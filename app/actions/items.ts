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

export async function updateItemAction(itemId: unknown, formData: FormData): Promise<void> {
  const user = await requireUser();
  if (typeof itemId !== "string" || !itemId.trim()) return;
  const id = itemId.trim();
  const parsed = ItemInput.safeParse(formToInput(formData));
  if (!parsed.success) {
    redirect(`/item/${id}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Check the fields.")}`);
  }
  await updateItem(user.id, id, parsed.data);
  await recordActivity(user, "updated", {
    _id: id,
    title: parsed.data.title,
    secret: parsed.data.secret,
  });
  revalidatePath("/");
  redirect("/");
}

export async function deleteItemAction(itemId: unknown): Promise<void> {
  const user = await requireUser();
  if (typeof itemId !== "string" || !itemId.trim()) return;
  const id = itemId.trim();
  await deleteItem(user.id, id);
  revalidatePath("/");
  redirect("/");
}

export async function archiveItemAction(itemId: unknown): Promise<void> {
  const user = await requireUser();
  if (typeof itemId !== "string" || !itemId.trim()) return;
  const id = itemId.trim();
  const item = await getItem(user.id, id);
  await archiveItem(user.id, id);
  if (item) {
    await recordActivity(user, "archived", { _id: id, title: item.title, secret: item.secret });
  }
  revalidatePath("/");
}
