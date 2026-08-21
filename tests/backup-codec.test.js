"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

require("../backup-codec.js");
require("../data-model.js");

const codec = globalThis.ASOUL_BACKUP_CODEC;
const model = globalThis.ASOUL_DATA_MODEL;
const projectRoot = path.resolve(__dirname, "..");

assert.ok(Object.isFrozen(codec), "the backup codec boundary must be immutable");
assert.ok(Object.isFrozen(codec.SUPPORTED_BACKUP_TYPES), "supported backup types must be immutable");
assert.deepEqual(codec.SUPPORTED_BACKUP_TYPES, ["asoul-health-diary", "asoul-life-diary"]);

const currentState = {
  version: model.CURRENT_STATE_VERSION,
  activeSpaceId: "study",
  spaces: [{ id: "study", type: "study", templateId: "study", name: "考研", icon: "✎" }],
  profile: { name: "测试用户", gender: "", age: "", signature: "", avatar: "" },
  goals: [],
  progressGoals: [],
  periods: [],
  weeks: [],
  charts: [],
};
const jokes = [{ question: "问题", answer: "答案" }];
const exportedAt = "2026-08-21T08:30:00.000Z";
const payload = codec.createDiaryBackupPayload(currentState, jokes, exportedAt);

assert.equal(payload.backupType, codec.BACKUP_TYPE);
assert.equal(payload.exportedAt, exportedAt);
assert.equal(payload.version, model.CURRENT_STATE_VERSION);
assert.deepEqual(payload.profile, currentState.profile);
assert.deepEqual(payload.jokes, jokes);
assert.equal(currentState.backupType, undefined, "creating a backup must not mutate state");
assert.deepEqual(codec.parseDiaryBackup(JSON.stringify(payload)), payload, "current backups must round-trip without shape changes");

for (const legacyBackup of [
  { profile: {}, charts: [], weeklyPlans: [] },
  { backupType: "asoul-health-diary", profile: {}, charts: [], weeks: [] },
]) {
  assert.equal(codec.isDiaryBackupPayload(legacyBackup), true, "legacy backup envelopes must remain accepted");
  assert.deepEqual(codec.parseDiaryBackup(JSON.stringify(legacyBackup)), legacyBackup);
}

for (const invalidBackup of [
  null,
  [],
  {},
  { backupType: "another-app", profile: {}, charts: [], weeks: [] },
  { profile: [], charts: [], weeks: [] },
  { profile: {}, charts: {}, weeks: [] },
  { profile: {}, charts: [], weeks: {} },
]) {
  assert.equal(codec.isDiaryBackupPayload(invalidBackup), false);
  assert.throws(
    () => codec.parseDiaryBackup(JSON.stringify(invalidBackup)),
    (error) => error.code === codec.INVALID_BACKUP_CODE,
  );
}
assert.throws(
  () => codec.parseDiaryBackup("{broken json"),
  (error) => error.code === codec.INVALID_BACKUP_CODE,
  "malformed JSON must be rejected before state normalization",
);

for (const filename of ["考研加健身用户示例.json", "全功能测试数据.json"]) {
  const text = fs.readFileSync(path.join(projectRoot, "示例数据", filename), "utf8");
  const imported = codec.parseDiaryBackup(text);
  const migrated = model.migrateState(imported);
  assert.equal(migrated.version, model.CURRENT_STATE_VERSION, `${filename} must still reach the current state version`);
  assert.equal(migrated.profile.name, imported.profile.name, `${filename} must preserve the profile during migration`);
  assert.equal(migrated.charts.length, imported.charts.length, `${filename} must preserve every chart`);
}

const futureBackup = codec.parseDiaryBackup(JSON.stringify({
  backupType: codec.BACKUP_TYPE,
  version: model.CURRENT_STATE_VERSION + 1,
  profile: {},
  charts: [],
  weeks: [],
}));
assert.throws(
  () => model.migrateState(futureBackup),
  (error) => error.code === model.UNSUPPORTED_VERSION_CODE && error.stateVersion === model.CURRENT_STATE_VERSION + 1,
  "a structurally valid future backup must still be refused by the data model",
);

console.log("backup codec: ok");
