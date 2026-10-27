import { randomUUID } from "node:crypto";
import { db } from "./db";
import { sendPush } from "./push";
import type { ActivityDoc, ItemDoc, UserDoc } from "./types";

const VERBS: Record<ActivityDoc["kind"], string> = {
  added: "added",
  updated: "updated",
  archived: "archived",
};

/**
 * Tells the *partner* that the owner touched their own list.
 * Called from item mutations only — a claim must never produce one of these.
 */
export async function recordActivity(
  actor: { id: string; displayName: string },
  kind: ActivityDoc["kind"],
  item: Pick<ItemDoc, "_id" | "title" | "secret">,
): Promise<void> {
  try {
    // Exactly two accounts, so "the other user" is the partner.
    const partner = await db().collection<UserDoc>("users").findOne({ _id: { $ne: actor.id } });
    if (!partner || item.secret || partner.notifyPartnerUpdates === false) return;

    await db().collection<ActivityDoc>("activity").insertOne({
      _id: randomUUID(),
      recipientId: partner._id,
      actorId: actor.id,
      kind,
      itemId: item._id,
      title: item.title,
      at: new Date(),
    });

    await sendPush(partner._id, {
      title: `${actor.displayName} ${VERBS[kind]} a wish`,
      body: item.title,
      url: "/?tab=theirs",
    });
  } catch {
    // A notification is best effort; it must never fail the save that caused it.
  }
}

export async function activityFor(userId: string): Promise<ActivityDoc[]> {
  return db()
    .collection<ActivityDoc>("activity")
    .find({ recipientId: userId })
    .sort({ at: -1 })
    .limit(50)
    .toArray();
}

export async function unreadActivityCount(userId: string): Promise<number> {
  return db()
    .collection<ActivityDoc>("activity")
    .countDocuments({ recipientId: userId, readAt: { $exists: false } });
}

export async function markActivityRead(userId: string): Promise<void> {
  await db()
    .collection<ActivityDoc>("activity")
    .updateMany(
      { recipientId: userId, readAt: { $exists: false } },
      { $set: { readAt: new Date() } },
    );
}
