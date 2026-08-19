"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

require("../data-model.js");

const model = globalThis.ASOUL_DATA_MODEL;

assert.equal(model.CURRENT_STATE_VERSION, 10);
assert.deepEqual(model.DEFAULT_SPACES.map(({ id, name }) => ({ id, name })), [
  { id: "health", name: "健康" },
  { id: "study", name: "考研" },
  { id: "work", name: "工作" },
]);

const legacyWeeks = [{ id: "week-1", startDate: "2026-08-17" }];
const legacy = { profile: {}, weeklyPlans: legacyWeeks, charts: [] };
const migratedLegacy = model.migrateState(legacy);
assert.equal(migratedLegacy.version, 10);
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
assert.equal(migratedVersionFour.version, 10);
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
assert.equal(migratedVersionFive.version, 10);
assert.equal(migratedVersionFive.spaces[1].templateId, "study");
assert.equal(migratedVersionFive.periods[0].yearMonth, "2026-09");

const current = {
  version: 10,
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
assert.equal(migratedVersionSix.version, 10);
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
assert.equal(migratedVersionSeven.version, 10);
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
assert.equal(migratedVersionEight.version, 10);
assert.deepEqual(migratedVersionEight.progressGoals, []);
assert.equal(migratedVersionEight.weeks[0].days[0].recorded, true, "legacy day content should remain recorded");
assert.equal(migratedVersionEight.weeks[0].days[1].recorded, false, "an explicit recorded flag must be preserved");

const versionNine = {
  version: 9,
  activeSpaceId: "health",
  spaces: model.DEFAULT_SPACES,
  profile: {},
  goals: [],
  progressGoals: [],
  periods: [],
  charts: [],
  weeks: [{
    id: "week-9",
    spaceId: "health",
    startDate: "2026-08-17",
    days: [{
      dietPlan: "英语阅读优先",
      planItems: [{ id: "plan-1", name: "英语", value: "精读 2 篇" }],
      records: [{ id: "record-1", name: "英语", value: "精读 1 篇", done: false }],
    }],
  }],
};
const migratedVersionNine = model.migrateState(versionNine);
assert.equal(migratedVersionNine.version, 10);
assert.equal(migratedVersionNine.weeks[0].days[0].focus, "");
assert.deepEqual(migratedVersionNine.weeks[0].days[0].items[0], {
  id: "plan-1",
  text: "英语：精读 2 篇",
  state: "missed",
  legacyActual: "精读 1 篇",
});
assert.deepEqual(migratedVersionNine.weeks[0].days[0].items[1], {
  id: "legacy-diet-2",
  text: "饮食安排：英语阅读优先",
  state: "",
});

for (const filename of ["考研加健身用户示例.json", "全功能测试数据.json"]) {
  const backup = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "示例数据", filename), "utf8"));
  const migratedBackup = model.migrateState(backup);
  const legacyItemCount = backup.weeks.reduce((weekTotal, week) => weekTotal + week.days.reduce(
    (dayTotal, day) => dayTotal + Math.max(day.planItems?.length || 0, day.records?.length || 0) + (day.dietPlan ? 1 : 0),
    0,
  ), 0);
  const migratedItemCount = migratedBackup.weeks.reduce((weekTotal, week) => weekTotal + week.days.reduce(
    (dayTotal, day) => dayTotal + day.items.length,
    0,
  ), 0);
  assert.equal(migratedBackup.version, 10, `${filename} should migrate to the current data version`);
  assert.equal(migratedItemCount, legacyItemCount, `${filename} should preserve every legacy weekly row`);
  assert.ok(
    migratedBackup.weeks.every((week) => week.days.every((day) => Array.isArray(day.items))),
    `${filename} should expose unified weekly items after migration`,
  );
}

assert.throws(
  () => model.migrateState({ version: 99, profile: {}, weeks: [], charts: [] }),
  (error) => error.code === model.UNSUPPORTED_VERSION_CODE && error.stateVersion === 99,
);

console.log("data-model migrations: ok");
