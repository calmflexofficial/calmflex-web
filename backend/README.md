# CalmFlex backend

Express API for checkout and order persistence. SQLite is stored at `backend/data/orders.sqlite` by default; set `DATABASE_PATH` to a persistent mounted volume when deploying.

## Run

From the repository root, run `npm run dev:backend` or `npm run dev` to run both projects. The API defaults to port `8787` and exposes `GET /api/health`.

## Checkout API

- `POST /api/orders` creates a Cash on Delivery order and returns its order reference and server-calculated totals.
- `POST /api/payments/create-order` creates a Razorpay order using server-priced products.
- `POST /api/payments/verify` checks the Razorpay signature and confirms the captured payment with Razorpay before marking an order paid.

The backend owns product prices and the free-shipping calculation. Never accept totals, payment status, or secrets from the browser. Configure `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` on the backend only. Configure `FRONTEND_ORIGIN` to the exact deployed frontend origin when frontend and API use different hosts.

SQLite is appropriate for a single backend instance with a durable disk and backups. Use a managed shared database before running multiple backend instances.
