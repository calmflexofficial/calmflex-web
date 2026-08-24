# Payment integration

CalmFlex uses Razorpay for online payments and Cash on Delivery for offline orders.

## Frontend contract

- `POST /api/payments/create-order` receives `{ customer, cart, amount }` and returns `{ id, amount, currency }`.
- Razorpay checkout returns `razorpay_payment_id`, `razorpay_order_id`, and `razorpay_signature`.
- The server must verify that signature at `POST /api/payments/verify` before marking an order paid.

## Before going live

1. Create Razorpay test keys and place only the public key in `src/config/payment.js`.
2. Keep `RAZORPAY_KEY_SECRET` in the server environment, never in browser code.
3. Implement server-side amount calculation from product IDs and prices. Do not trust the amount sent by the browser.
4. Verify every successful payment signature server-side.
5. Replace the test key with live credentials only after Razorpay account and webhooks are configured.
