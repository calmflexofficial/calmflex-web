import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { test } from "node:test";
import { createApp } from "./app.js";
import { openDatabase } from "./database.js";

const customer = {
  name: "Casey Customer",
  phone: "9876543210",
  email: "casey@example.com",
  address: "10 Market Road",
  city: "Pune",
  pin: "411001",
};

async function withApi(t, { razorpay = null, env = {} } = {}) {
  const database = openDatabase(":memory:");
  const server = createApp({ database, razorpay, env }).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(
    () =>
      new Promise((resolve, reject) =>
        server.close((error) => {
          database.close();
          error ? reject(error) : resolve();
        }),
      ),
  );
  return `http://127.0.0.1:${server.address().port}`;
}

test("health endpoint reports a live API", async (t) => {
  const baseUrl = await withApi(t);
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
});

test("guest COD checkout is rejected", async (t) => {
  const database = openDatabase(":memory:");
  const app = createApp({ database });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(
    () =>
      new Promise((resolve, reject) =>
        server.close((error) => {
          database.close();
          error ? reject(error) : resolve();
        }),
      ),
  );

  const response = await fetch(
    `http://127.0.0.1:${server.address().port}/api/orders`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        customer,
        paymentMethod: "cod",
        items: [{ slug: "derma-roller", quantity: 1, price: 1 }],
      }),
    },
  );
  assert.equal(response.status, 401);
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM orders").get().count, 0);
});

test("rejects invalid products and customer data", async (t) => {
  const baseUrl = await withApi(t);
  const cookie = await signupAndGetCookie(baseUrl);
  const response = await fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({
      customer: { ...customer, phone: "123" },
      paymentMethod: "cod",
      items: [{ slug: "unknown", quantity: 1 }],
    }),
  });
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /mobile number/);
});

test("online order verifies provider signature, amount, order and captured status", async (t) => {
  const secret = "test_secret_for_signature";
  let paymentFetches = 0;
  const razorpay = {
    orders: {
      create: async ({ amount }) => ({ id: "gateway-order-1", amount }),
    },
    payments: {
      fetch: async (id) => {
        paymentFetches += 1;
        return {
          id,
          order_id: "gateway-order-1",
          amount: 45900,
          status: "captured",
        };
      },
    },
  };
  const baseUrl = await withApi(t, {
    razorpay,
    env: { RAZORPAY_KEY_ID: "rzp_test_key", RAZORPAY_KEY_SECRET: secret },
  });
  const cookie = await signupAndGetCookie(baseUrl);
  const createResponse = await fetch(`${baseUrl}/api/payments/create-order`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({
      customer,
      items: [{ slug: "derma-roller", quantity: 1 }],
    }),
  });
  const gatewayOrder = await createResponse.json();
  assert.equal(createResponse.status, 201);
  assert.equal(gatewayOrder.amount, 45900);

  const paymentId = "gateway-payment-1";
  const signature = createHmac("sha256", secret)
    .update(`${gatewayOrder.id}|${paymentId}`)
    .digest("hex");
  const guestVerification = await fetch(`${baseUrl}/api/payments/verify`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      orderId: gatewayOrder.orderId,
      paymentResponse: {
        razorpay_order_id: gatewayOrder.id,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      },
    }),
  });
  assert.equal(guestVerification.status, 401);
  assert.equal(paymentFetches, 0);

  const verification = await fetch(`${baseUrl}/api/payments/verify`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({
      orderId: gatewayOrder.orderId,
      paymentResponse: {
        razorpay_order_id: gatewayOrder.id,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      },
    }),
  });
  assert.equal(verification.status, 200);
  assert.equal((await verification.json()).status, "paid");
  assert.equal(paymentFetches, 1);

  const repeatedVerification = await fetch(`${baseUrl}/api/payments/verify`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({
      orderId: gatewayOrder.orderId,
      paymentResponse: {
        razorpay_order_id: gatewayOrder.id,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      },
    }),
  });
  assert.equal(repeatedVerification.status, 200);
  assert.equal(paymentFetches, 1);
});

