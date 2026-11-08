import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";
import { redis } from "./redis";
import { getUserById, invalidateUser } from "./user-cache";
import type { CurrentUser } from "./user-cache";
import type { SessionDoc, Theme, UserDoc } from "./types";

export type { CurrentUser } from "./user-cache";

const COOKIE = "twofold_sid";
const SESSION_TTL_SEC = 30 * 24 * 60 * 60;
const SESSION_PREFIX = "twofold:session:";

const sha = (value: string) => createHash("sha256").update(value).digest("hex");

export { invalidateUser };

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const hash = sha(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_SEC * 1000);

  const client = redis();
  if (client) {
    try {
      await client.set(`${SESSION_PREFIX}${hash}`, userId, "EX", SESSION_TTL_SEC);
    } catch {
      await db().collection<SessionDoc>("sessions").insertOne({ _id: hash, userId, expiresAt });
    }
  } else {
    await db().collection<SessionDoc>("sessions").insertOne({ _id: hash, userId, expiresAt });
  }

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    const hash = sha(token);
    const client = redis();
    if (client) {
      try {
        await client.del(`${SESSION_PREFIX}${hash}`);
      } catch {
        await db()
        .collection<SessionDoc>("sessions")
        .updateOne({ _id: hash }, { $set: { deletedAt: new Date() } });
      }
    } else {
      await db()
        .collection<SessionDoc>("sessions")
        .updateOne({ _id: hash }, { $set: { deletedAt: new Date() } });
    }
  }
  jar.delete(COOKIE);
}

/** Cached per render pass: the layout and the page must not each pay for a session + user read. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const hash = sha(token);

  const client = redis();
  let userId: string | null = null;
  let redisFailed = false;

  if (client) {
    try {
      userId = await client.get(`${SESSION_PREFIX}${hash}`);
    } catch {
      redisFailed = true;
    }
  }

  if ((client === null || redisFailed) && userId === null) {
    const session = await db()
      .collection<SessionDoc>("sessions")
      .findOne({ _id: hash, expiresAt: { $gt: new Date() }, deletedAt: { $exists: false } });
    userId = session?.userId ?? null;
  } else if (client && !redisFailed && userId === null) {
    // Redis said "no such session"; do not fall back to Mongo (it was the source of truth
    // only when Redis is unavailable). Session is genuinely invalid.
  }

  if (!userId) return null;
  return getUserById(userId);
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** The partner id never changes (two accounts), so cache the lookup, not the user doc. */
const PARTNER_KEY = (userId: string) => `twofold:partner:${userId}`;
const PARTNER_TTL_SEC = 3600;

export async function getPartner(userId: string): Promise<CurrentUser | null> {
  const client = redis();
  let partnerId: string | null = null;

  if (client) {
    try {
      partnerId = await client.get(PARTNER_KEY(userId));
    } catch {
      // Fall through to Mongo on any Redis hiccup.
    }
  }

  if (!partnerId) {
    // Exactly two accounts by design, so "the other user" is the partner.
    const doc = await db().collection<UserDoc>("users").findOne({ _id: { $ne: userId } });
    if (!doc) return null;
    partnerId = doc._id;
    if (client) {
      try {
        await client.set(PARTNER_KEY(userId), partnerId, "EX", PARTNER_TTL_SEC);
      } catch {
        // Cache is best-effort; never fail the read.
      }
    }
  }

  return getUserById(partnerId);
}