export const paymentConfig = {
  provider: 'razorpay',
  publicKey: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
  createOrderEndpoint: '/api/payments/create-order',
  verifyPaymentEndpoint: '/api/payments/verify'
} as const;

export type PaymentMethod = 'upi' | 'card' | 'cod';
