import assert from "node:assert/strict";
import test from "node:test";
import { CommentInput } from "../lib/schema.ts";
import { canViewItem } from "../lib/view.ts";

test("a note needs an item and trimmed text", () => {
  assert.deepEqual(CommentInput.parse({ itemId: "item-1", body: "  Lovely  " }), {
    itemId: "item-1",
    body: "Lovely",
  });
  assert.equal(CommentInput.safeParse({ itemId: "item-1", body: "   " }).success, false);
  assert.equal(CommentInput.safeParse({ itemId: "", body: "Hi" }).success, false);
  assert.equal(CommentInput.safeParse({ itemId: "item-1", body: "x".repeat(1001) }).success, false);
});

test("the secret rule is shared by lists and comments", () => {
  const secret = { ownerId: "owner", secret: true };
  assert.equal(canViewItem("owner", secret), true);
  assert.equal(canViewItem("partner", secret), false);
  assert.equal(canViewItem("partner", secret, true), true);
  assert.equal(canViewItem("partner", { ownerId: "owner" }), true);
});
