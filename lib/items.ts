import { randomUUID } from "node:crypto";
import { db } from "./db";
import { getOwnerListRaw, invalidateOwnerList } from "./item-cache";
import type { ClaimDoc, ItemDoc, UserDoc } from "./types";
import type { ItemInput } from "./schema";
import { priorityRank } from "./priority";
import { ownerView, toView, type ListView } from "./view";

export type { ItemView, ListView } from "./view";

/**
 * `revealClaims` is the owner's Surprise Mode opt-out. Only the owner's own list may use it; the
 * partner's view already carries their own claims.
 */
export async function getList(
  viewerId: string,
  ownerId: string,
  revealClaims = false,
): Promise<ListView> {
  const raw = await getOwnerListRaw(ownerId);
  const wanted = raw.items.filter((item) => !item.deletedAt);

  if (wanted.length === 0) return { items: [], reservations: [] };

  const claims = raw.claims.filter((c) => !c.deletedAt && wanted.some((i) => i._id === c.itemId));

  const mine = new Map(claims.filter((c) => c.claimantId === viewerId).map((c) => [c.itemId, c]));

  // A secret item never reaches the partner, unless they reserved it before it was made secret —
  // yanking someone's plan is worse than a slightly weaker surprise.
  const items =
    viewerId === ownerId
      ? wanted
      : wanted.filter((item) => !item.secret || mine.has(item._id));

  items.sort(
    (a, b) => priorityRank(a.priority) - priorityRank(b.priority) || +b.createdAt - +a.createdAt,
  );

  if (viewerId === ownerId) {
    // With Surprise Mode on (the default) the owner gets a count and a riddle, never a mapping.
    if (!revealClaims) {
      return {
        items: items.map((item) => ownerView(item)),
        reservations: claims.map((claim) => ({ token: randomUUID(), bought: Boolean(claim.boughtAt) })),
      };
    }

    const byItem = new Map(claims.map((c) => [c.itemId, c]));
    return {
      items: items.map((item) => ownerView(item, byItem.get(item._id))),
      reservations: [],
    };
  }

  return {
    items: items.map((item) => toView(item, mine.get(item._id))),
    reservations: [],
  };
}

/** Fulfilled wishes: your archived items + the partner's items you gifted. */
export async function getFulfilled(viewerId: string, partnerId: string | null) {
  const own = await db()
    .collection<ItemDoc>("items")
    .find({ ownerId: viewerId, status: "archived", deletedAt: { $exists: false } })
    .sort({ updatedAt: -1 })
    .toArray();
  const givenIds = partnerId
    ? (await db()
        .collection<ClaimDoc>("claims")
        .find({ claimantId: viewerId, archivedAt: { $exists: true }, deletedAt: { $exists: false } })
        .toArray()).map((c) => c.itemId)
    : [];
  const claimsByItem = new Map(
    (await db()
      .collection<ClaimDoc>("claims")
      .find({ itemId: { $in: givenIds }, deletedAt: { $exists: false } })
      .toArray())
      .map((c) => [c.itemId, c]),
  );
  const given = givenIds.length
    ? await db()
        .collection<ItemDoc>("items")
        .find({ _id: { $in: givenIds }, ownerId: partnerId!, deletedAt: { $exists: false } })
        .sort({ updatedAt: -1 })
        .toArray()
    : [];
  return {
    own: own.map((i) => ownerView(i)),
    given: given.map((i) => {
      const claim = claimsByItem.get(i._id);
      return toView(i, claim ? { claimedAt: claim.claimedAt, boughtAt: claim.boughtAt } : undefined);
    }),
  };
}

/**
 * True when the partner has a wanted, non-secret item newer than the last time this user looked.
 * Keyed on the viewer, not the partner id, so callers can run it without waiting for getPartner —
 * exactly two accounts, the same invariant getPartner and recordActivity already rely on.
 */
