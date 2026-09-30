import { apiUrl } from './api';

export const paymentConfig = {
  provider: 'razorpay',
  publicKey: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
  createOrderEndpoint: apiUrl('/api/payments/create-order'),
  verifyPaymentEndpoint: apiUrl('/api/payments/verify')
} as const;

export type PaymentMethod = 'upi' | 'card' | 'cod';
