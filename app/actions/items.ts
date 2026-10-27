"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recordActivity } from "@/lib/activity";
import { requireUser } from "@/lib/auth";
import { archiveItem, createItem, deleteItem, getItem, updateItem } from "@/lib/items";
import { ItemInput } from "@/lib/schema";

export type SaveResult = { ok: true; id: string } | { ok: false; error: string };

const formToInput = (formData: FormData) => Object.fromEntries(formData.entries());

export async function createItemAction(input: unknown): Promise<SaveResult> {
  const user = await requireUser();
  const parsed = ItemInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the fields." };
  }
  const id = await createItem(user.id, parsed.data);
  await recordActivity(user, "added", {
    _id: id,
    title: parsed.data.title,
    secret: parsed.data.secret,
  });
  revalidatePath("/");
  return { ok: true, id };
}

export async function updateItemAction(itemId: string, formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = ItemInput.safeParse(formToInput(formData));
  if (!parsed.success) {
    redirect(`/item/${itemId}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Check the fields.")}`);
  }
  await updateItem(user.id, itemId, parsed.data);
  await recordActivity(user, "updated", {
    _id: itemId,
    title: parsed.data.title,
    secret: parsed.data.secret,
  });
  revalidatePath("/");
  redirect("/");
}

export async function deleteItemAction(itemId: string): Promise<void> {
  const user = await requireUser();
  await deleteItem(user.id, itemId);
  revalidatePath("/");
  redirect("/");
}

export async function archiveItemAction(itemId: string): Promise<void> {
  const user = await requireUser();
  const item = await getItem(user.id, itemId);
  await archiveItem(user.id, itemId);
  if (item) {
    await recordActivity(user, "archived", { _id: itemId, title: item.title, secret: item.secret });
  }
  revalidatePath("/");
}
