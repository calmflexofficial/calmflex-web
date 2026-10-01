import {
  createHash,
  createHmac,
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { priceItems } from "./catalog.js";
import {
  createSession,
  createUser,
  deleteSession,
  findSessionUser,
  findUserByEmail,
  saveOrder,
} from "./database.js";

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE = "calmflex_session";
const SESSION_LIFETIME_MS = 1000 * 60 * 60 * 24 * 14;

function getCookie(request, name) {
  const cookieHeader = request.headers.cookie || "";
  for (const part of cookieHeader.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return "";
}

function setSessionCookie(response, token, env) {
  const secure = env.NODE_ENV === "production" ? "; Secure" : "";
  const sameSite = env.COOKIE_SAME_SITE || "Lax";
  response.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=${SESSION_LIFETIME_MS / 1000}${secure}`,
  );
}

function clearSessionCookie(response, env) {
  const secure = env.NODE_ENV === "production" ? "; Secure" : "";
  const sameSite = env.COOKIE_SAME_SITE || "Lax";
  response.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=0${secure}`,
  );
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

async function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const derived = await scrypt(password, salt, 64);
  return `${salt}:${derived.toString("hex")}`;
}

async function verifyPassword(password, encoded) {
  const [salt, storedHex] = encoded.split(":");
  if (!salt || !/^[a-f\d]{128}$/i.test(storedHex || "")) return false;
  const candidate = await scrypt(password, salt, 64);
  return timingSafeEqual(candidate, Buffer.from(storedHex, "hex"));
}

function validateCustomer(input) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("Enter your delivery details.");
  const customer = Object.fromEntries(
    ["name", "phone", "email", "address", "city", "pin"].map((field) => [
      field,
      typeof input[field] === "string" ? input[field].trim() : "",
    ]),
  );
  if (!customer.name || customer.name.length > 120)
    throw new Error("Enter a valid name.");
  if (!/^[6-9]\d{9}$/.test(customer.phone))
    throw new Error("Enter a valid 10-digit Indian mobile number.");
  if (
    customer.email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)
  )
    throw new Error("Enter a valid email address.");
  if (!customer.address || customer.address.length > 300)
    throw new Error("Enter a valid delivery address.");
  if (!customer.city || customer.city.length > 100)
    throw new Error("Enter a valid city.");
  if (!/^\d{6}$/.test(customer.pin))
    throw new Error("Enter a valid 6-digit PIN code.");
  return customer;
}

function paymentConfiguration(env) {
  const keyId = env.RAZORPAY_KEY_ID || "";
  const keySecret = env.RAZORPAY_KEY_SECRET || "";
  if (
    !keyId ||
    !keySecret ||
    keyId.toLowerCase().includes("replace_me") ||
    keySecret.toLowerCase().includes("replace_me")
  )
    return null;
  return { keyId, keySecret };
}

function equalHex(left, right) {
  if (
    typeof left !== "string" ||
    typeof right !== "string" ||
    !/^[a-f\d]{64}$/i.test(left) ||
    !/^[a-f\d]{64}$/i.test(right)
  )
    return false;
  return timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}

