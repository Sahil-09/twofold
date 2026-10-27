import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import type { SessionDoc, Theme, UserDoc } from "./types";

const COOKIE = "twofold_sid";
const SESSION_TTL = 30 * 24 * 60 * 60 * 1000;

export type CurrentUser = {
  id: string;
  email: string;
  displayName: string;
  theme: Theme;
  notifyPartnerUpdates: boolean;
  surpriseMode: boolean;
  autoParse: boolean;
  partnerSeenAt?: Date;
  createdAt: Date;
};

// scrypt rather than argon2: no native build step, standard library only.
const sha = (value: string) => createHash("sha256").update(value).digest("hex");

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL);
  await db().collection<SessionDoc>("sessions").insertOne({ _id: sha(token), userId, expiresAt });
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
  if (token) await db().collection<SessionDoc>("sessions").deleteOne({ _id: sha(token) });
  jar.delete(COOKIE);
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;

  const session = await db()
    .collection<SessionDoc>("sessions")
    .findOne({ _id: sha(token), expiresAt: { $gt: new Date() } });
  if (!session) return null;

  const user = await db().collection<UserDoc>("users").findOne({ _id: session.userId });
  if (!user) return null;

  return {
    id: user._id,
    email: user.email,
    displayName: user.displayName,
    theme: user.theme ?? "system",
    notifyPartnerUpdates: user.notifyPartnerUpdates !== false,
    surpriseMode: user.surpriseMode !== false,
    autoParse: user.autoParse !== false,
    partnerSeenAt: user.partnerSeenAt,
    createdAt: user.createdAt,
  };
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function getPartner(userId: string): Promise<CurrentUser | null> {
  // Exactly two accounts by design, so "the other user" is the partner.
  const user = await db()
    .collection<UserDoc>("users")
    .findOne({ _id: { $ne: userId } });
  if (!user) return null;
  return {
    id: user._id,
    email: user.email,
    displayName: user.displayName,
    theme: user.theme ?? "system",
    notifyPartnerUpdates: user.notifyPartnerUpdates !== false,
    surpriseMode: user.surpriseMode !== false,
    autoParse: user.autoParse !== false,
    partnerSeenAt: user.partnerSeenAt,
    createdAt: user.createdAt,
  };
}
