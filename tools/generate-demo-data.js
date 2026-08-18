"use strict";

const fs = require("node:fs");
const path = require("node:path");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(PROJECT_ROOT, "示例数据");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "考研加健身用户示例.json");
const TODAY = "2026-08-18";
const EXPORTED_AT = "2026-08-18T08:00:00.000Z";
const CREATED_AT = Date.parse("2026-07-01T08:00:00.000Z");
const WEEK_STARTS = [
  "2026-07-06", "2026-07-13", "2026-07-20", "2026-07-27",
  "2026-08-03", "2026-08-10", "2026-08-17", "2026-08-24", "2026-08-31",
];

const STUDY_STICKER = "图片/嘉然/5-2026嘉然的画册动态表情包/[2026嘉然的画册动态表情包_看我表现].gif";
const HEALTH_STICKER = "图片/贝拉/5-2026贝拉的冒险/[2026贝拉的冒险_自我安慰].jpg";
const CHEER_STICKER = "图片/嘉然/3-脑洞波系列主题装扮-嘉然/[脑洞波系列主题装扮-嘉然_加油].jpg";

function addDays(isoDate, days) {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function dateLabel(isoDate) {
  return `${Number(isoDate.slice(5, 7))}/${Number(isoDate.slice(8, 10))}`;
}

function makePair(id, name, value, done = null) {
  return { id, name, value, done };
}

function studyPlan(weekIndex, dayIndex) {
  const mathTopics = ["高数极限与连续", "线代矩阵与秩", "概率论随机变量", "高数多元积分"];
  const majorTopics = ["专业课第 3 章", "专业课第 4 章", "专业课真题整理", "专业课框架回忆"];
  const topic = mathTopics[(weekIndex + dayIndex) % mathTopics.length];
  return [
    makePair(`study-plan-${weekIndex}-${dayIndex}-1`, "数学", `${topic}：例题与错题 90 分钟`),
    makePair(`study-plan-${weekIndex}-${dayIndex}-2`, "英语", "单词 80 个＋精读 2 篇阅读"),
    makePair(`study-plan-${weekIndex}-${dayIndex}-3`, "专业课", `${majorTopics[weekIndex % majorTopics.length]}：完成 1 节`),
  ];
}

function healthPlan(weekIndex, dayIndex) {
  const sessions = [
    ["力量训练", "深蹲、卧推、划船各 4 组"],
    ["有氧", "轻松跑 5 km，结束后拉伸"],
    ["恢复", "步行 8000 步＋肩颈拉伸 15 分钟"],
    ["力量训练", "硬拉、推举、下拉各 4 组"],
    ["有氧", "间歇跑 6 组，控制心率"],
    ["力量训练", "全身循环训练 45 分钟"],
    ["休息", "散步、泡沫轴和早点睡"],
  ];
  const [name, value] = sessions[(dayIndex + weekIndex) % sessions.length];
  return [
    makePair(`health-plan-${weekIndex}-${dayIndex}-1`, name, value),
    makePair(`health-plan-${weekIndex}-${dayIndex}-2`, "饮食", "每餐 1 拳主食＋2 拳蔬菜＋1 掌蛋白质"),
    makePair(`health-plan-${weekIndex}-${dayIndex}-3`, "睡眠", "23:30 前上床，睡够 7.5 小时"),
  ];
}

function makeRecordedPairs(plans, weekIndex, dayIndex, spaceId) {
  return plans.map((plan, index) => {
    const missed = (weekIndex * 7 + dayIndex + index + (spaceId === "fitness" ? 2 : 0)) % 11 === 0;
    const actual = spaceId === "study"
      ? ["完成 95 分钟，错题已标记", "完成 80 个单词和 2 篇阅读", "完成 1 节并做了框架笔记"][index]
      : ["按计划完成，最后一组稍吃力", "大致按拳头比例完成", "睡了约 7 小时 20 分"][index];
    return makePair(`${plan.id}-record`, plan.name, missed ? "未完成，移到明天" : actual, !missed);
  });
}

function makeDay(spaceId, startDate, weekIndex, dayIndex) {
  const date = addDays(startDate, dayIndex);
  const recorded = date <= TODAY;
  const plans = spaceId === "study" ? studyPlan(weekIndex, dayIndex) : healthPlan(weekIndex, dayIndex);
  const records = recorded ? makeRecordedPairs(plans, weekIndex, dayIndex, spaceId) : [];
  const doneCount = records.filter((item) => item.done).length;
  const isRestDay = spaceId === "fitness" && /恢复|休息/.test(plans[0].name);
  return {
    id: `${spaceId}-${startDate}-day-${dayIndex + 1}`,
    dayNumber: dayIndex + 1,
    date,
    title: isRestDay ? "休息日" : spaceId === "study" ? "学习日" : "训练日",
    duration: recorded ? (spaceId === "study" ? `${210 + (dayIndex % 3) * 35} 分钟` : `${45 + (dayIndex % 2) * 15} 分钟`) : "",
    dietPlan: spaceId === "study"
      ? (dayIndex < 3 ? "数学一轮复习优先，晚上完成英语输入" : "专业课输出优先，睡前回顾错题")
      : (isRestDay ? "恢复优先，保证步数和睡眠" : "动作质量优先，不追求力竭"),
    planItems: plans,
    records,
    dietRecord: recorded
      ? (spaceId === "study" ? `完成 ${doneCount}/3 项；明天先处理今天留下的错题。` : `完成 ${doneCount}/3 项；训练后精神状态不错。`)
      : "",
    weight: spaceId === "fitness" && recorded ? Number((154.8 - (weekIndex * 7 + dayIndex) * 0.055).toFixed(1)) : null,
    note: recorded
      ? (doneCount === 3 ? "节奏比较稳定，继续保持。" : "今天没有全做完，但已经明确了明天从哪里接上。")
      : "",
    status: recorded ? (doneCount === 3 ? "好好好" : doneCount === 2 ? "还不错" : "这期拉了") : "",
    sticker: recorded && dayIndex === 0 && weekIndex % 3 === 0 ? CHEER_STICKER : "",
  };
}

function makeWeek(spaceId, startDate, weekIndex) {
  const isStudy = spaceId === "study";
  return {
    id: `${spaceId}-week-${startDate}`,
    spaceId,
    startDate,
    title: `${dateLabel(startDate)} 开始的${isStudy ? "备考" : "训练"}周`,
    goal: isStudy
      ? (weekIndex < 4 ? "稳住数学基础，保持英语阅读手感" : "推进真题训练，专业课开始第二轮回忆")
      : (weekIndex < 4 ? "恢复规律训练，每周至少运动 4 次" : "力量训练和跑步并行，体重缓慢下降"),
    note: startDate < "2026-08-17"
      ? (isStudy ? "有效学习时间在增长，但周末需要减少手机干扰。" : "训练完成率不错，睡眠仍是最需要改进的一项。")
      : "",
    createdAt: CREATED_AT + weekIndex * 604800000,
    days: Array.from({ length: 7 }, (_, dayIndex) => makeDay(spaceId, startDate, weekIndex, dayIndex)),
  };
}

function makeChartNodes(prefix, seriesId, startValue, step, everyDays, count, note) {
  return Array.from({ length: count }, (_, index) => {
    const x = addDays("2026-07-06", index * everyDays);
    return {
      id: `${prefix}-node-${index + 1}`,
      x,
      values: { [seriesId]: Number((startValue + step * index + Math.sin(index) * Math.abs(step) * 0.7).toFixed(1)) },
      note: index % 4 === 0 ? note : "",
      sticker: "",
      stickers: {},
      createdAt: CREATED_AT + index * everyDays * 86400000,
    };
  });
}

const weeks = [
  ...WEEK_STARTS.map((startDate, index) => makeWeek("study", startDate, index)),
  ...WEEK_STARTS.map((startDate, index) => makeWeek("fitness", startDate, index)),
];

const periods = ["2026-07", "2026-08"].flatMap((yearMonth, monthIndex) => [
  { id: `period-study-${yearMonth}`, spaceId: "study", yearMonth, createdAt: CREATED_AT + monthIndex * 2592000000 },
  { id: `period-fitness-${yearMonth}`, spaceId: "fitness", yearMonth, createdAt: CREATED_AT + monthIndex * 2592000000 },
]);

const backup = {
  backupType: "asoul-life-diary",
  exportedAt: EXPORTED_AT,
  version: 8,
  spaces: [
    {
      id: "study",
      type: "study",
      templateId: "study",
      name: "考研",
      icon: "研",
      iconSticker: STUDY_STICKER,
      aiContext: {
        profile: "22 岁，应届生，准备 2027 考研。数学基础一般，英语阅读正确率约 70%，专业课刚完成第一轮。",
        goal: "12 月前完成三轮复习，数学真题稳定在 120 分以上，英语阅读正确率达到 80%。",
        current: "数学正在刷强化题，英语每天背 80 个单词并精读 2 篇，专业课开始搭第二轮框架。",
        availability: "工作日每天 4 小时，周末每天 7 小时；上午适合数学，晚上适合英语和专业课。",
        constraints: "周三下午有课程；连续学习 90 分钟后必须休息；每天最多安排 3 项重点。",
      },
      createdAt: CREATED_AT,
    },
    {
      id: "fitness",
      type: "health",
      templateId: "health",
      name: "健身",
      icon: "炼",
      iconSticker: HEALTH_STICKER,
      aiContext: {
        profile: "身高 176cm，目前约 150 斤，有半年力量训练经验，膝盖偶尔紧但没有伤病。",
        goal: "保持肌肉量的同时缓慢减脂，10 月前可以轻松跑完 10 km。",
        current: "每周力量训练 3 次、跑步 2 次，饮食用拳头估算，不计算热量。",
        availability: "工作日晚上 50 分钟，周末 90 分钟；周三只安排恢复。",
        constraints: "不做大重量冲击训练；跑步增加量每周不超过 10%；至少保留 1 个完整休息日。",
      },
      createdAt: CREATED_AT + 1000,
    },
  ],
  activeSpaceId: "study",
  profile: {
    name: "小枝",
    gender: "不愿透露",
    age: "22",
    signature: "稳稳地学，认真地练，今天比昨天多走一步。",
    avatar: STUDY_STICKER,
  },
  goals: [
    {
      id: "goal-postgraduate-exam",
      title: "2027 考研初试",
      targetDate: "2026-12-19",
      note: "按周推进，不拿一天的状态否定整个计划。",
      sticker: STUDY_STICKER,
      spaceIds: ["study"],
      createdAt: CREATED_AT,
    },
    {
      id: "goal-first-10k",
      title: "第一次轻松跑完 10 km",
      targetDate: "2026-10-01",
      note: "不追配速，先把距离稳稳完成。",
      sticker: HEALTH_STICKER,
      spaceIds: ["fitness"],
      createdAt: CREATED_AT + 1000,
    },
  ],
  periods,
  weeks,
  charts: [
    {
      id: "chart-study-hours",
      spaceId: "study",
      title: "有效学习时长",
      xLabel: "日期",
      series: [{ id: "study-hours", name: "有效学习 / 小时", color: "#8f7aea" }],
      nodes: makeChartNodes("study-hours", "study-hours", 3.2, 0.18, 3, 15, "开始稳定记录有效学习时间。"),
      createdAt: CREATED_AT,
    },
    {
      id: "chart-fitness-weight",
      spaceId: "fitness",
      title: "体重变化",
      xLabel: "日期",
      series: [{ id: "body-weight", name: "体重 / 斤", color: "#E799B0" }],
      nodes: makeChartNodes("body-weight", "body-weight", 154.8, -0.34, 4, 12, "体重缓慢下降，训练表现保持稳定。"),
      createdAt: CREATED_AT + 1000,
    },
    {
      id: "chart-fitness-time",
      spaceId: "fitness",
      title: "每次训练时长",
      xLabel: "日期",
      series: [{ id: "training-minutes", name: "训练时间 / 分钟", color: "#55A58F" }],
      nodes: makeChartNodes("training-minutes", "training-minutes", 48, 1.2, 4, 12, "训练逐渐规律，恢复日也保留步行。"),
      createdAt: CREATED_AT + 2000,
    },
  ],
};

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(backup, null, 2)}\n`, "utf8");
console.log(`generated: ${OUTPUT_FILE}`);