export function createApp({ database, razorpay = null, env = process.env }) {
  const app = express();
  app.disable("x-powered-by");
  if (env.TRUST_PROXY) app.set("trust proxy", Number(env.TRUST_PROXY));
  app.use(helmet());
  app.use((request, response, next) => {
    const allowedOrigins = (env.FRONTEND_ORIGIN || "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);
    const origin = request.get("origin");
    if (
      origin &&
      ((allowedOrigins.length && !allowedOrigins.includes(origin)) ||
        (env.NODE_ENV === "production" && !allowedOrigins.length))
    ) {
      return response
        .status(403)
        .json({ error: "This request origin is not allowed." });
    }
    if (origin && allowedOrigins.includes(origin)) {
      response.setHeader("Access-Control-Allow-Origin", origin);
      response.setHeader("Vary", "Origin");
      response.setHeader("Access-Control-Allow-Headers", "Content-Type");
      response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
      response.setHeader("Access-Control-Allow-Credentials", "true");
    }
    if (request.method === "OPTIONS")
      return response.sendStatus(
        origin && !allowedOrigins.includes(origin) ? 403 : 204,
      );
    next();
  });
  app.use(express.json({ limit: "32kb" }));
  app.use(
    "/api",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 120,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
  );
  const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many account attempts. Please wait and try again." },
  });

  app.get("/api/health", (_request, response) =>
    response.json({ status: "ok" }),
  );

  const requireUser = (request, response, next) => {
    const token = getCookie(request, SESSION_COOKIE);
    const user = token ? findSessionUser(database, hashToken(token)) : null;
    if (!user)
      return response.status(401).json({ error: "Please log in to continue." });
    request.user = user;
    next();
  };
  app.post("/api/auth/signup", authRateLimit, async (request, response) => {
    const name =
      typeof request.body?.name === "string" ? request.body.name.trim() : "";
    const email =
      typeof request.body?.email === "string"
        ? request.body.email.trim().toLowerCase()
        : "";
    const password =
      typeof request.body?.password === "string" ? request.body.password : "";
    if (!name || name.length > 120)
      return response.status(400).json({ error: "Enter a valid name." });
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return response
        .status(400)
        .json({ error: "Enter a valid email address." });
    if (password.length < 10 || password.length > 256)
      return response
        .status(400)
        .json({ error: "Password must be between 10 and 256 characters." });
    if (findUserByEmail(database, email))
      return response
        .status(409)
        .json({
          error: "An account with that email already exists. Try logging in.",
        });

    const user = { id: randomUUID(), name, email };
    try {
      createUser(database, {
        ...user,
        passwordHash: await hashPassword(password),
      });
    } catch (error) {
      if (error.code === "SQLITE_CONSTRAINT_UNIQUE")
        return response
          .status(409)
          .json({
            error: "An account with that email already exists. Try logging in.",
          });
      throw error;
    }
    const token = randomBytes(32).toString("base64url");
    createSession(database, {
      tokenHash: hashToken(token),
      userId: user.id,
      expiresAt: new Date(Date.now() + SESSION_LIFETIME_MS).toISOString(),
    });
    setSessionCookie(response, token, env);
    return response.status(201).json({ user });
  });

  app.post("/api/auth/login", authRateLimit, async (request, response) => {
    const email =
      typeof request.body?.email === "string"
        ? request.body.email.trim().toLowerCase()
        : "";
    const password =
      typeof request.body?.password === "string" ? request.body.password : "";
    if (password.length > 256)
      return response
        .status(401)
        .json({ error: "Email or password is not quite right." });
    const storedUser = findUserByEmail(database, email);
    if (
      !storedUser ||
      !(await verifyPassword(password, storedUser.password_hash))
    ) {
      return response
        .status(401)
        .json({ error: "Email or password is not quite right." });
    }
    const token = randomBytes(32).toString("base64url");
    createSession(database, {
      tokenHash: hashToken(token),
      userId: storedUser.id,
      expiresAt: new Date(Date.now() + SESSION_LIFETIME_MS).toISOString(),
    });
    setSessionCookie(response, token, env);
    return response.json({ user: publicUser(storedUser) });
  });

  app.get("/api/auth/me", requireUser, (request, response) =>
    response.json({ user: publicUser(request.user) }),
  );

  app.post("/api/auth/logout", (request, response) => {
    const token = getCookie(request, SESSION_COOKIE);
    if (token) deleteSession(database, hashToken(token));
    clearSessionCookie(response, env);
    return response.status(204).end();
  });

  app.get("/api/orders", requireUser, (request, response) => {
    const orders = database
      .prepare(
        `
      SELECT id, status, payment_method, items_json, subtotal_paise, shipping_paise, total_paise, created_at
      FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 100
    `,
      )
      .all(request.user.id)
      .map((order) => ({
        id: order.id,
        status: order.status,
        paymentMethod: order.payment_method,
        items: JSON.parse(order.items_json),
        subtotal: order.subtotal_paise / 100,
        shipping: order.shipping_paise / 100,
        total: order.total_paise / 100,
        createdAt: order.created_at,
      }));
    return response.json({ orders });
  });

  app.post("/api/orders", requireUser, (request, response) => {
    if (request.body?.paymentMethod !== "cod")
      return response
        .status(400)
        .json({ error: "Use Cash on Delivery for this endpoint." });
    let customer;
    let pricing;
    try {
      customer = validateCustomer(request.body.customer);
      pricing = priceItems(request.body.items);
    } catch (error) {
      return response.status(400).json({ error: error.message });
    }

    const orderId = randomUUID();
    saveOrder(database, {
      id: orderId,
      userId: request.user.id,
      status: "confirmed",
      paymentMethod: "cod",
      customer,
      pricing,
    });
    return response.status(201).json({
      orderId,
      status: "confirmed",
      currency: "INR",
      subtotal: pricing.subtotalPaise / 100,
      shipping: pricing.shippingPaise / 100,
      total: pricing.totalPaise / 100,
    });
  });

  app.post(
    "/api/payments/create-order",
    requireUser,
    async (request, response) => {
      const config = paymentConfiguration(env);
      if (!config || !razorpay)
        return response.status(503).json({
          error: "Online payments are not configured. Choose Cash on Delivery.",
        });
      let customer;
      let pricing;
      try {
        customer = validateCustomer(request.body?.customer);
        pricing = priceItems(request.body?.items);
      } catch (error) {
        return response.status(400).json({ error: error.message });
      }

      const orderId = randomUUID();
      try {
        const gatewayOrder = await razorpay.orders.create({
          amount: pricing.totalPaise,
          currency: "INR",
          receipt: orderId.slice(0, 40),
          notes: { orderId },
        });
        saveOrder(database, {
          id: orderId,
          userId: request.user.id,
          status: "pending_payment",
          paymentMethod: "razorpay",
          customer,
          pricing,
          gatewayOrderId: gatewayOrder.id,
        });
        return response.status(201).json({
          id: gatewayOrder.id,
          orderId,
          amount: pricing.totalPaise,
          currency: "INR",
        });
      } catch (error) {
        request.log?.error(error);
        return response
          .status(502)
          .json({
            error: "Could not create a payment order. Please try again.",
          });
      }
    },
  );

  app.post("/api/payments/verify", requireUser, async (request, response) => {
    const config = paymentConfiguration(env);
    const payment = request.body?.paymentResponse;
    const orderId = request.body?.orderId;
    if (!config || !razorpay)
      return response
        .status(503)
        .json({ error: "Online payments are not configured." });
    if (!payment || typeof orderId !== "string")
      return response
        .status(400)
        .json({ error: "Payment details are incomplete." });

    const order = database
      .prepare("SELECT * FROM orders WHERE id = ?")
      .get(orderId);
    if (!order || order.gateway_order_id !== payment.razorpay_order_id) {
      return response.status(404).json({
        error: "Payment order was not found or is no longer pending.",
      });
    }
    if (order.user_id !== request.user.id) {
      return response.status(403).json({ error: "This payment order belongs to another account." });
    }
    if (
      order.status === "paid" &&
      order.gateway_payment_id === payment.razorpay_payment_id
    ) {
      return response.json({ orderId: order.id, status: "paid" });
    }
    if (order.status !== "pending_payment")
      return response
        .status(409)
        .json({ error: "Payment order is no longer pending." });

    const expectedSignature = createHmac("sha256", config.keySecret)
      .update(`${order.gateway_order_id}|${payment.razorpay_payment_id || ""}`)
      .digest("hex");
    if (!equalHex(expectedSignature, payment.razorpay_signature))
      return response
        .status(400)
        .json({ error: "Payment signature is invalid." });

    try {
      const gatewayPayment = await razorpay.payments.fetch(
        payment.razorpay_payment_id,
      );
      if (
        gatewayPayment.order_id !== order.gateway_order_id ||
        gatewayPayment.amount !== order.total_paise ||
        gatewayPayment.status !== "captured"
      ) {
        return response.status(409).json({
          error:
            "Payment has not been captured. Please contact CalmFlex support before retrying.",
        });
      }
      database
        .prepare(
          `
        UPDATE orders SET status = 'paid', gateway_payment_id = ?, updated_at = ? WHERE id = ?
      `,
        )
        .run(gatewayPayment.id, new Date().toISOString(), order.id);
      return response.json({ orderId: order.id, status: "paid" });
    } catch {
      return response.status(502).json({
        error:
          "Could not confirm payment with the payment provider. Please contact CalmFlex support.",
      });
    }
  });

  app.use((error, _request, response, _next) => {
    if (error?.type === "entity.parse.failed")
      return response
        .status(400)
        .json({ error: "Request body must be valid JSON." });
    if (error?.type === "entity.too.large")
      return response.status(413).json({ error: "Request body is too large." });
    return response
      .status(500)
      .json({ error: "An unexpected server error occurred." });
  });

  return app;
}

export { validateCustomer };
