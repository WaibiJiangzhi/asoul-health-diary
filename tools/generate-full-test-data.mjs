import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(toolDir, "..");
const sourcePath = path.join(rootDir, "示例数据", "考研加健身用户示例.json");
const outputPath = path.join(rootDir, "示例数据", "全功能测试数据.json");
const stickerScript = fs.readFileSync(path.join(rootDir, "stickers.js"), "utf8");
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

fs.writeFileSync(outputPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(`Generated ${path.relative(rootDir, outputPath)}`);
