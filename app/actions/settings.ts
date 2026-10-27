"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import type { PushSubDoc, Theme, UserDoc } from "@/lib/types";

export async function saveSettings(formData: FormData): Promise<void> {
  const user = await requireUser();
  const displayName = String(formData.get("displayName") ?? "").trim().slice(0, 60);
  const theme = String(formData.get("theme") ?? "system") as Theme;
  if (!displayName) return;

  await db()
    .collection<UserDoc>("users")
    .updateOne(
      { _id: user.id },
      { $set: { displayName, theme: ["light", "dark", "system"].includes(theme) ? theme : "system" } },
    );
  revalidatePath("/");
  revalidatePath("/settings");
}

export async function setTheme(theme: Theme): Promise<void> {
  const user = await requireUser();
  if (!["light", "dark", "system"].includes(theme)) return;
  await db().collection<UserDoc>("users").updateOne({ _id: user.id }, { $set: { theme } });
  revalidatePath("/");
  revalidatePath("/settings");
}

/** The three user preferences that used to be chips or one-off actions. */
const SETTINGS = {
  surpriseMode: "surpriseMode",
  autoParse: "autoParse",
  partnerUpdates: "notifyPartnerUpdates",
} as const satisfies Record<string, keyof UserDoc>;

export type SettingKey = keyof typeof SETTINGS;

const SettingInput = z.object({
  key: z.enum(["surpriseMode", "autoParse", "partnerUpdates"]),
  enabled: z.boolean(),
});

/** Every toggle writes the same field shape; the key list is the allowlist. */
export async function setSetting(key: unknown, enabled: unknown): Promise<void> {
  const user = await requireUser();
  const parsed = SettingInput.safeParse({ key, enabled });
  if (!parsed.success) return;

  await db()
    .collection<UserDoc>("users")
    .updateOne(
      { _id: user.id },
      { $set: { [SETTINGS[parsed.data.key]]: parsed.data.enabled } },
    );
  revalidatePath("/");
  revalidatePath("/settings");
}

/** Called when the partner's list is actually opened, which clears the nav dot. */
export async function markPartnerSeenAction(): Promise<void> {
  const user = await requireUser();
  await db()
    .collection<UserDoc>("users")
    .updateOne({ _id: user.id }, { $set: { partnerSeenAt: new Date() } });
  revalidatePath("/");
  revalidatePath("/settings");
}

const SubscriptionInput = z.object({
  endpoint: z.string().url().max(2000),
  keys: z.object({ p256dh: z.string().max(200), auth: z.string().max(200) }),
});

export async function subscribeAction(input: unknown): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const parsed = SubscriptionInput.safeParse(input);
  if (!parsed.success) return { ok: false };

  await db()
    .collection<PushSubDoc>("pushSubs")
    .updateOne(
      { userId: user.id, endpoint: parsed.data.endpoint },
      {
        $set: { keys: parsed.data.keys },
        $setOnInsert: { _id: randomUUID(), userId: user.id, createdAt: new Date() },
      },
      { upsert: true },
    );
  return { ok: true };
}

export async function unsubscribeAction(endpoint: string): Promise<void> {
  const user = await requireUser();
  await db().collection<PushSubDoc>("pushSubs").deleteMany({ userId: user.id, endpoint });
  revalidatePath("/settings");
}
