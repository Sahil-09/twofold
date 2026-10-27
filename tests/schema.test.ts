import assert from "node:assert/strict";
import test from "node:test";
import { ItemInput } from "../lib/schema.ts";

const base = { title: "Linen robe" };

test("priority defaults to nice and accepts the four Stitch levels", () => {
  assert.equal(ItemInput.parse(base).priority, "nice");
  for (const value of ["dream", "high", "essential", "nice"]) {
    assert.equal(ItemInput.parse({ ...base, priority: value }).priority, value);
  }
  assert.equal(ItemInput.safeParse({ ...base, priority: "must" }).success, false);
});

test("the vault checkbox survives both FormData and the JSON path", () => {
  assert.equal(ItemInput.parse({ ...base, secret: "on" }).secret, true);
  assert.equal(ItemInput.parse({ ...base, secret: true }).secret, true);
  assert.equal(ItemInput.parse({ ...base, secret: "" }).secret, false);
  assert.equal(ItemInput.parse(base).secret, false);
});

test("blank numbers fall back instead of becoming NaN", () => {
  const parsed = ItemInput.parse({ ...base, quantity: "", targetPrice: "", priceAmount: "" });
  assert.equal(parsed.quantity, 1);
  assert.equal(parsed.targetPrice, undefined);
  assert.equal(parsed.priceAmount, undefined);
});

test("quantity stays inside the stepper's range", () => {
  assert.equal(ItemInput.safeParse({ ...base, quantity: "0" }).success, false);
  assert.equal(ItemInput.safeParse({ ...base, quantity: "100" }).success, false);
  assert.equal(ItemInput.parse({ ...base, quantity: "99" }).quantity, 99);
});

test("a bad date is rejected rather than stored half-baked", () => {
  assert.equal(ItemInput.safeParse({ ...base, occasionDate: "14/11/2026" }).success, false);
  assert.equal(ItemInput.parse({ ...base, occasionDate: "2026-11-14" }).occasionDate, "2026-11-14");
});
