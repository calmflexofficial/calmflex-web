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
      status TEXT NOT NULL,
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
  `);
  return database;
}

export function saveOrder(
  database,
  { id, status, paymentMethod, customer, pricing, gatewayOrderId = null },
) {
  const timestamp = new Date().toISOString();
  database
    .prepare(
      `
    INSERT INTO orders (
      id, status, payment_method, customer_json, items_json,
      subtotal_paise, shipping_paise, total_paise, gateway_order_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    )
    .run(
      id,
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
