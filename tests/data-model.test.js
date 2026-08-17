"use strict";

const assert = require("node:assert/strict");

require("../data-model.js");

const model = globalThis.ASOUL_DATA_MODEL;

assert.equal(model.CURRENT_STATE_VERSION, 4);

const legacyWeeks = [{ id: "week-1", startDate: "2026-08-17" }];
const legacy = { profile: {}, weeklyPlans: legacyWeeks, charts: [] };
const migratedLegacy = model.migrateState(legacy);
assert.equal(migratedLegacy.version, 4);
assert.deepEqual(migratedLegacy.weeks, legacyWeeks);
assert.equal(legacy.version, undefined, "migration must not mutate the source object");

const current = { version: 4, profile: { name: "test" }, weeks: [], charts: [] };
const migratedCurrent = model.migrateState(current);
assert.deepEqual(migratedCurrent, current);
assert.notEqual(migratedCurrent, current, "current data is cloned before normalization");

assert.throws(
  () => model.migrateState({ version: 99, profile: {}, weeks: [], charts: [] }),
  (error) => error.code === model.UNSUPPORTED_VERSION_CODE && error.stateVersion === 99,
);

console.log("data-model migrations: ok");

