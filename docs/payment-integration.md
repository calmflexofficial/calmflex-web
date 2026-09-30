# Payment integration

CalmFlex uses Razorpay for online payments and Cash on Delivery for offline orders.

## API contract

- `POST /api/orders` receives `{ customer, items, paymentMethod: "cod" }` and persists a COD order.
- `POST /api/payments/create-order` receives `{ customer, items }` and returns `{ id, orderId, amount, currency }`.
- Razorpay checkout returns `razorpay_payment_id`, `razorpay_order_id`, and `razorpay_signature`.
- `POST /api/payments/verify` validates the signature and confirms the captured payment with Razorpay before marking an order paid.
- Product prices, shipping, and totals are calculated on the backend from product slugs; browser-supplied amounts are ignored.

## Before going live

1. Set `VITE_RAZORPAY_KEY_ID` in the frontend build environment.
2. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in the backend environment; never expose the secret to browser code.
3. Set `FRONTEND_ORIGIN` on the backend when the two services use different origins.
4. Replace test credentials with live credentials only after the Razorpay account and webhook handling are configured.
