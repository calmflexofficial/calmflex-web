import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
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

test("COD order stores server-priced lines and delivery charge", async (t) => {
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
  const result = await response.json();
  const savedOrder = database
    .prepare("SELECT * FROM orders WHERE id = ?")
    .get(result.orderId);
  assert.equal(response.status, 201);
  assert.equal(result.subtotal, 399);
  assert.equal(result.shipping, 60);
  assert.equal(result.total, 459);
  assert.equal(savedOrder.status, "confirmed");
  assert.equal(JSON.parse(savedOrder.items_json)[0].unitPricePaise, 39900);
});

test("rejects invalid products and customer data", async (t) => {
  const baseUrl = await withApi(t);
  const response = await fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: { "content-type": "application/json" },
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
  const createResponse = await fetch(`${baseUrl}/api/payments/create-order`, {
    method: "POST",
    headers: { "content-type": "application/json" },
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
  const verification = await fetch(`${baseUrl}/api/payments/verify`, {
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
  assert.equal(verification.status, 200);
  assert.equal((await verification.json()).status, "paid");
  assert.equal(paymentFetches, 1);

  const repeatedVerification = await fetch(`${baseUrl}/api/payments/verify`, {
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
  assert.equal(repeatedVerification.status, 200);
  assert.equal(paymentFetches, 1);
});

test("online payment remains unavailable without server credentials", async (t) => {
  const baseUrl = await withApi(t);
  const response = await fetch(`${baseUrl}/api/payments/create-order`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      customer,
      items: [{ slug: "derma-roller", quantity: 1 }],
    }),
  });
  assert.equal(response.status, 503);
});
