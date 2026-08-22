import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(toolDir, "..");
const sourcePath = path.join(rootDir, "示例数据", "考研加健身用户示例.json");
const outputPath = path.join(rootDir, "示例数据", "全功能测试数据.json");
const longTermOutputPath = path.join(rootDir, "示例数据", "长期用户300节点示例.json");
const stickerScript = fs.readFileSync(path.join(rootDir, "js", "content", "stickers.js"), "utf8");
const stickerContext = { window: {} };
vm.runInNewContext(stickerScript, stickerContext);
const packs = stickerContext.window.ASOUL_STICKER_PACKS;
const bella = packs.贝拉;
const diana = packs.嘉然;
const eileen = packs.乃琳;
const stickerCycle = [diana[0], bella[1], eileen[2], diana[3], bella[4], eileen[5], diana[6], bella[7], eileen[8]];

const data = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
data.backupType = "asoul-life-diary";
data.exportedAt = "2026-08-18T12:00:00.000Z";
data.version = 9;
data.testDataNote = "全功能测试数据：个人档案、空间、倒计时、进度目标、周计划、每日记录、周报和曲线表情均已填充。";

data.profile = {
  name: "小枝（全功能测试）",
  gender: "不愿透露",
  age: "22",
  signature: "稳稳地学，认真地练，也记得给今天的自己一个表情。",
  avatar: diana[0],
};

data.goals = [
  {
    id: "goal-postgraduate-exam",
    title: "2027 考研初试",
    targetDate: "2026-12-19",
    note: "按周推进，不拿一天的状态否定整个计划。",
    sticker: diana[0],
    spaceIds: ["study"],
    createdAt: 1782892800000,
  },
  {
    id: "goal-first-10k",
    title: "第一次轻松跑完 10 km",
    targetDate: "2026-10-01",
    note: "不追配速，先把距离稳稳完成。",
    sticker: bella[1],
    spaceIds: ["fitness"],
    createdAt: 1782892801000,
  },
  {
    id: "goal-autumn-review",
    title: "秋季复盘日",
    targetDate: "2026-09-30",
    note: "学习和训练一起复盘，确认下一阶段节奏。",
    sticker: eileen[2],
    spaceIds: ["study", "fitness"],
    createdAt: 1782892802000,
  },
  {
    id: "goal-birthday",
    title: "给自己的生日计划",
    targetDate: "2027-01-08",
    note: "只在首页出现，用来检查未关联空间的倒计时。",
    sticker: diana[3],
    spaceIds: [],
    createdAt: 1782892803000,
  },
];

const makeUpdates = (amounts, startAt) => amounts.map((amount, index) => ({
  id: `progress-update-${startAt}-${index + 1}`,
  amount,
  createdAt: startAt + index * 86400000,
}));

data.progressGoals = [
  {
    id: "progress-words",
    title: "考研英语词汇",
    target: 10000,
    current: 6350,
    unit: "单词",
    defaultIncrement: 80,
    note: "新词和复习词都完成后再更新。",
    sticker: diana[6],
    spaceIds: ["study"],
    updates: makeUpdates([500, 650, 700, 800, 900, 1000, 900, 900], 1783000000000),
    createdAt: 1782892810000,
  },
  {
    id: "progress-math-bank",
    title: "数学强化题库",
    target: 1200,
    current: 468,
    unit: "题",
    defaultIncrement: 30,
    note: "只统计独立完成并订正的题目。",
    sticker: eileen[5],
    spaceIds: ["study"],
    updates: makeUpdates([60, 72, 80, 76, 90, 90], 1783100000000),
    createdAt: 1782892811000,
  },
  {
    id: "progress-running",
    title: "年度跑量",
    target: 300,
    current: 186.5,
    unit: "km",
    defaultIncrement: 5,
    note: "跑完再记，走路不凑里程。",
    sticker: bella[7],
    spaceIds: ["fitness"],
    updates: makeUpdates([28, 31.5, 34, 29, 32, 32], 1783200000000),
    createdAt: 1782892812000,
  },
  {
    id: "progress-steady-days",
    title: "学习＋训练稳定日",
    target: 100,
    current: 43,
    unit: "天",
    defaultIncrement: 1,
    note: "同时照顾学习和身体的日子才计入。",
    sticker: eileen[8],
    spaceIds: ["study", "fitness"],
    updates: makeUpdates([7, 7, 6, 7, 5, 6, 5], 1783300000000),
    createdAt: 1782892813000,
  },
];

let dayStickerIndex = 0;
for (const week of data.weeks) {
  for (const day of week.days) {
    day.recorded = true;
    day.sticker = stickerCycle[dayStickerIndex % stickerCycle.length];
    dayStickerIndex += 1;
    if (!day.note) day.note = "今天的计划、完成情况和感受都已经记录。";
    if (!day.status) day.status = "还不错";
    if (!day.dietRecord) day.dietRecord = "已完成当天复盘。";
  }
}

for (let chartIndex = 0; chartIndex < data.charts.length; chartIndex += 1) {
  const chart = data.charts[chartIndex];
  for (let nodeIndex = 0; nodeIndex < chart.nodes.length; nodeIndex += 1) {
    const node = chart.nodes[nodeIndex];
    const primarySeriesId = chart.series[0].id;
    const sticker = stickerCycle[(chartIndex * 3 + nodeIndex) % stickerCycle.length];
    node.note ||= `第 ${nodeIndex + 1} 个完整记录节点。`;
    node.sticker = sticker;
    node.stickers = { ...(node.stickers || {}), [primarySeriesId]: sticker };
  }
}

