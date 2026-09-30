import { paymentConfig } from '../config/payment';

const isConfigured = () => paymentConfig.publicKey && !paymentConfig.publicKey.includes('REPLACE_ME');

const loadRazorpay = () =>
  new Promise<void>((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Razorpay checkout could not load. Check your connection and try again.'));
    document.head.appendChild(script);
  });

interface CheckoutArgs {
  customer: Record<string, FormDataEntryValue>;
  cart: unknown;
  total: number;
  onSuccess: (paymentResponse?: unknown, order?: unknown) => void | Promise<void>;
}

export async function startRazorpayCheckout({ customer, cart, total, onSuccess }: CheckoutArgs) {
  if (!isConfigured()) {
    throw new Error('Online payments are not configured yet. Choose Cash on Delivery or add the Razorpay public key.');
  }

  await loadRazorpay();

  const response = await fetch(paymentConfig.createOrderEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer, cart, amount: total })
  });
  if (!response.ok) throw new Error('Unable to create a secure payment order. Please try again.');

  const order = await response.json();
  const Razorpay = window.Razorpay;
  if (!Razorpay) throw new Error('Razorpay checkout could not load. Check your connection and try again.');

  new Razorpay({
    key: paymentConfig.publicKey,
    amount: order.amount,
    currency: order.currency || 'INR',
    name: 'CalmFlex',
    description: 'Everyday wellness essentials',
    order_id: order.id,
    prefill: { name: customer.name, email: customer.email, contact: customer.phone },
    handler: async (paymentResponse: unknown) => {
      const verification = await fetch(paymentConfig.verifyPaymentEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentResponse, order, customer, cart })
      });
      if (!verification.ok) {
        throw new Error('Payment was received but could not be verified. Please contact support before trying again.');
      }
      await onSuccess(paymentResponse, order);
    },
    theme: { color: '#0d8a96' }
  }).open();
}
