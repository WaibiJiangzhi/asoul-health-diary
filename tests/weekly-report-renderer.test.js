"use strict";

const assert = require("node:assert/strict");

require("../js/ui/canvas-utils.js");
require("../js/ui/weekly-report-renderer.js");

function makeContext() {
  const gradient = { addColorStop() {} };
  return {
    arc() {},
    beginPath() {},
    bezierCurveTo() {},
    clip() {},
    closePath() {},
    createLinearGradient: () => gradient,
    drawImage() {},
    fill() {},
    fillRect() {},
    fillText() {},
    lineTo() {},
    measureText: (value) => ({ width: [...String(value)].length * 8 }),
    moveTo() {},
    quadraticCurveTo() {},
    restore() {},
    save() {},
    scale() {},
    setLineDash() {},
    stroke() {},
    translate() {},
  };
}

const createdCanvases = [];
global.document = {
  createElement(tagName) {
    assert.equal(tagName, "canvas");
    const context = makeContext();
    const canvas = { width: 0, height: 0, getContext: () => context };
    createdCanvases.push(canvas);
    return canvas;
  },
};

const renderer = globalThis.ASOUL_WEEKLY_REPORT_RENDERER.createWeeklyReportRenderer({
  utils: {
    addDaysIso: (value) => value,
    formatCompactDate: (value) => value.slice(5).replace("-", ""),
    formatDateRange: () => "8/17 — 8/23",
    formatFriendlyDate: (value) => value,
    formatGoalDate: (value) => value,
    formatProgressNumber: (value) => String(value),
    getGoalCountdown: () => ({ phrase: "还有 30 天" }),
  },
  scheduleDomain: {
    countWeekItemStates: () => ({ done: 0, changed: 0, missed: 0, pending: 0 }),
    weekItemStateMark: () => "·",
  },
  milestoneDomain: { getProgressPercent: () => 50 },
  canvasUtils: globalThis.ASOUL_CANVAS_UTILS,
  getSpaceTemplate: () => ({ id: "study", firstFieldLabel: "重点" }),
  getCardColor: () => "#576690",
  imageCache: new Map(),
  dayStatusPalette: {
    "好好好": { fill: "#db7d74", ink: "#fff" },
    "还不错": { fill: "#f7cbd7", ink: "#593c49" },
    "这期拉了": { fill: "#89777f", ink: "#fff" },
    "未设置": { fill: "#576690", ink: "#fff" },
  },
  itemSummaryPalette: {
    done: { fill: "#eaf6f2", ink: "#397f6d" },
    changed: { fill: "#fff7df", ink: "#9a6c25" },
    missed: { fill: "#fff0f2", ink: "#a85f6b" },
  },
});

const days = Array.from({ length: 7 }, (_, index) => ({
  dayNumber: index + 1,
  date: `2026-08-${String(17 + index).padStart(2, "0")}`,
  title: "学习日",
  focus: "",
  note: "",
  status: "",
  sticker: "",
  recorded: false,
  items: [],
}));
const week = { id: "week-1", spaceId: "study", startDate: "2026-08-17", title: "8/17 开始的备考周", days };

assert.equal(renderer.getCanvasDayHeight(days[0]), 189, "an empty day must retain the compact export height");
assert.equal(renderer.getCanvasDayHeight({ ...days[0], note: "有小记" }), 241, "a day footer must reserve enough export height");

const portrait = renderer.createWeeklyReportCanvas(week, { goals: [], progressGoals: [] });
assert.equal(portrait.width, 2160, "portrait exports must keep 2x 1080px resolution");
assert.ok(portrait.height > portrait.width, "the complete weekly report must remain portrait");

const summary = renderer.createWeeklySummaryCanvas(week, { goals: [], progressGoals: [] });
assert.equal(summary.width, 3840, "summary exports must keep 4K landscape width");
assert.equal(summary.height, 1648, "summary height must shrink when there are no milestones");

const milestones = [1, 2, 3].map((index) => ({
  id: `goal-${index}`,
  title: `目标 ${index}`,
  targetDate: "2026-12-01",
  sticker: "",
  spaceIds: ["study"],
}));
const tallSummary = renderer.createWeeklySummaryCanvas(week, { goals: milestones, progressGoals: [] });
assert.equal(tallSummary.height, 1900, "summary height must grow for a second milestone row");

assert.equal(createdCanvases.length, 3);
console.log("weekly report renderer: ok");
