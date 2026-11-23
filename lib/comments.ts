import { randomUUID } from "node:crypto";
import { db } from "./db";
import type { CommentDoc } from "./types";
import type { CommentView } from "./view";

/** One query per list, keyed by item. `ownerId` is the list owner, so notes can be labelled. */
export async function loadComments(
  itemIds: string[],
  ownerId: string,
): Promise<Map<string, CommentView[]>> {
  const byItem = new Map<string, CommentView[]>();
  if (itemIds.length === 0) return byItem;

  const docs = await db()
    .collection<CommentDoc>("comments")
    .find({ itemId: { $in: itemIds }, deletedAt: { $exists: false } })
    .sort({ createdAt: 1 })
    .toArray();

  for (const doc of docs) {
    const notes = byItem.get(doc.itemId) ?? [];
    notes.push({
      id: doc._id,
      body: doc.body,
      createdAt: doc.createdAt.toISOString(),
      byOwner: doc.authorId === ownerId,
    });
    byItem.set(doc.itemId, notes);
  }
  return byItem;
}

export async function addComment(authorId: string, itemId: string, body: string): Promise<void> {
  await db().collection<CommentDoc>("comments").insertOne({
    _id: randomUUID(),
    itemId,
    authorId,
    body,
    createdAt: new Date(),
  });
}
