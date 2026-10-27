// One-off: old rows used priority "must"; new rows also need a "seen" watermark.
// Usage: npm run migrate   (idempotent — safe to re-run)
import { db } from "../lib/db.ts";

for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {}
}

const database = db();

const before = await database.collection("items").countDocuments({ priority: "must" });
const items = await database
  .collection("items")
  .updateMany({ priority: "must" }, { $set: { priority: "dream" } });

const users = await database
  .collection("users")
  .updateMany({ partnerSeenAt: { $exists: false } }, { $set: { partnerSeenAt: new Date() } });

await database.collection("activity").createIndex({ recipientId: 1, at: -1 });

console.log(`must → dream: ${items.modifiedCount} of ${before}`);
console.log(`partnerSeenAt stamped: ${users.modifiedCount}`);
process.exit(0);
