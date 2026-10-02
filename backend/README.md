# CalmFlex backend

Express API for checkout, customer accounts, and order persistence. SQLite is stored at `backend/data/orders.sqlite` by default; set `DATABASE_PATH` to an absolute persistent mounted volume when deploying.

## Run

From the repository root, run `npm run dev:backend` or `npm run dev` to run both projects. The API defaults to port `8787` and exposes `GET /api/health`.

## Checkout API

- `POST /api/orders` creates a Cash on Delivery order and returns its order reference and server-calculated totals.
- `POST /api/auth/signup` and `POST /api/auth/login` create accounts and issue HttpOnly server sessions; `GET /api/auth/me` restores a session and `POST /api/auth/logout` revokes it.
- `GET /api/orders` returns only the signed-in customer's order history. Order placement requires an authenticated account.
- `GET /api/admin/orders` returns the order queue to provisioned admins only.
- `PATCH /api/admin/orders/:orderId` advances fulfillment through accepted, packing, dispatched, delivered, rejected, or cancelled; dispatch requires courier and tracking number.
- `POST /api/payments/create-order` creates a Razorpay order using server-priced products.
- `POST /api/payments/verify` checks the Razorpay signature and confirms the captured payment with Razorpay before marking an order paid.

The backend owns product prices and the free-shipping calculation. Never accept totals, payment status, or secrets from the browser. Configure `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` on the backend only. Configure `FRONTEND_ORIGIN` to the exact deployed frontend origin when frontend and API use different hosts.

When the frontend and API are on different sites, use HTTPS, set `NODE_ENV=production`, `COOKIE_SAME_SITE=None`, and `FRONTEND_ORIGIN` to the frontend origin. The API uses credentialed CORS only for configured origins. Passwords are scrypt-hashed; session tokens are random and only their hashes are stored.

If the hosting platform puts the API behind a reverse proxy, set `TRUST_PROXY` to the documented trusted hop count so IP rate limits use the real client address. Do not set this blindly to `true`.

Configure `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` of at least 14 characters in the backend environment. The server provisions that identity as the admin at startup; public signup always creates customer accounts. Never place admin credentials in frontend environment variables or source control. The dashboard polls the queue every 30 seconds; it does not send email/push alerts.

SQLite is appropriate only for a single backend instance with a durable disk and backups. Configure HTTPS, `NODE_ENV=production`, `FRONTEND_ORIGIN`, and `COOKIE_SAME_SITE=None` when the frontend and API are cross-site. Use a managed shared database before running multiple backend instances. The admin dashboard refreshes the order queue every 30 seconds; email alerts, refunds, inventory reservation, and external shipping-label integration are not included yet.
