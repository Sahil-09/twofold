import webpush from "web-push";
import { db } from "./db";
import type { PushSubDoc } from "./types";

let configured = false;

export function pushConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT,
  );
}

function configure(): boolean {
  if (!pushConfigured()) return false;
  if (!configured) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT!,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!,
    );
    configured = true;
  }
  return true;
}

export type PushPayload = { title: string; body: string; url?: string };

export async function sendPush(userId: string, payload: PushPayload): Promise<void> {
  if (!configure()) return;

  const subs = await db().collection<PushSubDoc>("pushSubs").find({ userId }).toArray();
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          JSON.stringify(payload),
        );
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        // 404/410 mean the browser dropped the subscription.
        if (status === 404 || status === 410) {
          await db().collection<PushSubDoc>("pushSubs").deleteOne({ _id: sub._id });
        }
      }
    }),
  );
}
