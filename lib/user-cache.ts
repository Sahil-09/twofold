import { db } from "./db";
import { redis } from "./redis";
import type { Theme, UserDoc } from "./types";

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

export type CachedUser = Omit<CurrentUser, "partnerSeenAt" | "createdAt"> & {
  partnerSeenAt?: string;
  createdAt: string;
};

export const USER_CACHE_TTL = 300;
const USER_KEY = (id: string) => `twofold:user:${id}`;

export function toCache(user: CurrentUser): CachedUser {
  return {
    ...user,
    partnerSeenAt: user.partnerSeenAt?.toISOString(),
    createdAt: user.createdAt.toISOString(),
  };
}

export function fromCache(cached: CachedUser): CurrentUser {
  return {
    ...cached,
    partnerSeenAt: cached.partnerSeenAt ? new Date(cached.partnerSeenAt) : undefined,
    createdAt: new Date(cached.createdAt),
  };
}

function mapUserDoc(user: UserDoc): CurrentUser {
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

export async function getUserById(userId: string): Promise<CurrentUser | null> {
  const client = redis();
  if (client) {
    try {
      const raw = await client.get(USER_KEY(userId));
      if (raw) return fromCache(JSON.parse(raw) as CachedUser);
    } catch {
      // Fall through to Mongo on any Redis hiccup.
    }
  }

  const doc = await db().collection<UserDoc>("users").findOne({ _id: userId });
  if (!doc) return null;
  const user = mapUserDoc(doc);

  if (client) {
    try {
      await client.set(USER_KEY(userId), JSON.stringify(toCache(user)), "EX", USER_CACHE_TTL);
    } catch {
      // Cache is best-effort; never fail the read.
    }
  }
  return user;
}

export async function invalidateUser(userId: string): Promise<void> {
  const client = redis();
  if (!client) return;
  try {
    await client.del(USER_KEY(userId));
  } catch {
    // Invalidation is best-effort; TTL covers the gap.
  }
}