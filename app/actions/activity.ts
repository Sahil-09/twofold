"use server";

import { revalidatePath } from "next/cache";
import { markActivityRead } from "@/lib/activity";
import { requireUser } from "@/lib/auth";

export async function markActivityReadAction(): Promise<void> {
  const user = await requireUser();
  await markActivityRead(user.id);
  // The header bell lives on this page, so this render is the one that needs the new count.
  revalidatePath("/activity");
}
