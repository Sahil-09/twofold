// Creates/refreshes the two accounts and the indexes. Safe to re-run.
// Usage: npm run seed   (needs MONGODB_URI, SEED_USER_A, SEED_USER_B)
import { randomUUID } from "node:crypto";
import { db } from "../lib/db.ts";
import { hashPassword } from "../lib/password.ts";
import type { UserDoc } from "../lib/types.ts";

// Node's own env loader; .env.local wins because it loads first and loadEnvFile never overwrites.
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {}
}

type Seed = { email: string; password: string; displayName: string };

function parseSeed(raw: string | undefined, which: string): Seed {
  const [email, password, displayName] = (raw ?? "").split(":");
  if (!email || !password) {
    throw new Error(`${which} must be "email:password:Display Name"`);
  }
  return { email: email.trim().toLowerCase(), password, displayName: displayName?.trim() || email };
}

const seeds = [
  parseSeed(process.env.SEED_USER_A, "SEED_USER_A"),
  parseSeed(process.env.SEED_USER_B, "SEED_USER_B"),
];

const database = db();

await database.collection("users").createIndex({ email: 1 }, { unique: true });
await database.collection("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
await database.collection("items").createIndex({ ownerId: 1, status: 1 });
await database.collection("claims").createIndex({ itemId: 1 }, { unique: true });
await database.collection("claims").createIndex({ claimantId: 1 });
await database.collection("pushSubs").createIndex({ userId: 1 });
await database.collection("priceChecks").createIndex({ itemId: 1, checkedAt: -1 });
await database.collection("activity").createIndex({ recipientId: 1, at: -1 });

for (const seed of seeds) {
  const passwordHash = await hashPassword(seed.password);
  await database.collection<UserDoc>("users").updateOne(
    { email: seed.email },
    {
      $set: { passwordHash, displayName: seed.displayName },
      $setOnInsert: {
        _id: randomUUID(),
        email: seed.email,
        theme: "system",
        createdAt: new Date(),
      },
    },
    { upsert: true },
  );
  console.log(`seeded ${seed.email}`);
}

console.log("done");
process.exit(0);
