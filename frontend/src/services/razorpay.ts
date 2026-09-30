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
  cart: Array<{ slug: string; quantity: number }>;
  onSuccess: (paymentResponse: unknown, order: PaymentOrder) => void | Promise<void>;
  onError: (message: string) => void;
}

interface PaymentOrder {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
}

export async function startRazorpayCheckout({ customer, cart, onSuccess, onError }: CheckoutArgs) {
  if (!isConfigured()) {
    throw new Error('Online payments are not configured yet. Choose Cash on Delivery or add the Razorpay public key.');
  }

  await loadRazorpay();

  const response = await fetch(paymentConfig.createOrderEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer, items: cart })
  });
  const orderResult = await response.json();
  if (!response.ok) throw new Error(orderResult.error || 'Unable to create a secure payment order. Please try again.');

  const order = orderResult as PaymentOrder;
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
      try {
        const verification = await fetch(paymentConfig.verifyPaymentEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentResponse, orderId: order.orderId })
        });
        const result = await verification.json();
        if (!verification.ok) {
          throw new Error(result.error || 'Payment was received but could not be verified. Please contact support before trying again.');
        }
        await onSuccess(paymentResponse, order);
      } catch (error) {
        onError(error instanceof Error ? error.message : 'Payment could not be verified. Contact CalmFlex support before retrying.');
      }
    },
    theme: { color: '#0d8a96' }
  }).open();
}
