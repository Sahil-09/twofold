import assert from "node:assert/strict";
import test from "node:test";
import { applyList, singleCurrency } from "../lib/list.ts";
import type { ItemView } from "../lib/view.ts";
import type { Priority } from "../lib/types.ts";

const item = (
  id: string,
  overrides: Partial<ItemView> & { priority?: Priority; createdAt?: string } = {},
): ItemView => ({
  id,
  title: id,
  priority: "nice",
  quantity: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

/** Titles in order, the easy thing to assert on. */
const ids = (items: ItemView[]) => items.map((entry) => entry.id);

const robe = item("robe", { title: "Linen Robe", note: "warm for winter" });
const chair = item("chair", { title: "Reading chair", url: "https://www.amazon.in/dp/x" });
const lamp = item("lamp", { title: "Brass lamp" });

test("search looks at the title, the note and the shop host, case-insensitively", () => {
  const all = [robe, chair, lamp];
  assert.deepEqual(ids(applyList(all, { q: "LINEN" })), ["robe"]);
  assert.deepEqual(ids(applyList(all, { q: "winter" })), ["robe"]);
  assert.deepEqual(ids(applyList(all, { q: "amazon" })), ["chair"]);
  assert.deepEqual(ids(applyList(all, { q: "  brass  " })), ["lamp"]);
  assert.deepEqual(ids(applyList(all, { q: "nothing here" })), []);
  assert.deepEqual(ids(applyList(all, { q: "  " })), ["robe", "chair", "lamp"]);
});

test("the priority filter keeps only that priority", () => {
  const all = [item("a", { priority: "dream" }), item("b", { priority: "toppick" }), lamp];
  assert.deepEqual(ids(applyList(all, { priority: "dream" })), ["a"]);
  assert.deepEqual(ids(applyList(all, { priority: "all" })), ["b", "lamp", "a"]);
});

test("planned and unplanned only look at the claim the viewer already has", () => {
  const claimed = item("claimed", { claim: { claimedAt: "2026-02-01T00:00:00.000Z", bought: false } });
  const all = [claimed, lamp];
  assert.deepEqual(ids(applyList(all, { state: "planned" })), ["claimed"]);
  assert.deepEqual(ids(applyList(all, { state: "unplanned" })), ["lamp"]);
  assert.deepEqual(ids(applyList(all, { state: "all" })), ["claimed", "lamp"]);
});

test("most wanted is the default, newest breaks the tie", () => {
  const all = [
    item("nice", { priority: "nice", createdAt: "2026-03-01T00:00:00.000Z" }),
    item("dream-new", { priority: "dream", createdAt: "2026-03-02T00:00:00.000Z" }),
    item("dream-old", { priority: "dream", createdAt: "2026-03-01T00:00:00.000Z" }),
    item("high", { priority: "toppick", createdAt: "2026-03-01T00:00:00.000Z" }),
  ];
  assert.deepEqual(ids(applyList(all)), ["high", "nice", "dream-new", "dream-old"]);
});

test("newest ignores priority", () => {
  const all = [
    item("old", { priority: "dream", createdAt: "2026-01-01T00:00:00.000Z" }),
    item("new", { priority: "nice", createdAt: "2026-05-01T00:00:00.000Z" }),
  ];
  assert.deepEqual(ids(applyList(all, { sort: "newest" })), ["new", "old"]);
});

test("price sorts put the unpriced last in both directions", () => {
  const all = [
    item("none"),
    item("cheap", { price: { amount: 100, currency: "INR" } }),
    item("dear", { price: { amount: 5000, currency: "INR" } }),
  ];
  assert.deepEqual(ids(applyList(all, { sort: "priceAsc" })), ["cheap", "dear", "none"]);
  assert.deepEqual(ids(applyList(all, { sort: "priceDesc" })), ["dear", "cheap", "none"]);
});

test("filters and search stack", () => {
  const all = [
    item("dream-robe", { title: "Linen Robe", priority: "dream" }),
    item("nice-robe", { title: "Silk robe", priority: "nice" }),
  ];
  assert.deepEqual(ids(applyList(all, { q: "robe", priority: "dream" })), ["dream-robe"]);
});

test("one currency only when every priced item shares it", () => {
  assert.equal(singleCurrency([robe, lamp]), undefined);
  assert.equal(singleCurrency([]), undefined);
  assert.equal(
    singleCurrency([robe, item("a", { price: { amount: 1, currency: "INR" } })]),
    "INR",
  );
  assert.equal(
    singleCurrency([
      item("a", { price: { amount: 1, currency: "INR" } }),
      item("b", { price: { amount: 2, currency: "USD" } }),
    ]),
    undefined,
  );
});
