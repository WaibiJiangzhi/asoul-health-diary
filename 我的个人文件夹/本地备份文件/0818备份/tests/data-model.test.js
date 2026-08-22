"use strict";

const assert = require("node:assert/strict");

require("../data-model.js");

const model = globalThis.ASOUL_DATA_MODEL;

assert.equal(model.CURRENT_STATE_VERSION, 9);
assert.deepEqual(model.DEFAULT_SPACES.map(({ id, name }) => ({ id, name })), [
  { id: "health", name: "健康" },
  { id: "study", name: "考研" },
  { id: "work", name: "工作" },
]);

const legacyWeeks = [{ id: "week-1", startDate: "2026-08-17" }];
const legacy = { profile: {}, weeklyPlans: legacyWeeks, charts: [] };
const migratedLegacy = model.migrateState(legacy);
assert.equal(migratedLegacy.version, 9);
assert.equal(migratedLegacy.activeSpaceId, "health");
assert.deepEqual(migratedLegacy.weeks, [{ ...legacyWeeks[0], spaceId: "health", days: [] }]);
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
assert.equal(migratedVersionFour.version, 9);
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
assert.equal(migratedVersionFive.version, 9);
assert.equal(migratedVersionFive.spaces[1].templateId, "study");
assert.equal(migratedVersionFive.periods[0].yearMonth, "2026-09");

const current = {
  version: 9,
  activeSpaceId: "study",
  spaces: model.DEFAULT_SPACES,
  profile: { name: "test" },
  progressGoals: [],
  weeks: [],
  periods: [],
  charts: [],
};
const migratedCurrent = model.migrateState(current);
assert.deepEqual(migratedCurrent, current);
assert.notEqual(migratedCurrent, current, "current data is cloned before normalization");

const versionSix = {
  version: 6,
  activeSpaceId: "health",
  spaces: model.DEFAULT_SPACES,
  profile: { name: "test" },
  weeks: [],
  periods: [],
  charts: [],
};
const migratedVersionSix = model.migrateState(versionSix);
assert.equal(migratedVersionSix.version, 9);
assert.equal(migratedVersionSix.profile.signature, "");
assert.deepEqual(migratedVersionSix.goals, []);

const versionSeven = {
  version: 7,
  activeSpaceId: "health",
  spaces: model.DEFAULT_SPACES,
  profile: { name: "test" },
  goals: [{ id: "goal-1", title: "考试", targetDate: "2026-12-20" }],
  weeks: [],
  periods: [],
  charts: [],
};
const migratedVersionSeven = model.migrateState(versionSeven);
assert.equal(migratedVersionSeven.version, 9);
assert.deepEqual(migratedVersionSeven.goals[0].spaceIds, ["health", "study", "work"]);

const versionEight = {
  version: 8,
  activeSpaceId: "study",
  spaces: model.DEFAULT_SPACES,
  profile: { name: "test" },
  goals: [],
  weeks: [{
    id: "week-8",
    spaceId: "study",
    startDate: "2026-08-17",
    days: [{ note: "旧数据里写过当天小记" }, { recorded: false, note: "明确不计入" }],
  }],
  periods: [],
  charts: [],
};
const migratedVersionEight = model.migrateState(versionEight);
assert.equal(migratedVersionEight.version, 9);
assert.deepEqual(migratedVersionEight.progressGoals, []);
assert.equal(migratedVersionEight.weeks[0].days[0].recorded, true, "legacy day content should remain recorded");
assert.equal(migratedVersionEight.weeks[0].days[1].recorded, false, "an explicit recorded flag must be preserved");

assert.throws(
  () => model.migrateState({ version: 99, profile: {}, weeks: [], charts: [] }),
  (error) => error.code === model.UNSUPPORTED_VERSION_CODE && error.stateVersion === 99,
);

console.log("data-model migrations: ok");