test("online payment remains unavailable without server credentials", async (t) => {
  const baseUrl = await withApi(t);
  const payload = {
    customer,
    items: [{ slug: "derma-roller", quantity: 1 }],
  };
  const guestResponse = await fetch(`${baseUrl}/api/payments/create-order`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  assert.equal(guestResponse.status, 401);
  const cookie = await signupAndGetCookie(baseUrl);
  const response = await fetch(`${baseUrl}/api/payments/create-order`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify(payload),
  });
  assert.equal(response.status, 503);
});

async function signupAndGetCookie(baseUrl) {
  const response = await fetch(`${baseUrl}/api/auth/signup`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: customer.name, email: customer.email, password: "long-test-password" }),
  });
  assert.equal(response.status, 201);
  return response.headers.get("set-cookie").split(";")[0];
}

test("signup creates a hashed account, attaches COD orders, and logout revokes its session", async (t) => {
  const database = openDatabase(":memory:");
  const server = createApp({ database }).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(
    () =>
      new Promise((resolve, reject) =>
        server.close((error) => {
          database.close();
          error ? reject(error) : resolve();
        }),
      ),
  );
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const signup = await fetch(`${baseUrl}/api/auth/signup`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: customer.name,
      email: customer.email,
      password: "long-test-password",
    }),
  });
  const signupResult = await signup.json();
  const cookie = signup.headers.get("set-cookie").split(";")[0];
  assert.equal(signup.status, 201);
  assert.equal(signupResult.user.email, customer.email);
  assert.doesNotMatch(
    database
      .prepare("SELECT password_hash FROM users WHERE id = ?")
      .get(signupResult.user.id).password_hash,
    /long-test-password/,
  );

  const order = await fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({
      customer,
      paymentMethod: "cod",
      items: [{ slug: "derma-roller", quantity: 1 }],
    }),
  });
  assert.equal(order.status, 201);

  const history = await fetch(`${baseUrl}/api/orders`, { headers: { cookie } });
  const historyResult = await history.json();
  assert.equal(history.status, 200);
  assert.equal(historyResult.orders.length, 1);
  assert.equal(historyResult.orders[0].id, (await order.json()).orderId);

  const logout = await fetch(`${baseUrl}/api/auth/logout`, {
    method: "POST",
    headers: { cookie },
  });
  assert.equal(logout.status, 204);
  const unauthorizedHistory = await fetch(`${baseUrl}/api/orders`, {
    headers: { cookie },
  });
  assert.equal(unauthorizedHistory.status, 401);
});

test("existing order databases migrate to account ownership", (t) => {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "calmflex-migration-"),
  );
  const databasePath = path.join(directory, "orders.sqlite");
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const legacyDatabase = new Database(databasePath);
  legacyDatabase.exec(`CREATE TABLE orders (
    id TEXT PRIMARY KEY, status TEXT NOT NULL, payment_method TEXT NOT NULL,
    customer_json TEXT NOT NULL, items_json TEXT NOT NULL,
    subtotal_paise INTEGER NOT NULL, shipping_paise INTEGER NOT NULL,
    total_paise INTEGER NOT NULL, gateway_order_id TEXT UNIQUE,
    gateway_payment_id TEXT UNIQUE, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  )`);
  legacyDatabase.close();

  const migrated = openDatabase(databasePath);
  assert.ok(
    migrated
      .pragma("table_info(orders)")
      .some((column) => column.name === "user_id"),
  );
  assert.ok(
    migrated
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'orders_user_id_idx'",
      )
      .get(),
  );
  migrated.close();
});

test("production rejects cross-origin requests when no frontend origin is configured", async (t) => {
  const baseUrl = await withApi(t, { env: { NODE_ENV: "production" } });
  const response = await fetch(`${baseUrl}/api/health`, {
    headers: { origin: "https://shop.example.com" },
  });
  assert.equal(response.status, 403);
});

test("configured frontend origin receives credentialed CORS headers", async (t) => {
  const baseUrl = await withApi(t, {
    env: {
      NODE_ENV: "production",
      FRONTEND_ORIGIN: "https://shop.example.com",
    },
  });
  const response = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { origin: "https://shop.example.com" },
  });
  assert.equal(response.status, 401);
  assert.equal(
    response.headers.get("access-control-allow-origin"),
    "https://shop.example.com",
  );
  assert.equal(
    response.headers.get("access-control-allow-credentials"),
    "true",
  );
});
