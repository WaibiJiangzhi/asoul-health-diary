"use strict";

const assert = require("node:assert/strict");

require("../data-model.js");

const model = globalThis.ASOUL_DATA_MODEL;

assert.equal(model.CURRENT_STATE_VERSION, 6);
assert.deepEqual(model.DEFAULT_SPACES.map(({ id, name }) => ({ id, name })), [
  { id: "health", name: "健康" },
  { id: "study", name: "考研" },
  { id: "work", name: "工作" },
]);

const legacyWeeks = [{ id: "week-1", startDate: "2026-08-17" }];
const legacy = { profile: {}, weeklyPlans: legacyWeeks, charts: [] };
const migratedLegacy = model.migrateState(legacy);
assert.equal(migratedLegacy.version, 6);
assert.equal(migratedLegacy.activeSpaceId, "health");
assert.deepEqual(migratedLegacy.weeks, [{ ...legacyWeeks[0], spaceId: "health" }]);
assert.deepEqual(migratedLegacy.periods.map(({ spaceId, yearMonth }) => ({ spaceId, yearMonth })), [
  { spaceId: "health", yearMonth: "2026-08" },
]);
assert.equal(legacy.version, undefined, "migration must not mutate the source object");

const versionFour = {
  version: 4,
  profile: { name: "test" },
  weeks: [{ id: "week-4" }],
  charts: [{ id: "chart-4" }],
};
const migratedVersionFour = model.migrateState(versionFour);
assert.equal(migratedVersionFour.version, 6);
assert.equal(migratedVersionFour.weeks[0].spaceId, "health");
assert.equal(migratedVersionFour.charts[0].spaceId, "health");
assert.deepEqual(migratedVersionFour.spaces, model.DEFAULT_SPACES);

const versionFive = {
  version: 5,
  activeSpaceId: "study",
  spaces: model.DEFAULT_SPACES,
  profile: { name: "test" },
  weeks: [{ id: "study-week", spaceId: "study", startDate: "2026-09-07" }],
  charts: [],
};
const migratedVersionFive = model.migrateState(versionFive);
assert.equal(migratedVersionFive.version, 6);
assert.equal(migratedVersionFive.spaces[1].templateId, "study");
assert.equal(migratedVersionFive.periods[0].yearMonth, "2026-09");

const current = {
  version: 6,
  activeSpaceId: "study",
  spaces: model.DEFAULT_SPACES,
  profile: { name: "test" },
  weeks: [],
  periods: [],
  charts: [],
};
const migratedCurrent = model.migrateState(current);
assert.deepEqual(migratedCurrent, current);
assert.notEqual(migratedCurrent, current, "current data is cloned before normalization");

assert.throws(
  () => model.migrateState({ version: 99, profile: {}, weeks: [], charts: [] }),
  (error) => error.code === model.UNSUPPORTED_VERSION_CODE && error.stateVersion === 99,
);

console.log("data-model migrations: ok");
