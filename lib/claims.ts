import { randomUUID } from "node:crypto";
import { db } from "./db";
import type { ClaimDoc, ItemDoc } from "./types";

/** The partner may only touch items they do not own. A secret item stays touchable by whoever had already reserved it. */
async function partnerItem(viewerId: string, itemId: string): Promise<ItemDoc> {
  const item = await db().collection<ItemDoc>("items").findOne({ _id: itemId });
  if (!item || item.ownerId === viewerId) throw new Error("Item not found");
  if (item.secret) {
    const existing = await db()
      .collection<ClaimDoc>("claims")
      .findOne({ itemId, claimantId: viewerId });
    if (!existing) throw new Error("Item not found");
  }
  return item;
}

export async function claimItem(viewerId: string, itemId: string): Promise<void> {
  await partnerItem(viewerId, itemId);
  try {
    await db().collection<ClaimDoc>("claims").insertOne({
      _id: randomUUID(),
      itemId,
      claimantId: viewerId,
      claimedAt: new Date(),
    });
  } catch (error) {
    // Unique index on itemId: already claimed by this partner is a no-op.
    if ((error as { code?: number }).code !== 11000) throw error;
  }
}

export async function unclaimItem(viewerId: string, itemId: string): Promise<void> {
  await partnerItem(viewerId, itemId);
  await db()
    .collection<ClaimDoc>("claims")
    .deleteOne({ itemId, claimantId: viewerId, boughtAt: { $exists: false } });
}

export async function markBought(viewerId: string, itemId: string): Promise<void> {
  await partnerItem(viewerId, itemId);
  await db()
    .collection<ClaimDoc>("claims")
    .updateOne({ itemId, claimantId: viewerId }, { $set: { boughtAt: new Date() } });
}

/** After giving the gift the partner archives it, which is the first thing the owner sees. */
export async function markGiven(viewerId: string, itemId: string): Promise<void> {
  const item = await partnerItem(viewerId, itemId);
  const now = new Date();
  await db()
    .collection<ClaimDoc>("claims")
    .updateOne({ itemId, claimantId: viewerId }, { $set: { archivedAt: now } });
  await db()
    .collection<ItemDoc>("items")
    .updateOne({ _id: item._id }, { $set: { status: "archived", updatedAt: now } });
}
