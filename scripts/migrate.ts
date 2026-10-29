// One-off: legacy priority values migrate to the new 5-tier labels.
// Usage: npm run migrate   (idempotent — safe to re-run)
import { db } from "../lib/db.ts";

for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {}
}

const database = db();

const mappings = [
  ["must", "worth"],
  ["high", "toppick"],
  ["essential", "everyday"],
] as const;

let total = 0;
for (const [from, to] of mappings) {
  const before = await database.collection("items").countDocuments({ priority: from });
  const result = await database.collection("items").updateMany({ priority: from }, { $set: { priority: to } });
  total += result.modifiedCount;
  console.log(`${from} → ${to} (modified ${result.modifiedCount} of ${before})`);
}

const users = await database
  .collection("users")
  .updateMany({ partnerSeenAt: { $exists: false } }, { $set: { partnerSeenAt: new Date() } });

await database.collection("activity").createIndex({ recipientId: 1, at: -1 });

console.log(`total migrations: ${total}`);
console.log(`partnerSeenAt stamped: ${users.modifiedCount}`);
process.exit(0);