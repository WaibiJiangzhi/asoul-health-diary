"use strict";

const assert = require("node:assert/strict");

require("../js/core/app-utils.js");

const utils = globalThis.ASOUL_APP_UTILS;

assert.ok(Object.isFrozen(utils), "the shared utility boundary must be immutable");
assert.equal(utils.safeString("  一个魂日记  ", 3), "一个魂");
assert.equal(utils.safeDate("2024-02-29"), "2024-02-29");
assert.equal(utils.safeDate("2025-02-29"), "");
assert.equal(utils.safeDate("2026-2-9"), "");
assert.equal(utils.safeWeight("63.456"), 63.46);
assert.equal(utils.safeWeight("19.9"), null);
assert.equal(utils.safeWeight(""), null);

assert.equal(utils.startOfWeekIso("2026-08-21"), "2026-08-17");
assert.equal(utils.addDaysIso("2026-08-31", 1), "2026-09-01");
assert.deepEqual(utils.getMonthMondays("2026-08"), [
  "2026-08-03",
  "2026-08-10",
  "2026-08-17",
  "2026-08-24",
  "2026-08-31",
]);
assert.deepEqual(utils.getMonthMondays("not-a-month"), []);

assert.deepEqual(utils.getGoalCountdown("2026-08-22", "2026-08-21"), {
  days: 1,
  value: "1",
  unit: "天后",
  phrase: "还有 1 天",
  state: "upcoming",
});
assert.deepEqual(utils.getGoalCountdown("2026-08-21", "2026-08-21"), {
  days: 0,
  value: "今天",
  unit: "就是此刻",
  phrase: "就是今天",
  state: "today",
});
assert.equal(utils.formatCompactDate("2026-08-21"), "0821");
assert.match(utils.formatDateRange("2026-08-17"), /8\D*17.*8\D*23/);

const paceSeries = { name: "配速 / 分钟每公里" };
const numberSeries = { name: "体重 / 斤" };
assert.equal(utils.parseSeriesValue(paceSeries, "5:30"), 5.5);
assert.ok(Number.isNaN(utils.parseSeriesValue(paceSeries, "5:75")));
assert.equal(utils.parseSeriesValue(numberSeries, "63.5"), 63.5);
assert.equal(utils.formatSeriesInput(paceSeries, 5.5), "5:30");
assert.equal(utils.formatSeriesValue(paceSeries, 5.5), "5′30″");
assert.equal(utils.formatProgressInput(1.236), "1.24");

assert.deepEqual(utils.parseChartDate("2026年8月21日"), { year: 2026, month: 8, day: 21 });
assert.deepEqual(utils.parseChartDate("8/21"), { year: null, month: 8, day: 21 });
assert.equal(utils.formatChartAxisLabel("2026-08-21", true), "26/08/21");
assert.equal(utils.formatChartAxisLabel("阶段节点名称很长", false), "阶段节点名称很长");
assert.equal(utils.shortLabel("1234567890"), "12345678…");

const unsafe = `<a title="x">Tom & Jerry's</a>`;
const escaped = "&lt;a title=&quot;x&quot;&gt;Tom &amp; Jerry&#039;s&lt;/a&gt;";
assert.equal(utils.escapeHtml(unsafe), escaped);
assert.equal(utils.escapeXml(unsafe), escaped);
assert.equal(utils.escapeAttr(unsafe), escaped);

console.log("app utils: ok");
