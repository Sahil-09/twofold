import { db } from "@/lib/db";
import { money } from "@/lib/format";
import { parseProduct } from "@/lib/parse";
import { sendPush } from "@/lib/push";
import { fetchPage } from "@/lib/ssrf";
import type { ItemDoc, PriceCheckDoc } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// shortcut: 40 items per run, concurrency 4, to stay inside the function budget.
// Upgrade to a paged/queued job if the list ever outgrows it.
const PER_RUN = 40;
const CONCURRENCY = 4;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");
  if (!secret || header !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const items = await db()
    .collection<ItemDoc>("items")
    .find({ status: "wanted", url: { $exists: true }, targetPrice: { $exists: true } })
    .limit(PER_RUN)
    .toArray();

  let checked = 0;
  let alerts = 0;

  for (let index = 0; index < items.length; index += CONCURRENCY) {
    const batch = items.slice(index, index + CONCURRENCY);
    const results = await Promise.all(batch.map(checkItem));
    checked += results.filter((ok) => ok).length;
    alerts += results.filter((ok) => ok === "alert").length;
  }

  return Response.json({ checked, alerts, scanned: items.length });
}

async function checkItem(item: ItemDoc): Promise<boolean | "alert"> {
  const now = new Date();
  const page = await fetchPage(item.url!);
  if (!page.ok) {
    await record(item._id, now, undefined, false, page.error);
    return false;
  }

  const draft = parseProduct(page.html, page.finalUrl);
  if (draft.priceAmount === undefined) {
    await record(item._id, now, undefined, false, "No price found on the page");
    return false;
  }

  await record(item._id, now, draft.priceAmount, true);
  await db()
    .collection<ItemDoc>("items")
    .updateOne(
      { _id: item._id },
      {
        $set: {
          price: {
            amount: draft.priceAmount,
            currency: draft.priceCurrency ?? item.price?.currency ?? "INR",
            capturedAt: now,
          },
          updatedAt: now,
        },
      },
    );

  const hit = item.targetPrice !== undefined && draft.priceAmount <= item.targetPrice;
  if (!hit || item.alertedAt) return true;

  await db()
    .collection<ItemDoc>("items")
    .updateOne({ _id: item._id }, { $set: { alertedAt: now } });

  await sendPush(item.ownerId, {
    title: "Target hit",
    body: `${item.title} is ${money(draft.priceAmount, draft.priceCurrency ?? item.price?.currency)}.`,
    url: `/item/${item._id}`,
  });

  return "alert";
}

async function record(
  itemId: string,
  checkedAt: Date,
  price: number | undefined,
  ok: boolean,
  error?: string,
) {
  await db()
    .collection<PriceCheckDoc>("priceChecks")
    .insertOne({ _id: crypto.randomUUID(), itemId, checkedAt, price, ok, error });
}
