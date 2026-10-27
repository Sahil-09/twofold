// Usage: npm run set-password -- you@example.com "the new password"
import { db } from "../lib/db.ts";
import { hashPassword } from "../lib/password.ts";
import type { UserDoc } from "../lib/types.ts";

for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {}
}

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error('usage: npm run set-password -- email "new password"');
  process.exit(1);
}

const result = await db()
  .collection<UserDoc>("users")
  .updateOne({ email: email.trim().toLowerCase() }, { $set: { passwordHash: await hashPassword(password) } });

if (result.matchedCount === 0) {
  console.error(`no user with email ${email}`);
  process.exit(1);
}

console.log(`password updated for ${email}`);
process.exit(0);
