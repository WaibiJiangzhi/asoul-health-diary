"use strict";

const assert = require("node:assert/strict");

require("../js/domain/schedule-domain.js");

const domain = globalThis.ASOUL_SCHEDULE_DOMAIN;

assert.ok(Object.isFrozen(domain));
assert.equal(domain.hasWeekDayRecord({ recorded: true }), true);
assert.equal(domain.hasWeekDayRecord({ recorded: false, note: "有内容但未记录" }), false);
assert.equal(domain.hasScheduleDayContent({ items: [], focus: "", note: "", status: "", sticker: "", weight: null }), false);
assert.equal(domain.hasScheduleDayContent({ items: [{ text: "任务" }] }), true);
assert.equal(domain.weekItemStateMark("changed"), "⚡");
assert.equal(domain.weekItemStateLabel("missed"), "未完成");
assert.deepEqual(domain.countWeekItemStates({ days: [{ items: [
  { state: "done" },
  { state: "changed" },
  { state: "missed" },
  { state: "" },
] }] }), { done: 1, changed: 1, missed: 1, pending: 1 });

const parsed = domain.parseAiPlanTemplate(`\`\`\`text
【周开始】2026-08-17
【Day1】学习日
【重点】概率论
【任务】数学｜完成 20 题
【任务】英语 | 精读 2 篇
【Day2】
【重点】恢复
\`\`\``);
assert.equal(parsed.length, 1);
assert.equal(parsed[0].startDate, "2026-08-17");
assert.equal(parsed[0].days[0].title, "学习日");
assert.equal(parsed[0].days[0].focus, "概率论");
assert.deepEqual(parsed[0].days[0].items.map((item) => item.text), ["数学：完成 20 题", "英语 ： 精读 2 篇"]);
assert.equal(parsed[0].days[1].title, "休息日");
assert.deepEqual(domain.parseAiPlanTemplate("没有模板标记"), []);

const days = Array.from({ length: 7 }, (_, index) => ({
  id: `day-${index + 1}`,
  date: `2026-08-${String(17 + index).padStart(2, "0")}`,
  title: `内容 ${index + 1}`,
  items: [{ text: `任务 ${index + 1}` }],
}));
const normalizeDay = (day, index, startDate) => ({
  id: `normalized-${index}`,
  date: `${startDate}:${index}`,
  title: day.title || "空白",
  items: Array.isArray(day.items) ? day.items.map((item) => ({ ...item })) : [],
});
const clearedDay = domain.clearWeekDayContent(days[2], 2, {
  startDate: "2026-08-17",
  templateId: "study",
  normalizeDay,
});
assert.equal(clearedDay.id, "day-3");
assert.equal(clearedDay.date, "2026-08-19");
assert.equal(clearedDay.title, "空白");
assert.deepEqual(clearedDay.items, []);
assert.equal(days[2].title, "内容 3", "clearing a day must not mutate the source day");

const clearedWeek = domain.clearWeekContent(days, {
  startDate: "2026-08-17",
  templateId: "study",
  normalizeDay,
});
assert.equal(clearedWeek.length, 7);
assert.deepEqual(clearedWeek.map((day) => day.id), days.map((day) => day.id));
assert.deepEqual(clearedWeek.map((day) => day.date), days.map((day) => day.date));
assert.ok(clearedWeek.every((day) => day.title === "空白" && day.items.length === 0));

const shifted = domain.shiftWeekDays(days, 2, {
  startDate: "2026-08-17",
  templateId: "study",
  normalizeDay,
});
assert.equal(shifted[1].title, "内容 2", "days before the selected day must remain unchanged");
assert.equal(shifted[2].id, "day-3");
assert.equal(shifted[2].date, "2026-08-19");
assert.equal(shifted[2].title, "空白");
assert.equal(shifted[3].id, "day-4");
assert.equal(shifted[3].title, "内容 3");
assert.equal(shifted[6].title, "内容 6");
assert.equal(days[2].title, "内容 3", "schedule shifting must not mutate the source array");

console.log("schedule domain: ok");
