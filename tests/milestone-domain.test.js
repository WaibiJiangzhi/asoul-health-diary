"use strict";

const assert = require("node:assert/strict");

require("../js/domain/milestone-domain.js");

const domain = globalThis.ASOUL_MILESTONE_DOMAIN;

assert.ok(Object.isFrozen(domain));
assert.equal(domain.getProgressPercent({ current: 25, target: 40 }), 62.5);
assert.equal(domain.getProgressPercent({ current: 50, target: 40 }), 100);
assert.equal(domain.getProgressPercent({ current: -5, target: 40 }), 0);
assert.equal(domain.getProgressPercent({ current: 5, target: 0 }), 0);

const spaces = [{ id: "study", name: "考研" }, { id: "health", name: "健身" }];
assert.deepEqual(domain.getReportSpaceNames({ spaceIds: ["health", "missing", "study"] }, spaces), ["健身", "考研"]);
assert.deepEqual(domain.selectValidSpaceIds(["study", "study", " missing ", "health"], spaces), ["study", "health"]);

const original = [{ id: "one" }, { id: "two" }, { id: "three" }];
const moved = domain.moveItemById(original, "two", -1);
assert.equal(moved.moved, true);
assert.deepEqual(moved.items.map((item) => item.id), ["two", "one", "three"]);
assert.deepEqual(original.map((item) => item.id), ["one", "two", "three"], "reordering must not mutate the source array");
assert.deepEqual(domain.moveItemById(original, "one", -1), { items: original, moved: false });

const goal = {
  id: "progress-1",
  current: 8,
  target: 10,
  defaultIncrement: 1,
  updates: Array.from({ length: 100 }, (_, index) => ({ id: `old-${index}`, amount: 1, createdAt: index })),
};
const increased = domain.applyProgressDelta(goal, 5, { id: "new", createdAt: 101 });
assert.equal(increased.current, 13);
assert.equal(increased.defaultIncrement, 5);
assert.equal(increased.updates.length, 100);
assert.equal(increased.updates[0].id, "old-1");
assert.deepEqual(increased.updates.at(-1), { id: "new", amount: 5, createdAt: 101 });
assert.equal(goal.current, 8, "progress updates must not mutate the source goal");
assert.equal(domain.applyProgressDelta(goal, 0, { id: "zero", createdAt: 102 }), null);
assert.equal(domain.applyProgressDelta({ ...goal, current: 2 }, -5, { id: "down", createdAt: 103 }).current, 0);

console.log("milestone domain: ok");
