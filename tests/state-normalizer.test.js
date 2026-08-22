"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

global.window = globalThis;
require("../js/core/data-model.js");
require("../js/core/app-utils.js");
require("../js/domain/milestone-domain.js");
require("../js/content/stickers.js");
require("../js/core/state-normalizer.js");

const dataModel = globalThis.ASOUL_DATA_MODEL;
const utils = globalThis.ASOUL_APP_UTILS;
const defaultSpaces = dataModel.DEFAULT_SPACES.map((space) => ({
  ...space,
  iconSticker: "",
  aiContext: { profile: "", goal: "", current: "", availability: "", constraints: "" },
}));
const spaceTemplates = {
  health: { id: "health", name: "健康", icon: "♡", activeDayLabel: "训练日" },
  study: { id: "study", name: "考研", icon: "✎", activeDayLabel: "学习日" },
  work: { id: "work", name: "工作", icon: "▣", activeDayLabel: "工作日" },
  custom: { id: "custom", name: "自定义", icon: "✦", activeDayLabel: "行动日" },
};
const defaultState = {
  version: dataModel.CURRENT_STATE_VERSION,
  spaces: defaultSpaces,
  activeSpaceId: "health",
  profile: { name: "", gender: "", age: "", signature: "", avatar: "" },
  goals: [],
  progressGoals: [],
  weeks: [],
  periods: [],
  charts: [],
};
const stickerPacks = globalThis.ASOUL_STICKER_PACKS;
const legacyStickerFallbacks = Object.fromEntries(Object.entries(stickerPacks).map(([name, paths]) => [name, paths[0] || ""]));
const normalizer = globalThis.ASOUL_STATE_NORMALIZER.createStateNormalizer({
  dataModel,
  utils,
  defaultState,
  defaultSpaces,
  spaceTemplates,
  allowedColors: ["#E799B0", "#DB7D74", "#576690", "#8f7aea", "#36a58b", "#ee9d42", "#4f8edb", "#35a8bb", "#a77957"],
  stickerPacks,
  legacyStickerFallbacks,
  selectValidSpaceIds: globalThis.ASOUL_MILESTONE_DOMAIN.selectValidSpaceIds,
  limits: { spaces: 8, goals: 4, progressGoals: 6 },
  weekItemStates: new Set(["", "done", "changed", "missed"]),
  weekItemsNotTracked: new Set(["跑前热身", "跑后拉伸"]),
});

assert.ok(Object.isFrozen(normalizer), "a configured normalizer must expose an immutable boundary");
assert.notEqual(normalizer.cloneDefault(), normalizer.cloneDefault(), "fresh state must never share a mutable object");
assert.equal(normalizer.safeCardColor("#e799b0"), "#E799B0");
assert.equal(normalizer.safeCardColor("red"), "");
assert.equal(normalizer.safeTemplateId("missing"), "custom");

const publishedV4Path = path.join(__dirname, "fixtures", "published-v4-backup.json");
const publishedV4 = JSON.parse(fs.readFileSync(publishedV4Path, "utf8"));
const normalizedV4 = normalizer.normalizeState(publishedV4);
assert.equal(normalizedV4.version, dataModel.CURRENT_STATE_VERSION);
assert.equal(normalizedV4.profile.name, publishedV4.profile.name);
assert.deepEqual(normalizedV4.spaces.map((space) => space.id), ["health"]);
assert.ok(publishedV4.weeks.every((legacyWeek) => normalizedV4.weeks.some((week) => week.id === legacyWeek.id)), "every published week must survive full normalization while legacy dates align to Mondays");
assert.equal(normalizedV4.charts.length, publishedV4.charts.length);
assert.equal(normalizedV4.jokes, undefined, "obsolete legacy jokes must stop at the import boundary");

const legacyDay = normalizer.normalizeWeekDay({
  title: "学习日",
  planItems: [{ activity: "英语", target: "阅读 1 篇" }],
  records: [{ activity: "英语", result: "完成", done: true }],
}, 0, "2026-08-17", "study");
assert.equal(legacyDay.title, "学习日");
assert.equal(legacyDay.items[0].text, "英语：阅读 1 篇");
assert.equal(legacyDay.items[0].state, "done");

console.log("state normalizer: ok");
