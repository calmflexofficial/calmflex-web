# CalmFlex web

React + TypeScript + Vite storefront for CalmFlex wellness products. The legacy static pages remain available during the incremental migration.

## Run locally

From the project folder:

```bash
python -m http.server 4173
```

Open `http://localhost:4173/`.

For the React app, install Node.js 20+ and run:

```bash
npm install
npm run dev
```

Create a production bundle with `npm run build`, then deploy the generated `dist/` directory to a host that supports SPA fallback to `index.html`.

## Structure

```text
index.html              Landing page
shop.html               Searchable product catalog
product.html            Featured product detail page
cart.html               Cart and checkout UI
app.js                  Landing page interactions
shop.js                 Catalog search, filters and sorting
product.js              Product quantity and delivery check
cart.js                 Cart state and checkout orchestration
assets/                 Supplied product photography
src/config/             Public frontend configuration
src/services/           External service integrations
src/data/               Shared typed catalog data
src/types/              Shared TypeScript models
vite.config.ts          Vite + React build configuration
tsconfig.json           Strict TypeScript configuration
server/                 Private backend environment templates
docs/                   Integration and launch notes
```

## Payments

Cash on Delivery is available in the frontend now. Online UPI/card checkout is intentionally disabled until a backend implements secure order creation and signature verification. Follow [docs/payment-integration.md](docs/payment-integration.md) before enabling live payments. Never put `RAZORPAY_KEY_SECRET` in browser code.

The storefront is not ready for a real-money launch until that backend is deployed and the frontend has a live `VITE_RAZORPAY_KEY_ID` value. The current frontend can be published as a catalog with COD only.
