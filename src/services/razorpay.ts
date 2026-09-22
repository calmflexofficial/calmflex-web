import { paymentConfig } from '../config/payment';

const isConfigured = () => paymentConfig.publicKey && !paymentConfig.publicKey.includes('REPLACE_ME');

interface CheckoutArgs {
  customer: Record<string, FormDataEntryValue>;
  cart: unknown;
  total: number;
  onSuccess: (paymentResponse?: unknown, order?: unknown) => void;
}

export async function startRazorpayCheckout({ customer, cart, total, onSuccess }: CheckoutArgs) {
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
    handler: (paymentResponse: unknown) => onSuccess(paymentResponse, order),
    theme: { color: '#0d8a96' }
  }).open();
}
