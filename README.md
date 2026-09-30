# CalmFlex storefront and API

CalmFlex is organized as two npm workspace projects: a React, TypeScript and Vite storefront in `frontend/`, and an Express API with SQLite order persistence in `backend/`.

## Run locally

Install Node.js 20 or newer, then from the repository root:

```bash
npm install
npm run dev
```

The storefront opens at `http://127.0.0.1:5173/`; the API runs at `http://127.0.0.1:8787/`. The storefront proxies `/api` requests to the backend. For separate terminals use `npm run dev:frontend` and `npm run dev:backend`.

Run `npm run build` to create the production storefront bundle, and `npm test` to run backend checkout tests.

## Project layout

- `frontend/` contains the React app, legacy pages, Vite configuration, and public product images.
- `backend/` contains the API, SQLite data layer, tests, and server environment template.
- `docs/` contains payment and launch notes.

## Deployment

Deploy the frontend and backend as separate services. Host the generated `frontend/dist/` as an SPA with fallback to `index.html`. Set `VITE_API_BASE_URL` to the backend origin when it is hosted separately, and configure `FRONTEND_ORIGIN` on the backend to that exact frontend origin. Keep `RAZORPAY_KEY_SECRET` server-side only. Mount a persistent disk for SQLite and maintain backups; move to a managed shared database before scaling to multiple backend instances.

Cash on Delivery works without payment credentials. Online UPI/card checkout remains disabled until real Razorpay keys are configured on both sides. See [docs/payment-integration.md](docs/payment-integration.md).
