"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { claimItem, markBought, markGiven, unclaimItem, unmarkBought } from "@/lib/claims";

const itemId = (formData: FormData) => String(formData.get("itemId") ?? "");

export async function claimAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  await claimItem(user.id, itemId(formData));
  revalidatePath("/");
}

export async function unclaimAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  await unclaimItem(user.id, itemId(formData));
  revalidatePath("/");
}

export async function boughtAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  await markBought(user.id, itemId(formData));
  revalidatePath("/");
}

export async function unboughtAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  await unmarkBought(user.id, itemId(formData));
  revalidatePath("/");
}

export async function givenAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  await markGiven(user.id, itemId(formData));
  revalidatePath("/");
}