export async function partnerHasNew(userId: string, seenAt?: Date): Promise<boolean> {
  const count = await db()
    .collection<ItemDoc>("items")
    .countDocuments({
      ownerId: { $ne: userId },
      status: "wanted",
      secret: { $ne: true },
      deletedAt: { $exists: false },
      createdAt: { $gt: seenAt ?? new Date(0) },
    });
  return count > 0;
}

export async function markPartnerSeen(userId: string): Promise<void> {
  await db()
    .collection<UserDoc>("users")
    .updateOne({ _id: userId }, { $set: { partnerSeenAt: new Date() } });
}

export async function getItem(ownerId: string, itemId: string): Promise<ItemDoc | null> {
  return db()
    .collection<ItemDoc>("items")
    .findOne({ _id: itemId, ownerId, deletedAt: { $exists: false } });
}

export async function createItem(ownerId: string, input: ItemInput): Promise<string> {
  const now = new Date();
  const id = randomUUID();
  await db().collection<ItemDoc>("items").insertOne({
    _id: id,
    ownerId,
    ...mapInput(input),
    status: "wanted",
    createdAt: now,
    updatedAt: now,
  });
  await invalidateOwnerList(ownerId);
  return id;
}

export async function updateItem(ownerId: string, itemId: string, input: ItemInput): Promise<void> {
  const next = mapInput(input);
  const set: Record<string, unknown> = { updatedAt: new Date() };
  const unset: Record<string, ""> = {};
  for (const [key, value] of Object.entries(next)) {
    if (value === undefined) unset[key] = "";
    else set[key] = value;
  }
  const update = Object.keys(unset).length ? { $set: set, $unset: unset } : { $set: set };
  await db()
    .collection<ItemDoc>("items")
    .updateOne({ _id: itemId, ownerId, deletedAt: { $exists: false } }, update);
  await invalidateOwnerList(ownerId);
}

export async function archiveItem(ownerId: string, itemId: string): Promise<void> {
  const now = new Date();
  await db()
    .collection<ItemDoc>("items")
    .updateOne(
      { _id: itemId, ownerId, deletedAt: { $exists: false } },
      { $set: { status: "archived", updatedAt: now, archivedAt: now } },
    );
  await db()
    .collection<ClaimDoc>("claims")
    .updateMany({ itemId, deletedAt: { $exists: false } }, { $set: { archivedAt: new Date() } });
  await invalidateOwnerList(ownerId);
}

export async function deleteItem(ownerId: string, itemId: string): Promise<void> {
  const now = new Date();
  await db()
    .collection<ItemDoc>("items")
    .updateOne(
      { _id: itemId, ownerId, deletedAt: { $exists: false } },
      { $set: { deletedAt: now, updatedAt: now } },
    );
  // Soft-delete everything tied to the wish; never remove documents.
  await db()
    .collection<ClaimDoc>("claims")
    .updateMany({ itemId, deletedAt: { $exists: false } }, { $set: { deletedAt: now } });
  await db()
    .collection("priceChecks")
    .updateMany({ itemId, deletedAt: { $exists: false } }, { $set: { deletedAt: now } });
  await db()
    .collection("activity")
    .updateMany({ itemId, deletedAt: { $exists: false } }, { $set: { deletedAt: now } });
  await invalidateOwnerList(ownerId);
}

function mapInput(input: ItemInput): Omit<ItemDoc, "_id" | "ownerId" | "status" | "createdAt" | "updatedAt"> {
  return {
    title: input.title,
    url: input.url,
    imageUrl: input.imageUrl,
    note: input.note,
    priority: input.priority,
    quantity: input.quantity,
    occasion:
      input.occasionLabel || input.occasionDate
        ? { label: input.occasionLabel ?? "", date: input.occasionDate }
        : undefined,
    targetPrice: input.targetPrice,
    secret: input.secret || undefined,
    price:
      input.priceAmount !== undefined
        ? {
            amount: input.priceAmount,
            currency: (input.priceCurrency ?? "INR").toUpperCase(),
            capturedAt: new Date(),
          }
        : undefined,
  };
}
