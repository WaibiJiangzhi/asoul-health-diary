"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

require("../js/core/backup-codec.js");
require("../js/core/data-model.js");

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
const exportedAt = "2026-08-21T08:30:00.000Z";
const payload = codec.createDiaryBackupPayload(currentState, exportedAt);

assert.equal(payload.backupType, codec.BACKUP_TYPE);
assert.equal(payload.exportedAt, exportedAt);
assert.equal(payload.version, model.CURRENT_STATE_VERSION);
assert.deepEqual(payload.profile, currentState.profile);
assert.equal(payload.jokes, undefined, "static cold jokes must not be exported as user data");
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

const publishedV4Path = path.join(projectRoot, "tests", "fixtures", "published-v4-backup.json");
const publishedV4 = codec.parseDiaryBackup(fs.readFileSync(publishedV4Path, "utf8"));
const migratedPublishedV4 = model.migrateState(publishedV4);
assert.equal(publishedV4.backupType, "asoul-health-diary", "the actually published legacy backup type must remain supported");
assert.equal(publishedV4.version, 4, "the published legacy fixture must keep its original schema version");
assert.equal(migratedPublishedV4.version, model.CURRENT_STATE_VERSION);
assert.equal(migratedPublishedV4.weeks.length, publishedV4.weeks.length, "v4 migration must preserve every published week");
assert.equal(migratedPublishedV4.charts.length, publishedV4.charts.length, "v4 migration must preserve every published chart");
assert.deepEqual(migratedPublishedV4.spaces.map((space) => space.id), ["health"], "v4 health records must enter the health space");
assert.ok(Array.isArray(publishedV4.jokes) && publishedV4.jokes.length > 0, "the legacy fixture must keep proving that obsolete jokes are accepted as inert extra data");

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
