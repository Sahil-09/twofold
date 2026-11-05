import { db } from "./db";
import { redis } from "./redis";
import type { ClaimDoc, ItemDoc } from "./types";

const ITEM_CACHE_TTL = 30;
const NOT_DELETED = { deletedAt: { $exists: false } };

const revive = (value: unknown): unknown => {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return new Date(value);
  if (Array.isArray(value)) return value.map(revive);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) out[key] = revive(val);
    return out;
  }
  return value;
};

const rawKey = (ownerId: string) => `twofold:listraw:${ownerId}`;

export type OwnerListRaw = { items: ItemDoc[]; claims: ClaimDoc[] };

export async function getOwnerListRaw(ownerId: string): Promise<OwnerListRaw> {
  const client = redis();
  if (client) {
    try {
      const raw = await client.get(rawKey(ownerId));
      if (raw) return revive(JSON.parse(raw)) as OwnerListRaw;
    } catch {
      // Fall through to Mongo.
    }
  }

  const items = await db()
    .collection<ItemDoc>("items")
    .find({ ownerId, status: "wanted", ...NOT_DELETED })
    .toArray();
  const claims = items.length
    ? await db()
        .collection<ClaimDoc>("claims")
        .find({ itemId: { $in: items.map((i) => i._id) }, ...NOT_DELETED })
        .toArray()
    : [];

  const payload: OwnerListRaw = { items, claims };
  if (client) {
    try {
      await client.set(rawKey(ownerId), JSON.stringify(payload), "EX", ITEM_CACHE_TTL);
    } catch {
      // Best-effort cache.
    }
  }
  return payload;
}

export async function invalidateOwnerList(ownerId: string): Promise<void> {
  const client = redis();
  if (!client) return;
  try {
    await client.del(rawKey(ownerId));
  } catch {
    // TTL covers lapses.
  }
}