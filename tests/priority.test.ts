import assert from "node:assert/strict";
import test from "node:test";
import { PRIORITIES, priorityIcon, priorityLabel, priorityRank } from "../lib/priority.ts";
import type { Priority } from "../lib/types.ts";

test("list order puts the most wanted first", () => {
  const sorted = (["nice", "toppick", "worth", "everyday", "dream"] as Priority[]).sort(
    (a, b) => priorityRank(a) - priorityRank(b),
  );
  assert.deepEqual(sorted, ["everyday", "toppick", "nice", "worth", "dream"]);
});

test("an unknown legacy priority sorts last instead of vanishing", () => {
  assert.equal(priorityRank("must" as Priority), 5);
  assert.ok(priorityRank("must" as Priority) > priorityRank("nice"));
});

test("every priority has a label and an icon", () => {
  for (const entry of PRIORITIES) {
    assert.equal(priorityLabel(entry.value), entry.short);
    assert.ok(["star", "sparkle", "bag"].includes(priorityIcon(entry.value)));
  }
  assert.equal(priorityLabel("nope" as Priority), "Nice to have");
});
