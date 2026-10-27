import assert from "node:assert/strict";
import test from "node:test";
import { ownerView, toView } from "../lib/view.ts";
import type { ItemDoc } from "../lib/types.ts";

const item: ItemDoc = {
  _id: "item-1",
  ownerId: "me",
  title: "Linen robe",
  price: { amount: 120, currency: "USD", capturedAt: new Date("2026-01-01") },
  priority: "dream",
  quantity: 1,
  status: "wanted",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

test("the owner's item never carries claim data by default", () => {
  const view = ownerView(item);
  assert.equal("claim" in view, false);
  assert.equal(JSON.stringify(view).includes("claim"), false);
  assert.equal(JSON.stringify(view).includes("bought"), false);
});

test("surprise mode off passes the claim, without the claimant's identity", () => {
  const view = ownerView(item, { claimedAt: new Date("2026-02-01"), boughtAt: new Date("2026-02-02") });
  assert.deepEqual(view.claim, {
    claimedAt: "2026-02-01T00:00:00.000Z",
    boughtAt: "2026-02-02T00:00:00.000Z",
    bought: true,
  });
  assert.equal("claimantId" in (view.claim ?? {}), false);
});

test("owner view keeps what the owner needs to edit the wish", () => {
  const view = ownerView(item);
  assert.equal(view.id, "item-1");
  assert.equal(view.title, "Linen robe");
  assert.equal(view.price?.amount, 120);
});

test("the secret flag is owner-only", () => {
  const secret = { ...item, secret: true };
  assert.equal(ownerView(secret).secret, true);
  assert.equal(ownerView(item).secret, undefined);
  assert.equal("secret" in toView(secret), false);
});
