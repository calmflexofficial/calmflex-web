import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { priceItems } from './catalog.js';
import { saveOrder } from './database.js';

function validateCustomer(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Enter your delivery details.');
  const customer = Object.fromEntries(['name', 'phone', 'email', 'address', 'city', 'pin'].map((field) => [
    field,
    typeof input[field] === 'string' ? input[field].trim() : ''
  ]));
  if (!customer.name || customer.name.length > 120) throw new Error('Enter a valid name.');
  if (!/^[6-9]\d{9}$/.test(customer.phone)) throw new Error('Enter a valid 10-digit Indian mobile number.');
  if (customer.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) throw new Error('Enter a valid email address.');
  if (!customer.address || customer.address.length > 300) throw new Error('Enter a valid delivery address.');
  if (!customer.city || customer.city.length > 100) throw new Error('Enter a valid city.');
  if (!/^\d{6}$/.test(customer.pin)) throw new Error('Enter a valid 6-digit PIN code.');
  return customer;
}

function paymentConfiguration(env) {
  const keyId = env.RAZORPAY_KEY_ID || '';
  const keySecret = env.RAZORPAY_KEY_SECRET || '';
  if (!keyId || !keySecret || keyId.toLowerCase().includes('replace_me') || keySecret.toLowerCase().includes('replace_me')) return null;
  return { keyId, keySecret };
}

function equalHex(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string' || !/^[a-f\d]{64}$/i.test(left) || !/^[a-f\d]{64}$/i.test(right)) return false;
  return timingSafeEqual(Buffer.from(left, 'hex'), Buffer.from(right, 'hex'));
}

export function createApp({ database, razorpay = null, env = process.env }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use((request, response, next) => {
    const allowedOrigins = (env.FRONTEND_ORIGIN || '').split(',').map((origin) => origin.trim()).filter(Boolean);
    const origin = request.get('origin');
    if (origin && allowedOrigins.includes(origin)) {
      response.setHeader('Access-Control-Allow-Origin', origin);
      response.setHeader('Vary', 'Origin');
      response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    }
    if (request.method === 'OPTIONS') return response.sendStatus(origin && !allowedOrigins.includes(origin) ? 403 : 204);
    next();
  });
  app.use(express.json({ limit: '32kb' }));
  app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 120, standardHeaders: 'draft-8', legacyHeaders: false }));

  app.get('/api/health', (_request, response) => response.json({ status: 'ok' }));

  app.post('/api/orders', (request, response) => {
    if (request.body?.paymentMethod !== 'cod') return response.status(400).json({ error: 'Use Cash on Delivery for this endpoint.' });
    let customer;
    let pricing;
    try {
      customer = validateCustomer(request.body.customer);
      pricing = priceItems(request.body.items);
    } catch (error) {
      return response.status(400).json({ error: error.message });
    }

    const orderId = randomUUID();
    saveOrder(database, { id: orderId, status: 'confirmed', paymentMethod: 'cod', customer, pricing });
    return response.status(201).json({
      orderId,
      status: 'confirmed',
      currency: 'INR',
      subtotal: pricing.subtotalPaise / 100,
      shipping: pricing.shippingPaise / 100,
      total: pricing.totalPaise / 100
    });
  });

  app.post('/api/payments/create-order', async (request, response) => {
    const config = paymentConfiguration(env);
    if (!config || !razorpay) return response.status(503).json({ error: 'Online payments are not configured. Choose Cash on Delivery.' });
    let customer;
    let pricing;
    try {
      customer = validateCustomer(request.body?.customer);
      pricing = priceItems(request.body?.items);
    } catch (error) {
      return response.status(400).json({ error: error.message });
    }

    const orderId = randomUUID();
    try {
      const gatewayOrder = await razorpay.orders.create({
        amount: pricing.totalPaise,
        currency: 'INR',
        receipt: orderId.slice(0, 40),
        notes: { orderId }
      });
      saveOrder(database, {
        id: orderId,
        status: 'pending_payment',
        paymentMethod: 'razorpay',
        customer,
        pricing,
        gatewayOrderId: gatewayOrder.id
      });
      return response.status(201).json({
        id: gatewayOrder.id,
        orderId,
        amount: pricing.totalPaise,
        currency: 'INR'
      });
    } catch (error) {
      request.log?.error(error);
      return response.status(502).json({ error: 'Could not create a payment order. Please try again.' });
    }
  });

  app.post('/api/payments/verify', async (request, response) => {
    const config = paymentConfiguration(env);
    const payment = request.body?.paymentResponse;
    const orderId = request.body?.orderId;
    if (!config || !razorpay) return response.status(503).json({ error: 'Online payments are not configured.' });
    if (!payment || typeof orderId !== 'string') return response.status(400).json({ error: 'Payment details are incomplete.' });

    const order = database.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order || order.gateway_order_id !== payment.razorpay_order_id) {
      return response.status(404).json({ error: 'Payment order was not found or is no longer pending.' });
    }
    if (order.status === 'paid' && order.gateway_payment_id === payment.razorpay_payment_id) {
      return response.json({ orderId: order.id, status: 'paid' });
    }
    if (order.status !== 'pending_payment') return response.status(409).json({ error: 'Payment order is no longer pending.' });

    const expectedSignature = createHmac('sha256', config.keySecret)
      .update(`${order.gateway_order_id}|${payment.razorpay_payment_id || ''}`)
      .digest('hex');
    if (!equalHex(expectedSignature, payment.razorpay_signature)) return response.status(400).json({ error: 'Payment signature is invalid.' });

    try {
      const gatewayPayment = await razorpay.payments.fetch(payment.razorpay_payment_id);
      if (gatewayPayment.order_id !== order.gateway_order_id || gatewayPayment.amount !== order.total_paise || gatewayPayment.status !== 'captured') {
        return response.status(409).json({ error: 'Payment has not been captured. Please contact CalmFlex support before retrying.' });
      }
      database.prepare(`
        UPDATE orders SET status = 'paid', gateway_payment_id = ?, updated_at = ? WHERE id = ?
      `).run(gatewayPayment.id, new Date().toISOString(), order.id);
      return response.json({ orderId: order.id, status: 'paid' });
    } catch {
      return response.status(502).json({ error: 'Could not confirm payment with the payment provider. Please contact CalmFlex support.' });
    }
  });

  app.use((error, _request, response, _next) => {
    if (error?.type === 'entity.parse.failed') return response.status(400).json({ error: 'Request body must be valid JSON.' });
    if (error?.type === 'entity.too.large') return response.status(413).json({ error: 'Request body is too large.' });
    return response.status(500).json({ error: 'An unexpected server error occurred.' });
  });

  return app;
}

export { validateCustomer };