const scoreDates = ["2026-07-06", "2026-07-10", "2026-07-14", "2026-07-18", "2026-07-22", "2026-07-26", "2026-07-30", "2026-08-03", "2026-08-07", "2026-08-11", "2026-08-15", "2026-08-18"];
data.charts.push({
  id: "chart-study-mock-scores",
  spaceId: "study",
  title: "阶段测验双曲线",
  xLabel: "日期",
  series: [
    { id: "series-math-score", name: "数学 / 分", unit: "分", color: "#8f7aea" },
    { id: "series-english-score", name: "英语 / 分", unit: "分", color: "#e799b0" },
  ],
  nodes: scoreDates.map((date, index) => {
    const mathSticker = diana[index % Math.min(12, diana.length)];
    const englishSticker = eileen[(index + 3) % Math.min(12, eileen.length)];
    return {
      id: `study-score-${index + 1}`,
      x: date,
      values: {
        "series-math-score": 82 + index * 2.7 + (index % 3) * 1.2,
        "series-english-score": 58 + index * 1.5 + (index % 2) * 2,
      },
      note: `第 ${index + 1} 次阶段测验：数学与英语均完成复盘。`,
      sticker: mathSticker,
      stickers: {
        "series-math-score": mathSticker,
        "series-english-score": englishSticker,
      },
      createdAt: 1782892900000 + index * 86400000,
    };
  }),
  createdAt: 1782892899000,
});

const longTermData = JSON.parse(JSON.stringify(data));
const longTermStartAt = Date.UTC(2024, 2, 1, 8);
const longTermNodeInterval = 3 * 86400000;
const longTermNodes = Array.from({ length: 300 }, (_, index) => {
  const recordedAt = longTermStartAt + index * longTermNodeInterval;
  const trend = 3.25 + index * 0.0082;
  const rhythm = Math.sin(index / 10) * 0.42 + Math.cos(index / 27) * 0.18;
  const studyHours = Math.round((trend + rhythm) * 100) / 100;
  const completionRate = Math.round(Math.min(96, 61 + index * 0.075 + Math.sin(index / 13) * 7 + Math.cos(index / 31) * 3));
  const sleepHours = Math.round((7.05 + Math.sin(index / 9 + 1.4) * 0.52 + Math.cos(index / 25) * 0.24) * 100) / 100;
  const studySticker = stickerCycle[index % stickerCycle.length];
  const completionSticker = stickerCycle[(index + 3) % stickerCycle.length];
  const sleepSticker = stickerCycle[(index + 6) % stickerCycle.length];
  return {
    id: `long-term-study-${index + 1}`,
    x: new Date(recordedAt).toISOString().slice(0, 10),
    values: {
      "series-long-term-hours": studyHours,
      "series-long-term-completion": completionRate,
      "series-long-term-sleep": sleepHours,
    },
    note: `长期记录第 ${index + 1} 次：学习、完成率与睡眠均已复盘。`,
    sticker: studySticker,
    stickers: {
      "series-long-term-hours": studySticker,
      "series-long-term-completion": completionSticker,
      "series-long-term-sleep": sleepSticker,
    },
    createdAt: recordedAt,
  };
});

const dailyNodeEndAt = Date.UTC(2026, 7, 15, 8);
const dailyNodeStartAt = dailyNodeEndAt - 299 * 86400000;
const dailyStudyNodes = Array.from({ length: 300 }, (_, index) => {
  const recordedAt = dailyNodeStartAt + index * 86400000;
  const trend = 3.05 + index * 0.0074;
  const rhythm = Math.sin(index / 8) * 0.36 + Math.cos(index / 23) * 0.15;
  const studyHours = Math.round((trend + rhythm) * 100) / 100;
  const sticker = stickerCycle[index % stickerCycle.length];
  return {
    id: `daily-study-${index + 1}`,
    x: new Date(recordedAt).toISOString().slice(0, 10),
    values: { "series-daily-study-hours": studyHours },
    note: `连续记录第 ${index + 1} 天。`,
    sticker,
    stickers: { "series-daily-study-hours": sticker },
    createdAt: recordedAt,
  };
});

longTermData.exportedAt = "2026-08-22T12:00:00.000Z";
longTermData.testDataNote = "长期用户压力测试：连续 300 天单曲线用于检查每日刻度，另有一张约两年半的三曲线 300 节点图，用于验证全局抽稀、局部放大和性能。";
longTermData.profile = {
  ...longTermData.profile,
  name: "小枝（长期使用测试）",
  signature: "把两年多的学习节奏留在同一条曲线上，看看长期变化。",
};
longTermData.charts.unshift({
  id: "chart-daily-300-study-hours",
  spaceId: "study",
  title: "连续 300 天有效学习",
  xLabel: "日期",
  series: [
    { id: "series-daily-study-hours", name: "有效学习", unit: "小时", color: "#8f7aea" },
  ],
  nodes: dailyStudyNodes,
  createdAt: dailyNodeStartAt,
}, {
  id: "chart-long-term-study-hours",
  spaceId: "study",
  title: "两年半学习状态",
  xLabel: "日期",
  series: [
    { id: "series-long-term-hours", name: "有效学习", unit: "小时", color: "#8f7aea" },
    { id: "series-long-term-completion", name: "任务完成率", unit: "%", color: "#db7d74", axisMin: 45, axisMax: 100 },
    { id: "series-long-term-sleep", name: "睡眠", unit: "小时", color: "#576690", axisMin: 5.5, axisMax: 8.5 },
  ],
  nodes: longTermNodes,
  createdAt: longTermStartAt,
});

fs.writeFileSync(outputPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
fs.writeFileSync(longTermOutputPath, `${JSON.stringify(longTermData, null, 2)}\n`, "utf8");
console.log(`Generated ${path.relative(rootDir, outputPath)}`);
console.log(`Generated ${path.relative(rootDir, longTermOutputPath)}`);
