"use server";

import { revalidatePath } from "next/cache";
import { recordActivity } from "@/lib/activity";
import { requireUser } from "@/lib/auth";
import { addComment } from "@/lib/comments";
import { getVisibleItem } from "@/lib/items";
import { CommentInput } from "@/lib/schema";

export async function addCommentAction(itemId: unknown, formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = CommentInput.safeParse({ itemId, body: formData.get("body") });
  if (!parsed.success) return;

  const item = await getVisibleItem(user.id, parsed.data.itemId);
  if (!item) return;

  await addComment(user.id, item._id, parsed.data.body);
  await recordActivity(
    user,
    "commented",
    { _id: item._id, title: item.title, secret: item.secret, ownerId: item.ownerId },
  );
  revalidatePath("/", "layout");
}
