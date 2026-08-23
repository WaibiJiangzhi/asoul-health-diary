(() => {
  "use strict";

  const dataModel = globalThis.ASOUL_DATA_MODEL;
  const utils = globalThis.ASOUL_APP_UTILS;
  if (!dataModel || !utils) throw new Error("app config requires data-model and app-utils");

  const STORAGE_KEY = "asoul-health-diary-v1";
  const SOUND_STORAGE_KEY = "asoul-health-diary-week-sound-v1";
  const BACKUP_META_STORAGE_KEY = "asoul-health-diary-backup-meta-v1";
  const ALLOWED_COLORS = Object.freeze([
    "#E799B0",
    "#DB7D74",
    "#576690",
    "#8f7aea",
    "#36a58b",
    "#ee9d42",
    "#4f8edb",
    "#35a8bb",
    "#a77957",
  ]);
  const CARD_AUTO_COLORS = Object.freeze(["#576690", "#E799B0", "#36a58b", "#DB7D74"]);
  const MAX_SPACES = 8;
  const MAX_GOALS = 4;
  const MAX_PROGRESS_GOALS = 6;
  const WEEK_ITEMS_NOT_TRACKED = new Set(["跑前热身", "跑后拉伸"]);
  const WEEK_ITEM_STATES = new Set(["", "done", "changed", "missed"]);
  const DEFAULT_SPACES = dataModel.DEFAULT_SPACES.map((space) => ({
    ...space,
    iconSticker: "",
  }));
  const SPACE_TEMPLATES = {
    health: {
      id: "health",
      name: "健康",
      icon: "♡",
      eyebrow: "一个魂的健康日程",
      heading: "这一周，按自己的节奏来",
      activeDayLabel: "训练日",
      firstFieldLabel: "今日重点",
      firstFieldPlaceholder: "今天最想推进的一件事",
      itemPlaceholder: "项目，例如：早餐、跑步或早睡",
      targetPlaceholder: "目标，例如：清淡饮食 / 5 km / 23:30 前睡",
      showWeight: false,
      chartEyebrow: "一个魂的健康轨迹",
      chartHeading: "身体状态，有怎样的变化？",
      emptyChartExample: "例如：横轴写“日期”，指标写“体重 / 斤”，明天再来添加一个新节点。",
      defaultSeries: { name: "体重 / 斤", color: "#E799B0" },
    },
    study: {
      id: "study",
      name: "考研",
      icon: "✎",
      eyebrow: "一个魂的考研打卡",
      heading: "这一周，按自己的节奏来",
      activeDayLabel: "学习日",
      firstFieldLabel: "今日重点",
      firstFieldPlaceholder: "今天最想推进的一件事",
      itemPlaceholder: "科目，例如：英语阅读",
      targetPlaceholder: "目标，例如：精读 2 篇",
      showWeight: false,
      chartEyebrow: "一个魂的备考趋势",
      chartHeading: "努力正在怎样积累？",
      emptyChartExample: "例如：横轴写“日期”，指标写“有效学习 / 小时”或“正确率 / %”。",
      defaultSeries: { name: "有效学习 / 小时", color: "#8f7aea" },
    },
    work: {
      id: "work",
      name: "工作",
      icon: "▣",
      eyebrow: "一个魂的工作日程",
      heading: "这一周，按自己的节奏来",
      activeDayLabel: "工作日",
      firstFieldLabel: "今日重点",
      firstFieldPlaceholder: "今天最想推进的一件事",
      itemPlaceholder: "事项，例如：项目方案",
      targetPlaceholder: "目标，例如：完成初稿",
      showWeight: false,
      chartEyebrow: "一个魂的工作趋势",
      chartHeading: "这一阶段，产出与节奏如何？",
      emptyChartExample: "例如：横轴写“日期”，指标写“深度工作 / 小时”或“完成任务 / 项”。",
      defaultSeries: { name: "深度工作 / 小时", color: "#4f8edb" },
    },
    custom: {
      id: "custom",
      name: "自定义",
      icon: "✦",
      eyebrow: "一个魂的每周打卡",
      heading: "这一周，按自己的节奏来",
      activeDayLabel: "行动日",
      firstFieldLabel: "今日重点",
      firstFieldPlaceholder: "今天最想推进的一件事",
      itemPlaceholder: "事项，例如：阅读、练琴或整理房间",
      targetPlaceholder: "目标，例如：完成 30 分钟",
      showWeight: false,
      chartEyebrow: "一个魂的变化轨迹",
      chartHeading: "坚持正在怎样积累？",
      emptyChartExample: "例如：横轴写“日期”，指标写“投入时间 / 分钟”或“完成数量 / 项”。",
      defaultSeries: { name: "投入时间 / 分钟", color: "#a77957" },
    },
  };
  const DEFAULT_STATE = {
    version: dataModel.CURRENT_STATE_VERSION,
    spaces: DEFAULT_SPACES,
    activeSpaceId: "health",
    profile: { name: "", gender: "", age: "", signature: "", avatar: "" },
    goals: [],
    progressGoals: [],
    weeks: [],
    periods: [],
    charts: [],
  };

  const FALLBACK_STICKER_PACKS = {
    贝拉: [
      "images/贝拉/5-2026贝拉的冒险/[2026贝拉的冒险_败北].jpg",
      "images/贝拉/5-2026贝拉的冒险/[2026贝拉的冒险_比心].jpg",
      "images/贝拉/5-2026贝拉的冒险/[2026贝拉的冒险_不解].jpg",
    ],
    嘉然: [
      "images/嘉然/5-2026嘉然的画册动态表情包/[2026嘉然的画册动态表情包_黯然离场].gif",
      "images/嘉然/5-2026嘉然的画册动态表情包/[2026嘉然的画册动态表情包_邦邦两拳].gif",
      "images/嘉然/5-2026嘉然的画册动态表情包/[2026嘉然的画册动态表情包_扶我下].gif",
    ],
    乃琳: [
      "images/乃琳/4-2025乃琳的酒馆/[2025乃琳的酒馆_啊？].jpg",
      "images/乃琳/4-2025乃琳的酒馆/[2025乃琳的酒馆_干杯].jpg",
      "images/乃琳/4-2025乃琳的酒馆/[2025乃琳的酒馆_可爱].jpg",
    ],
  };
  const STICKER_PACKS = globalThis.ASOUL_STICKER_PACKS || FALLBACK_STICKER_PACKS;
  const LEGACY_STICKER_FALLBACKS = Object.fromEntries(Object.entries(STICKER_PACKS).map(([name, paths]) => [name, paths[0] || ""]));
  const PRESETS = {
    weight: { title: "我的体重变化", xLabel: "日期", series: [{ name: "体重 / 斤", color: "#E799B0" }] },
    run: {
      title: "跑步记录",
      xLabel: "日期",
      series: [
        { name: "跑量 / km", color: "#DB7D74" },
        { name: "配速 / 分钟每公里", color: "#576690" },
      ],
    },
    mood: { title: "每日心情指数", xLabel: "日期", series: [{ name: "心情 / 10分", color: "#ee9d42" }] },
    studyHours: { title: "每日有效学习时长", xLabel: "日期", series: [{ name: "有效学习 / 小时", color: "#8f7aea" }] },
    questions: {
      title: "每日刷题记录",
      xLabel: "日期",
      series: [
        { name: "完成题目 / 道", color: "#36a58b" },
        { name: "正确率 / %", color: "#ee9d42" },
      ],
    },
    score: { title: "模考成绩变化", xLabel: "日期", series: [{ name: "总分 / 分", color: "#DB7D74" }] },
    workHours: { title: "深度工作时长", xLabel: "日期", series: [{ name: "深度工作 / 小时", color: "#4f8edb" }] },
    completedTasks: { title: "任务交付记录", xLabel: "日期", series: [{ name: "完成任务 / 项", color: "#35a8bb" }] },
    habit: { title: "每日投入记录", xLabel: "日期", series: [{ name: "投入时间 / 分钟", color: "#a77957" }] },
  };
  const DEFAULT_COLD_JOKES = Array.isArray(globalThis.ASOUL_COLD_JOKES)
    ? globalThis.ASOUL_COLD_JOKES
        .map((joke) => ({ question: utils.safeString(joke?.question, 160), answer: utils.safeString(joke?.answer, 160) }))
        .filter((joke) => joke.question && joke.answer)
    : [];

  globalThis.ASOUL_APP_CONFIG = Object.freeze({
    ALLOWED_COLORS,
    BACKUP_META_STORAGE_KEY,
    CARD_AUTO_COLORS,
    DEFAULT_COLD_JOKES,
    DEFAULT_SPACES,
    DEFAULT_STATE,
    LEGACY_STICKER_FALLBACKS,
    MAX_GOALS,
    MAX_PROGRESS_GOALS,
    MAX_SPACES,
    PRESETS,
    SOUND_STORAGE_KEY,
    SPACE_TEMPLATES,
    STICKER_PACKS,
    STORAGE_KEY,
    WEEK_ITEMS_NOT_TRACKED,
    WEEK_ITEM_STATES,
  });
})();
