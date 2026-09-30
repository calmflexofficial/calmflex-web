import { paymentConfig } from '../config/payment.js';

const isConfigured = () => paymentConfig.publicKey && !paymentConfig.publicKey.includes('REPLACE_ME');

export async function startRazorpayCheckout({ customer, cart, total, onSuccess }) {
  if (!isConfigured()) {
    throw new Error('Online payments are not configured yet. Choose Cash on Delivery or add the Razorpay public key.');
  }

  const response = await fetch(paymentConfig.createOrderEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer, cart, amount: total })
  });
  if (!response.ok) throw new Error('Unable to create a secure payment order. Please try again.');

  const order = await response.json();
  const options = {
    key: paymentConfig.publicKey,
    amount: order.amount,
    currency: order.currency || 'INR',
    name: 'CalmFlex',
    description: 'Everyday wellness essentials',
    order_id: order.id,
    prefill: { name: customer.name, email: customer.email, contact: customer.phone },
    handler: (paymentResponse) => onSuccess(paymentResponse, order),
    theme: { color: '#71886a' }
  };

  if (!window.Razorpay) throw new Error('Razorpay checkout could not load. Check your connection and try again.');
  new window.Razorpay(options).open();
}
