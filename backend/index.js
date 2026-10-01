import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Razorpay from "razorpay";
import { createApp } from "./app.js";
import { openDatabase } from "./database.js";

const backendDirectory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(backendDirectory, ".env") });
const configuredDatabasePath =
  process.env.DATABASE_PATH || "data/orders.sqlite";
const databasePath = path.isAbsolute(configuredDatabasePath)
  ? configuredDatabasePath
  : path.resolve(backendDirectory, configuredDatabasePath);
const database = openDatabase(databasePath);
const hasPaymentKeys =
  process.env.RAZORPAY_KEY_ID &&
  process.env.RAZORPAY_KEY_SECRET &&
  !process.env.RAZORPAY_KEY_ID.toLowerCase().includes("replace_me") &&
  !process.env.RAZORPAY_KEY_SECRET.toLowerCase().includes("replace_me");
const razorpay = hasPaymentKeys
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  : null;
const app = createApp({ database, razorpay });
const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || "0.0.0.0";
const server = app.listen(port, host, () => {
  console.log(`CalmFlex API listening on ${host}:${port}`);
  console.log(`SQLite database: ${databasePath}`);
  if (!razorpay)
    console.log(
      "Online payments disabled; set Razorpay credentials in backend/.env to enable them.",
    );
});

function shutdown() {
  server.close(() => {
    database.close();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
