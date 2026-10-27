"use server";

import { revalidatePath } from "next/cache";
import { markActivityRead } from "@/lib/activity";
import { requireUser } from "@/lib/auth";

export async function markActivityReadAction(): Promise<void> {
  const user = await requireUser();
  await markActivityRead(user.id);
  revalidatePath("/activity");
  revalidatePath("/");
}
