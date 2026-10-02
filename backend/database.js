import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { fileURLToPath } from "node:url";

const backendDirectory = path.dirname(fileURLToPath(import.meta.url));

export function openDatabase(
  databasePath = process.env.DATABASE_PATH ||
    path.join(backendDirectory, "data", "orders.sqlite"),
) {
  if (databasePath !== ":memory:")
    fs.mkdirSync(path.dirname(path.resolve(databasePath)), { recursive: true });
  const database = new Database(databasePath);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  database.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      status TEXT NOT NULL,
      fulfillment_status TEXT NOT NULL DEFAULT 'new',
      tracking_carrier TEXT,
      tracking_number TEXT,
      admin_note TEXT,
      payment_method TEXT NOT NULL,
      customer_json TEXT NOT NULL,
      items_json TEXT NOT NULL,
      subtotal_paise INTEGER NOT NULL,
      shipping_paise INTEGER NOT NULL,
      total_paise INTEGER NOT NULL,
      gateway_order_id TEXT UNIQUE,
      gateway_payment_id TEXT UNIQUE,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at);
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL COLLATE NOCASE UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);
  `);

  const orderColumns = database.pragma("table_info(orders)");
  if (!orderColumns.some((column) => column.name === "user_id")) {
    database.exec(
      "ALTER TABLE orders ADD COLUMN user_id TEXT REFERENCES users(id)",
    );
  }
  const migratedOrderColumns = database.pragma("table_info(orders)");
  for (const [column, definition] of [
    ["fulfillment_status", "TEXT NOT NULL DEFAULT 'new'"],
    ["tracking_carrier", "TEXT"],
    ["tracking_number", "TEXT"],
    ["admin_note", "TEXT"],
  ]) {
    if (!migratedOrderColumns.some((entry) => entry.name === column)) {
      database.exec(`ALTER TABLE orders ADD COLUMN ${column} ${definition}`);
    }
  }
  const userColumns = database.pragma("table_info(users)");
  if (!userColumns.some((column) => column.name === "role")) {
    database.exec(
      "ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'customer'",
    );
  }
  database.exec(
    "CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id, created_at)",
  );
  return database;
}

export function saveOrder(
  database,
  {
    id,
    userId = null,
    status,
    paymentMethod,
    customer,
    pricing,
    gatewayOrderId = null,
  },
) {
  const timestamp = new Date().toISOString();
  database
    .prepare(
      `
    INSERT INTO orders (
      id, user_id, status, payment_method, customer_json, items_json,
      subtotal_paise, shipping_paise, total_paise, gateway_order_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    )
    .run(
      id,
      userId,
      status,
      paymentMethod,
      JSON.stringify(customer),
      JSON.stringify(pricing.lines),
      pricing.subtotalPaise,
      pricing.shippingPaise,
      pricing.totalPaise,
      gatewayOrderId,
      timestamp,
      timestamp,
    );
}

export function createUser(
  database,
  { id, name, email, passwordHash, role = "customer" },
) {
  database
    .prepare(
      `
    INSERT INTO users (id, name, email, password_hash, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `,
    )
    .run(id, name, email, passwordHash, role, new Date().toISOString());
}

export function provisionAdminUser(
  database,
  { id, name, email, passwordHash },
) {
  const existing = findUserByEmail(database, email);
  if (existing) {
    database
      .prepare(
        "UPDATE users SET name = ?, password_hash = ?, role = 'admin' WHERE id = ?",
      )
      .run(name, passwordHash, existing.id);
    return existing.id;
  }
  createUser(database, { id, name, email, passwordHash, role: "admin" });
  return id;
}

export function findUserByEmail(database, email) {
  return database
    .prepare("SELECT * FROM users WHERE email = ? COLLATE NOCASE")
    .get(email);
}

export function createSession(database, { tokenHash, userId, expiresAt }) {
  const now = new Date().toISOString();
  database.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(now);
  database
    .prepare(
      `
    INSERT INTO sessions (token_hash, user_id, expires_at, created_at)
    VALUES (?, ?, ?, ?)
  `,
    )
    .run(tokenHash, userId, expiresAt, now);
}

export function findSessionUser(database, tokenHash) {
  return database
    .prepare(
      `
    SELECT users.id, users.name, users.email, users.role
    FROM sessions JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?
  `,
    )
    .get(tokenHash, new Date().toISOString());
}

export function deleteSession(database, tokenHash) {
  database.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash);
}
