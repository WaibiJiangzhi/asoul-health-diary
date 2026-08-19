(() => {
  "use strict";

  const DATA_MODEL = globalThis.ASOUL_DATA_MODEL || {
    CURRENT_STATE_VERSION: 10,
    UNSUPPORTED_VERSION_CODE: "ASOUL_UNSUPPORTED_STATE_VERSION",
    DEFAULT_SPACES: [
      { id: "health", type: "health", templateId: "health", name: "健康", icon: "♡" },
      { id: "study", type: "study", templateId: "study", name: "考研", icon: "✎" },
      { id: "work", type: "work", templateId: "work", name: "工作", icon: "▣" },
    ],
    migrateState: (candidate) => candidate,
  };
  const STORAGE_KEY = "asoul-health-diary-v1";
  const JOKES_STORAGE_KEY = "asoul-health-diary-jokes-v1";
  const SOUND_STORAGE_KEY = "asoul-health-diary-week-sound-v1";
  const BACKUP_META_STORAGE_KEY = "asoul-health-diary-backup-meta-v1";
  const ALLOWED_COLORS = [
    "#E799B0",
    "#DB7D74",
    "#576690",
    "#8f7aea",
    "#36a58b",
    "#ee9d42",
    "#4f8edb",
    "#35a8bb",
    "#a77957",
  ];
  const CHART_ZOOM_LEVELS = [1, 2, 4, 8];
  const MAX_SPACES = 8;
  const MAX_GOALS = 4;
  const MAX_PROGRESS_GOALS = 6;
  const WEEK_ITEMS_NOT_TRACKED = new Set(["跑前热身", "跑后拉伸"]);
  const WEEK_ITEM_STATES = new Set(["", "done", "changed", "missed"]);
  const DEFAULT_SPACES = DATA_MODEL.DEFAULT_SPACES.map((space) => ({
    ...space,
    iconSticker: "",
    aiContext: { profile: "", goal: "", current: "", availability: "", constraints: "" },
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
      showWeight: true,
      chartEyebrow: "一个魂的健康轨迹",
      chartHeading: "身体状态，有怎样的变化？",
      emptyChartExample: "例如：横轴写“日期”，指标写“体重 / 斤”，明天再来添加一个新节点。",
      aiContextExample: "例如：我身高 175cm、体重 70kg，之前每周跑步 2 次；这周想减脂并恢复力量训练。工作日晚上有 45 分钟，周末时间更多。不吃香菜，膝盖偶尔不舒服，希望饮食按拳头估算、任务不要排太满。",
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
      aiContextExample: "例如：我准备考研，英语阅读基础一般，专业课刚开始第一轮；这周想完成 3 章并保持每天背词。工作日可学 2 小时，周末 5 小时，周三晚上没空，喜欢上午做难题。",
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
      aiContextExample: "例如：我是产品经理，本周要完成需求文档并在周五前评审；上午适合深度工作，周二下午开会，周四要出差。希望每天最多安排 3 件重点，不把临时沟通排进固定计划。",
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
      aiContextExample: "例如：我目前的基础和进度是……，这周想达成……；每天大约能投入……，我喜欢……，需要避开……，希望每天任务量……。",
      defaultSeries: { name: "投入时间 / 分钟", color: "#a77957" },
    },
  };
  const DEFAULT_STATE = {
    version: DATA_MODEL.CURRENT_STATE_VERSION,
    spaces: DEFAULT_SPACES,
    activeSpaceId: "health",
    profile: {
      name: "",
      gender: "",
      age: "",
      signature: "",
      avatar: "",
    },
    goals: [],
    progressGoals: [],
    weeks: [],
    periods: [],
    charts: [],
  };

  const FALLBACK_STICKER_PACKS = {
    贝拉: [
      "图片/贝拉/5-2026贝拉的冒险/[2026贝拉的冒险_败北].jpg",
      "图片/贝拉/5-2026贝拉的冒险/[2026贝拉的冒险_比心].jpg",
      "图片/贝拉/5-2026贝拉的冒险/[2026贝拉的冒险_不解].jpg",
    ],
    嘉然: [
      "图片/嘉然/5-2026嘉然的画册动态表情包/[2026嘉然的画册动态表情包_黯然离场].gif",
      "图片/嘉然/5-2026嘉然的画册动态表情包/[2026嘉然的画册动态表情包_邦邦两拳].gif",
      "图片/嘉然/5-2026嘉然的画册动态表情包/[2026嘉然的画册动态表情包_扶我下].gif",
    ],
    乃琳: [
      "图片/乃琳/4-2025乃琳的酒馆/[2025乃琳的酒馆_啊？].jpg",
      "图片/乃琳/4-2025乃琳的酒馆/[2025乃琳的酒馆_干杯].jpg",
      "图片/乃琳/4-2025乃琳的酒馆/[2025乃琳的酒馆_可爱].jpg",
    ],
  };
  const STICKER_PACKS = globalThis.ASOUL_STICKER_PACKS || FALLBACK_STICKER_PACKS;
  const LEGACY_STICKER_FALLBACKS = Object.fromEntries(
    Object.entries(STICKER_PACKS).map(([name, paths]) => [name, paths[0] || ""]),
  );

  const PRESETS = {
    weight: {
      title: "我的体重变化",
      xLabel: "日期",
      series: [{ name: "体重 / 斤", color: "#E799B0" }],
    },
    run: {
      title: "跑步记录",
      xLabel: "日期",
      series: [
        { name: "跑量 / km", color: "#DB7D74" },
        { name: "配速 / 分钟每公里", color: "#576690" },
      ],
    },
    pushups: {
      title: "俯卧撑记录",
      xLabel: "日期",
      series: [{ name: "俯卧撑 / 个", color: "#36a58b" }],
    },
    mood: {
      title: "每日心情指数",
      xLabel: "日期",
      series: [{ name: "心情 / 10分", color: "#ee9d42" }],
    },
    studyHours: {
      title: "每日有效学习时长",
      xLabel: "日期",
      series: [{ name: "有效学习 / 小时", color: "#8f7aea" }],
    },
    questions: {
      title: "每日刷题记录",
      xLabel: "日期",
      series: [
        { name: "完成题目 / 道", color: "#36a58b" },
        { name: "正确率 / %", color: "#ee9d42" },
      ],
    },
    score: {
      title: "模考成绩变化",
      xLabel: "日期",
      series: [{ name: "总分 / 分", color: "#DB7D74" }],
    },
    workHours: {
      title: "深度工作时长",
      xLabel: "日期",
      series: [{ name: "深度工作 / 小时", color: "#4f8edb" }],
    },
    completedTasks: {
      title: "任务交付记录",
      xLabel: "日期",
      series: [{ name: "完成任务 / 项", color: "#35a8bb" }],
    },
    habit: {
      title: "每日投入记录",
      xLabel: "日期",
      series: [{ name: "投入时间 / 分钟", color: "#a77957" }],
    },
  };

  const DEFAULT_COLD_JOKES = Array.isArray(globalThis.ASOUL_COLD_JOKES)
    ? globalThis.ASOUL_COLD_JOKES
        .map((joke) => ({ question: safeString(joke?.question, 160), answer: safeString(joke?.answer, 160) }))
        .filter((joke) => joke.question && joke.answer)
    : [];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const cloneDefault = () => JSON.parse(JSON.stringify(DEFAULT_STATE));

  let storageAvailable = true;
  let stateSaveBlocked = false;
  let stateLoadIssue = "";
  let state = loadState();
  let activeSpaceId = safeSpaceId(state.activeSpaceId);
  let editingChartId = null;
  let editingNodeId = null;
  let editingSpaceId = null;
  let editingGoalId = null;
  let selectedGoalId = state.goals[0]?.id || null;
  let editingProgressGoalId = null;
  let selectedProgressGoalId = state.progressGoals[0]?.id || null;
  let activeNodeChartId = null;
  const initialSpaceWeeks = state.weeks.filter((week) => week.spaceId === activeSpaceId);
  const initialSpacePeriods = state.periods.filter((period) => period.spaceId === activeSpaceId);
  let selectedWeekId = pickRelevantWeek(initialSpaceWeeks)?.id || null;
  let weekYearFilter = initialSpacePeriods.at(-1)?.yearMonth.slice(0, 4) || String(new Date().getFullYear());
  let weekMonthFilter = initialSpacePeriods.at(-1)?.yearMonth.slice(5, 7) || String(new Date().getMonth() + 1).padStart(2, "0");
  let openWeekStickerWeekId = null;
  let openWeekStickerDayId = null;
  let activeStickerPack = "贝拉";
  let activeNodeStickerSeriesId = "";
  let selectedNodeStickers = {};
  let activeWeekStickerPack = "贝拉";
  let selectedWeekSticker = "";
  let activeAvatarPack = "嘉然";
  let pendingAvatarSticker = "";
  let activeSpaceIconPack = "嘉然";
  let pendingSpaceIconSticker = "";
  let activeGoalStickerPack = "嘉然";
  let pendingGoalSticker = "";
  let activeProgressGoalStickerPack = "嘉然";
  let pendingProgressGoalSticker = "";
  let coldJokes = loadJokes();
  let currentJokeIndex = -1;
  let weekSoundEnabled = loadWeekSoundPreference();
  let lastManualBackupAt = loadLastManualBackupAt();
  let feedbackAudioContext = null;
  const selectedNodeByChart = new Map();
  const selectedDayByWeek = new Map();
  const chartZoomById = new Map();
  const chartScrollById = new Map();
  let saveTimer = null;
  let toastTimer = null;
  let deferredInstallPrompt = null;
  let waitingServiceWorker = null;
  const canvasImageCache = new Map();

  const profileForm = $("#profileForm");
  const goalList = $("#goalList");
  const goalDialog = $("#goalDialog");
  const goalForm = $("#goalForm");
  const progressGoalList = $("#progressGoalList");
  const progressGoalDialog = $("#progressGoalDialog");
  const progressGoalForm = $("#progressGoalForm");
  const progressGoalStickerTabs = $("#progressGoalStickerTabs");
  const progressGoalStickerGrid = $("#progressGoalStickerGrid");
  const goalStickerTabs = $("#goalStickerTabs");
  const goalStickerGrid = $("#goalStickerGrid");
  const spaceSwitcher = $("#spaceSwitcher");
  const spaceDialog = $("#spaceDialog");
  const spaceForm = $("#spaceForm");
  const spaceIconStickerTabs = $("#spaceIconStickerTabs");
  const spaceIconStickerGrid = $("#spaceIconStickerGrid");
  const avatarPreview = $("#avatarPreview");
  const avatarPlaceholder = $("#avatarPlaceholder");
  const autosaveStatus = $("#autosaveStatus");
  const weekTimeline = $("#weekTimeline");
  const weekDetail = $("#weekDetail");
  const weekEmpty = $("#weekEmpty");
  const weekDialog = $("#weekDialog");
  const weekForm = $("#weekForm");
  const weekStickerDialog = $("#weekStickerDialog");
  const weekStickerForm = $("#weekStickerForm");
  const weekStickerTabs = $("#weekStickerTabs");
  const weekStickerGrid = $("#weekStickerGrid");
  const weekImportDialog = $("#weekImportDialog");
  const weekImportForm = $("#weekImportForm");
  const weeklyReportDialog = $("#weeklyReportDialog");
  const weeklyReportContent = $("#weeklyReportContent");
  const chartsGrid = $("#chartsGrid");
  const emptyState = $("#emptyState");
  const chartDialog = $("#chartDialog");
  const chartForm = $("#chartForm");
  const seriesEditor = $("#seriesEditor");
  const nodeDialog = $("#nodeDialog");
  const nodeForm = $("#nodeForm");
  const nodeSeriesFields = $("#nodeSeriesFields");
  const deleteNodeButton = $("#deleteNodeButton");
  const stickerTabs = $("#stickerTabs");
  const stickerGrid = $("#stickerGrid");
  const nodeStickerSeriesTabs = $("#nodeStickerSeriesTabs");
  const avatarDialog = $("#avatarDialog");
  const avatarForm = $("#avatarForm");
  const avatarStickerTabs = $("#avatarStickerTabs");
  const avatarStickerGrid = $("#avatarStickerGrid");
  const jokeEditorDialog = $("#jokeEditorDialog");
  const jokeEditorForm = $("#jokeEditorForm");
  const jokeEditorList = $("#jokeEditorList");
  const toast = $("#toast");

  init();

  function init() {
    hydrateProfileForm();
    renderProfileAvatar();
    renderGoals();
    renderProgressGoals();
    showRandomJoke();
    renderSpaceSwitcher();
    renderWeeks();
    renderCharts();
    renderBackupStatus();
    bindEvents();
    renderWeekSoundToggle();
    initSectionNavigation();
    initPwa();
    preloadCanvasAssets();

    if (stateLoadIssue) {
      autosaveStatus.textContent = stateLoadIssue;
      autosaveStatus.classList.remove("is-saved");
    } else if (!storageAvailable) {
      autosaveStatus.textContent = "浏览器限制了本地保存，请使用 Chrome 或 Edge 打开";
      autosaveStatus.classList.remove("is-saved");
    }
  }

  function bindEvents() {
    $("#addChartButton").addEventListener("click", () => openChartDialog());
    $("#emptyAddButton").addEventListener("click", () => openChartDialog());
    $("#addGoalButton").addEventListener("click", () => openGoalDialog());
    $("#editGoalButton").addEventListener("click", () => selectedGoalId && openGoalDialog(selectedGoalId));
    $("#deleteGoalButton").addEventListener("click", deleteSelectedGoal);
    $("#moveGoalEarlierButton").addEventListener("click", () => moveSelectedGoal(-1));
    $("#moveGoalLaterButton").addEventListener("click", () => moveSelectedGoal(1));
    $("#addProgressGoalButton").addEventListener("click", () => openProgressGoalDialog());
    $("#editProgressGoalButton").addEventListener("click", () => selectedProgressGoalId && openProgressGoalDialog(selectedProgressGoalId));
    $("#deleteProgressGoalButton").addEventListener("click", deleteSelectedProgressGoal);
    $("#moveProgressGoalEarlierButton").addEventListener("click", () => moveSelectedProgressGoal(-1));
    $("#moveProgressGoalLaterButton").addEventListener("click", () => moveSelectedProgressGoal(1));
    $("#addSpaceButton").addEventListener("click", () => openSpaceDialog());
    $("#editSpaceButton").addEventListener("click", () => openSpaceDialog(activeSpaceId));
    $("#deleteSpaceButton").addEventListener("click", () => deleteSpace(activeSpaceId));
    $("#addWeekButton").addEventListener("click", openPeriodDialog);
    $("#emptyAddWeekButton").addEventListener("click", openPeriodDialog);
    $("#importWeekButton").addEventListener("click", openWeekImportDialog);
    $("#shiftWeekButton").addEventListener("click", () => selectedWeekId && shiftWeekScheduleByOneDay(selectedWeekId));
    $("#copyPreviousWeekButton").addEventListener("click", copyPreviousWeekContext);
    $("#copyAiPromptButton").addEventListener("click", copyAiPlanningPrompt);
    $("#weekYearSelect").addEventListener("change", (event) => {
      weekYearFilter = event.currentTarget.value;
      weekMonthFilter = "";
      renderWeeks();
    });
    $("#weekMonthSelect").addEventListener("change", (event) => {
      weekMonthFilter = event.currentTarget.value;
      renderWeeks();
    });
    $("#previousPeriodButton").addEventListener("click", () => selectAdjacentPeriod(-1));
    $("#nextPeriodButton").addEventListener("click", () => selectAdjacentPeriod(1));
    $("#weekSoundToggle").addEventListener("click", toggleWeekSound);
    $("#showSelectedWeekReportButton").addEventListener("click", () => selectedWeekId && openWeeklyReport(selectedWeekId));
    $("#copySelectedWeekReportButton").addEventListener("click", () => selectedWeekId && copyWeekReportText(selectedWeekId));
    $("#downloadWeeklyReportImageButton").addEventListener("click", () => selectedWeekId && downloadWeeklyReportImage(selectedWeekId));
    $("#downloadWeeklySummaryImageButton").addEventListener("click", () => selectedWeekId && downloadWeeklySummaryImage(selectedWeekId));
    $("#deleteSelectedPeriodButton").addEventListener("click", deleteSelectedPeriod);
    $("#avatarButton").addEventListener("click", openAvatarDialog);
    $("#exportButton").addEventListener("click", exportBackup);
    $("#importButton").addEventListener("click", () => $("#importInput").click());
    $("#footerExportButton").addEventListener("click", exportBackup);
    $("#footerImportButton").addEventListener("click", () => $("#importInput").click());
    $("#resetDataButton").addEventListener("click", resetDiaryData);
    $("#footerResetDataButton").addEventListener("click", resetDiaryData);
    $("#importInput").addEventListener("change", importBackup);
    $("#addSeriesButton").addEventListener("click", () => addSeriesEditorRow());
    $("#nextJokeButton").addEventListener("click", showRandomJoke);
    $("#revealJokeButton").addEventListener("click", revealJokeAnswer);
    $("#editJokesButton").addEventListener("click", openJokeEditor);
    $("#addJokeRowButton").addEventListener("click", addJokeEditorRow);
    $("#resetJokesButton").addEventListener("click", resetJokesToFile);
    $("#exportJokesButton").addEventListener("click", exportJokesFile);
    window.addEventListener("pagehide", flushScheduledSave);

    profileForm.addEventListener("input", (event) => {
      const field = event.target;
      if (!field.name || !(field.name in state.profile)) return;
      state.profile[field.name] = field.value;
      if (field.name === "name") renderProfileAvatar();
      scheduleSave();
    });

    chartForm.addEventListener("submit", saveChartFromDialog);
    nodeForm.addEventListener("submit", saveNodeFromDialog);
    goalForm.addEventListener("submit", saveGoalFromDialog);
    progressGoalForm.addEventListener("submit", saveProgressGoalFromDialog);
    spaceForm.addEventListener("submit", saveSpaceFromDialog);
    weekForm.addEventListener("submit", savePeriodFromDialog);
    weekStickerForm.addEventListener("submit", saveWeekSticker);
    weekImportForm.addEventListener("submit", importWeekPlan);
    avatarForm.addEventListener("submit", saveAvatarFromDialog);
    jokeEditorForm.addEventListener("submit", saveJokesFromEditor);
    $$('[name="templateId"]', spaceForm).forEach((input) => input.addEventListener("change", syncSpaceFormTemplate));
    spaceForm.elements.icon.addEventListener("input", () => {
      pendingSpaceIconSticker = "";
      renderSpaceIconPicker();
    });
    $("#spaceIconPicker").addEventListener("toggle", renderSpaceIconPicker);
    $("#goalStickerPicker").addEventListener("toggle", renderGoalStickerPicker);
    $("#progressGoalStickerPicker").addEventListener("toggle", renderProgressGoalStickerPicker);
    $("#clearAvatarButton").addEventListener("click", clearAvatar);
    deleteNodeButton.addEventListener("click", deleteActiveNode);
    $("#clearWeekStickerButton").addEventListener("click", clearWeekSticker);

    $$('[data-close-dialog]').forEach((button) => {
      button.addEventListener("click", () => button.closest("dialog").close());
    });

    document.addEventListener("click", (event) => {
      const explicitClose = event.target.closest("[data-close-menu]");
      if (explicitClose) {
        explicitClose.closest("details")?.removeAttribute("open");
        return;
      }
      $$(".section-action-menu[open], .week-action-menu[open], .chart-action-menu[open], .week-item-state[open]").forEach((menu) => {
        if (!menu.contains(event.target)) menu.removeAttribute("open");
      });
    });
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      $$(".section-action-menu[open], .week-action-menu[open], .chart-action-menu[open], .week-item-state[open]").forEach((menu) => menu.removeAttribute("open"));
    });

    $$("[data-preset]").forEach((button) => {
      button.addEventListener("click", () => applyPreset(button.dataset.preset));
    });

    [goalDialog, progressGoalDialog, spaceDialog, chartDialog, nodeDialog, weekDialog, weekStickerDialog, weekImportDialog, weeklyReportDialog, avatarDialog, jokeEditorDialog].forEach((dialog) => {
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) dialog.close();
      });
    });
  }

  function loadState() {
    let raw;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      storageAvailable = false;
      return cloneDefault();
    }

    if (!raw) return cloneDefault();
    try {
      return normalizeState(JSON.parse(raw));
    } catch (error) {
      stateSaveBlocked = true;
      stateLoadIssue = error?.code === DATA_MODEL.UNSUPPORTED_VERSION_CODE
        ? "数据来自更新版本，请用新版打开或恢复兼容备份"
        : "本地数据读取失败，请先恢复备份或清空记录";
      return cloneDefault();
    }
  }

  function loadWeekSoundPreference() {
    try {
      return localStorage.getItem(SOUND_STORAGE_KEY) !== "off";
    } catch (error) {
      return true;
    }
  }

  function loadLastManualBackupAt() {
    try {
      const value = Number(localStorage.getItem(BACKUP_META_STORAGE_KEY));
      return Number.isFinite(value) && value > 0 ? value : null;
    } catch (error) {
      return null;
    }
  }

  function renderBackupStatus() {
    const target = $("#backupStatusText");
    if (!target) return;
    if (!lastManualBackupAt) {
      target.textContent = "还没有记录手动备份时间";
      return;
    }
    const formatted = new Intl.DateTimeFormat("zh-CN", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(lastManualBackupAt));
    target.textContent = `最近一次手动备份：${formatted}`;
  }

  function rememberManualBackup() {
    lastManualBackupAt = Date.now();
    try {
      localStorage.setItem(BACKUP_META_STORAGE_KEY, String(lastManualBackupAt));
    } catch (error) {
      // The backup itself has already downloaded; this timestamp is only a reminder.
    }
    renderBackupStatus();
  }

  function toggleWeekSound() {
    weekSoundEnabled = !weekSoundEnabled;
    try {
      localStorage.setItem(SOUND_STORAGE_KEY, weekSoundEnabled ? "on" : "off");
    } catch (error) {
      // The sound preference can remain session-only when storage is unavailable.
    }
    renderWeekSoundToggle();
    if (weekSoundEnabled) playWeekFeedback(true);
  }

  function renderWeekSoundToggle() {
    const button = $("#weekSoundToggle");
    if (!button) return;
    button.setAttribute("aria-pressed", String(weekSoundEnabled));
    $("#weekSoundLabel").textContent = weekSoundEnabled ? "已开启" : "已关闭";
  }

  function playWeekFeedback(done) {
    if (!weekSoundEnabled) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      feedbackAudioContext ||= new AudioContextClass();
      if (feedbackAudioContext.state === "suspended") feedbackAudioContext.resume();
      const now = feedbackAudioContext.currentTime;
      const playTone = (frequency, start, duration, volume, type = "sine") => {
        const oscillator = feedbackAudioContext.createOscillator();
        const gain = feedbackAudioContext.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        oscillator.connect(gain);
        gain.connect(feedbackAudioContext.destination);
        oscillator.start(start);
        oscillator.stop(start + duration + 0.02);
      };
      if (done) {
        playTone(659.25, now, 0.11, 0.055);
        playTone(880, now + 0.075, 0.13, 0.045);
      } else {
        playTone(246.94, now, 0.12, 0.045, "triangle");
        playTone(196, now + 0.065, 0.15, 0.035, "triangle");
      }
    } catch (error) {
      // Audio feedback is optional and must never block recording.
    }
  }

  function normalizeJokes(candidate) {
    if (!Array.isArray(candidate)) return [];
    return candidate
      .slice(0, 100)
      .map((joke) => ({
        question: safeString(joke?.question, 160),
        answer: safeString(joke?.answer, 160),
      }))
      .filter((joke) => joke.question && joke.answer);
  }

  function normalizePairList(candidate) {
    if (!Array.isArray(candidate)) return [];
    return candidate
      .slice(0, 24)
      .map((item) => ({
        id: safeId(item?.id),
        name: safeString(item?.name ?? item?.activity, 36),
        value: safeString(item?.value ?? item?.target ?? item?.result, 80),
        done: typeof (item?.done ?? item?.completed) === "boolean" ? (item.done ?? item.completed) : null,
      }))
      .filter((item) => item.name || item.value);
  }

  function buildLegacyWeekItems(day) {
    const plans = normalizePairList(day?.planItems ?? day?.schedule ?? day?.plans);
    const records = normalizePairList(day?.records ?? day?.actual ?? day?.results);
    const rowCount = Math.max(plans.length, records.length);
    return Array.from({ length: rowCount }, (_, index) => {
      const plan = plans[index] || {};
      const record = records[index] || {};
      const name = plan.name || record.name || "";
      const target = plan.value || "";
      const legacyActual = record.value || "";
      return {
        id: plan.id || record.id || makeId(),
        text: [name, target].filter(Boolean).join("：") || legacyActual,
        state: record.done === true ? "done" : record.done === false ? "missed" : "",
        legacyActual,
      };
    });
  }

  function normalizeWeekItems(candidate, day) {
    const source = Array.isArray(candidate) ? candidate : buildLegacyWeekItems(day);
    return source
      .slice(0, 24)
      .map((item) => {
        const state = safeString(item?.state, 12);
        return {
          id: safeId(item?.id),
          text: safeString(item?.text, 160),
          state: WEEK_ITEM_STATES.has(state) ? state : "",
          legacyActual: safeString(item?.legacyActual, 160),
        };
      })
      .filter((item) => item.text || item.state || item.legacyActual);
  }

  function normalizeWeekDay(candidate, index, startDate, templateId = "custom") {
    const day = candidate && typeof candidate === "object" ? candidate : {};
    const allowedStatuses = ["", "这期拉了", "还不错", "好好好"];
    const status = safeString(day.status, 12);
    const items = normalizeWeekItems(day.items, day)
      .filter((item) => !WEEK_ITEMS_NOT_TRACKED.has(item.text.split("：")[0]));
    const recorded = typeof day.recorded === "boolean"
      ? day.recorded
      : Boolean(
          status
          || items.some((item) => item.state)
          || day.note
          || (day.weight !== null && day.weight !== undefined && day.weight !== "" && Number.isFinite(Number(day.weight))),
        );
    return {
      id: safeId(day.id),
      dayNumber: index + 1,
      date: safeDate(day.date) || addDaysIso(startDate, index),
      title: normalizeDayType(day.title, templateId),
      duration: safeString(day.duration, 40),
      focus: safeString(day.focus ?? day.dietPlan, 500),
      items,
      weight: safeWeight(day.weight),
      note: safeString(day.note, 600),
      status: allowedStatuses.includes(status) ? status : "",
      recorded,
      sticker: safeSticker(day.sticker),
    };
  }

  function normalizeDayType(value, templateId = "custom") {
    const text = safeString(value, 36);
    if (/休息|恢复|慢走/.test(text)) return "休息日";
    const activeDayLabel = SPACE_TEMPLATES[safeTemplateId(templateId)].activeDayLabel;
    return text ? activeDayLabel : "休息日";
  }

  function normalizeWeek(candidate, spaces = DEFAULT_SPACES) {
    const week = candidate && typeof candidate === "object" ? candidate : {};
    const spaceId = safeSpaceIdForList(week.spaceId, spaces);
    const templateId = spaces.find((space) => space.id === spaceId)?.templateId || "custom";
    const startDate = startOfWeekIso(safeDate(week.startDate) || todayIso());
    const sourceDays = Array.isArray(week.days) ? week.days : [];
    return {
      id: safeId(week.id),
      spaceId,
      startDate,
      title: safeString(week.title, 36) || `${formatMonthDay(startDate)} 开始的一周`,
      goal: safeString(week.goal, 240),
      note: safeString(week.note, 360),
      createdAt: Number(week.createdAt) || Date.now(),
      days: Array.from({ length: 7 }, (_, index) => normalizeWeekDay(sourceDays[index], index, startDate, templateId)),
    };
  }

  function safeTemplateId(value) {
    return Object.hasOwn(SPACE_TEMPLATES, value) ? value : "custom";
  }

  function safeSpaceIdForList(value, spaces) {
    const candidates = Array.isArray(spaces) ? spaces : DEFAULT_SPACES;
    return candidates.some((space) => space.id === value) ? value : (candidates[0]?.id || "");
  }

  function normalizeAiContext(candidate) {
    const context = candidate && typeof candidate === "object" ? candidate : {};
    return {
      profile: safeString(context.profile, 2000),
      goal: safeString(context.goal, 600),
      current: safeString(context.current, 1000),
      availability: safeString(context.availability, 600),
      constraints: safeString(context.constraints, 600),
    };
  }

  function normalizeSpaces(candidate) {
    const source = Array.isArray(candidate) ? candidate : DEFAULT_SPACES;
    const seen = new Set();
    const spaces = [];
    source.slice(0, MAX_SPACES).forEach((item, index) => {
      const rawId = safeString(item?.id, 60).replace(/[^a-zA-Z0-9_-]/g, "");
      let id = rawId || `space-${index + 1}`;
      while (seen.has(id)) id = `${id}-${index + 1}`;
      seen.add(id);
      const templateId = safeTemplateId(item?.templateId || item?.type || item?.id);
      const template = SPACE_TEMPLATES[templateId];
      spaces.push({
        id,
        type: templateId,
        templateId,
        name: safeString(item?.name, 16) || template.name,
        icon: safeString(item?.icon, 2) || template.icon,
        iconSticker: safeSticker(item?.iconSticker),
        aiContext: normalizeAiContext(item?.aiContext),
        createdAt: Number(item?.createdAt) || Date.now(),
      });
    });
    return spaces;
  }

  function normalizePeriod(candidate, spaces) {
    const period = candidate && typeof candidate === "object" ? candidate : {};
    const yearMonth = /^\d{4}-\d{2}$/.test(String(period.yearMonth || "")) ? String(period.yearMonth) : "";
    if (!yearMonth) return null;
    const spaceId = safeSpaceIdForList(period.spaceId, spaces);
    return {
      id: safeId(period.id),
      spaceId,
      yearMonth,
      createdAt: Number(period.createdAt) || Date.now(),
    };
  }

  function normalizeGoal(candidate, spaces) {
    const goal = candidate && typeof candidate === "object" ? candidate : {};
    const title = safeString(goal.title, 30);
    const targetDate = safeDate(goal.targetDate);
    if (!title || !targetDate) return null;
    const availableSpaces = Array.isArray(spaces) ? spaces : DEFAULT_SPACES;
    const validSpaceIds = new Set(availableSpaces.map((space) => space.id));
    const requestedSpaceIds = Array.isArray(goal.spaceIds)
      ? goal.spaceIds
      : [];
    const spaceIds = [...new Set(requestedSpaceIds
      .map((spaceId) => safeString(spaceId, 60))
      .filter((spaceId) => validSpaceIds.has(spaceId)))];
    return {
      id: safeId(goal.id),
      title,
      targetDate,
      note: safeString(goal.note, 80),
      sticker: safeSticker(goal.sticker),
      spaceIds,
      createdAt: Number(goal.createdAt) || Date.now(),
    };
  }

  function normalizeProgressGoal(candidate, spaces) {
    const goal = candidate && typeof candidate === "object" ? candidate : {};
    const title = safeString(goal.title, 30);
    const target = Number(goal.target);
    const current = Number(goal.current);
    if (!title || !Number.isFinite(target) || target <= 0 || target > 1_000_000_000) return null;
    const updates = (Array.isArray(goal.updates) ? goal.updates : [])
      .slice(-100)
      .map((update) => ({
        id: safeId(update?.id),
        amount: Number(update?.amount),
        createdAt: Number(update?.createdAt) || Date.now(),
      }))
      .filter((update) => Number.isFinite(update.amount) && update.amount !== 0);
    const availableSpaces = Array.isArray(spaces) ? spaces : DEFAULT_SPACES;
    const validSpaceIds = new Set(availableSpaces.map((space) => space.id));
    const spaceIds = [...new Set((Array.isArray(goal.spaceIds) ? goal.spaceIds : [])
      .map((spaceId) => safeString(spaceId, 60))
      .filter((spaceId) => validSpaceIds.has(spaceId)))];
    return {
      id: safeId(goal.id),
      title,
      target,
      current: Number.isFinite(current) && current >= 0 ? Math.min(current, 1_000_000_000) : 0,
      unit: safeString(goal.unit, 10) || "项",
      defaultIncrement: Number.isFinite(Number(goal.defaultIncrement)) && Number(goal.defaultIncrement) !== 0
        ? Math.max(-1_000_000_000, Math.min(Number(goal.defaultIncrement), 1_000_000_000))
        : 1,
      note: safeString(goal.note, 80),
      sticker: safeSticker(goal.sticker),
      spaceIds,
      updates,
      createdAt: Number(goal.createdAt) || Date.now(),
    };
  }

  function loadJokes() {
    try {
      const saved = normalizeJokes(JSON.parse(localStorage.getItem(JOKES_STORAGE_KEY) || "null"));
      return saved.length ? saved : DEFAULT_COLD_JOKES.map((joke) => ({ ...joke }));
    } catch (error) {
      return DEFAULT_COLD_JOKES.map((joke) => ({ ...joke }));
    }
  }

  function saveJokes() {
    if (!storageAvailable) return;
    try {
      localStorage.setItem(JOKES_STORAGE_KEY, JSON.stringify(coldJokes));
    } catch (error) {
      showToast("冷笑话暂时无法保存，请先导出冷笑话.js");
    }
  }

  function normalizeState(candidate) {
    const clean = cloneDefault();
    if (!candidate || typeof candidate !== "object") return clean;
    candidate = DATA_MODEL.migrateState(candidate);

    clean.spaces = normalizeSpaces(candidate.spaces);
    clean.activeSpaceId = safeSpaceIdForList(candidate.activeSpaceId, clean.spaces);

    if (candidate.profile && typeof candidate.profile === "object") {
      clean.profile.name = safeString(candidate.profile.name, 20);
      clean.profile.gender = safeString(candidate.profile.gender, 20);
      clean.profile.age = safeString(candidate.profile.age, 4);
      clean.profile.signature = safeString(candidate.profile.signature, 60);
      clean.profile.avatar = safeSticker(candidate.profile.avatar);
    }

    clean.goals = (Array.isArray(candidate.goals) ? candidate.goals : [])
      .slice(0, MAX_GOALS)
      .map((goal) => normalizeGoal(goal, clean.spaces))
      .filter(Boolean);

    clean.progressGoals = (Array.isArray(candidate.progressGoals) ? candidate.progressGoals : [])
      .slice(0, MAX_PROGRESS_GOALS)
      .map((goal) => normalizeProgressGoal(goal, clean.spaces))
      .filter(Boolean);

    const sourceWeeks = Array.isArray(candidate.weeks)
      ? candidate.weeks
      : Array.isArray(candidate.weeklyPlans)
        ? candidate.weeklyPlans
        : [];
    clean.weeks = sourceWeeks
      .slice(0, 3000)
      .map((week) => normalizeWeek(week, clean.spaces))
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
    const uniqueWeeks = new Map();
    clean.weeks.forEach((week) => uniqueWeeks.set(`${week.spaceId}:${week.startDate}`, week));
    clean.weeks = [...uniqueWeeks.values()];

    const periodMap = new Map();
    clean.weeks.forEach((week) => {
      const yearMonth = week.startDate.slice(0, 7);
      const key = `${week.spaceId}:${yearMonth}`;
      if (!periodMap.has(key)) periodMap.set(key, normalizePeriod({ spaceId: week.spaceId, yearMonth }, clean.spaces));
    });
    clean.periods = [...periodMap.values()].sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
    clean.periods.forEach((period) => {
      getMonthMondays(period.yearMonth).forEach((startDate) => {
        const key = `${period.spaceId}:${startDate}`;
        if (uniqueWeeks.has(key)) return;
        const week = normalizeWeek({ spaceId: period.spaceId, startDate, days: [] }, clean.spaces);
        clean.weeks.push(week);
        uniqueWeeks.set(key, week);
      });
    });
    clean.weeks.sort((a, b) => a.startDate.localeCompare(b.startDate));

    if (Array.isArray(candidate.charts)) {
      clean.charts = candidate.charts.slice(0, 160).map((chart) => {
        const sourceSeries = Array.isArray(chart.series) && chart.series.length
          ? chart.series
          : [{ id: makeId(), name: chart.yLabel || "纵轴", color: chart.color }];
        const series = sourceSeries.slice(0, 3).map((item, index) => ({
          id: safeId(item.id),
          name: safeString(item.name, 24) || `指标 ${index + 1}`,
          color: ALLOWED_COLORS.includes(item.color) ? item.color : ALLOWED_COLORS[index % ALLOWED_COLORS.length],
          axisMin: item.axisMin !== null && item.axisMin !== undefined && item.axisMin !== "" && Number.isFinite(Number(item.axisMin)) ? Number(item.axisMin) : null,
          axisMax: item.axisMax !== null && item.axisMax !== undefined && item.axisMax !== "" && Number.isFinite(Number(item.axisMax)) ? Number(item.axisMax) : null,
        }));

        return {
          id: safeId(chart.id),
          spaceId: safeSpaceIdForList(chart.spaceId, clean.spaces),
          title: safeString(chart.title, 30) || "未命名图表",
          xLabel: safeString(chart.xLabel, 20) || "横轴",
          series,
          createdAt: Number(chart.createdAt) || Date.now(),
          nodes: Array.isArray(chart.nodes)
            ? chart.nodes.slice(0, 2000).map((node) => {
                const values = {};
                series.forEach((item, index) => {
                  const raw = node.values?.[item.id] ?? (index === 0 ? node.y : null);
                  values[item.id] = raw !== null && raw !== undefined && Number.isFinite(Number(raw)) ? Number(raw) : null;
                });
                const stickers = {};
                series.forEach((item, index) => {
                  const sticker = safeSticker(node.stickers?.[item.id] ?? (index === 0 ? node.sticker : ""));
                  if (sticker) stickers[item.id] = sticker;
                });
                return {
                  id: safeId(node.id),
                  x: safeString(node.x, 24),
                  values,
                  note: safeString(node.note, 120),
                  sticker: stickers[series[0]?.id] || "",
                  stickers,
                  createdAt: Number(node.createdAt) || Date.now(),
                };
              })
            : [],
        };
      });
    }

    return clean;
  }

  function saveState(showSavedStatus = true) {
    if (!storageAvailable || stateSaveBlocked) {
      if (stateLoadIssue) autosaveStatus.textContent = stateLoadIssue;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (showSavedStatus) {
        autosaveStatus.textContent = "已自动保存";
        autosaveStatus.classList.add("is-saved");
        window.setTimeout(() => {
          autosaveStatus.textContent = "更改会自动保存";
          autosaveStatus.classList.remove("is-saved");
        }, 1700);
      }
    } catch (error) {
      showToast("保存空间不足，请先备份并精简部分记录");
      autosaveStatus.textContent = "保存空间不足";
      autosaveStatus.classList.remove("is-saved");
    }
  }

  function scheduleSave() {
    if (stateSaveBlocked) {
      autosaveStatus.textContent = stateLoadIssue;
      return;
    }
    autosaveStatus.textContent = "正在保存…";
    autosaveStatus.classList.remove("is-saved");
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => {
      saveTimer = null;
      saveState();
    }, 420);
  }

  function flushScheduledSave() {
    if (!saveTimer) return;
    window.clearTimeout(saveTimer);
    saveTimer = null;
    saveState(false);
  }

  function resetDiaryData() {
    const hasProfile = Object.values(state.profile).some((value) => String(value).trim());
    if (!stateSaveBlocked && !hasProfile && state.goals.length === 0 && state.progressGoals.length === 0 && state.charts.length === 0 && state.weeks.length === 0) {
      showToast("现在已经是空白日记啦");
      return;
    }
    if (!window.confirm("确定清空这台浏览器里的个人资料、倒计时、进度目标、每周计划、曲线图和全部节点吗？\n\n冷笑话不会被删除；如果记录还需要保留，请先点击“备份”。")) return;

    state = cloneDefault();
    activeSpaceId = "health";
    stateSaveBlocked = false;
    stateLoadIssue = "";
    selectedNodeByChart.clear();
    selectedDayByWeek.clear();
    chartZoomById.clear();
    chartScrollById.clear();
    selectedGoalId = null;
    selectedProgressGoalId = null;
    selectedWeekId = null;
    weekYearFilter = String(new Date().getFullYear());
    weekMonthFilter = String(new Date().getMonth() + 1).padStart(2, "0");
    window.clearTimeout(saveTimer);
    saveTimer = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      storageAvailable = false;
    }
    hydrateProfileForm();
    renderProfileAvatar();
    renderGoals();
    renderProgressGoals();
    renderSpaceSwitcher();
    renderWeeks();
    renderCharts();
    autosaveStatus.textContent = "更改会自动保存";
    autosaveStatus.classList.remove("is-saved");
    showToast("记录已清空，可以重新开始啦");
  }

  function hydrateProfileForm() {
    for (const [key, value] of Object.entries(state.profile)) {
      const input = profileForm.elements.namedItem(key);
      if (input) input.value = value;
    }
  }

  function renderProfileAvatar() {
    const avatar = safeSticker(state.profile.avatar);
    if (avatar) {
      avatarPreview.src = assetUrl(avatar);
      avatarPreview.hidden = false;
      avatarPlaceholder.hidden = true;
      return;
    }

    avatarPreview.hidden = true;
    avatarPreview.removeAttribute("src");
    avatarPlaceholder.hidden = false;
    avatarPlaceholder.textContent = (state.profile.name.trim()[0] || "A").toUpperCase();
  }

  function renderGoals() {
    const goals = state.goals;
    if (!goals.some((goal) => goal.id === selectedGoalId)) selectedGoalId = goals[0]?.id || null;
    $("#goalLimitText").textContent = `${goals.length} / ${MAX_GOALS} 个倒计时`;
    $("#addGoalButton").disabled = goals.length >= MAX_GOALS;
    $("#editGoalButton").disabled = !selectedGoalId;
    $("#deleteGoalButton").disabled = !selectedGoalId;
    const selectedIndex = goals.findIndex((goal) => goal.id === selectedGoalId);
    $("#moveGoalEarlierButton").disabled = selectedIndex <= 0;
    $("#moveGoalLaterButton").disabled = selectedIndex < 0 || selectedIndex >= goals.length - 1;
    $("#goalEmpty").hidden = true;
    goalList.classList.toggle("goal-list--single", goals.length === 1);
    goalList.dataset.count = String(goals.length);
    goalList.innerHTML = goals.map((goal, index) => {
      const countdown = getGoalCountdown(goal.targetDate);
      const reportSpaceNames = goal.spaceIds
        .map((spaceId) => state.spaces.find((space) => space.id === spaceId)?.name)
        .filter(Boolean);
      return `
        <button class="goal-card goal-card--tone-${index % 4} goal-card--${countdown.state}${goal.id === selectedGoalId ? " is-selected" : ""}" type="button" data-select-goal="${escapeAttr(goal.id)}" aria-pressed="${goal.id === selectedGoalId}">
          <span class="goal-card-sticker${goal.sticker ? " has-sticker" : ""}" aria-hidden="true">
            ${goal.sticker ? `<img src="${escapeAttr(assetUrl(goal.sticker))}" alt="" loading="lazy" />` : "◎"}
          </span>
          <time class="goal-card-date" datetime="${escapeAttr(goal.targetDate)}">${escapeHtml(formatGoalDate(goal.targetDate))}</time>
          <span class="goal-card-copy">
            <strong>${escapeHtml(goal.title)}</strong>
            <small>${goal.note ? escapeHtml(goal.note) : "一步一步，慢慢靠近。"}</small>
            <em>${reportSpaceNames.length ? `周报 · ${escapeHtml(reportSpaceNames.join(" / "))}` : "仅在首页显示"}</em>
          </span>
          <span class="goal-card-countdown" aria-label="${escapeAttr(countdown.phrase)}">
            <b>${escapeHtml(countdown.value)}</b>
            <span>${escapeHtml(countdown.unit)}</span>
          </span>
        </button>`;
    }).join("");
    $$('[data-select-goal]', goalList).forEach((button) => {
      button.addEventListener("click", () => {
        selectGoalWithoutRerender(button.dataset.selectGoal);
      });
    });
    bindSnapSelection(goalList, "[data-select-goal]", () => selectedGoalId, (id) => {
      selectGoalWithoutRerender(id);
    });
    revealSelectedCard(goalList, `[data-select-goal="${escapeSelectorValue(selectedGoalId)}"]`);
  }

  function selectGoalWithoutRerender(goalId) {
    if (!state.goals.some((goal) => goal.id === goalId)) return;
    selectedGoalId = goalId;
    $$('[data-select-goal]', goalList).forEach((button) => {
      const selected = button.dataset.selectGoal === goalId;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    const selectedIndex = state.goals.findIndex((goal) => goal.id === selectedGoalId);
    $("#editGoalButton").disabled = selectedIndex < 0;
    $("#deleteGoalButton").disabled = selectedIndex < 0;
    $("#moveGoalEarlierButton").disabled = selectedIndex <= 0;
    $("#moveGoalLaterButton").disabled = selectedIndex < 0 || selectedIndex >= state.goals.length - 1;
  }

  function renderGoalSpaceOptions(selectedSpaceIds) {
    const selected = new Set(Array.isArray(selectedSpaceIds) ? selectedSpaceIds : []);
    $("#goalSpaceOptions").innerHTML = state.spaces.length ? state.spaces.map((space) => `
      <label class="goal-space-option">
        <input type="checkbox" name="spaceIds" value="${escapeAttr(space.id)}"${selected.has(space.id) ? " checked" : ""} />
        <span class="goal-space-option-icon${space.iconSticker ? " has-sticker" : ""}" aria-hidden="true">
          ${space.iconSticker ? `<img src="${escapeAttr(assetUrl(space.iconSticker))}" alt="" />` : escapeHtml(space.icon)}
        </span>
        <strong>${escapeHtml(space.name)}</strong>
        <small>显示在周报</small>
      </label>
    `).join("") : `<p class="goal-space-options-empty">目前没有空间；保存后，这个倒计时只会显示在首页。</p>`;
  }

  function renderProgressGoals() {
    const goals = state.progressGoals;
    if (!goals.some((goal) => goal.id === selectedProgressGoalId)) selectedProgressGoalId = goals[0]?.id || null;
    $("#progressGoalLimitText").textContent = `${goals.length} / ${MAX_PROGRESS_GOALS} 个进度目标`;
    $("#addProgressGoalButton").disabled = goals.length >= MAX_PROGRESS_GOALS;
    $("#editProgressGoalButton").disabled = !selectedProgressGoalId;
    $("#deleteProgressGoalButton").disabled = !selectedProgressGoalId;
    const selectedIndex = goals.findIndex((goal) => goal.id === selectedProgressGoalId);
    $("#moveProgressGoalEarlierButton").disabled = selectedIndex <= 0;
    $("#moveProgressGoalLaterButton").disabled = selectedIndex < 0 || selectedIndex >= goals.length - 1;
    $("#progressGoalEmpty").hidden = true;
    progressGoalList.classList.toggle("progress-goal-list--single", goals.length === 1);
    progressGoalList.dataset.count = String(goals.length);
    progressGoalList.innerHTML = goals.map((goal, index) => {
      const percent = Math.min(100, Math.max(0, goal.current / goal.target * 100));
      const isComplete = goal.current >= goal.target;
      const lastUpdate = goal.updates.at(-1);
      const reportSpaceNames = goal.spaceIds
        .map((spaceId) => state.spaces.find((space) => space.id === spaceId)?.name)
        .filter(Boolean);
      return `
        <article class="progress-goal-card progress-goal-card--tone-${index % 4}${goal.id === selectedProgressGoalId ? " is-selected" : ""}${isComplete ? " is-complete" : ""}" style="--progress:${percent}%">
          <button class="progress-goal-main" type="button" data-select-progress-goal="${escapeAttr(goal.id)}" aria-pressed="${goal.id === selectedProgressGoalId}">
            <span class="progress-goal-sticker${goal.sticker ? " has-sticker" : ""}" aria-hidden="true">
              ${goal.sticker ? `<img src="${escapeAttr(assetUrl(goal.sticker))}" alt="" loading="lazy" />` : "↗"}
            </span>
            <span class="progress-goal-copy">
              <small>${isComplete ? "目标达成" : `完成 ${formatProgressNumber(percent)}%`}</small>
              <strong>${escapeHtml(goal.title)}</strong>
              <em>${escapeHtml(goal.note || "每一次增加，都会留在这里。")}</em>
              <span>${reportSpaceNames.length ? `周报 · ${escapeHtml(reportSpaceNames.join(" / "))}` : "仅在首页显示"}</span>
            </span>
            <span class="progress-goal-value"><b>${escapeHtml(formatProgressNumber(goal.current))}</b><i>/ ${escapeHtml(formatProgressNumber(goal.target))} ${escapeHtml(goal.unit)}</i></span>
            <span class="progress-goal-bar" aria-label="完成 ${escapeAttr(formatProgressNumber(percent))}%"><i></i><b>${escapeHtml(formatProgressNumber(percent))}%</b></span>
          </button>
          <form class="progress-goal-add" data-add-progress="${escapeAttr(goal.id)}">
            <label><span>本次调整</span><input name="amount" type="number" min="-1000000000" max="1000000000" step="any" value="${escapeAttr(formatProgressInput(goal.defaultIncrement))}" aria-label="调整${escapeAttr(goal.title)}的进度；负数表示减少" /></label>
            <button type="submit">确认调整</button>
            <small>${lastUpdate ? `最近调整 ${lastUpdate.amount > 0 ? "+" : ""}${escapeHtml(formatProgressNumber(lastUpdate.amount))} ${escapeHtml(goal.unit)} · ${escapeHtml(formatProgressUpdateTime(lastUpdate.createdAt))}` : "还没有调整过进度；输入负数可以减少"}</small>
          </form>
        </article>`;
    }).join("");

    $$('[data-select-progress-goal]', progressGoalList).forEach((button) => {
      button.addEventListener("click", () => {
        selectProgressGoalWithoutRerender(button.dataset.selectProgressGoal);
      });
    });
    $$('[data-add-progress]', progressGoalList).forEach((form) => {
      form.addEventListener("submit", addProgressFromCard);
    });
    bindSnapSelection(progressGoalList, "[data-select-progress-goal]", () => selectedProgressGoalId, (id) => {
      selectProgressGoalWithoutRerender(id);
    });
    revealSelectedCard(progressGoalList, `[data-select-progress-goal="${escapeSelectorValue(selectedProgressGoalId)}"]`);
  }

  function selectProgressGoalWithoutRerender(goalId) {
    if (!state.progressGoals.some((goal) => goal.id === goalId)) return;
    selectedProgressGoalId = goalId;
    $$('[data-select-progress-goal]', progressGoalList).forEach((button) => {
      const selected = button.dataset.selectProgressGoal === goalId;
      button.setAttribute("aria-pressed", String(selected));
      button.closest(".progress-goal-card")?.classList.toggle("is-selected", selected);
    });
    const selectedIndex = state.progressGoals.findIndex((goal) => goal.id === selectedProgressGoalId);
    $("#editProgressGoalButton").disabled = selectedIndex < 0;
    $("#deleteProgressGoalButton").disabled = selectedIndex < 0;
    $("#moveProgressGoalEarlierButton").disabled = selectedIndex <= 0;
    $("#moveProgressGoalLaterButton").disabled = selectedIndex < 0 || selectedIndex >= state.progressGoals.length - 1;
  }

  function escapeSelectorValue(value) {
    return globalThis.CSS?.escape ? CSS.escape(String(value || "")) : String(value || "").replaceAll('"', '\\"');
  }

  function revealSelectedCard(container, selector) {
    if (!window.matchMedia("(max-width: 900px)").matches || !selector) return;
    window.requestAnimationFrame(() => {
      const card = container.querySelector(selector);
      if (!card || container.clientWidth <= 0) return;
      const left = card.offsetLeft - (container.clientWidth - card.offsetWidth) / 2;
      container.scrollTo({ left: Math.max(0, left), behavior: "auto" });
    });
  }

  function bindSnapSelection(container, selector, getSelectedId, selectId) {
    if (!window.matchMedia("(max-width: 900px)").matches || container.dataset.snapSelectionBound === "true") return;
    container.dataset.snapSelectionBound = "true";
    let timer = null;
    const syncSelection = () => {
      const cards = $$(selector, container);
      if (cards.length < 2) return;
      const center = container.getBoundingClientRect().left + container.clientWidth / 2;
      const nearest = cards.reduce((best, card) => {
        const rect = card.getBoundingClientRect();
        const distance = Math.abs(rect.left + rect.width / 2 - center);
        return !best || distance < best.distance ? { card, distance } : best;
      }, null)?.card;
      const id = nearest?.dataset.selectGoal || nearest?.dataset.selectProgressGoal;
      if (id && id !== getSelectedId()) selectId(id);
    };
    container.addEventListener("scroll", () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(syncSelection, 120);
    }, { passive: true });
  }

  function renderProgressGoalSpaceOptions(selectedSpaceIds) {
    const selected = new Set(Array.isArray(selectedSpaceIds) ? selectedSpaceIds : []);
    $("#progressGoalSpaceOptions").innerHTML = state.spaces.length ? state.spaces.map((space) => `
      <label class="goal-space-option">
        <input type="checkbox" name="spaceIds" value="${escapeAttr(space.id)}"${selected.has(space.id) ? " checked" : ""} />
        <span class="goal-space-option-icon${space.iconSticker ? " has-sticker" : ""}" aria-hidden="true">
          ${space.iconSticker ? `<img src="${escapeAttr(assetUrl(space.iconSticker))}" alt="" />` : escapeHtml(space.icon)}
        </span>
        <strong>${escapeHtml(space.name)}</strong>
        <small>显示在周报</small>
      </label>
    `).join("") : `<p class="goal-space-options-empty">目前没有空间；保存后，这个进度目标只会显示在首页。</p>`;
  }

  function openProgressGoalDialog(goalId = null) {
    const goal = goalId ? state.progressGoals.find((item) => item.id === goalId) : null;
    if (!goal && state.progressGoals.length >= MAX_PROGRESS_GOALS) {
      showToast(`最多保留 ${MAX_PROGRESS_GOALS} 个进度目标`);
      return;
    }
    editingProgressGoalId = goal?.id || null;
    pendingProgressGoalSticker = safeSticker(goal?.sticker);
    const matchedPack = Object.entries(STICKER_PACKS).find(([, paths]) => paths.includes(pendingProgressGoalSticker));
    if (matchedPack) activeProgressGoalStickerPack = matchedPack[0];
    progressGoalForm.reset();
    progressGoalForm.elements.title.value = goal?.title || "";
    progressGoalForm.elements.target.value = goal ? formatProgressInput(goal.target) : "";
    progressGoalForm.elements.unit.value = goal?.unit || "";
    progressGoalForm.elements.current.value = goal ? formatProgressInput(goal.current) : "0";
    progressGoalForm.elements.defaultIncrement.value = goal ? formatProgressInput(goal.defaultIncrement) : "";
    progressGoalForm.elements.note.value = goal?.note || "";
    renderProgressGoalSpaceOptions(goal ? goal.spaceIds : []);
    $("#progressGoalDialogEyebrow").textContent = goal ? "EDIT PROGRESS" : "NEW PROGRESS";
    $("#progressGoalDialogTitle").textContent = goal ? `编辑“${goal.title}”` : "新建进度目标";
    $("#saveProgressGoalButton").textContent = goal ? "保存修改" : "保存进度目标";
    $("#progressGoalStickerPicker").open = false;
    renderProgressGoalStickerPicker();
    progressGoalDialog.showModal();
    focusDialogFieldWithoutScrolling(progressGoalForm, progressGoalForm.elements.title);
  }

  function saveProgressGoalFromDialog(event) {
    event.preventDefault();
    if (!progressGoalForm.reportValidity()) return;
    const formData = new FormData(progressGoalForm);
    const existing = editingProgressGoalId ? state.progressGoals.find((item) => item.id === editingProgressGoalId) : null;
    if (!existing && state.progressGoals.length >= MAX_PROGRESS_GOALS) return;
    const selectedSpaceIds = formData.getAll("spaceIds").map((spaceId) => String(spaceId));
    const goal = normalizeProgressGoal({
      id: existing?.id,
      title: formData.get("title"),
      target: formData.get("target"),
      current: formData.get("current"),
      unit: formData.get("unit"),
      defaultIncrement: formData.get("defaultIncrement"),
      note: formData.get("note"),
      sticker: pendingProgressGoalSticker,
      spaceIds: selectedSpaceIds,
      updates: existing?.updates || [],
      createdAt: existing?.createdAt,
    }, state.spaces);
    if (!goal) {
      showToast("请填写有效的目标名称和数值");
      return;
    }
    preloadCanvasAsset(goal.sticker);
    if (existing) state.progressGoals[state.progressGoals.indexOf(existing)] = goal;
    else state.progressGoals.push(goal);
    selectedProgressGoalId = goal.id;
    progressGoalDialog.close();
    editingProgressGoalId = null;
    saveState();
    renderProgressGoals();
    showToast(existing ? "进度目标已经更新" : "新的进度目标已经建立");
  }

  function renderProgressGoalStickerPicker() {
    if (!progressGoalStickerTabs || !progressGoalStickerGrid) return;
    const preview = $("#progressGoalStickerPreview");
    preview.innerHTML = pendingProgressGoalSticker
      ? `<img src="${escapeAttr(assetUrl(pendingProgressGoalSticker))}" alt="选中的进度目标表情" />`
      : "<span>—</span>";
    if (!$("#progressGoalStickerPicker").open) {
      progressGoalStickerTabs.innerHTML = "";
      progressGoalStickerGrid.innerHTML = "";
      return;
    }
    progressGoalStickerTabs.innerHTML = Object.keys(STICKER_PACKS).map((name) => `
      <button class="sticker-tab${name === activeProgressGoalStickerPack ? " is-active" : ""}" type="button" role="tab" aria-selected="${name === activeProgressGoalStickerPack}" data-progress-goal-sticker-pack="${name}">${name}</button>
    `).join("");
    $$('[data-progress-goal-sticker-pack]', progressGoalStickerTabs).forEach((button) => {
      button.addEventListener("click", () => {
        activeProgressGoalStickerPack = button.dataset.progressGoalStickerPack;
        renderProgressGoalStickerPicker();
      });
    });
    const stickers = STICKER_PACKS[activeProgressGoalStickerPack] || [];
    progressGoalStickerGrid.innerHTML = `
      <button class="sticker-item sticker-item--blank${pendingProgressGoalSticker ? "" : " is-selected"}" type="button" data-progress-goal-sticker="" aria-label="留空"><span>留空</span></button>
    ` + stickers.map((path, index) => `
      <button class="sticker-item${pendingProgressGoalSticker === path ? " is-selected" : ""}" type="button" data-progress-goal-sticker="${escapeAttr(path)}" aria-label="选择${activeProgressGoalStickerPack}进度目标表情 ${index + 1}">
        <img src="${escapeAttr(assetUrl(path))}" alt="" loading="lazy" />
      </button>
    `).join("");
    $$('[data-progress-goal-sticker]', progressGoalStickerGrid).forEach((button) => {
      button.addEventListener("click", () => {
        pendingProgressGoalSticker = safeSticker(button.dataset.progressGoalSticker);
        renderProgressGoalStickerPicker();
      });
    });
  }

  function addProgressFromCard(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const goal = state.progressGoals.find((item) => item.id === form.dataset.addProgress);
    const amount = Number(new FormData(form).get("amount"));
    if (!goal || !Number.isFinite(amount) || amount === 0) {
      showToast("本次调整不能为 0；减少进度请填写负数");
      return;
    }
    goal.current = Math.max(0, Math.min(1_000_000_000, goal.current + amount));
    goal.defaultIncrement = amount;
    goal.updates.push({ id: makeId(), amount, createdAt: Date.now() });
    goal.updates = goal.updates.slice(-100);
    selectedProgressGoalId = goal.id;
    saveState(false);
    renderProgressGoals();
    showToast(goal.current >= goal.target
      ? `${goal.title}已经达到目标`
      : `已${amount > 0 ? "增加" : "减少"} ${formatProgressNumber(Math.abs(amount))} ${goal.unit}`);
  }

  function deleteSelectedProgressGoal() {
    const goal = state.progressGoals.find((item) => item.id === selectedProgressGoalId);
    if (!goal) return;
    if (!window.confirm(`确定删除进度目标“${goal.title}”吗？\n\n已添加的进度记录也会一起删除。`)) return;
    state.progressGoals = state.progressGoals.filter((item) => item.id !== goal.id);
    selectedProgressGoalId = state.progressGoals[0]?.id || null;
    saveState();
    renderProgressGoals();
    showToast("进度目标已删除");
  }

  function moveSelectedProgressGoal(direction) {
    moveSelectedMilestone("progressGoals", selectedProgressGoalId, direction, "进度目标");
  }

  function openGoalDialog(goalId = null) {
    const goal = goalId ? state.goals.find((item) => item.id === goalId) : null;
    if (!goal && state.goals.length >= MAX_GOALS) {
      showToast(`最多保留 ${MAX_GOALS} 个倒计时`);
      return;
    }
    editingGoalId = goal?.id || null;
    pendingGoalSticker = safeSticker(goal?.sticker);
    const matchedPack = Object.entries(STICKER_PACKS).find(([, paths]) => paths.includes(pendingGoalSticker));
    if (matchedPack) activeGoalStickerPack = matchedPack[0];
    goalForm.reset();
    goalForm.elements.title.value = goal?.title || "";
    goalForm.elements.targetDate.value = goal?.targetDate || addDaysIso(todayIso(), 30);
    goalForm.elements.note.value = goal?.note || "";
    renderGoalSpaceOptions(goal ? goal.spaceIds : []);
    $("#goalDialogEyebrow").textContent = goal ? "EDIT COUNTDOWN" : "NEW COUNTDOWN";
    $("#goalDialogTitle").textContent = goal ? `编辑“${goal.title}”` : "新建倒计时";
    $("#saveGoalButton").textContent = goal ? "保存修改" : "保存倒计时";
    $("#goalStickerPicker").open = false;
    renderGoalStickerPicker();
    goalDialog.showModal();
    focusDialogFieldWithoutScrolling(goalForm, goalForm.elements.title);
  }

  function saveGoalFromDialog(event) {
    event.preventDefault();
    if (!goalForm.reportValidity()) return;
    const formData = new FormData(goalForm);
    const existing = editingGoalId ? state.goals.find((item) => item.id === editingGoalId) : null;
    if (!existing && state.goals.length >= MAX_GOALS) return;
    const selectedSpaceIds = formData.getAll("spaceIds").map((spaceId) => String(spaceId));
    const goal = normalizeGoal({
      id: existing?.id,
      title: formData.get("title"),
      targetDate: formData.get("targetDate"),
      note: formData.get("note"),
      sticker: pendingGoalSticker,
      spaceIds: selectedSpaceIds,
      createdAt: existing?.createdAt,
    }, state.spaces);
    if (!goal) {
      showToast("请填写倒计时名称和有效日期");
      return;
    }
    preloadCanvasAsset(goal.sticker);
    if (existing) state.goals[state.goals.indexOf(existing)] = goal;
    else state.goals.push(goal);
    selectedGoalId = goal.id;
    goalDialog.close();
    editingGoalId = null;
    saveState();
    renderGoals();
    showToast(existing ? "倒计时已经更新" : "新的倒计时已经建立");
  }

  function deleteSelectedGoal() {
    const goal = state.goals.find((item) => item.id === selectedGoalId);
    if (!goal) return;
    if (!window.confirm(`确定删除倒计时“${goal.title}”吗？\n\n空间、日程和周报记录不会受到影响。`)) return;
    state.goals = state.goals.filter((item) => item.id !== goal.id);
    selectedGoalId = state.goals[0]?.id || null;
    saveState();
    renderGoals();
    showToast("倒计时已删除，其他记录保持不变");
  }

  function moveSelectedGoal(direction) {
    moveSelectedMilestone("goals", selectedGoalId, direction, "倒计时");
  }

  function moveSelectedMilestone(collectionName, selectedId, direction, label) {
    const collection = state[collectionName];
    const index = collection.findIndex((item) => item.id === selectedId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= collection.length) return;
    [collection[index], collection[target]] = [collection[target], collection[index]];
    saveState(false);
    renderGoals();
    renderProgressGoals();
    showToast(`${label}已${direction < 0 ? "向前" : "向后"}移动`);
  }

  function renderGoalStickerPicker() {
    if (!goalStickerTabs || !goalStickerGrid) return;
    const preview = $("#goalStickerPreview");
    preview.innerHTML = pendingGoalSticker
      ? `<img src="${escapeAttr(assetUrl(pendingGoalSticker))}" alt="选中的倒计时表情" />`
      : "<span>—</span>";
    if (!$("#goalStickerPicker").open) {
      goalStickerTabs.innerHTML = "";
      goalStickerGrid.innerHTML = "";
      return;
    }
    goalStickerTabs.innerHTML = Object.keys(STICKER_PACKS).map((name) => `
      <button class="sticker-tab${name === activeGoalStickerPack ? " is-active" : ""}" type="button" role="tab" aria-selected="${name === activeGoalStickerPack}" data-goal-sticker-pack="${name}">${name}</button>
    `).join("");
    $$('[data-goal-sticker-pack]', goalStickerTabs).forEach((button) => {
      button.addEventListener("click", () => {
        activeGoalStickerPack = button.dataset.goalStickerPack;
        renderGoalStickerPicker();
      });
    });
    const stickers = STICKER_PACKS[activeGoalStickerPack] || [];
    goalStickerGrid.innerHTML = `
      <button class="sticker-item sticker-item--blank${pendingGoalSticker ? "" : " is-selected"}" type="button" data-goal-sticker="" aria-label="留空"><span>留空</span></button>
    ` + stickers.map((path, index) => `
      <button class="sticker-item${pendingGoalSticker === path ? " is-selected" : ""}" type="button" data-goal-sticker="${escapeAttr(path)}" aria-label="选择${activeGoalStickerPack}倒计时表情 ${index + 1}">
        <img src="${escapeAttr(assetUrl(path))}" alt="" loading="lazy" />
      </button>
    `).join("");
    $$('[data-goal-sticker]', goalStickerGrid).forEach((button) => {
      button.addEventListener("click", () => {
        pendingGoalSticker = safeSticker(button.dataset.goalSticker);
        renderGoalStickerPicker();
      });
    });
  }

  function safeSpaceId(value) {
    return safeSpaceIdForList(value, state.spaces);
  }

  function getSpace(spaceId = activeSpaceId) {
    return state.spaces.find((space) => space.id === safeSpaceId(spaceId));
  }

  function getSpaceTemplate(spaceId = activeSpaceId) {
    const space = getSpace(spaceId);
    if (!space) return { ...SPACE_TEMPLATES.custom, name: "生活", icon: "○", iconSticker: "", spaceId: "" };
    const template = SPACE_TEMPLATES[safeTemplateId(space.templateId)];
    return { ...template, name: space.name, icon: space.icon, iconSticker: safeSticker(space.iconSticker), spaceId: space.id };
  }

  function getActiveSpaceWeeks() {
    return state.weeks.filter((week) => week.spaceId === activeSpaceId);
  }

  function getActiveSpaceCharts() {
    return state.charts.filter((chart) => chart.spaceId === activeSpaceId);
  }

  function getActiveSpacePeriods() {
    return state.periods.filter((period) => period.spaceId === activeSpaceId);
  }

  function renderSpaceSwitcher() {
    if (!spaceSwitcher) return;
    const renderSpaceButton = (space, extraClass = "") => {
      const template = getSpaceTemplate(space.id);
      const periodCount = state.periods.filter((period) => period.spaceId === space.id).length;
      const isActive = space.id === activeSpaceId;
      const icon = template.iconSticker
        ? `<img src="${escapeAttr(assetUrl(template.iconSticker))}" alt="" />`
        : escapeHtml(template.icon);
      return `
        <div class="space-switcher-item${extraClass}">
          <button class="space-switcher-button${isActive ? " is-active" : ""}" type="button" data-space-id="${space.id}" aria-pressed="${isActive}">
            <span class="space-switcher-icon${template.iconSticker ? " has-sticker" : ""}" aria-hidden="true">${icon}</span>
            <span><strong>${escapeHtml(template.name)}</strong><small>${periodCount ? `${periodCount} 个月份` : "从这里开始"}</small></span>
          </button>
        </div>`;
    };
    spaceSwitcher.innerHTML = state.spaces.length ? `
      <div class="space-switcher-mobile" data-space-rail aria-label="左右滑动切换日程空间">
        ${state.spaces.map((space) => renderSpaceButton(space, space.id === activeSpaceId ? " is-mobile-current" : "")).join("")}
      </div>
      <div class="space-switcher-desktop">${state.spaces.map((space) => renderSpaceButton(space)).join("")}</div>
    ` : `
      <div class="space-switcher-empty">
        <span aria-hidden="true">＋</span>
        <div><strong>现在没有空间</strong><small>首页倒计时和进度目标仍可单独使用；需要日程和周报时再新建空间。</small></div>
      </div>`;
    $$('[data-space-id]', spaceSwitcher).forEach((button) => {
      button.addEventListener("click", () => selectSpace(button.dataset.spaceId));
    });
    window.requestAnimationFrame(() => {
      const rail = $(".space-switcher-mobile", spaceSwitcher);
      const current = $(".is-mobile-current", rail);
      if (rail && current) rail.scrollTo({ left: Math.max(0, current.offsetLeft - (rail.clientWidth - current.clientWidth) / 2), behavior: "smooth" });
    });
    const chartSpaceSwitcher = $("#chartSpaceSwitcher");
    if (chartSpaceSwitcher) {
      chartSpaceSwitcher.innerHTML = state.spaces.length ? `
        <span>当前空间</span>
        <div>${state.spaces.map((space) => {
          const template = getSpaceTemplate(space.id);
          const icon = template.iconSticker
            ? `<img src="${escapeAttr(assetUrl(template.iconSticker))}" alt="" />`
            : escapeHtml(template.icon);
          return `<button type="button" data-chart-space-id="${space.id}" aria-pressed="${space.id === activeSpaceId}" class="${space.id === activeSpaceId ? "is-active" : ""}"><i>${icon}</i>${escapeHtml(space.name)}</button>`;
        }).join("")}</div>` : "";
      $$('[data-chart-space-id]', chartSpaceSwitcher).forEach((button) => button.addEventListener("click", () => selectSpace(button.dataset.chartSpaceId)));
    }
    $("#spaceLimitText").textContent = `${state.spaces.length} / ${MAX_SPACES} 个空间`;
    $("#addSpaceButton").disabled = state.spaces.length >= MAX_SPACES;
    $("#editSpaceButton").disabled = !getSpace();
    $("#deleteSpaceButton").disabled = !getSpace();
    syncSpaceCopy();
  }

  function selectAdjacentSpace(direction) {
    const currentIndex = state.spaces.findIndex((space) => space.id === activeSpaceId);
    const nextIndex = Math.max(0, Math.min(state.spaces.length - 1, currentIndex + direction));
    if (nextIndex === currentIndex || !state.spaces[nextIndex]) return;
    selectSpace(state.spaces[nextIndex].id);
  }

  function bindSpaceSwipe() {
    const surface = $("[data-space-swipe]", spaceSwitcher);
    if (!surface) return;
    let startX = null;
    let startY = null;
    surface.addEventListener("touchstart", (event) => {
      startX = event.touches[0]?.clientX ?? null;
      startY = event.touches[0]?.clientY ?? null;
    }, { passive: true });
    surface.addEventListener("touchend", (event) => {
      if (startX === null || startY === null) return;
      const touch = event.changedTouches[0];
      const deltaX = (touch?.clientX ?? startX) - startX;
      const deltaY = (touch?.clientY ?? startY) - startY;
      startX = null;
      startY = null;
      if (Math.abs(deltaX) < 44 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
      selectAdjacentSpace(deltaX < 0 ? 1 : -1);
    }, { passive: true });
  }

  function selectSpace(spaceId) {
    const nextSpaceId = safeSpaceId(spaceId);
    if (!nextSpaceId) return;
    if (nextSpaceId === activeSpaceId) return;
    activeSpaceId = nextSpaceId;
    state.activeSpaceId = activeSpaceId;
    const weeks = getActiveSpaceWeeks();
    const periods = getActiveSpacePeriods();
    selectedWeekId = pickRelevantWeek(weeks)?.id || null;
    weekYearFilter = periods.at(-1)?.yearMonth.slice(0, 4) || String(new Date().getFullYear());
    weekMonthFilter = periods.at(-1)?.yearMonth.slice(5, 7) || String(new Date().getMonth() + 1).padStart(2, "0");
    saveState(false);
    renderSpaceSwitcher();
    renderWeeks();
    renderCharts();
  }

  function syncSpaceCopy() {
    const hasSpace = Boolean(getSpace());
    const template = getSpaceTemplate();
    $("#weeklyEyebrow").textContent = "WEEKLY SOUL PLAN";
    $("#weeklyTitle").textContent = hasSpace ? `一个魂的${getSpace().name}打卡` : "建立空间后，再开始安排日程";
    $("#chartsEyebrow").textContent = hasSpace ? template.chartEyebrow : "一个魂的状态轨迹";
    $("#chartsTitle").textContent = hasSpace ? template.chartHeading : "建立空间后，再记录一条轨迹";
    $(".week-empty h3").textContent = hasSpace ? "先建立一个年月吧" : "先建立一个空间吧";
    $(".empty-state h3").textContent = hasSpace ? "从第一条轨迹开始吧" : "先建立一个空间吧";
    $("#emptyChartExample").textContent = hasSpace ? template.emptyChartExample : "曲线图会跟随空间独立保存；建立空间后即可开始记录。";
    $("#weekEmptyDescription").textContent = hasSpace
      ? `新建年月后，会自动展开当月所有从周一开始的周条。`
      : "日程和周报会跟随空间独立保存；建立空间后即可新建年月。";
    const activeTemplateId = getSpace()?.templateId || "";
    $$('[data-preset-space]').forEach((button) => {
      button.hidden = button.dataset.presetSpace !== activeTemplateId;
    });
  }

  function openSpaceDialog(spaceId = null) {
    const editingSpace = spaceId ? state.spaces.find((space) => space.id === spaceId) : null;
    if (!editingSpace && state.spaces.length >= MAX_SPACES) {
      showToast(`最多保留 ${MAX_SPACES} 个空间`);
      return;
    }
    editingSpaceId = editingSpace?.id || null;
    spaceForm.reset();
    if (editingSpace) {
      spaceForm.elements.templateId.value = safeTemplateId(editingSpace.templateId);
      spaceForm.elements.name.value = editingSpace.name;
      spaceForm.elements.icon.value = editingSpace.icon;
      pendingSpaceIconSticker = safeSticker(editingSpace.iconSticker);
      const matchingPack = Object.entries(STICKER_PACKS).find(([, paths]) => paths.includes(pendingSpaceIconSticker));
      if (matchingPack) activeSpaceIconPack = matchingPack[0];
      $("#spaceDialogEyebrow").textContent = "EDIT LIFE SPACE";
      $("#spaceDialogTitle").textContent = `编辑“${editingSpace.name}”`;
      $("#saveSpaceButton").textContent = "保存修改";
    } else {
      spaceForm.elements.templateId.value = "custom";
      pendingSpaceIconSticker = "";
      $("#spaceDialogEyebrow").textContent = "NEW LIFE SPACE";
      $("#spaceDialogTitle").textContent = "新建一个空间";
      $("#saveSpaceButton").textContent = "建立空间";
      syncSpaceFormTemplate();
    }
    $("#spaceIconPicker").open = false;
    renderSpaceIconPicker();
    spaceDialog.showModal();
    focusDialogFieldWithoutScrolling(spaceForm, spaceForm.elements.name);
  }

  function syncSpaceFormTemplate() {
    const template = SPACE_TEMPLATES[safeTemplateId(spaceForm.elements.templateId.value)];
    spaceForm.elements.name.placeholder = `例如：${template.name === "自定义" ? "阅读计划、副业、早睡挑战" : template.name}`;
    spaceForm.elements.icon.value = template.icon;
    pendingSpaceIconSticker = "";
    renderSpaceIconPicker();
  }

  function renderSpaceIconPicker() {
    if (!spaceIconStickerTabs || !spaceIconStickerGrid) return;
    const preview = $("#spaceIconPreview");
    if (preview) {
      const symbol = safeString(spaceForm.elements.icon.value, 2) || SPACE_TEMPLATES[safeTemplateId(spaceForm.elements.templateId.value)].icon;
      preview.innerHTML = pendingSpaceIconSticker
        ? `<img src="${escapeAttr(assetUrl(pendingSpaceIconSticker))}" alt="选中的空间图标" />`
        : `<span>${escapeHtml(symbol)}</span>`;
    }
    if (!$("#spaceIconPicker").open) {
      spaceIconStickerTabs.innerHTML = "";
      spaceIconStickerGrid.innerHTML = "";
      return;
    }
    spaceIconStickerTabs.innerHTML = Object.keys(STICKER_PACKS).map((name) => `
      <button class="sticker-tab${name === activeSpaceIconPack ? " is-active" : ""}" type="button" role="tab" aria-selected="${name === activeSpaceIconPack}" data-space-icon-pack="${name}">${name}</button>
    `).join("");
    $$('[data-space-icon-pack]', spaceIconStickerTabs).forEach((button) => {
      button.addEventListener("click", () => {
        activeSpaceIconPack = button.dataset.spaceIconPack;
        renderSpaceIconPicker();
      });
    });
    const stickers = STICKER_PACKS[activeSpaceIconPack] || [];
    spaceIconStickerGrid.innerHTML = `
      <button class="sticker-item sticker-item--blank${pendingSpaceIconSticker ? "" : " is-selected"}" type="button" data-space-icon-sticker="" aria-label="留空，使用空间符号"><span>留空</span></button>
    ` + stickers.map((path, index) => `
      <button class="sticker-item${pendingSpaceIconSticker === path ? " is-selected" : ""}" type="button" data-space-icon-sticker="${escapeAttr(path)}" aria-label="选择${activeSpaceIconPack}表情 ${index + 1}">
        <img src="${escapeAttr(assetUrl(path))}" alt="" loading="lazy" />
      </button>
    `).join("");
    $$('[data-space-icon-sticker]', spaceIconStickerGrid).forEach((button) => {
      button.addEventListener("click", () => {
        pendingSpaceIconSticker = safeSticker(button.dataset.spaceIconSticker);
        renderSpaceIconPicker();
      });
    });
  }

  function saveSpaceFromDialog(event) {
    event.preventDefault();
    if (!spaceForm.reportValidity() || (!editingSpaceId && state.spaces.length >= MAX_SPACES)) return;
    const formData = new FormData(spaceForm);
    const templateId = safeTemplateId(formData.get("templateId"));
    const template = SPACE_TEMPLATES[templateId];
    const existing = editingSpaceId ? state.spaces.find((item) => item.id === editingSpaceId) : null;
    const space = {
      id: existing?.id || `space-${makeId()}`,
      type: templateId,
      templateId,
      name: safeString(formData.get("name"), 16) || template.name,
      icon: safeString(formData.get("icon"), 2) || template.icon,
      iconSticker: safeSticker(pendingSpaceIconSticker),
      aiContext: existing?.aiContext || normalizeAiContext(),
      createdAt: existing?.createdAt || Date.now(),
    };
    if (existing) state.spaces[state.spaces.indexOf(existing)] = space;
    else state.spaces.push(space);
    activeSpaceId = space.id;
    state.activeSpaceId = space.id;
    selectedWeekId = null;
    weekYearFilter = String(new Date().getFullYear());
    weekMonthFilter = String(new Date().getMonth() + 1).padStart(2, "0");
    saveState(false);
    spaceDialog.close();
    renderGoals();
    renderProgressGoals();
    renderSpaceSwitcher();
    renderWeeks();
    renderCharts();
    showToast(existing ? `“${space.name}”空间已更新` : `“${space.name}”空间已经建立`);
  }

  function deleteSpace(spaceId) {
    const space = state.spaces.find((item) => item.id === spaceId);
    if (!space) return;
    const periodCount = state.periods.filter((period) => period.spaceId === space.id).length;
    const chartCount = state.charts.filter((chart) => chart.spaceId === space.id).length;
    const lastSpaceNote = state.spaces.length === 1
      ? "\n\n这是最后一个空间；删除后首页倒计时和进度目标仍可使用，需要时可以重新新建空间。"
      : "";
    if (!window.confirm(`确定删除“${space.name}”空间吗？\n\n其中 ${periodCount} 个月份、全部每日记录和 ${chartCount} 张图表都会一起删除。${lastSpaceNote}`)) return;
    state.spaces = state.spaces.filter((item) => item.id !== space.id);
    state.periods = state.periods.filter((period) => period.spaceId !== space.id);
    state.weeks = state.weeks.filter((week) => week.spaceId !== space.id);
    state.charts = state.charts.filter((chart) => chart.spaceId !== space.id);
    state.goals = state.goals.map((goal) => {
      const spaceIds = goal.spaceIds.filter((goalSpaceId) => goalSpaceId !== space.id);
      return { ...goal, spaceIds };
    });
    state.progressGoals = state.progressGoals.map((goal) => {
      const spaceIds = goal.spaceIds.filter((goalSpaceId) => goalSpaceId !== space.id);
      return { ...goal, spaceIds };
    });
    if (activeSpaceId === space.id) {
      activeSpaceId = state.spaces[0]?.id || "";
      state.activeSpaceId = activeSpaceId;
    }
    const periods = getActiveSpacePeriods();
    weekYearFilter = periods.at(-1)?.yearMonth.slice(0, 4) || "";
    weekMonthFilter = periods.at(-1)?.yearMonth.slice(5, 7) || "";
    selectedWeekId = pickRelevantWeek(getActiveSpaceWeeks().filter((week) => week.startDate.startsWith(periods.at(-1)?.yearMonth || "-")))?.id || null;
    saveState(false);
    renderGoals();
    renderProgressGoals();
    renderSpaceSwitcher();
    renderWeeks();
    renderCharts();
    showToast(`“${space.name}”空间已删除`);
  }

  function findWeek(id) {
    return state.weeks.find((week) => week.id === id);
  }

  function openPeriodDialog() {
    if (!getSpace()) {
      showToast("请先新建一个空间");
      return;
    }
    weekForm.reset();
    $("#weekDialogTitle").textContent = `新建${getSpace().name}年月`;
    weekForm.elements.yearMonth.value = todayIso().slice(0, 7);
    weekDialog.showModal();
    focusDialogFieldWithoutScrolling(weekForm, weekForm.elements.yearMonth);
  }

  function savePeriodFromDialog(event) {
    event.preventDefault();
    if (!weekForm.reportValidity()) return;
    const yearMonth = safeString(new FormData(weekForm).get("yearMonth"), 7);
    if (!/^\d{4}-\d{2}$/.test(yearMonth)) return;
    const exists = state.periods.some((period) => period.spaceId === activeSpaceId && period.yearMonth === yearMonth);
    if (exists) {
      showToast("这个年月已经建立过啦");
      weekForm.elements.yearMonth.focus();
      return;
    }

    state.periods.push({ id: makeId(), spaceId: activeSpaceId, yearMonth, createdAt: Date.now() });
    getMonthMondays(yearMonth).forEach((startDate) => {
      const existsWeek = state.weeks.some((week) => week.spaceId === activeSpaceId && week.startDate === startDate);
      if (existsWeek) return;
      state.weeks.push(normalizeWeek({
        id: makeId(),
        spaceId: activeSpaceId,
        startDate,
        title: `${formatMonthDay(startDate)} 开始的一周`,
        goal: "",
        note: "",
        createdAt: Date.now(),
        days: [],
      }, state.spaces));
    });

    state.weeks.sort((a, b) => a.startDate.localeCompare(b.startDate));
    state.periods.sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
    weekYearFilter = yearMonth.slice(0, 4);
    weekMonthFilter = yearMonth.slice(5, 7);
    selectedWeekId = pickRelevantWeek(getActiveSpaceWeeks().filter((week) => week.startDate.startsWith(yearMonth)))?.id || null;
    saveState(false);
    weekDialog.close();
    renderSpaceSwitcher();
    renderWeeks();
    showToast(`${Number(weekMonthFilter)} 月的周一节点已经展开`);
  }

  function deleteSelectedPeriod() {
    const yearMonth = `${weekYearFilter}-${weekMonthFilter}`;
    const period = state.periods.find((item) => item.spaceId === activeSpaceId && item.yearMonth === yearMonth);
    if (!period) return;
    const label = `${weekYearFilter} 年 ${Number(weekMonthFilter)} 月`;
    if (!window.confirm(`确定删除“${getSpace().name}”里的 ${label} 吗？\n\n这个年月下所有安排、打卡状态和当天小记都会一起删除。`)) return;
    const removedWeekIds = state.weeks
      .filter((week) => week.spaceId === activeSpaceId && week.startDate.startsWith(yearMonth))
      .map((week) => week.id);
    state.periods = state.periods.filter((item) => item.id !== period.id);
    state.weeks = state.weeks.filter((week) => !(week.spaceId === activeSpaceId && week.startDate.startsWith(yearMonth)));
    removedWeekIds.forEach((id) => selectedDayByWeek.delete(id));
    const periods = getActiveSpacePeriods();
    const nextPeriod = periods.at(-1);
    weekYearFilter = nextPeriod?.yearMonth.slice(0, 4) || "";
    weekMonthFilter = nextPeriod?.yearMonth.slice(5, 7) || "";
    selectedWeekId = pickRelevantWeek(getActiveSpaceWeeks().filter((week) => week.startDate.startsWith(nextPeriod?.yearMonth || "-")))?.id || null;
    saveState(false);
    renderSpaceSwitcher();
    renderWeeks();
    showToast(`${label} 已删除`);
  }

  function shiftWeekScheduleByOneDay(weekId) {
    const week = findWeek(weekId);
    if (!week) return;
    const visibleDayId = weekDetail.querySelector("[data-inline-day]")?.dataset.inlineDay;
    const selectedDayId = visibleDayId || selectedDayByWeek.get(week.id) || week.days[0]?.id;
    selectedDayByWeek.set(week.id, selectedDayId);
    const startIndex = Math.max(0, week.days.findIndex((day) => day.id === selectedDayId));
    const startDayNumber = startIndex + 1;
    const lastDay = week.days[6];
    const hasLastDayData = lastDay && (
      lastDay.items.length || lastDay.focus ||
      lastDay.note || lastDay.status || lastDay.sticker || Number.isFinite(lastDay.weight)
    );
    const warning = hasLastDayData
      ? "原 Day7 已有内容，顺延后会被丢弃。"
      : "原 Day7 目前没有内容。";
    const movingRange = startIndex < 6
      ? `Day${startDayNumber} 到 Day6 的内容会移动到下一天；Day${startDayNumber} 会清空。`
      : "Day7 会移出本周并清空。";
    const preservedRange = startIndex === 0
      ? "Day1 之前没有需要保留的日程。"
      : startIndex === 1
        ? "Day1 保持不变。"
        : `Day1 到 Day${startIndex} 保持不变。`;
    if (!window.confirm(`确定从 Day${startDayNumber} 开始把日程往后排一天吗？\n\n${preservedRange}${movingRange}${warning}`)) return;
    const sourceDays = JSON.parse(JSON.stringify(week.days));
    const templateId = getSpace(week.spaceId).templateId;
    for (let index = 6; index > startIndex; index -= 1) {
      const identity = week.days[index];
      const moved = normalizeWeekDay(sourceDays[index - 1], index, week.startDate, templateId);
      moved.id = identity.id;
      moved.date = identity.date;
      week.days[index] = moved;
    }
    const startIdentity = week.days[startIndex];
    const emptyStartDay = normalizeWeekDay({}, startIndex, week.startDate, templateId);
    emptyStartDay.id = startIdentity.id;
    emptyStartDay.date = startIdentity.date;
    week.days[startIndex] = emptyStartDay;
    saveState(false);
    renderWeeks();
    showToast(`已从 Day${startDayNumber} 开始顺延一天，前面的日期保持不变`);
  }

  function renderWeeks() {
    const hasActiveSpace = Boolean(getSpace());
    const spaceWeeks = getActiveSpaceWeeks();
    renderWeekFilters();
    const filteredWeeks = spaceWeeks.filter((week) => {
      const [year, month] = week.startDate.split("-");
      return year === weekYearFilter && month === weekMonthFilter;
    });
    weekTimeline.dataset.count = String(filteredWeeks.length);
    $("#addWeekButton").disabled = !hasActiveSpace;
    $("#emptyAddWeekButton").disabled = !hasActiveSpace;
    $("#shiftWeekButton").hidden = true;
    $("#shiftWeekButton").disabled = filteredWeeks.length === 0;
    $("#showSelectedWeekReportButton").disabled = filteredWeeks.length === 0;
    if (!filteredWeeks.length) {
      $("#shiftWeekButton").textContent = "日程顺延一天";
      $("#shiftWeekButton").removeAttribute("title");
    }
    $("#deleteSelectedPeriodButton").disabled = !getActiveSpacePeriods().some((period) => period.yearMonth === `${weekYearFilter}-${weekMonthFilter}`);
    $("#importWeekButton").disabled = filteredWeeks.length === 0;
    weekEmpty.hidden = getActiveSpacePeriods().length > 0;
    weekDetail.hidden = getActiveSpacePeriods().length === 0 || filteredWeeks.length === 0;

    if (!getActiveSpacePeriods().length) {
      weekTimeline.innerHTML = "";
      weekDetail.innerHTML = "";
      selectedWeekId = null;
      return;
    }

    if (!filteredWeeks.length) {
      weekTimeline.innerHTML = `<p class="week-filter-empty">这个月份还没有周节点，换个月份看看吧。</p>`;
      weekDetail.innerHTML = "";
      return;
    }

    if (!filteredWeeks.some((week) => week.id === selectedWeekId)) selectedWeekId = pickRelevantWeek(filteredWeeks).id;
    weekTimeline.innerHTML = filteredWeeks.map((week) => {
      const monthIndex = filteredWeeks.findIndex((item) => item.id === week.id);
      const recorded = week.days.filter(hasWeekDayRecord).length;
      const isSelected = week.id === selectedWeekId;
      const endDate = addDaysIso(week.startDate, 6);
      const isCurrentWeek = todayIso() >= week.startDate && todayIso() <= endDate;
      const progress = Math.round(recorded / 7 * 100);
      const stateClass = recorded === 7 ? " is-complete" : recorded ? " has-records" : "";
      const badge = isSelected ? "正在查看" : isCurrentWeek ? "本周" : recorded === 7 ? "已记满" : "";
      return `
        <button class="week-node${isSelected ? " is-selected" : ""}${isCurrentWeek ? " is-current" : ""}${stateClass}" type="button" role="listitem" data-select-week="${week.id}" aria-pressed="${isSelected}">
          <span class="week-node-head"><span>WEEK ${String(monthIndex + 1).padStart(2, "0")}</span>${badge ? `<em>${badge}</em>` : ""}</span>
          <strong><time datetime="${escapeAttr(week.startDate)}">${escapeHtml(formatCompactDate(week.startDate))}</time><i>—</i><time datetime="${escapeAttr(endDate)}">${escapeHtml(formatCompactDate(endDate))}</time></strong>
          <span class="week-node-progress" aria-hidden="true"><i style="--week-progress:${progress}%"></i></span>
          <small>已记录 ${recorded} / 7 天</small>
        </button>`;
    }).join("");

    $$('[data-select-week]', weekTimeline).forEach((button) => {
      button.addEventListener("click", () => {
        selectedWeekId = button.dataset.selectWeek;
        renderWeeks();
      });
    });

    renderWeekDetail(findWeek(selectedWeekId));
  }

  function pickRelevantWeek(weeks) {
    if (!Array.isArray(weeks) || !weeks.length) return null;
    const today = todayIso();
    return weeks.find((week) => today >= week.startDate && today <= addDaysIso(week.startDate, 6))
      || [...weeks].reverse().find((week) => week.startDate <= today)
      || weeks[0];
  }

  function renderWeekFilters() {
    const periods = getActiveSpacePeriods();
    const years = [...new Set(periods.map((period) => period.yearMonth.slice(0, 4)))].sort();
    if (!years.includes(weekYearFilter)) weekYearFilter = years.at(-1) || "";
    const yearSelect = $("#weekYearSelect");
    yearSelect.disabled = !getSpace();
    yearSelect.innerHTML = years.map((year) => `<option value="${year}">${year} 年</option>`).join("");
    yearSelect.value = weekYearFilter;

    const months = [...new Set(periods
      .filter((period) => period.yearMonth.startsWith(`${weekYearFilter}-`))
      .map((period) => period.yearMonth.slice(5, 7)))].sort();
    if (!months.includes(weekMonthFilter)) weekMonthFilter = months.at(-1) || "";
    const monthSelect = $("#weekMonthSelect");
    monthSelect.disabled = !getSpace();
    monthSelect.innerHTML = months.map((month) => `<option value="${month}">${Number(month)} 月</option>`).join("");
    monthSelect.value = weekMonthFilter;
    const orderedPeriods = [...periods].sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
    const currentIndex = orderedPeriods.findIndex((period) => period.yearMonth === `${weekYearFilter}-${weekMonthFilter}`);
    $("#previousPeriodButton").disabled = currentIndex <= 0;
    $("#nextPeriodButton").disabled = currentIndex < 0 || currentIndex >= orderedPeriods.length - 1;
  }

  function selectAdjacentPeriod(direction) {
    const periods = [...getActiveSpacePeriods()].sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
    if (!periods.length) return;
    const currentKey = `${weekYearFilter}-${weekMonthFilter}`;
    const currentIndex = Math.max(0, periods.findIndex((period) => period.yearMonth === currentKey));
    const nextIndex = Math.max(0, Math.min(periods.length - 1, currentIndex + direction));
    if (nextIndex === currentIndex) return;
    [weekYearFilter, weekMonthFilter] = periods[nextIndex].yearMonth.split("-");
    selectedWeekId = null;
    renderWeeks();
  }

  function hasWeekDayRecord(day) {
    return day.recorded === true;
  }

  function weekItemStateMark(state) {
    return ({ done: "✓", changed: "⚡", missed: "×" })[state] || "·";
  }

  function weekItemStateLabel(state) {
    return ({ done: "完成", changed: "调整过计划", missed: "未完成" })[state] || "待记录";
  }

  function countWeekItemStates(week) {
    return week.days.reduce((counts, day) => {
      day.items.forEach((item) => {
        if (item.state === "done") counts.done += 1;
        else if (item.state === "changed") counts.changed += 1;
        else if (item.state === "missed") counts.missed += 1;
        else counts.pending += 1;
      });
      return counts;
    }, { done: 0, changed: 0, missed: 0, pending: 0 });
  }

  function renderWeekDetail(week) {
    if (!week) return;
    let selectedDayId = selectedDayByWeek.get(week.id);
    if (!week.days.some((day) => day.id === selectedDayId)) {
      const today = week.days.find((day) => day.date === todayIso());
      selectedDayId = (today || week.days[0]).id;
      selectedDayByWeek.set(week.id, selectedDayId);
    }
    const selectedDay = week.days.find((day) => day.id === selectedDayId);
    const selectedIndex = week.days.findIndex((day) => day.id === selectedDayId);
    $("#shiftWeekButton").textContent = `从 Day${selectedDay.dayNumber} 起顺延一天`;
    $("#shiftWeekButton").title = selectedDay.dayNumber === 1
      ? "从本周第一天开始顺延"
      : `Day1 到 Day${selectedDay.dayNumber - 1} 保持不变`;
    weekDetail.innerHTML = `
      <article class="week-board">
        <div class="week-day-stepper" aria-label="切换当天">
          <button type="button" data-week-day-step="-1" aria-label="前一天"${selectedIndex === 0 ? " disabled" : ""}>←</button>
          <strong>Day ${selectedDay.dayNumber} <small>/ 7 · ${escapeHtml(formatCompactDate(selectedDay.date))}</small></strong>
          <button type="button" data-week-day-step="1" aria-label="后一天"${selectedIndex === week.days.length - 1 ? " disabled" : ""}>→</button>
        </div>
        ${renderWeekDayEditor(week, selectedDay)}
      </article>`;
    $$('[data-week-day-step]', weekDetail).forEach((button) => {
      button.addEventListener("click", () => selectAdjacentWeekDay(week, Number(button.dataset.weekDayStep)));
    });
    bindInlineWeekDayEditor(week, selectedDay);
  }

  function selectAdjacentWeekDay(week, direction) {
    const currentId = selectedDayByWeek.get(week.id);
    const currentIndex = Math.max(0, week.days.findIndex((day) => day.id === currentId));
    const nextIndex = Math.max(0, Math.min(week.days.length - 1, currentIndex + direction));
    if (nextIndex === currentIndex) return;
    selectedDayByWeek.set(week.id, week.days[nextIndex].id);
    renderWeekDetail(week);
  }

  function bindWeekDaySwipe(week) {
    const surface = $("[data-week-day-swipe]", weekDetail);
    if (!surface) return;
    let startX = null;
    let startY = null;
    surface.addEventListener("touchstart", (event) => {
      const touch = event.touches[0];
      startX = touch?.clientX ?? null;
      startY = touch?.clientY ?? null;
    }, { passive: true });
    surface.addEventListener("touchend", (event) => {
      if (startX === null || startY === null) return;
      const touch = event.changedTouches[0];
      const deltaX = (touch?.clientX ?? startX) - startX;
      const deltaY = (touch?.clientY ?? startY) - startY;
      startX = null;
      startY = null;
      if (Math.abs(deltaX) < 44 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
      selectAdjacentWeekDay(week, deltaX < 0 ? 1 : -1);
    }, { passive: true });
  }

  function renderWeekDayTab(day, selected) {
    const statusClass = ({ "这期拉了": "missed", "还不错": "okay", "好好好": "great" })[day.status] || "pending";
    const sticker = safeSticker(day.sticker);
    return `
      <div class="week-day-tab week-day-tab--${statusClass}${selected ? " is-selected" : ""}">
        <button class="week-day-tab-select" type="button" role="tab" data-select-week-day="${day.id}" aria-selected="${selected}" aria-label="切换到 Day${day.dayNumber} ${escapeAttr(day.title)}">
          <span class="week-day-tab-copy">
            <strong>Day${day.dayNumber}</strong>
            <time datetime="${escapeAttr(day.date)}">${escapeHtml(formatCompactDate(day.date))}</time>
            <small>${escapeHtml(day.title)}</small>
          </span>
          <span class="week-day-tab-side">
            ${sticker ? `<img class="week-day-tab-sticker" src="${escapeAttr(assetUrl(sticker))}" alt="Day${day.dayNumber} 表情" />` : `<span class="week-day-tab-add" aria-hidden="true">＋</span>`}
            ${day.status || day.recorded ? `<em>${escapeHtml(day.status || "已记录")}</em>` : ""}
          </span>
        </button>
        <i aria-hidden="true"></i>
      </div>`;
  }

  function renderWeekDayEditor(week, day) {
    const template = getSpaceTemplate(week.spaceId);
    const statusClass = ({ "这期拉了": "missed", "还不错": "okay", "好好好": "great" })[day.status] || "pending";
    const rowCount = Math.max(day.items.length, 1);
    const rows = Array.from({ length: rowCount }, (_, index) => {
      const item = day.items[index] || {};
      const state = WEEK_ITEM_STATES.has(item.state) ? item.state : "";
      const stateMeta = {
        "": { mark: "○", label: "待记录" },
        done: { mark: "✓", label: "按计划完成" },
        changed: { mark: "⚡", label: "调整过计划" },
        missed: { mark: "×", label: "未完成" },
      }[state];
      return `
        <div class="week-item-row week-item-row--${state || "pending"}" data-week-item-index="${index}">
          <details class="week-item-state">
            <summary class="week-item-state-current" aria-label="第 ${index + 1} 项当前状态：${stateMeta.label}" title="${stateMeta.label}"><b>${stateMeta.mark}</b><span>${stateMeta.label}</span></summary>
            <div class="week-item-state-choices" aria-label="选择第 ${index + 1} 项状态">
              ${[["done", "✓", "完成"], ["changed", "⚡", "调整"], ["missed", "×", "未完成"]].map(([value, mark, label]) => `<button type="button" data-set-week-item-state="${value}" aria-pressed="${state === value}"><b>${mark}</b><span>${label}</span></button>`).join("")}
              <button type="button" data-set-week-item-state="" aria-pressed="${state === ""}"><b>○</b><span>清除</span></button>
            </div>
          </details>
          <input class="week-item-text" data-week-item-text maxlength="160" aria-label="第 ${index + 1} 项计划" placeholder="写下这项安排" value="${escapeAttr(item.text || "")}" />
          <button class="week-item-remove" type="button" data-remove-week-item="${index}" aria-label="删除第 ${index + 1} 项安排">×</button>
        </div>`;
    }).join("");

    const sticker = safeSticker(day.sticker);
    const statuses = [
      ["", "未设置"],
      ["这期拉了", "这期拉了"],
      ["还不错", "还不错"],
      ["好好好", "好好好"],
    ].map(([value, label]) => {
      const tone = value === "这期拉了" ? "missed" : value === "还不错" ? "okay" : value === "好好好" ? "great" : "pending";
      return `<button type="button" data-set-day-status="${value}" aria-pressed="${day.status === value}" class="week-day-status--${tone}${day.status === value ? " is-active" : ""}">${label}</button>`;
    }).join("");

    return `
      <section class="week-inline-day week-inline-day--${statusClass}" data-inline-week="${week.id}" data-inline-day="${day.id}">
        <header class="week-inline-day-head">
          <div class="week-day-identity">
            <span>DAY ${day.dayNumber} · ${escapeHtml(formatCompactDate(day.date))}</span>
            <input data-day-text-field="title" maxlength="20" aria-label="这一天的名称" value="${escapeAttr(day.title)}" />
          </div>
          <button class="week-day-sticker-button" type="button" data-pick-day-sticker aria-label="选择今天的表情">
            ${sticker ? `<img src="${escapeAttr(assetUrl(sticker))}" alt="今天的表情" />` : `<span aria-hidden="true">＋</span><small>选表情</small>`}
          </button>
          <div class="week-day-statuses" aria-label="今天完成得怎么样">${statuses}</div>
          <div class="week-day-primary-actions">
            <button class="week-record-today${day.recorded ? " is-recorded" : ""}" type="button" data-record-today aria-pressed="${day.recorded}">${day.recorded ? "✓ 今天已记录" : "记录今天"}</button>
            <button class="week-shift-day" type="button" data-shift-current-day>顺延一天</button>
          </div>
        </header>

        <div class="week-focus-field">
          <label><span>今日重点</span><input data-day-text-field="focus" maxlength="500" placeholder="今天最想推进的一件事" value="${escapeAttr(day.focus)}" /></label>
        </div>

        <div class="week-item-table">
          <div class="week-item-table-head"><strong>计划安排</strong><small>✓ 完成　⚡ 调整过　× 未完成</small></div>
          <div class="week-item-rows">${rows}</div>
          <button class="week-add-item" type="button" data-add-week-item>＋ 添加一项安排</button>
        </div>

        ${template.showWeight ? `<div class="week-paired-text week-weight-text">
          <label><span>今日体重</span><span class="week-weight-input"><input data-day-weight type="number" min="20" max="500" step="0.1" inputmode="decimal" aria-label="今日体重，单位斤" placeholder="例如：105" value="${day.weight === null ? "" : escapeAttr(day.weight)}" /><b>斤</b></span></label>
        </div>` : ""}

        <label class="week-inline-note">
          <span>当天小记</span>
          <textarea data-day-text-field="note" maxlength="600" placeholder="写下一句想留给今天的话">${escapeHtml(day.note)}</textarea>
        </label>
      </section>`;
  }

  function ensureWeekItem(day, index) {
    while (day.items.length <= index) day.items.push({ id: makeId(), text: "", state: "", legacyActual: "" });
    return day.items[index];
  }

  function bindInlineWeekDayEditor(week, day) {
    $$('[data-week-item-text]', weekDetail).forEach((input) => {
      input.addEventListener("input", () => {
        const row = input.closest('[data-week-item-index]');
        const item = ensureWeekItem(day, Number(row.dataset.weekItemIndex));
        item.text = safeString(input.value, 160);
        scheduleSave();
      });
    });

    $$('[data-set-week-item-state]', weekDetail).forEach((button) => {
      button.addEventListener("click", () => {
        const row = button.closest('[data-week-item-index]');
        const item = ensureWeekItem(day, Number(row.dataset.weekItemIndex));
        item.state = WEEK_ITEM_STATES.has(button.dataset.setWeekItemState) ? button.dataset.setWeekItemState : "";
        if (item.state) playWeekFeedback(item.state !== "missed");
        saveState(false);
        renderWeekDetail(week);
      });
    });

    $$('[data-day-text-field]', weekDetail).forEach((input) => {
      input.addEventListener("input", () => {
        const field = input.dataset.dayTextField;
        day[field] = safeString(input.value, field === "note" ? 600 : field === "title" ? 20 : 500);
        scheduleSave();
      });
      input.addEventListener("change", () => window.setTimeout(() => renderWeekDetail(week), 0));
    });

    const weightInput = $("[data-day-weight]", weekDetail);
    weightInput?.addEventListener("input", () => {
      day.weight = safeWeight(weightInput.value);
      scheduleSave();
    });
    weightInput?.addEventListener("change", () => {
      if (weightInput.value.trim() && day.weight === null) showToast("体重请填写 20–500 斤内的有效数字");
      saveState(false);
      renderWeekDetail(week);
    });

    $$('[data-remove-week-item]', weekDetail).forEach((button) => {
      button.addEventListener("click", () => {
        day.items.splice(Number(button.dataset.removeWeekItem), 1);
        saveState(false);
        renderWeekDetail(week);
      });
    });
    $("[data-add-week-item]", weekDetail).addEventListener("click", () => {
      if (day.items.length >= 24) {
        showToast("一天最多添加 24 项");
        return;
      }
      day.items.push({ id: makeId(), text: "", state: "", legacyActual: "" });
      saveState(false);
      renderWeekDetail(week);
      $$('[data-week-item-text]', weekDetail).at(-1)?.focus();
    });

    $("[data-record-today]", weekDetail)?.addEventListener("click", () => {
      day.recorded = !day.recorded;
      saveState(false);
      renderWeeks();
      showToast(day.recorded ? `Day${day.dayNumber} 已计入本周记录` : `Day${day.dayNumber} 已取消记录`);
    });
    $$('[data-set-day-status]', weekDetail).forEach((button) => {
      button.addEventListener("click", () => {
        day.status = ["这期拉了", "还不错", "好好好"].includes(button.dataset.setDayStatus) ? button.dataset.setDayStatus : "";
        if (day.status) playWeekFeedback(day.status !== "这期拉了");
        saveState(false);
        renderWeekDetail(week);
      });
    });
    $("[data-pick-day-sticker]", weekDetail)?.addEventListener("click", () => openWeekStickerPicker(week.id, day.id));
    $("[data-shift-current-day]", weekDetail)?.addEventListener("click", () => shiftWeekScheduleByOneDay(week.id));
  }

  function openWeekStickerPicker(weekId, dayId) {
    const week = findWeek(weekId);
    const day = week?.days.find((item) => item.id === dayId);
    if (!week || !day) return;
    openWeekStickerWeekId = weekId;
    openWeekStickerDayId = dayId;
    selectedWeekSticker = day.sticker || "";
    $("#weekStickerEyebrow").textContent = `DAY ${day.dayNumber} · ${formatCompactDate(day.date)}`;
    $("#weekStickerDialogTitle").textContent = `Day${day.dayNumber} 的表情`;
    renderWeekStickerTabs();
    renderWeekStickerGrid();
    weekStickerDialog.showModal();
  }

  function saveWeekSticker(event) {
    event.preventDefault();
    const week = findWeek(openWeekStickerWeekId);
    const day = week?.days.find((item) => item.id === openWeekStickerDayId);
    if (!week || !day) return;
    day.sticker = safeSticker(selectedWeekSticker);
    preloadCanvasAsset(day.sticker);
    saveState(false);
    weekStickerDialog.close();
    renderWeeks();
    showToast(`Day${day.dayNumber} 已经设置好啦`);
  }

  function clearWeekSticker() {
    selectedWeekSticker = "";
    renderWeekStickerGrid();
    showToast("已清除选择，保存后生效");
  }

  function renderWeekStickerTabs() {
    weekStickerTabs.innerHTML = Object.keys(STICKER_PACKS).map((name) => `
      <button class="sticker-tab${name === activeWeekStickerPack ? " is-active" : ""}" type="button" role="tab" aria-selected="${name === activeWeekStickerPack}" data-week-sticker-pack="${name}">${name}</button>
    `).join("");
    $$('[data-week-sticker-pack]', weekStickerTabs).forEach((button) => {
      button.addEventListener("click", () => {
        activeWeekStickerPack = button.dataset.weekStickerPack;
        renderWeekStickerTabs();
        renderWeekStickerGrid();
      });
    });
  }

  function renderWeekStickerGrid() {
    const stickers = STICKER_PACKS[activeWeekStickerPack] || [];
    weekStickerGrid.innerHTML = `
      <button class="sticker-item${selectedWeekSticker ? "" : " is-selected"}" type="button" data-week-sticker="" aria-label="留空"><span class="sticker-none">留空</span></button>
      ${stickers.map((path, index) => `
        <button class="sticker-item${selectedWeekSticker === path ? " is-selected" : ""}" type="button" data-week-sticker="${escapeAttr(path)}" aria-label="${activeWeekStickerPack}表情 ${index + 1}">
          <img src="${escapeAttr(path)}" alt="" loading="lazy" />
        </button>
      `).join("")}`;
    $$('[data-week-sticker]', weekStickerGrid).forEach((button) => {
      button.addEventListener("click", () => {
        selectedWeekSticker = safeSticker(button.dataset.weekSticker);
        renderWeekStickerGrid();
      });
    });
  }

  function openWeekImportDialog() {
    const week = findWeek(selectedWeekId);
    if (!week || week.spaceId !== activeSpaceId) {
      showToast("请先选择要规划的周条");
      return;
    }
    weekImportForm.reset();
    const context = getSpace().aiContext || normalizeAiContext();
    weekImportForm.elements.profile.value = getAiContextProfile(context);
    const template = getSpaceTemplate();
    weekImportForm.elements.profile.placeholder = template.aiContextExample;
    $("#weekImportDialogTitle").textContent = `AI 规划本周 · ${formatDateRange(week.startDate)}`;
    const previousWeek = findPreviousWeek(week);
    $("#aiPreviousWeekSummary").textContent = previousWeek
      ? `${formatDateRange(previousWeek.startDate)} · 已读取 ${previousWeek.days.filter(hasWeekDayRecord).length}/7 天真实记录`
      : "当前空间还没有更早一周；会明确告诉 AI 不要虚构历史记录。";
    weekImportDialog.showModal();
  }

  function getAiContextProfile(context) {
    const normalized = normalizeAiContext(context);
    if (normalized.profile) return normalized.profile;
    return [
      normalized.goal && `目标：${normalized.goal}`,
      normalized.current && `目前情况：${normalized.current}`,
      normalized.availability && `可投入时间：${normalized.availability}`,
      normalized.constraints && `限制与偏好：${normalized.constraints}`,
    ].filter(Boolean).join("\n");
  }

  function collectAiContext() {
    const formData = new FormData(weekImportForm);
    return normalizeAiContext({
      ...getSpace().aiContext,
      profile: formData.get("profile"),
    });
  }

  function findPreviousWeek(week) {
    if (!week) return null;
    return state.weeks
      .filter((item) => item.spaceId === week.spaceId && item.startDate < week.startDate)
      .sort((left, right) => left.startDate.localeCompare(right.startDate))
      .at(-1) || null;
  }

  function buildPreviousWeekSummary(week) {
    const previousWeek = findPreviousWeek(week);
    if (!previousWeek) return "这是当前空间最早的一周，提示词不会虚构历史完成情况。";
    const weekdays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
    const recordedDays = previousWeek.days.filter(hasWeekDayRecord).length;
    const stateCounts = countWeekItemStates(previousWeek);
    const details = previousWeek.days.map((day, index) => {
      if (!hasWeekDayRecord(day)) return "";
      const done = day.items.filter((item) => item.state === "done").length;
      const changed = day.items.filter((item) => item.state === "changed").length;
      const missed = day.items.filter((item) => item.state === "missed").length;
      const parts = [day.status || "已记录", `任务完成 ${done} 项${changed ? `、调整 ${changed} 项` : ""}${missed ? `、未完成 ${missed} 项` : ""}`];
      const taskDetails = day.items
        .filter((item) => item.text || item.state)
        .map((item, itemIndex) => `${item.text || `任务 ${itemIndex + 1}`}：${weekItemStateLabel(item.state)}`);
      if (taskDetails.length) parts.push(`明细：${taskDetails.join("；")}`);
      if (day.focus) parts.push(`${getSpaceTemplate(previousWeek.spaceId).firstFieldLabel}：${day.focus}`);
      if (Number.isFinite(day.weight)) parts.push(`体重：${day.weight} 斤`);
      return `${weekdays[index]}：${parts.join("；")}`;
    }).filter(Boolean);
    return [
      `上一周 ${formatDateRange(previousWeek.startDate)}，记录 ${recordedDays}/7 天，完成 ${stateCounts.done} 项，调整 ${stateCounts.changed} 项，未完成 ${stateCounts.missed} 项。`,
      ...(details.length ? details : ["这一周还没有打卡记录。"]),
    ].join("\n");
  }

  function buildAiPlanningPrompt(week) {
    if (!week) return "请先选择一条周计划。";
    const template = getSpaceTemplate(week.spaceId);
    const days = Array.from({ length: 7 }, (_, index) => [
      `【Day${index + 1}】${template.activeDayLabel}`,
      "【重点】",
      "【任务】写成一条清楚、可直接执行的安排",
    ].join("\n")).join("\n");
    return [
      `请为我制定“${getSpace(week.spaceId).name}”空间 ${formatDateRange(week.startDate)} 的可执行周计划。本周从周一开始，共 7 天。`,
      "请结合我刚才发给你的真实情况与上周记录控制任务量，宁可留出余量，也不要机械地把每天塞满。",
      "",
      `“重点”用于填写${template.firstFieldLabel}；“任务”每行一项，可以重复多行。没有任务的日子请写“【DayX】休息日”。当天小记由我本人记录，请不要生成、总结或修改。`,
      "请严格保留下方所有【】标记、日期和 Day 编号，只替换标记后面的内容。每项任务单独一行，不要添加解释、表格、代码块或 JSON。",
      "",
      `【周开始】${week.startDate}`,
      days,
    ].join("\n");
  }

  async function copyPreviousWeekContext() {
    const week = findWeek(selectedWeekId);
    if (!week) return;
    const space = getSpace();
    space.aiContext = collectAiContext();
    saveState(false);
    const contextText = [
      `这是我在“${space.name}”空间的真实情况，请先读完，稍后我会继续发送网页要求的计划模板。`,
      "",
      "我的情况与偏好：",
      getAiContextProfile(space.aiContext) || "这次没有额外补充，请按保守、容易调整的节奏规划。",
      "",
      "上一周真实记录（没有记录的部分不要自行假设）：",
      buildPreviousWeekSummary(week),
    ].join("\n");
    await copyText(contextText);
    showToast("上周情况已复制，请先粘贴给 AI");
  }

  async function copyAiPlanningPrompt() {
    const space = getSpace();
    space.aiContext = collectAiContext();
    const prompt = buildAiPlanningPrompt(findWeek(selectedWeekId));
    saveState(false);
    await copyText(prompt);
    showToast("计划模板已复制，请继续粘贴到同一个 AI 对话");
  }

  function parseAiPlanText(rawText) {
    const text = String(rawText || "").replace(/```[^\n]*|```/g, "").trim();
    if (!text) return [];
    const weeks = [];
    let currentWeek = null;
    let currentDay = null;
    text.split(/\r?\n/).forEach((rawLine) => {
      const line = rawLine.trim().replace(/^[-*]\s*/, "");
      const weekMatch = line.match(/^【周开始】\s*(\d{4}-\d{2}-\d{2})/);
      if (weekMatch) {
        currentWeek = { startDate: weekMatch[1], days: [] };
        weeks.push(currentWeek);
        currentDay = null;
        return;
      }
      const dayMatch = line.match(/^【Day\s*([1-7])】\s*(.*)$/i);
      if (dayMatch && currentWeek) {
        const index = Number(dayMatch[1]) - 1;
        currentDay = currentWeek.days[index] || { items: [] };
        currentDay.title = safeString(dayMatch[2], 36) || "休息日";
        currentWeek.days[index] = currentDay;
        return;
      }
      if (!currentDay) return;
      const focusMatch = line.match(/^【重点】\s*(.*)$/);
      if (focusMatch) {
        currentDay.focus = safeString(focusMatch[1], 500);
        return;
      }
      const taskMatch = line.match(/^【任务】\s*(.*)$/);
      if (taskMatch) {
        const task = safeString(taskMatch[1].replace(/[｜|]/, "："), 160);
        if (task) currentDay.items.push({ text: task, state: "", legacyActual: "" });
        return;
      }
    });
    return weeks.map((week) => normalizeWeek({ ...week, spaceId: activeSpaceId }, state.spaces));
  }

  function importWeekPlan(event) {
    event.preventDefault();
    const selectedWeek = findWeek(selectedWeekId);
    if (!selectedWeek) return;
    const imported = parseAiPlanText(new FormData(weekImportForm).get("payload"))
      .filter((week) => week.startDate === selectedWeek.startDate);
    if (!imported.length) {
      showToast("没有识别到当前周计划，请确认从【周开始】开始完整复制");
      return;
    }
    getSpace().aiContext = collectAiContext();
    imported.forEach((week) => {
      const existing = state.weeks.find((item) => item.spaceId === activeSpaceId && item.startDate === week.startDate);
      if (!existing) return;
      week.days.forEach((plannedDay, index) => {
        const day = existing.days[index];
        day.title = plannedDay.title;
        day.focus = plannedDay.focus;
        day.items = plannedDay.items.map((item, itemIndex) => ({
          ...item,
          state: day.items[itemIndex]?.state || "",
          legacyActual: day.items[itemIndex]?.legacyActual || "",
        }));
      });
      selectedWeekId = existing.id;
    });
    saveState(false);
    weekImportDialog.close();
    renderWeeks();
    showToast("本周计划已导入，原有状态与当天小记已保留");
  }

  async function copyText(value) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const helper = document.createElement("textarea");
      helper.value = value;
      helper.setAttribute("readonly", "");
      helper.style.position = "fixed";
      helper.style.opacity = "0";
      document.body.appendChild(helper);
      helper.select();
      document.execCommand("copy");
      helper.remove();
    }
  }

  function buildWeekReportText(week) {
    const template = getSpaceTemplate(week.spaceId);
    const lines = [
      `# Asoul 一个魂${template.name}周报`,
      "",
      `- 周期：${formatDateRange(week.startDate)}`,
    ];
    const reportGoals = state.goals.filter((goal) => goal.spaceIds.includes(week.spaceId));
    if (reportGoals.length) {
      const reportDate = addDaysIso(week.startDate, 6);
      lines.push(`- 目标倒计时（截至${formatFriendlyDate(reportDate)}）：`);
      reportGoals.forEach((goal) => {
        lines.push(`  - ${goal.title}：${getGoalCountdown(goal.targetDate, reportDate).phrase}（${formatGoalDate(goal.targetDate)}）`);
      });
    }
    const reportProgressGoals = state.progressGoals.filter((goal) => goal.spaceIds.includes(week.spaceId));
    if (reportProgressGoals.length) {
      lines.push("- 进度目标（当前累计）：");
      reportProgressGoals.forEach((goal) => {
        const percent = Math.min(100, Math.max(0, goal.current / goal.target * 100));
        lines.push(`  - ${goal.title}：${formatProgressNumber(goal.current)} / ${formatProgressNumber(goal.target)} ${goal.unit}（${formatProgressNumber(percent)}%）`);
      });
    }

    week.days.forEach((day) => {
      const plannedItems = day.items.filter((item) => item.text || item.state);
      lines.push("", "", `## Day${day.dayNumber} · ${formatCompactDate(day.date)} · ${day.title}`);
      lines.push(`- 是否记录：${day.recorded ? "已记录" : "未记录"}`);
      lines.push(`- 完成状态：${day.status || "未选择"}`);
      if (template.showWeight) lines.push(`- 体重：${formatWeight(day.weight)}`);
      lines.push(`- ${template.firstFieldLabel}：${day.focus || "未填写"}`);
      lines.push("");
      lines.push("- 计划安排：");
      lines.push(...(plannedItems.length ? plannedItems.map((item) => `  - ${weekItemStateMark(item.state)} ${item.text || "未填写安排"}`) : ["  - 无"]));
      if (day.note) lines.push(`- 当天小记：${day.note}`);
    });
    return lines.join("\n");
  }

  function openWeeklyReport(weekId) {
    const week = findWeek(weekId);
    if (!week) return;
    const template = getSpaceTemplate(week.spaceId);
    const statusSummary = week.days.reduce((summary, day) => {
      const key = day.status || "未设置";
      summary[key] = (summary[key] || 0) + 1;
      return summary;
    }, {});
    const itemCounts = countWeekItemStates(week);

    weeklyReportContent.innerHTML = `
      <header class="weekly-report-capture-head">
        <div>
          <span>ASOUL ${escapeHtml(template.id.toUpperCase())} WEEKLY</span>
          <h3>${escapeHtml(week.title)}</h3>
          <p>${escapeHtml(formatDateRange(week.startDate))}</p>
        </div>
        <div class="weekly-report-score" aria-label="本周记录汇总">
          <span><b>${itemCounts.done}</b> 已完成</span>
          <span><b>${itemCounts.changed}</b> 已调整</span>
          <span><b>${itemCounts.missed}</b> 未完成</span>
        </div>
      </header>
      ${renderWeeklyReportGoals(addDaysIso(week.startDate, 6), week.spaceId)}
      <div class="weekly-report-statuses" aria-label="每日状态汇总">
        ${["好好好", "还不错", "这期拉了", "未设置"].map((status) => `<span class="weekly-report-status weekly-report-status--${status === "好好好" ? "great" : status === "还不错" ? "okay" : status === "这期拉了" ? "missed" : "pending"}">${escapeHtml(status)} ${statusSummary[status] || 0}</span>`).join("")}
      </div>
      <div class="weekly-report-days">
        ${week.days.map((day) => renderWeeklyReportDay(day, week.spaceId)).join("")}
      </div>`;
    weeklyReportDialog.showModal();
  }

  function renderWeeklyReportGoals(reportDate, spaceId) {
    const goals = state.goals.filter((goal) => goal.spaceIds.includes(spaceId));
    const progressGoals = state.progressGoals.filter((goal) => goal.spaceIds.includes(spaceId));
    if (!goals.length && !progressGoals.length) return "";
    return `
      <section class="weekly-report-goals weekly-report-milestones" aria-label="倒计时与进度目标">
        <div class="weekly-report-milestone-groups">
          ${goals.length ? `
            <div class="weekly-report-milestone-group">
              <div class="weekly-report-goal-list">
                ${goals.map((goal, index) => {
                  const countdown = getGoalCountdown(goal.targetDate, reportDate);
                  return `
                    <article class="weekly-report-goal weekly-report-goal--tone-${index % 4}">
                      ${goal.sticker ? `<img src="${escapeAttr(assetUrl(goal.sticker))}" alt="" />` : ""}
                      <span>${escapeHtml(goal.title)}</span>
                      <strong>${escapeHtml(countdown.phrase)}</strong>
                      <small>${escapeHtml(formatGoalDate(goal.targetDate))}</small>
                    </article>`;
                }).join("")}
              </div>
            </div>` : ""}
          ${progressGoals.length ? `
            <div class="weekly-report-milestone-group">
              <div class="weekly-report-goal-list">
                ${progressGoals.map((goal, index) => {
                  const percent = Math.min(100, Math.max(0, goal.current / goal.target * 100));
                  return `
                    <article class="weekly-report-goal weekly-report-progress weekly-report-goal--tone-${(index + goals.length) % 4}" style="--report-progress:${percent}%">
                      ${goal.sticker ? `<img src="${escapeAttr(assetUrl(goal.sticker))}" alt="" />` : ""}
                      <span>${escapeHtml(goal.title)}</span>
                      <strong>${escapeHtml(formatProgressNumber(goal.current))} / ${escapeHtml(formatProgressNumber(goal.target))} ${escapeHtml(goal.unit)}</strong>
                      <i aria-label="完成 ${escapeAttr(formatProgressNumber(percent))}%"><b></b></i>
                      <small>完成 ${escapeHtml(formatProgressNumber(percent))}%</small>
                    </article>`;
                }).join("")}
              </div>
            </div>` : ""}
        </div>
      </section>`;
  }

  function renderWeeklyReportDay(day, spaceId = "health") {
    const template = getSpaceTemplate(spaceId);
    const entries = day.items.filter((item) => item.text || item.state);
    const statusClass = ({ "这期拉了": "missed", "还不错": "okay", "好好好": "great" })[day.status] || "pending";
    return `
      <article class="weekly-report-day weekly-report-day--${statusClass}">
        <header>
          <div class="weekly-report-day-title">
            <span class="weekly-report-day-heading"><strong>Day${day.dayNumber}</strong>${day.status ? `<em>${escapeHtml(day.status)}</em>` : ""}</span>
            <time datetime="${escapeAttr(day.date)}">${escapeHtml(formatCompactDate(day.date))}</time>
            <small>${escapeHtml(day.title)}</small>
          </div>
          ${day.sticker ? `<img src="${escapeAttr(assetUrl(day.sticker))}" alt="Day${day.dayNumber} 表情" />` : ""}
        </header>
        <ul>
          ${entries.length ? entries.map((item) => {
            const markClass = item.state || "pending";
            return `<li><b class="is-${markClass}">${weekItemStateMark(item.state)}</b><span>${escapeHtml(item.text || "未填写安排")}</span></li>`;
          }).join("") : "<li class=\"is-empty\">还没有安排</li>"}
        </ul>
        ${day.focus ? `<p class="weekly-report-diet"><b>${escapeHtml(template.firstFieldLabel)}</b>${escapeHtml(day.focus)}</p>` : ""}
        ${template.showWeight && day.weight !== null ? `<p class="weekly-report-weight"><b>体重</b><strong>${escapeHtml(formatWeight(day.weight))}</strong></p>` : ""}
        ${day.note ? `<p class="weekly-report-note">${escapeHtml(day.note)}</p>` : ""}
      </article>`;
  }

  async function copyWeekReportText(weekId) {
    const week = findWeek(weekId);
    if (!week) return;
    const reportText = buildWeekReportText(week);
    try {
      await navigator.clipboard.writeText(reportText);
    } catch {
      const helper = document.createElement("textarea");
      helper.value = reportText;
      helper.setAttribute("readonly", "");
      helper.style.position = "fixed";
      helper.style.opacity = "0";
      document.body.appendChild(helper);
      helper.select();
      document.execCommand("copy");
      helper.remove();
    }
    showToast("纯文本周报已复制");
  }

  function downloadWeeklyReportImage(weekId) {
    const week = findWeek(weekId);
    const button = $("#downloadWeeklyReportImageButton");
    if (!week) return;
    button.disabled = true;
    button.textContent = "正在生成竖版…";
    try {
      const canvas = createWeeklyReportCanvas(week);
      downloadCanvasAsPng(canvas, `Asoul-${getSpaceTemplate(week.spaceId).name}完整周报-${week.startDate}.png`);
      showToast("竖版完整周报已经下载");
    } catch {
      showToast("图片生成失败，请稍后再试");
    } finally {
      button.disabled = false;
      button.textContent = "下载高清竖版";
    }
  }

  function downloadWeeklySummaryImage(weekId) {
    const week = findWeek(weekId);
    const button = $("#downloadWeeklySummaryImageButton");
    if (!week) return;
    button.disabled = true;
    button.textContent = "正在生成横版…";
    try {
      const canvas = createWeeklySummaryCanvas(week);
      downloadCanvasAsPng(canvas, `Asoul-${getSpaceTemplate(week.spaceId).name}周报摘要-${week.startDate}.png`);
      showToast("横版周报摘要已经下载");
    } catch {
      showToast("图片生成失败，请稍后再试");
    } finally {
      button.disabled = false;
      button.textContent = "下载 4K 横版";
    }
  }

  function downloadCanvasAsPng(canvas, filename) {
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = filename.replace(/[\\/:*?"<>|]/g, "-");
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function createWeeklyReportCanvas(week) {
    const template = getSpaceTemplate(week.spaceId);
    const goals = state.goals.filter((goal) => goal.spaceIds.includes(week.spaceId));
    const progressGoals = state.progressGoals.filter((goal) => goal.spaceIds.includes(week.spaceId));
    const milestones = [
      ...goals.map((goal) => ({ type: "countdown", data: goal })),
      ...progressGoals.map((goal) => ({ type: "progress", data: goal })),
    ];
    const scale = 2;
    const width = 1080;
    const outer = 54;
    const gap = 14;
    const milestoneCardHeight = 104;
    const milestoneRows = Math.ceil(milestones.length / 2);
    const milestoneHeight = milestones.length ? 70 + milestoneRows * (milestoneCardHeight + gap) : 0;
    const dayHeights = week.days.map((day) => getCanvasDayHeight(day));
    const height = outer + 176 + milestoneHeight + 72 + dayHeights.reduce((sum, value) => sum + value, 0) + gap * 6 + 72;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const context = canvas.getContext("2d");
    context.scale(scale, scale);
    const background = context.createLinearGradient(0, 0, width, height);
    background.addColorStop(0, "#fffdfb");
    background.addColorStop(0.48, "#faf8ff");
    background.addColorStop(1, "#fff7f8");
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);

    drawCanvasAppIcon(context, width - outer - 58, outer + 5, 58);

    const itemCounts = countWeekItemStates(week);
    const recordedCount = week.days.filter((day) => day.recorded === true).length;
    context.fillStyle = "#7865cf";
    context.font = "800 14px system-ui, sans-serif";
    context.fillText(`ASOUL ${template.id.toUpperCase()} WEEKLY`, outer, outer + 20);
    context.fillStyle = "#29263d";
    context.font = "850 38px system-ui, sans-serif";
    drawCanvasText(context, week.title, outer, outer + 70, width - outer * 2 - 130, 44, 1);
    context.fillStyle = "#777287";
    context.font = "650 17px system-ui, sans-serif";
    context.fillText(`${formatDateRange(week.startDate)} · 已记录 ${recordedCount}/7 天`, outer, outer + 104);
    drawCanvasPill(context, outer, outer + 124, 126, 38, `${itemCounts.done} 项完成`, "#eaf6f2", "#397f6d");
    drawCanvasPill(context, outer + 136, outer + 124, 126, 38, `${itemCounts.changed} 项调整`, "#fff7df", "#9a6c25");
    drawCanvasPill(context, outer + 272, outer + 124, 126, 38, `${itemCounts.missed} 项未完成`, "#fff0f2", "#a85f6b");
    drawCanvasPill(context, outer + 408, outer + 124, 126, 38, `${recordedCount} 天记录`, "#f1edff", "#6d59be");

    let y = outer + 176;
    if (milestones.length) {
      context.fillStyle = "#6c5bc5";
      context.font = "850 14px system-ui, sans-serif";
      context.fillText("WEEKLY MILESTONES · 本周坐标", outer, y + 20);
      context.fillStyle = "#8c8798";
      context.font = "550 13px system-ui, sans-serif";
      context.fillText("只显示关联到这个空间的倒计时与进度目标", outer, y + 43);
      const cardWidth = (width - outer * 2 - gap) / 2;
      milestones.forEach((item, index) => {
        const cardX = outer + index % 2 * (cardWidth + gap);
        const cardY = y + 58 + Math.floor(index / 2) * (milestoneCardHeight + gap);
        drawCanvasMilestone(context, item, cardX, cardY, cardWidth, milestoneCardHeight, week, canvasImageCache, index);
      });
      y += milestoneHeight;
    }

    const statusSummary = week.days.reduce((summary, day) => {
      const key = day.status || "未设置";
      summary[key] = (summary[key] || 0) + 1;
      return summary;
    }, {});
    const statuses = [
      ["好好好", "#fff0ec", "#ad594b"],
      ["还不错", "#fceef4", "#aa607c"],
      ["这期拉了", "#eef1f8", "#596a8b"],
      ["未设置", "#f5f0e7", "#7a6b53"],
    ];
    let statusX = outer;
    statuses.forEach(([label, fill, color]) => {
      drawCanvasPill(context, statusX, y + 14, 118, 36, `${label} ${statusSummary[label] || 0}`, fill, color);
      statusX += 128;
    });
    y += 72;

    week.days.forEach((day, index) => {
      drawCanvasDayVertical(context, day, template, outer, y, width - outer * 2, dayHeights[index], canvasImageCache, index);
      y += dayHeights[index] + (index < week.days.length - 1 ? gap : 0);
    });
    context.fillStyle = "#938d9b";
    context.font = "600 12px system-ui, sans-serif";
    context.textAlign = "center";
    context.fillText("ASOUL 一个魂生活日记 · 数据保存在你的设备中", width / 2, height - 30);
    context.textAlign = "left";
    return canvas;
  }

  function drawCanvasMilestone(context, item, x, y, width, height, week, stickerImages, toneIndex = 0) {
    const tones = ["#8871ec", "#e88da9", "#4ea78e", "#dd756b"];
    const tone = tones[toneIndex % tones.length];
    drawCanvasCard(context, x, y, width, height, "#ffffff", "#e9e3f3");
    context.fillStyle = tone;
    context.fillRect(x, y, 5, height);
    const sticker = stickerImages.get(item.data.sticker);
    const contentX = x + 18;
    if (sticker?.complete && sticker.naturalWidth) drawCanvasSticker(context, sticker, contentX, y + 20, 62);
    const textX = sticker?.complete && sticker.naturalWidth ? contentX + 76 : contentX;
    context.fillStyle = "#343044";
    context.font = "750 17px system-ui, sans-serif";
    drawCanvasText(context, item.data.title, textX, y + 35, width - (textX - x) - 148, 22, 2);
    context.fillStyle = tone;
    context.textAlign = "right";
    context.font = "850 21px system-ui, sans-serif";
    if (item.type === "countdown") {
      const countdown = getGoalCountdown(item.data.targetDate, addDaysIso(week.startDate, 6));
      context.fillText(countdown.phrase, x + width - 18, y + 39);
      context.font = "550 12px system-ui, sans-serif";
      context.fillText(formatGoalDate(item.data.targetDate), x + width - 18, y + 64);
    } else {
      const percent = Math.min(100, Math.max(0, item.data.current / item.data.target * 100));
      context.font = "850 16px system-ui, sans-serif";
      context.fillText(`${formatProgressNumber(item.data.current)} / ${formatProgressNumber(item.data.target)} ${item.data.unit}`, x + width - 18, y + 38);
      drawCanvasProgress(context, textX, y + height - 24, x + width - 18 - textX, percent, tone);
    }
    context.textAlign = "left";
  }

  function getCanvasDayEntries(day) {
    return day.items
      .filter((item) => item.text || item.state)
      .map((item) => ({ text: item.text, state: item.state }));
  }

  function getCanvasDayHeight(day) {
    const entryCount = Math.min(7, getCanvasDayEntries(day).length);
    const hasFooter = Boolean(day.focus || day.weight !== null || day.note);
    return 138 + Math.max(1, entryCount) * 31 + (hasFooter ? 54 : 20);
  }

  function drawCanvasDayVertical(context, day, template, x, y, width, height, stickerImages, index) {
    const tones = ["#8871ec", "#e88da9", "#4ea78e", "#dd756b"];
    const statusColors = { "好好好": "#db7d74", "还不错": "#e799b0", "这期拉了": "#576690" };
    const tone = statusColors[day.status] || tones[index % tones.length];
    drawCanvasCard(context, x, y, width, height, "rgba(255,255,255,.95)", colorMixForCanvas(tone, .18));
    context.fillStyle = tone;
    drawCanvasRoundedRectPath(context, x, y, 8, height, 4);
    context.fill();
    context.fillStyle = colorMixForCanvas(tone, .09);
    drawCanvasRoundedRectPath(context, x + 22, y + 22, 86, 82, 22);
    context.fill();
    context.fillStyle = tone;
    context.font = "900 12px system-ui, sans-serif";
    context.fillText("DAY", x + 43, y + 48);
    context.font = "900 31px system-ui, sans-serif";
    context.fillText(String(day.dayNumber).padStart(2, "0"), x + 39, y + 82);
    context.fillStyle = "#3a3548";
    context.font = "820 20px system-ui, sans-serif";
    drawCanvasText(context, day.title || `Day${day.dayNumber}`, x + 128, y + 39, width - 300, 25, 1);
    context.fillStyle = "#898291";
    context.font = "650 13px system-ui, sans-serif";
    context.fillText(`${formatFriendlyDate(day.date)} · ${day.recorded ? "已记录" : "未记录"}`, x + 128, y + 64);
    if (day.status) drawCanvasPill(context, x + 128, y + 76, 88, 28, day.status, colorMixForCanvas(tone, .1), tone);
    const sticker = stickerImages.get(day.sticker);
    if (sticker?.complete && sticker.naturalWidth) drawCanvasSticker(context, sticker, x + width - 84, y + 22, 58);

    const entries = getCanvasDayEntries(day);
    const listX = x + 128;
    const listY = y + 132;
    (entries.length ? entries : [{ text: "当天没有安排事项", state: "" }]).slice(0, 7).forEach((entry, entryIndex) => {
      const rowY = listY + entryIndex * 31;
      const mark = weekItemStateMark(entry.state);
      context.fillStyle = entry.state === "done" ? "#32977c" : entry.state === "changed" ? "#d69a31" : entry.state === "missed" ? "#cc626c" : "#9a929f";
      context.font = "900 17px system-ui, sans-serif";
      context.fillText(mark, listX, rowY);
      context.fillStyle = "#484251";
      context.font = "760 14px system-ui, sans-serif";
      drawCanvasText(context, entry.text || "未填写安排", listX + 28, rowY, width - 190, 18, 1);
    });
    if (entries.length > 7) {
      context.fillStyle = "#8e8794";
      context.font = "550 12px system-ui, sans-serif";
      context.fillText(`另有 ${entries.length - 7} 项，请在网页中查看`, listX + 28, listY + 7 * 31);
    }
    const footerParts = [];
    if (day.focus) footerParts.push(`${template.firstFieldLabel}：${day.focus}`);
    if (template.showWeight && day.weight !== null) footerParts.push(`体重：${formatWeight(day.weight)}`);
    if (day.note) footerParts.push(`当天小记：${day.note}`);
    if (footerParts.length) {
      context.strokeStyle = "#ede9f0";
      context.setLineDash([5, 6]);
      context.beginPath();
      context.moveTo(listX, y + height - 46);
      context.lineTo(x + width - 26, y + height - 46);
      context.stroke();
      context.setLineDash([]);
      context.fillStyle = "#736d79";
      context.font = "520 12px system-ui, sans-serif";
      drawCanvasText(context, footerParts.join(" · "), listX, y + height - 22, width - 176, 17, 1);
    }
  }

  function createWeeklySummaryCanvas(week) {
    const scale = 2;
    const width = 1920;
    const height = 1080;
    const outer = 78;
    const contextCanvas = document.createElement("canvas");
    contextCanvas.width = width * scale;
    contextCanvas.height = height * scale;
    const context = contextCanvas.getContext("2d");
    context.scale(scale, scale);
    const template = getSpaceTemplate(week.spaceId);
    const goals = state.goals.filter((goal) => goal.spaceIds.includes(week.spaceId));
    const progressGoals = state.progressGoals.filter((goal) => goal.spaceIds.includes(week.spaceId));
    const milestones = [
      ...goals.map((goal) => ({ type: "countdown", data: goal })),
      ...progressGoals.map((goal) => ({ type: "progress", data: goal })),
    ].slice(0, 4);
    const itemCounts = countWeekItemStates(week);
    const recordedCount = week.days.filter((day) => day.recorded === true).length;

    const background = context.createLinearGradient(0, 0, width, height);
    background.addColorStop(0, "#fffdfb");
    background.addColorStop(.52, "#faf8ff");
    background.addColorStop(1, "#fff4f7");
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);
    context.fillStyle = "rgba(143,122,234,.08)";
    context.beginPath();
    context.arc(width - 90, 30, 360, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "rgba(85,165,143,.06)";
    context.beginPath();
    context.arc(80, height - 50, 300, 0, Math.PI * 2);
    context.fill();
    drawCanvasAppIcon(context, width - outer - 76, outer - 3, 76);

    context.fillStyle = "#7865cf";
    context.font = "850 22px system-ui, sans-serif";
    context.fillText(`ASOUL ${template.id.toUpperCase()} WEEKLY`, outer, outer + 24);
    context.fillStyle = "#29263d";
    context.font = "900 54px system-ui, sans-serif";
    drawCanvasText(context, week.title, outer, outer + 88, 1040, 62, 1);
    context.fillStyle = "#777287";
    context.font = "650 24px system-ui, sans-serif";
    context.fillText(`${formatDateRange(week.startDate)} · 已记录 ${recordedCount}/7 天`, outer, outer + 132);
    drawCanvasPill(context, width - outer - 560, outer + 102, 132, 50, `${itemCounts.done} 完成`, "#eaf6f2", "#397f6d");
    drawCanvasPill(context, width - outer - 414, outer + 102, 132, 50, `${itemCounts.changed} 调整`, "#fff7df", "#9a6c25");
    drawCanvasPill(context, width - outer - 268, outer + 102, 132, 50, `${itemCounts.missed} 未完成`, "#fff0f2", "#a85f6b");

    const milestoneY = 280;
    context.fillStyle = "#6252ad";
    context.font = "850 18px system-ui, sans-serif";
    context.fillText("WEEKLY MILESTONES · 本周坐标", outer, milestoneY - 24);
    if (milestones.length) {
      const cardWidth = (width - outer * 2 - 22) / 2;
      milestones.forEach((item, index) => {
        const x = outer + index % 2 * (cardWidth + 22);
        const y = milestoneY + Math.floor(index / 2) * 132;
        drawCanvasMilestone(context, item, x, y, cardWidth, 112, week, canvasImageCache, index);
      });
    } else {
      context.fillStyle = "#918a98";
      context.font = "600 19px system-ui, sans-serif";
      context.fillText("这个空间暂时没有关联的倒计时或进度目标。", outer, milestoneY + 45);
    }

    const daysY = milestones.length > 2 ? 576 : 450;
    context.fillStyle = "#6252ad";
    context.font = "850 18px system-ui, sans-serif";
    context.fillText("SEVEN DAYS · 一周足迹", outer, daysY - 24);
    const dayGap = 13;
    const dayWidth = (width - outer * 2 - dayGap * 6) / 7;
    week.days.forEach((day, index) => {
      const x = outer + index * (dayWidth + dayGap);
      const tone = { "好好好": "#db7d74", "还不错": "#e799b0", "这期拉了": "#576690" }[day.status] || "#b89558";
      drawCanvasCard(context, x, daysY, dayWidth, 286, "rgba(255,255,255,.94)", colorMixForCanvas(tone, .18));
      context.fillStyle = tone;
      drawCanvasRoundedRectPath(context, x, daysY, dayWidth, 7, 4);
      context.fill();
      context.fillStyle = "#383346";
      context.font = "900 28px system-ui, sans-serif";
      context.fillText(`D${day.dayNumber}`, x + 18, daysY + 46);
      context.fillStyle = tone;
      context.font = "850 14px system-ui, sans-serif";
      context.fillText(formatCompactDate(day.date), x + 18, daysY + 72);
      const sticker = canvasImageCache.get(day.sticker);
      if (sticker?.complete && sticker.naturalWidth) drawCanvasSticker(context, sticker, x + dayWidth - 64, daysY + 18, 48);
      if (day.status) drawCanvasPill(context, x + 16, daysY + 88, Math.min(92, dayWidth - 32), 30, day.status, colorMixForCanvas(tone, .1), tone);
      const entries = getCanvasDayEntries(day);
      const done = entries.filter((entry) => entry.state === "done").length;
      const changed = entries.filter((entry) => entry.state === "changed").length;
      const missed = entries.filter((entry) => entry.state === "missed").length;
      context.fillStyle = "#4a4553";
      context.font = "780 15px system-ui, sans-serif";
      drawCanvasText(context, day.title || "生活日", x + 18, daysY + 148, dayWidth - 36, 20, 2);
      context.fillStyle = "#817b88";
      context.font = "600 13px system-ui, sans-serif";
      context.fillText(`${done} 完成 · ${changed} 调整 · ${missed} 未完成`, x + 18, daysY + 198);
      context.fillText(day.recorded ? "今天已记录" : "等待记录", x + 18, daysY + 224);
      drawCanvasProgress(context, x + 18, daysY + 250, dayWidth - 36, entries.length ? (done + changed) / entries.length * 100 : 0, tone);
    });

    context.fillStyle = "#8c8693";
    context.font = "600 17px system-ui, sans-serif";
    context.textAlign = "center";
    context.fillText("把一周摊开看见，也把下一步留给自己。 · ASOUL 一个魂生活日记", width / 2, height - 54);
    context.textAlign = "left";
    return contextCanvas;
  }

  function drawCanvasSoulMark(context, x, y, size) {
    context.save();
    context.translate(x, y);
    context.scale(size / 64, size / 64);
    const background = context.createLinearGradient(5, 4, 59, 61);
    background.addColorStop(0, "#7665d7");
    background.addColorStop(.58, "#9a7ce5");
    background.addColorStop(1, "#e89bb4");
    context.fillStyle = background;
    drawCanvasRoundedRectPath(context, 3, 3, 58, 58, 18);
    context.fill();
    context.fillStyle = "#fff4b3";
    context.beginPath();
    context.moveTo(49, 12);
    context.lineTo(50.5, 15.5);
    context.lineTo(54, 17);
    context.lineTo(50.5, 18.5);
    context.lineTo(49, 22);
    context.lineTo(47.5, 18.5);
    context.lineTo(44, 17);
    context.lineTo(47.5, 15.5);
    context.closePath();
    context.fill();
    const ghost = context.createLinearGradient(22, 15, 42, 51);
    ghost.addColorStop(0, "#fffefc");
    ghost.addColorStop(1, "#f3eaff");
    context.fillStyle = ghost;
    context.beginPath();
    context.moveTo(18, 47);
    context.lineTo(18, 31);
    context.bezierCurveTo(18, 21, 24, 14, 32, 14);
    context.bezierCurveTo(40, 14, 46, 21, 46, 31);
    context.lineTo(46, 47);
    context.bezierCurveTo(46, 50, 43, 51, 41, 49);
    context.lineTo(39, 47);
    context.lineTo(35.5, 50);
    context.bezierCurveTo(34, 51.3, 32.7, 50.7, 32, 49.7);
    context.lineTo(30, 47);
    context.lineTo(27, 50);
    context.bezierCurveTo(25.4, 51.2, 24, 50.5, 23.3, 49.5);
    context.lineTo(22, 48);
    context.bezierCurveTo(20.3, 50, 18, 49, 18, 47);
    context.fill();
    context.fillStyle = "#403854";
    context.beginPath();
    context.arc(27.2, 31, 2.8, 0, Math.PI * 2);
    context.arc(36.8, 31, 2.8, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "#6f6188";
    context.lineWidth = 1.5;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(29.5, 37.2);
    context.quadraticCurveTo(32, 39.2, 34.5, 37.2);
    context.stroke();
    context.fillStyle = "rgba(243,164,184,.72)";
    context.beginPath();
    context.arc(23.2, 36, 2.2, 0, Math.PI * 2);
    context.arc(40.8, 36, 2.2, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function drawCanvasAppIcon(context, x, y, size) {
    const image = canvasImageCache.get("icons/icon-192.png") || $("#installAppButton img");
    if (!image?.complete || !image.naturalWidth) {
      drawCanvasSoulMark(context, x, y, size);
      return;
    }
    context.save();
    drawCanvasRoundedRectPath(context, x, y, size, size, size * .24);
    context.clip();
    context.drawImage(image, x, y, size, size);
    context.restore();
  }

  function colorMixForCanvas(hex, opacity) {
    const match = String(hex).match(/^#([0-9a-f]{6})$/i);
    if (!match) return `rgba(143,122,234,${opacity})`;
    const value = Number.parseInt(match[1], 16);
    return `rgba(${value >> 16},${value >> 8 & 255},${value & 255},${opacity})`;
  }

  function drawCanvasDay(context, day, template, x, y, width, height, stickerImages) {
    drawCanvasCard(context, x, y, width, height, "rgba(255,255,255,.94)", "#e5e1eb");
    context.fillStyle = "#343044";
    context.font = "800 30px system-ui, sans-serif";
    context.fillText(`Day${day.dayNumber}`, x + 24, y + 42);
    context.font = "800 18px system-ui, sans-serif";
    context.fillText(formatCompactDate(day.date), x + 24, y + 68);
    context.fillStyle = "#837e8f";
    context.font = "500 16px system-ui, sans-serif";
    context.fillText(day.title, x + 24, y + 93);
    if (day.status) drawCanvasPill(context, x + 126, y + 14, 108, 36, day.status, "#f9edf4", "#a25e79");
    const sticker = stickerImages.get(day.sticker);
    if (sticker) drawCanvasSticker(context, sticker, x + width - 100, y + 20, 72);

    const entries = getCanvasDayEntries(day);
    entries.slice(0, 5).forEach((entry, index) => {
      const rowY = y + 132 + index * 34;
      const mark = weekItemStateMark(entry.state);
      context.fillStyle = entry.state === "done" ? "#36a083" : entry.state === "changed" ? "#d69a31" : entry.state === "missed" ? "#d96670" : "#9a929f";
      context.font = "800 20px system-ui, sans-serif";
      context.fillText(mark, x + 24, rowY);
      context.fillStyle = "#454052";
      context.font = "700 17px system-ui, sans-serif";
      drawCanvasText(context, entry.text || "未填写安排", x + 54, rowY, width - 78, 20, 1);
    });
    if (entries.length > 5) {
      context.fillStyle = "#8a8495";
      context.font = "500 15px system-ui, sans-serif";
      context.fillText(`另有 ${entries.length - 5} 项记录`, x + 54, y + 132 + 5 * 34);
    }
    const footerParts = [];
    if (day.focus) footerParts.push(`${template.firstFieldLabel}：${day.focus}`);
    if (template.showWeight && day.weight !== null) footerParts.push(`体重：${formatWeight(day.weight)}`);
    if (day.note) footerParts.push(day.note);
    if (footerParts.length) {
      context.fillStyle = "#6f697b";
      context.font = "500 15px system-ui, sans-serif";
      drawCanvasText(context, footerParts.join(" · "), x + 24, y + height - 32, width - 48, 20, 2);
    }
  }

  function drawCanvasCard(context, x, y, width, height, fill, stroke) {
    drawCanvasRoundedRectPath(context, x, y, width, height, 22);
    context.fillStyle = fill;
    context.fill();
    context.strokeStyle = stroke;
    context.lineWidth = 1;
    context.stroke();
  }

  function drawCanvasPill(context, x, y, width, height, text, fill, color) {
    drawCanvasRoundedRectPath(context, x, y, width, height, height / 2);
    context.fillStyle = fill;
    context.fill();
    context.fillStyle = color;
    context.font = "700 16px system-ui, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, x + width / 2, y + height / 2);
    context.textAlign = "left";
    context.textBaseline = "alphabetic";
  }

  function drawCanvasProgress(context, x, y, width, percent, color) {
    context.fillStyle = "#eeebf2";
    drawCanvasRoundedRectPath(context, x, y, width, 10, 5);
    context.fill();
    context.fillStyle = color;
    drawCanvasRoundedRectPath(context, x, y, Math.max(4, width * percent / 100), 10, 5);
    context.fill();
  }

  function drawCanvasSticker(context, image, x, y, size) {
    context.save();
    context.fillStyle = "#fff";
    drawCanvasRoundedRectPath(context, x, y, size, size, 18);
    context.fill();
    context.clip();
    context.drawImage(image, x, y, size, size);
    context.restore();
  }

  function drawCanvasRoundedRectPath(context, x, y, width, height, radius) {
    const safeRadius = Math.max(0, Math.min(radius, width / 2, height / 2));
    context.beginPath();
    context.moveTo(x + safeRadius, y);
    context.lineTo(x + width - safeRadius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
    context.lineTo(x + width, y + height - safeRadius);
    context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
    context.lineTo(x + safeRadius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
    context.lineTo(x, y + safeRadius);
    context.quadraticCurveTo(x, y, x + safeRadius, y);
    context.closePath();
  }

  function drawCanvasText(context, text, x, y, maxWidth, lineHeight, maxLines) {
    const characters = [...String(text || "")];
    const lines = [];
    let line = "";
    characters.forEach((character) => {
      const candidate = line + character;
      if (line && context.measureText(candidate).width > maxWidth) {
        lines.push(line);
        line = character;
      } else {
        line = candidate;
      }
    });
    if (line) lines.push(line);
    const visible = lines.slice(0, maxLines);
    if (lines.length > maxLines && visible.length) {
      let last = visible[visible.length - 1];
      while (last && context.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
      visible[visible.length - 1] = `${last}…`;
    }
    visible.forEach((value, index) => context.fillText(value, x, y + index * lineHeight));
  }

  function openChartDialog(chartId = null) {
    if (!getSpace()) {
      showToast("请先新建一个空间");
      return;
    }
    editingChartId = chartId;
    chartForm.reset();
    seriesEditor.innerHTML = "";
    $("#chartDialogTitle").textContent = chartId ? "修改曲线图" : "添加一张曲线图";
    const template = getSpaceTemplate(chartId ? findChart(chartId)?.spaceId : activeSpaceId);
    chartForm.elements.title.placeholder = `${template.name}记录图表，例如：${template.defaultSeries.name.replace(/\s*\/.*$/, "")}变化`;

    if (chartId) {
      const chart = findChart(chartId);
      if (!chart) return;
      chartForm.elements.title.value = chart.title;
      chartForm.elements.xLabel.value = chart.xLabel;
      chart.series.forEach((item) => addSeriesEditorRow(item));
    } else {
      addSeriesEditorRow(getSpaceTemplate().defaultSeries);
    }

    chartDialog.showModal();
    focusDialogFieldWithoutScrolling(chartForm, chartForm.elements.title);
  }

  function applyPreset(key) {
    const preset = PRESETS[key];
    if (!preset) return;
    chartForm.elements.title.value = preset.title;
    chartForm.elements.xLabel.value = preset.xLabel;
    seriesEditor.innerHTML = "";
    preset.series.forEach((item) => addSeriesEditorRow(item));
  }

  function addSeriesEditorRow(item = {}) {
    const existingRows = $$('[data-series-row]', seriesEditor);
    if (existingRows.length >= 3) {
      showToast("一张图最多记录三项指标");
      return;
    }

    const row = document.createElement("div");
    const index = existingRows.length;
    const color = ALLOWED_COLORS.includes(item.color) ? item.color : ALLOWED_COLORS[index % ALLOWED_COLORS.length];
    row.className = "series-editor-row";
    row.dataset.seriesRow = "";
    row.dataset.seriesId = safeId(item.id);
    row.style.setProperty("--series-row-color", color);
    row.innerHTML = `
      <span class="series-number">${index + 1}</span>
      <label class="field">
        <span>指标名称与单位</span>
        <input data-series-name maxlength="24" required placeholder="例如：跑量 / km" value="${escapeAttr(item.name || "")}" />
      </label>
      <label class="field series-color-field">
        <span>曲线颜色</span>
        <select data-series-color>
          ${ALLOWED_COLORS.map((value) => `<option value="${value}"${value === color ? " selected" : ""}>${colorName(value)}</option>`).join("")}
        </select>
      </label>
      <div class="series-axis-fields">
        <label class="field">
          <span>纵轴最小值 <small>留空自动</small></span>
          <input data-series-axis-min type="number" step="any" inputmode="decimal" placeholder="留空自动" value="${Number.isFinite(Number(item.axisMin)) && item.axisMin !== null && item.axisMin !== "" ? escapeAttr(item.axisMin) : ""}" />
        </label>
        <label class="field">
          <span>纵轴最大值 <small>留空自动</small></span>
          <input data-series-axis-max type="number" step="any" inputmode="decimal" placeholder="留空自动" value="${Number.isFinite(Number(item.axisMax)) && item.axisMax !== null && item.axisMax !== "" ? escapeAttr(item.axisMax) : ""}" />
        </label>
      </div>
      <button class="series-remove" type="button" aria-label="删除指标 ${index + 1}">×</button>`;
    seriesEditor.appendChild(row);
    $("[data-series-color]", row).addEventListener("change", (event) => {
      row.style.setProperty("--series-row-color", event.currentTarget.value);
    });
    $(".series-remove", row).addEventListener("click", () => {
      if ($$('[data-series-row]', seriesEditor).length === 1) {
        showToast("至少保留一项指标");
        return;
      }
      row.remove();
      refreshSeriesEditor();
    });
    refreshSeriesEditor();
  }

  function refreshSeriesEditor() {
    $$('[data-series-row]', seriesEditor).forEach((row, index) => {
      $(".series-number", row).textContent = index + 1;
      $(".series-remove", row).setAttribute("aria-label", `删除指标 ${index + 1}`);
    });
    $("#addSeriesButton").disabled = $$('[data-series-row]', seriesEditor).length >= 3;
  }

  function readSeriesEditor() {
    const result = [];
    for (const [index, row] of $$('[data-series-row]', seriesEditor).entries()) {
      const minInput = $("[data-series-axis-min]", row);
      const maxInput = $("[data-series-axis-max]", row);
      const axisMin = minInput.value.trim() === "" ? null : Number(minInput.value);
      const axisMax = maxInput.value.trim() === "" ? null : Number(maxInput.value);
      if ((axisMin !== null && !Number.isFinite(axisMin)) || (axisMax !== null && !Number.isFinite(axisMax))) {
        showToast(`指标 ${index + 1} 的纵轴范围需要填写有效数字`);
        (axisMin !== null && !Number.isFinite(axisMin) ? minInput : maxInput).focus();
        return null;
      }
      if (axisMin !== null && axisMax !== null && axisMin >= axisMax) {
        showToast(`指标 ${index + 1} 的最大值要大于最小值`);
        maxInput.focus();
        return null;
      }
      result.push({
        id: safeId(row.dataset.seriesId),
        name: safeString($("[data-series-name]", row).value, 24) || `指标 ${index + 1}`,
        color: ALLOWED_COLORS.includes($("[data-series-color]", row).value)
          ? $("[data-series-color]", row).value
          : ALLOWED_COLORS[index % ALLOWED_COLORS.length],
        axisMin,
        axisMax,
      });
    }
    return result;
  }

  function colorName(value) {
    return ({
      "#8f7aea": "星云紫",
      "#36a58b": "薄荷绿",
      "#ee9d42": "晨光橙",
      "#4f8edb": "晴空蓝",
      "#35a8bb": "海盐青",
      "#a77957": "奶咖棕",
      "#E799B0": "嘉然 · 贝壳粉",
      "#DB7D74": "贝拉 · 番茄红",
      "#576690": "乃琳 · 深岩暗蓝灰",
    })[value] || "曲线颜色";
  }

  function saveChartFromDialog(event) {
    event.preventDefault();
    if (!chartForm.reportValidity()) return;
    const data = new FormData(chartForm);
    const series = readSeriesEditor();
    if (!series) return;
    const next = {
      title: safeString(data.get("title"), 30),
      xLabel: safeString(data.get("xLabel"), 20),
      series,
    };

    if (editingChartId) {
      const chart = findChart(editingChartId);
      if (!chart) return;
      const previousPrimarySeriesId = chart.series[0]?.id || "";
      Object.assign(chart, next);
      chart.nodes.forEach((node) => {
        const values = {};
        const stickers = {};
        next.series.forEach((item) => {
          const raw = node.values?.[item.id];
          values[item.id] = raw !== null && raw !== undefined && Number.isFinite(Number(raw)) ? Number(raw) : null;
          const sticker = safeSticker(node.stickers?.[item.id] ?? (item.id === previousPrimarySeriesId ? node.sticker : ""));
          if (sticker) stickers[item.id] = sticker;
        });
        node.values = values;
        node.stickers = stickers;
        node.sticker = stickers[next.series[0]?.id] || "";
      });
      showToast("图表设置已更新");
    } else {
      state.charts.unshift({
        id: makeId(),
        spaceId: activeSpaceId,
        ...next,
        nodes: [],
        createdAt: Date.now(),
      });
      showToast("空白曲线图已经准备好啦");
    }

    saveState(false);
    chartDialog.close();
    renderCharts();
  }

  function renderCharts() {
    captureChartScrollPositions();
    const spaceCharts = getActiveSpaceCharts();
    const hasActiveSpace = Boolean(getSpace());
    $("#addChartButton").disabled = !hasActiveSpace;
    $("#emptyAddButton").disabled = !hasActiveSpace;
    emptyState.hidden = spaceCharts.length > 0;
    chartsGrid.innerHTML = spaceCharts.map((chart, index) => renderChartCard(chart, index, spaceCharts.length)).join("");

    $$("[data-add-node]", chartsGrid).forEach((button) => {
      button.addEventListener("click", () => openNodeDialog(button.dataset.addNode));
    });
    $$("[data-edit-chart]", chartsGrid).forEach((button) => {
      button.addEventListener("click", () => openChartDialog(button.dataset.editChart));
    });
    $$("[data-download-chart]", chartsGrid).forEach((button) => {
      button.addEventListener("click", () => downloadChartImage(button.dataset.downloadChart));
    });
    $$("[data-delete-chart]", chartsGrid).forEach((button) => {
      button.addEventListener("click", () => deleteChart(button.dataset.deleteChart));
    });
    $$("[data-move-chart]", chartsGrid).forEach((button) => {
      button.addEventListener("click", () => moveChart(button.dataset.moveChart, Number(button.dataset.direction)));
    });
    $$("[data-zoom-chart]", chartsGrid).forEach((button) => {
      button.addEventListener("click", () => changeChartZoom(button.dataset.zoomChart, button.dataset.zoomAction));
    });
    $$("[data-edit-selected-node]", chartsGrid).forEach((button) => {
      button.addEventListener("click", () => openNodeDialog(button.dataset.chartId, button.dataset.editSelectedNode));
    });
    $$("[data-node-id]", chartsGrid).forEach((point) => {
      const select = () => selectChartNode(point.dataset.chartId, point.dataset.nodeId);
      point.addEventListener("click", select);
      point.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          select();
        }
      });
    });
    restoreChartScrollPositions();
  }

  function renderChartCard(chart, chartIndex, chartCount) {
    const selectedId = selectedNodeByChart.get(chart.id);
    const selectedNode = chart.nodes.find((node) => node.id === selectedId) || chart.nodes.at(-1) || null;
    if (selectedNode) selectedNodeByChart.set(chart.id, selectedNode.id);
    const primaryColor = chart.series[0]?.color || ALLOWED_COLORS[0];
    const selectedValues = selectedNode
      ? chart.series.map((series) => {
          const raw = selectedNode.values?.[series.id];
          const value = raw === null || raw === undefined ? NaN : Number(raw);
          return Number.isFinite(value)
            ? `<span><i style="--series-color:${series.color}"></i>${escapeHtml(series.name)} <strong>${escapeHtml(formatSeriesValue(series, value))}</strong></span>`
            : "";
        }).join("")
      : "";
    const nodeDetailHtml = selectedNode
      ? `<div class="selected-node-detail">
           <div class="selected-node-heading">
             <span class="selected-node-date">${escapeHtml(selectedNode.x)}</span>
             <div class="selected-node-values">${selectedValues}</div>
           </div>
           <p>${selectedNode.note ? escapeHtml(selectedNode.note) : "这一天还没有写小笔记。"}</p>
         </div>
         <button class="secondary-button" type="button" data-chart-id="${chart.id}" data-edit-selected-node="${selectedNode.id}">设置当前节点</button>`
      : "";
    const chartBody = chart.nodes.length ? renderChartSvg(chart) : renderEmptyChart(chart);

    return `
      <article class="chart-card" style="--chart-color:${primaryColor}">
        <div class="chart-card-head">
          <div class="chart-card-title">
            <div>
              <h3>${escapeHtml(chart.title)}</h3>
              <div class="chart-meta">
                <span><b>${escapeHtml(chart.xLabel)}</b> · ${chart.series.length} 项指标</span>
                <span aria-hidden="true">·</span>
                <span>${chart.nodes.length} 个节点</span>
              </div>
            </div>
          </div>
          <div class="chart-card-actions">
            <button class="chart-action chart-action--add" type="button" data-add-node="${chart.id}">＋ 新节点</button>
            <button class="chart-action chart-action--download" type="button" data-download-chart="${chart.id}">↓ 下载曲线图</button>
            <details class="chart-action-menu">
              <summary aria-label="管理曲线图">•••</summary>
              <div>
                <button class="chart-action chart-action--move" type="button" data-move-chart="${chart.id}" data-direction="-1" aria-label="曲线图上移"${chartIndex === 0 ? " disabled" : ""}>↑ 曲线图上移</button>
                <button class="chart-action chart-action--move" type="button" data-move-chart="${chart.id}" data-direction="1" aria-label="曲线图下移"${chartIndex === chartCount - 1 ? " disabled" : ""}>↓ 曲线图下移</button>
                <button class="chart-action chart-action--settings" type="button" data-edit-chart="${chart.id}"><span aria-hidden="true">⚙</span> 图表设置</button>
                <button class="chart-action chart-action--danger" type="button" data-delete-chart="${chart.id}"><span aria-hidden="true">×</span> 删除图表</button>
              </div>
            </details>
          </div>
        </div>
        <div class="chart-wrap">${chartBody}</div>
        ${selectedNode ? `<div class="chart-card-foot">${nodeDetailHtml}</div>` : ""}
      </article>`;
  }

  function downloadChartImage(chartId) {
    const chart = findChart(chartId);
    if (!chart || !chart.nodes.length) {
      showToast("先添加节点，再下载曲线图");
      return;
    }
    try {
      const canvas = createChartCanvas(chart);
      downloadCanvasAsPng(canvas, `Asoul-${getSpaceTemplate(chart.spaceId).name}-${chart.title}-曲线图.png`);
      showToast("高清曲线图已经下载");
    } catch {
      showToast("曲线图生成失败，请稍后再试");
    }
  }

  function createChartCanvas(chart) {
    const scale = 2;
    const width = 1920;
    const height = 1080;
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const context = canvas.getContext("2d");
    context.scale(scale, scale);
    const template = getSpaceTemplate(chart.spaceId);
    const primary = chart.series[0];
    const primaryColor = primary?.color || "#8f7aea";
    const background = context.createLinearGradient(0, 0, width, height);
    background.addColorStop(0, "#fffdfb");
    background.addColorStop(.52, "#faf8ff");
    background.addColorStop(1, colorMixForCanvas(primaryColor, .08));
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);
    context.fillStyle = colorMixForCanvas(primaryColor, .07);
    context.beginPath();
    context.arc(width - 80, 60, 350, 0, Math.PI * 2);
    context.fill();
    drawCanvasAppIcon(context, width - 145, 64, 76);

    context.fillStyle = primaryColor;
    context.font = "850 22px system-ui, sans-serif";
    context.fillText(`ASOUL ${template.id.toUpperCase()} CURVE`, 86, 88);
    context.fillStyle = "#2f2a40";
    context.font = "900 54px system-ui, sans-serif";
    context.fillText(chart.title, 86, 154);
    context.fillStyle = "#817a89";
    context.font = "650 20px system-ui, sans-serif";
    context.fillText(`${chart.nodes.length} 个节点 · ${chart.xLabel} · 生成于 ${formatFriendlyDate(todayIso())}`, 88, 194);

    let legendX = 88;
    chart.series.forEach((series) => {
      context.fillStyle = series.color;
      context.beginPath();
      context.arc(legendX + 7, 232, 7, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#554f5d";
      context.font = "750 17px system-ui, sans-serif";
      context.fillText(series.name, legendX + 23, 238);
      legendX += 44 + context.measureText(series.name).width;
    });

    const plot = { left: 134, top: 304, right: 106, bottom: 150 };
    const plotWidth = width - plot.left - plot.right;
    const plotHeight = height - plot.top - plot.bottom;
    const xAt = (index) => chart.nodes.length === 1
      ? plot.left + plotWidth / 2
      : plot.left + index / (chart.nodes.length - 1) * plotWidth;
    const seriesData = chart.series.map((series) => {
      const values = chart.nodes.map((node) => {
        const raw = node.values?.[series.id];
        return raw === null || raw === undefined ? NaN : Number(raw);
      }).filter(Number.isFinite);
      let min = values.length ? Math.min(...values) : 0;
      let max = values.length ? Math.max(...values) : 1;
      const range = max - min;
      const padding = range === 0 ? Math.max(Math.abs(max) * .12, 1) : range * .16;
      min = series.axisMin !== null && series.axisMin !== undefined && Number.isFinite(Number(series.axisMin)) ? Number(series.axisMin) : Math.max(0, min - padding);
      max = series.axisMax !== null && series.axisMax !== undefined && Number.isFinite(Number(series.axisMax)) ? Number(series.axisMax) : max + padding;
      if (max <= min) max = min + Math.max(Math.abs(min) * .12, 1);
      const points = chart.nodes.map((node, index) => {
        const raw = node.values?.[series.id];
        const value = raw === null || raw === undefined ? NaN : Number(raw);
        if (!Number.isFinite(value)) return null;
        const visible = Math.max(min, Math.min(max, value));
        return { node, value, x: xAt(index), y: plot.top + (max - visible) / (max - min) * plotHeight };
      }).filter(Boolean);
      return { ...series, min, max, points };
    });

    for (let index = 0; index < 5; index += 1) {
      const ratio = index / 4;
      const y = plot.top + ratio * plotHeight;
      context.strokeStyle = "rgba(87,102,144,.11)";
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(plot.left, y);
      context.lineTo(width - plot.right, y);
      context.stroke();
      context.fillStyle = "#858091";
      context.font = "650 16px system-ui, sans-serif";
      context.textAlign = "right";
      context.fillText(formatSeriesValue(seriesData[0], seriesData[0].max - ratio * (seriesData[0].max - seriesData[0].min)), plot.left - 18, y + 6);
    }
    context.textAlign = "left";

    seriesData.forEach((series, seriesIndex) => {
      if (!series.points.length) return;
      if (seriesIndex === 0 && series.points.length > 1) {
        const gradient = context.createLinearGradient(0, plot.top, 0, plot.top + plotHeight);
        gradient.addColorStop(0, colorMixForCanvas(series.color, .18));
        gradient.addColorStop(1, colorMixForCanvas(series.color, 0));
        context.beginPath();
        drawCanvasSmoothPath(context, series.points);
        context.lineTo(series.points.at(-1).x, plot.top + plotHeight);
        context.lineTo(series.points[0].x, plot.top + plotHeight);
        context.closePath();
        context.fillStyle = gradient;
        context.fill();
      }
      context.beginPath();
      drawCanvasSmoothPath(context, series.points);
      context.strokeStyle = series.color;
      context.lineWidth = seriesIndex === 0 ? 8 : 6;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.stroke();
      series.points.forEach((point) => {
        context.fillStyle = "#fff";
        context.beginPath();
        context.arc(point.x, point.y, 13, 0, Math.PI * 2);
        context.fill();
        context.strokeStyle = series.color;
        context.lineWidth = 6;
        context.stroke();
      });
    });

    const maxLabels = 9;
    const labelEvery = Math.max(1, Math.ceil((chart.nodes.length - 1) / Math.max(1, maxLabels - 1)));
    chart.nodes.forEach((node, index) => {
      const x = xAt(index);
      if (index === 0 || index === chart.nodes.length - 1 || index % labelEvery === 0) {
        context.fillStyle = "#777182";
        context.font = "700 17px system-ui, sans-serif";
        context.textAlign = "center";
        context.fillText(formatChartAxisLabel(node.x, index === 0), x, height - 102);
      }
      const sticker = Object.values(node.stickers || {}).map(safeSticker).find(Boolean) || safeSticker(node.sticker);
      const image = canvasImageCache.get(sticker);
      if (image?.complete && image.naturalWidth) {
        const spacing = plotWidth / Math.max(1, chart.nodes.length - 1);
        const size = Math.max(28, Math.min(58, spacing * .42));
        const primaryPoint = seriesData[0].points.find((point) => point.node.id === node.id);
        if (primaryPoint) drawCanvasSticker(context, image, primaryPoint.x - size / 2, primaryPoint.y - size - 26, size);
      }
    });
    context.textAlign = "left";
    context.fillStyle = "#8b8592";
    context.font = "600 16px system-ui, sans-serif";
    context.fillText("曲线图会采用每条曲线自己的纵轴范围；此图显示左侧第一项指标刻度。", 88, height - 44);
    return canvas;
  }

  function drawCanvasSmoothPath(context, points) {
    if (!points.length) return;
    context.moveTo(points[0].x, points[0].y);
    for (let index = 0; index < points.length - 1; index += 1) {
      const current = points[index];
      const next = points[index + 1];
      const offset = (next.x - current.x) * .38;
      context.bezierCurveTo(current.x + offset, current.y, next.x - offset, next.y, next.x, next.y);
    }
  }

  function renderEmptyChart(chart) {
    const names = chart.series.map((item) => item.name).join("、");
    return `
      <div class="chart-empty">
        <div class="chart-empty-inner">
          <div class="chart-empty-line" aria-hidden="true"></div>
          <h4>这张图还没有节点</h4>
        <p>添加第一个“${escapeHtml(chart.xLabel)} / ${escapeHtml(names)}”记录后，曲线就会从这里开始生长。</p>
          <button class="secondary-button" type="button" data-add-node="${chart.id}">
            <span aria-hidden="true">＋</span> 添加第一个节点
          </button>
        </div>
      </div>`;
  }

  function renderChartSvg(chart) {
    const zoom = chartZoomById.get(chart.id) || 1;
    const zoomIndex = Math.max(0, CHART_ZOOM_LEVELS.indexOf(zoom));
    const canZoom = chart.nodes.length > 1;
    const compactChart = window.matchMedia("(max-width: 900px)").matches;
    const visualScale = 1 + zoomIndex * (compactChart ? 0.18 : 0.1);
    const baseWidth = compactChart ? 360 : 920;
    const width = Math.round(baseWidth * zoom);
    const height = Math.round((compactChart ? 360 : 370) * (1 + zoomIndex * 0.08));
    const margin = {
      top: Math.round((compactChart ? 54 : 58) * visualScale),
      right: Math.round((compactChart ? 18 : 34) * visualScale),
      bottom: Math.round((compactChart ? 51 : 62) * visualScale),
      left: Math.round((chart.series.length > 1 ? (compactChart ? 66 : 112) : (compactChart ? 48 : 76)) * visualScale),
    };
    const axisFontSize = (compactChart ? 10 : 11) * visualScale;
    const axisNameSize = (compactChart ? 10.5 : 12) * visualScale;
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const xAt = (index) => chart.nodes.length === 1
      ? margin.left + plotWidth / 2
      : margin.left + (index / (chart.nodes.length - 1)) * plotWidth;
    const seriesData = chart.series.map((series) => {
      const finiteValues = chart.nodes
        .map((node) => {
          const raw = node.values?.[series.id];
          return raw === null || raw === undefined ? NaN : Number(raw);
        })
        .filter(Number.isFinite);
      const hasData = finiteValues.length > 0;
      let automaticMin = finiteValues.length ? Math.min(...finiteValues) : 0;
      let automaticMax = finiteValues.length ? Math.max(...finiteValues) : 1;
      const naturalRange = automaticMax - automaticMin;
      const padding = naturalRange === 0 ? Math.max(Math.abs(automaticMax) * 0.12, 1) : naturalRange * 0.16;
      automaticMin = Math.max(0, automaticMin - padding);
      automaticMax += padding;
      const customMin = series.axisMin !== null && series.axisMin !== undefined && Number.isFinite(Number(series.axisMin)) ? Number(series.axisMin) : null;
      const customMax = series.axisMax !== null && series.axisMax !== undefined && Number.isFinite(Number(series.axisMax)) ? Number(series.axisMax) : null;
      let min = customMin ?? automaticMin;
      let max = customMax ?? automaticMax;
      if (max <= min) {
        const fallbackRange = Math.max(Math.abs(min) * 0.12, 1);
        if (customMax !== null && customMin === null) min = max - fallbackRange;
        else max = min + fallbackRange;
      }
      const points = chart.nodes.map((node, index) => {
        const raw = node.values?.[series.id];
        const value = raw === null || raw === undefined ? NaN : Number(raw);
        if (!Number.isFinite(value)) return null;
        const visibleValue = Math.max(min, Math.min(max, value));
        return {
          node,
          value,
          px: xAt(index),
          py: margin.top + ((max - visibleValue) / (max - min)) * plotHeight,
        };
      }).filter(Boolean);
      return { ...series, min, max, points, pointByNode: new Map(points.map((point) => [point.node.id, point])), hasData };
    });

    const baseline = margin.top + plotHeight;
    const primary = seriesData[0];
    const primaryPath = smoothPath(primary.points);
    const areaPath = primary.points.length > 1
      ? `${primaryPath} L ${primary.points.at(-1).px.toFixed(2)} ${baseline} L ${primary.points[0].px.toFixed(2)} ${baseline} Z`
      : "";
    const gradientId = `gradient-${chart.id}-${primary.id}`;
    const tickCount = 5;

    const grid = Array.from({ length: tickCount }, (_, index) => {
      const ratio = index / (tickCount - 1);
      const y = margin.top + ratio * plotHeight;
      const value = primary.max - ratio * (primary.max - primary.min);
      const scaleLabels = seriesData
        .filter((item) => item.hasData)
        .map((item, seriesIndex) => `${seriesIndex ? '<tspan class="chart-axis-separator"> / </tspan>' : ""}<tspan style="fill:${item.color}">${escapeXml(formatSeriesValue(item, item.max - ratio * (item.max - item.min)))}</tspan>`)
        .join("");
      return `
        <line class="chart-grid-line" x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" />
        <text class="chart-axis-text${chart.series.length > 1 ? " chart-axis-text--multi" : ""}" style="font-size:${axisFontSize.toFixed(2)}px" x="${margin.left - 9 * visualScale}" y="${y + 4 * visualScale}" text-anchor="end">${chart.series.length === 1 ? escapeXml(formatNumber(value)) : scaleLabels}</text>`;
    }).join("");

    const nodeSpacing = plotWidth / Math.max(chart.nodes.length - 1, 1);
    const maxLabels = Math.max(2, Math.floor(plotWidth / 96));
    const labelEvery = Math.max(1, Math.ceil(Math.max(chart.nodes.length - 1, 1) / Math.max(maxLabels - 1, 1)));
    const parsedNodeDates = chart.nodes.map((node) => parseChartDate(node.x));
    const xLabels = chart.nodes.map((node, index) => {
      const date = parsedNodeDates[index];
      const previousDate = parsedNodeDates[index - 1];
      const yearChanged = Boolean(date?.year && previousDate?.year && date.year !== previousDate.year);
      if (index !== 0 && index !== chart.nodes.length - 1 && index % labelEvery !== 0 && !yearChanged) return "";
      return `<text class="chart-axis-text" style="font-size:${axisFontSize.toFixed(2)}px" x="${xAt(index)}" y="${height - 21 * visualScale}" text-anchor="middle">${escapeXml(formatChartAxisLabel(node.x, index === 0 || yearChanged))}</text>`;
    }).join("");

    const lineMarkup = seriesData.map((item) => {
      const path = smoothPath(item.points);
      const lineWidth = (compactChart ? 2.8 : 3) * visualScale;
      return `<path class="chart-line" style="--chart-color:${item.color};stroke-width:${lineWidth.toFixed(2)}" d="${path}" />`;
    }).join("");

    const pointMarkup = chart.nodes.map((node, nodeIndex) => {
      const pointValues = seriesData.map((item) => ({
        series: item,
        point: item.pointByNode.get(node.id),
      })).filter((item) => item.point);
      const label = `${node.x}：${pointValues.map(({ series, point }) => `${series.name} ${formatSeriesValue(series, point.value)}`).join("；")}`;
      const isSelected = selectedNodeByChart.get(chart.id) === node.id;
      const showPointMarker = isSelected || nodeSpacing >= 14 || nodeIndex % labelEvery === 0 || nodeIndex === chart.nodes.length - 1;
      const desiredStickerSize = (seriesData.length > 1 ? 29 : 38) * visualScale;
      const stickerSize = Math.max(20 * visualScale, Math.min(desiredStickerSize, nodeSpacing * .86));
      const stickerMarkup = pointValues.map(({ series, point }, pointIndex) => {
        const sticker = safeSticker(node.stickers?.[series.id] ?? (pointIndex === 0 ? node.sticker : ""));
        if (!sticker) return "";
        const centerX = point.px + (pointIndex - (pointValues.length - 1) / 2) * (stickerSize + 4);
        const centerY = point.py - stickerSize / 2 - 12 * visualScale;
        const clipRadius = stickerSize / 2;
        const clipId = `clip-${chart.id}-${node.id}-${series.id}`;
        return `<circle class="point-sticker-bg" cx="${centerX}" cy="${centerY}" r="${clipRadius + 3}" />
          <clipPath id="${clipId}"><circle cx="${centerX}" cy="${centerY}" r="${clipRadius}" /></clipPath>
          <image href="${escapeAttr(assetUrl(sticker))}" x="${centerX - clipRadius}" y="${centerY - clipRadius}" width="${stickerSize}" height="${stickerSize}" preserveAspectRatio="xMidYMid meet" clip-path="url(#${clipId})" />`;
      }).join("");
      const cores = showPointMarker ? pointValues.map(({ series, point }) => `
        <circle class="point-halo" style="--chart-color:${series.color}" cx="${point.px}" cy="${point.py}" r="${(10 * visualScale).toFixed(2)}" />
        <circle class="point-core" style="--chart-color:${series.color}" cx="${point.px}" cy="${point.py}" r="${(6 * visualScale).toFixed(2)}" />
      `).join("") : "";
      const hitWidth = Math.max(10 * visualScale, Math.min(42 * visualScale, plotWidth / Math.max(chart.nodes.length, 1)));
      return `
        <g class="chart-point${isSelected ? " is-selected" : ""}" role="button" tabindex="0" aria-pressed="${isSelected}" aria-label="${escapeAttr(label)}，点击查看" data-chart-id="${chart.id}" data-node-id="${node.id}">
          <title>${escapeXml(label)}，点击查看当天记录</title>
          <rect class="node-hit-area" x="${xAt(nodeIndex) - hitWidth / 2}" y="${margin.top}" width="${hitWidth}" height="${plotHeight}" />
          ${stickerMarkup}
          ${cores}
        </g>`;
    }).join("");

    const rangeSummary = seriesData.map((item) => `
      <span><i style="--series-color:${item.color}"></i>${escapeHtml(item.name)}：${item.hasData ? `${formatSeriesValue(item, item.min)}—${formatSeriesValue(item, item.max)}` : "暂无数据"}${(item.axisMin !== null && item.axisMin !== undefined) || (item.axisMax !== null && item.axisMax !== undefined) ? " · 自定纵轴" : ""}</span>
    `).join("");
    const axisSeriesNames = seriesData.map((item, index) => `
      ${index ? '<tspan class="chart-axis-separator" dx="10">·</tspan>' : ""}<tspan class="chart-axis-series-name" style="fill:${item.color}"${index ? ' dx="10"' : ""}>● ${escapeXml(item.name)}</tspan>
    `).join("");

    return `
      <div class="chart-range-summary">
        ${rangeSummary}
        ${chart.series.length > 1 ? `<small>纵轴数值按曲线颜色对应，各项指标使用独立刻度</small>` : ""}
      </div>
      <div class="chart-zoom-bar" aria-label="曲线图缩放">
        <button type="button" data-zoom-chart="${chart.id}" data-zoom-action="out"${!canZoom || zoomIndex <= 0 ? " disabled" : ""}>− 缩小</button>
        <strong>${zoom}×</strong>
        <button type="button" data-zoom-chart="${chart.id}" data-zoom-action="in"${!canZoom || zoomIndex >= CHART_ZOOM_LEVELS.length - 1 ? " disabled" : ""}>＋ 放大</button>
      </div>
      <div class="chart-scroll" data-chart-scroll="${chart.id}" tabindex="0" aria-label="可横向滑动的${escapeAttr(chart.title)}曲线图">
      <svg class="chart-svg" style="width:${zoom * 100}%;min-width:${zoom * 100}%;max-width:none;aspect-ratio:${width}/${height};--chart-visual-scale:${visualScale}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttr(chart.title)}曲线图">
        <defs>
          <linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${primary.color}" stop-opacity="0.24" />
            <stop offset="100%" stop-color="${primary.color}" stop-opacity="0" />
          </linearGradient>
        </defs>
        ${grid}
        <text class="chart-axis-name chart-axis-name--series" style="font-size:${axisNameSize.toFixed(2)}px" x="${margin.left}" y="${22 * visualScale}">${axisSeriesNames}</text>
        <text class="chart-axis-name" style="font-size:${axisNameSize.toFixed(2)}px" x="${width - margin.right}" y="${height - 6 * visualScale}" text-anchor="end">${escapeXml(chart.xLabel)}</text>
        ${areaPath ? `<path class="chart-area" d="${areaPath}" fill="url(#${gradientId})" />` : ""}
        ${lineMarkup}
        ${xLabels}
        ${pointMarkup}
      </svg>
      </div>`;
  }

  function smoothPath(points) {
    if (!points.length) return "";
    if (points.length === 1) return `M ${points[0].px.toFixed(2)} ${points[0].py.toFixed(2)}`;
    if (points.length === 2) {
      return `M ${points[0].px.toFixed(2)} ${points[0].py.toFixed(2)} L ${points[1].px.toFixed(2)} ${points[1].py.toFixed(2)}`;
    }

    let path = `M ${points[0].px.toFixed(2)} ${points[0].py.toFixed(2)}`;
    for (let index = 0; index < points.length - 1; index += 1) {
      const current = points[index];
      const next = points[index + 1];
      const controlOffset = (next.px - current.px) * 0.38;
      path += ` C ${(current.px + controlOffset).toFixed(2)} ${current.py.toFixed(2)}, ${(next.px - controlOffset).toFixed(2)} ${next.py.toFixed(2)}, ${next.px.toFixed(2)} ${next.py.toFixed(2)}`;
    }
    return path;
  }

  function openNodeDialog(chartId, nodeId = null) {
    const chart = findChart(chartId);
    if (!chart) return;
    const node = nodeId ? chart.nodes.find((item) => item.id === nodeId) : null;

    activeNodeChartId = chartId;
    editingNodeId = nodeId;
    activeNodeStickerSeriesId = chart.series[0]?.id || "";
    selectedNodeStickers = Object.fromEntries(chart.series.map((series, index) => [
      series.id,
      safeSticker(node?.stickers?.[series.id] ?? (index === 0 ? node?.sticker : "")),
    ]));
    nodeForm.reset();
    $("#nodeDialogTitle").textContent = node ? "修改这个节点" : "记录一个新节点";
    $("#nodeXLabel").textContent = chart.xLabel;
    nodeForm.elements.x.placeholder = `填写${chart.xLabel}`;
    nodeSeriesFields.innerHTML = chart.series.map((series) => `
      <label class="field node-series-field">
        <span><i style="--series-color:${series.color}"></i>${escapeHtml(series.name)}</span>
        <input data-node-series-id="${series.id}" inputmode="decimal" required placeholder="${/配速/.test(series.name) ? "例如：5:30" : `填写${escapeAttr(series.name)}的数值`}" />
      </label>
    `).join("");
    deleteNodeButton.hidden = !node;

    if (node) {
      nodeForm.elements.x.value = node.x;
      nodeForm.elements.note.value = node.note;
      chart.series.forEach((series) => {
        const input = $(`[data-node-series-id="${series.id}"]`, nodeSeriesFields);
        const raw = node.values?.[series.id];
        const value = raw === null || raw === undefined ? NaN : Number(raw);
        if (input && Number.isFinite(value)) input.value = formatSeriesInput(series, value);
      });
    } else if (/日期|时间|day|date/i.test(chart.xLabel)) {
      nodeForm.elements.x.value = todayIso();
    }

    renderNodeStickerSeriesTabs(chart);
    renderStickerGrid();
    nodeDialog.showModal();
    focusDialogFieldWithoutScrolling(nodeForm, nodeForm.elements.x);
  }

  function saveNodeFromDialog(event) {
    event.preventDefault();
    if (!nodeForm.reportValidity()) return;
    const chart = findChart(activeNodeChartId);
    if (!chart) return;
    const data = new FormData(nodeForm);
    const values = {};
    for (const series of chart.series) {
      const input = $(`[data-node-series-id="${series.id}"]`, nodeSeriesFields);
      const value = parseSeriesValue(series, input?.value);
      if (!Number.isFinite(value)) {
        showToast(`${series.name}需要填写有效数字`);
        input?.focus();
        return;
      }
      values[series.id] = value;
    }
    const stickers = {};
    chart.series.forEach((series) => {
      const sticker = safeSticker(selectedNodeStickers[series.id]);
      if (sticker) stickers[series.id] = sticker;
    });
    const next = {
      x: safeString(data.get("x"), 24),
      values,
      note: safeString(data.get("note"), 120),
      sticker: stickers[chart.series[0]?.id] || "",
      stickers,
    };

    if (editingNodeId) {
      const node = chart.nodes.find((item) => item.id === editingNodeId);
      if (!node) return;
      Object.assign(node, next);
      selectedNodeByChart.set(chart.id, node.id);
      showToast("节点已经更新");
    } else {
      const node = { id: makeId(), ...next, createdAt: Date.now() };
      chart.nodes.push(node);
      selectedNodeByChart.set(chart.id, node.id);
      showToast("新节点已经记下来了");
    }

    Object.values(stickers).forEach(preloadCanvasAsset);

    saveState(false);
    nodeDialog.close();
    renderCharts();
  }

  function deleteActiveNode() {
    const chart = findChart(activeNodeChartId);
    if (!chart || !editingNodeId) return;
    if (!window.confirm("确定删除这个节点吗？这一步无法撤销。")) return;
    chart.nodes = chart.nodes.filter((node) => node.id !== editingNodeId);
    selectedNodeByChart.delete(chart.id);
    saveState(false);
    nodeDialog.close();
    renderCharts();
    showToast("节点已删除");
  }

  function deleteChart(chartId) {
    const chart = findChart(chartId);
    if (!chart) return;
    if (!window.confirm(`确定删除“${chart.title}”及其中的全部节点吗？`)) return;
    state.charts = state.charts.filter((item) => item.id !== chartId);
    selectedNodeByChart.delete(chartId);
    chartZoomById.delete(chartId);
    chartScrollById.delete(chartId);
    saveState(false);
    renderCharts();
    showToast("图表已删除");
  }

  function selectChartNode(chartId, nodeId) {
    const chart = findChart(chartId);
    if (!chart?.nodes.some((node) => node.id === nodeId)) return;
    selectedNodeByChart.set(chartId, nodeId);
    renderCharts();
  }

  function moveChart(chartId, direction) {
    const spaceCharts = getActiveSpaceCharts();
    const index = spaceCharts.findIndex((chart) => chart.id === chartId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= spaceCharts.length) return;
    const sourceIndex = state.charts.findIndex((chart) => chart.id === spaceCharts[index].id);
    const targetIndex = state.charts.findIndex((chart) => chart.id === spaceCharts[target].id);
    [state.charts[sourceIndex], state.charts[targetIndex]] = [state.charts[targetIndex], state.charts[sourceIndex]];
    saveState(false);
    renderCharts();
    showToast(direction < 0 ? "图表已上移" : "图表已下移");
  }

  function captureChartScrollPositions() {
    $$("[data-chart-scroll]", chartsGrid).forEach((scroller) => {
      const maxScroll = scroller.scrollWidth - scroller.clientWidth;
      if (maxScroll > 0) chartScrollById.set(scroller.dataset.chartScroll, scroller.scrollLeft / maxScroll);
      else if (!chartScrollById.has(scroller.dataset.chartScroll)) chartScrollById.set(scroller.dataset.chartScroll, 0);
    });
  }

  function restoreChartScrollPositions() {
    window.requestAnimationFrame(() => {
      $$("[data-chart-scroll]", chartsGrid).forEach((scroller) => {
        const ratio = chartScrollById.get(scroller.dataset.chartScroll) || 0;
        scroller.scrollLeft = ratio * Math.max(0, scroller.scrollWidth - scroller.clientWidth);
      });
    });
  }

  function changeChartZoom(chartId, action) {
    const current = chartZoomById.get(chartId) || 1;
    const index = Math.max(0, CHART_ZOOM_LEVELS.indexOf(current));
    const chart = findChart(chartId);
    if (current === 1 && action === "in" && chart?.nodes.length > 1) {
      const selectedId = selectedNodeByChart.get(chartId);
      const selectedIndex = Math.max(0, chart.nodes.findIndex((node) => node.id === selectedId));
      chartScrollById.set(chartId, selectedIndex / (chart.nodes.length - 1));
    }
    if (action === "reset") chartScrollById.set(chartId, 0);
    const next = action === "reset"
      ? 1
      : CHART_ZOOM_LEVELS[Math.max(0, Math.min(CHART_ZOOM_LEVELS.length - 1, index + (action === "in" ? 1 : -1)))];
    chartZoomById.set(chartId, next);
    renderCharts();
  }

  function renderStickerTabs() {
    stickerTabs.innerHTML = Object.keys(STICKER_PACKS).map((name) => `
      <button class="sticker-tab${name === activeStickerPack ? " is-active" : ""}" type="button" role="tab" aria-selected="${name === activeStickerPack}" data-sticker-pack="${name}">${name}</button>
    `).join("");

    $$("[data-sticker-pack]", stickerTabs).forEach((button) => {
      button.addEventListener("click", () => {
        activeStickerPack = button.dataset.stickerPack;
        renderStickerTabs();
        renderStickerGrid();
      });
    });
  }

  function renderStickerGrid() {
    const stickers = STICKER_PACKS[activeStickerPack] || [];
    const activeSticker = safeSticker(selectedNodeStickers[activeNodeStickerSeriesId]);
    stickerGrid.innerHTML = `
      <button class="sticker-item${activeSticker ? "" : " is-selected"}" type="button" data-sticker="" aria-label="不使用表情"><span class="sticker-none">不选</span></button>
      ${stickers.map((path, index) => `
        <button class="sticker-item${activeSticker === path ? " is-selected" : ""}" type="button" data-sticker="${escapeAttr(path)}" aria-label="${activeStickerPack}表情 ${index + 1}">
          <img src="${escapeAttr(path)}" alt="" loading="lazy" />
        </button>
      `).join("")}`;

    $$("[data-sticker]", stickerGrid).forEach((button) => {
      button.addEventListener("click", () => {
        if (!activeNodeStickerSeriesId) return;
        selectedNodeStickers[activeNodeStickerSeriesId] = safeSticker(button.dataset.sticker);
        renderStickerGrid();
      });
    });

  }

  function renderNodeStickerSeriesTabs(chart) {
    nodeStickerSeriesTabs.innerHTML = chart.series.map((series) => `
      <button class="node-sticker-series-tab${series.id === activeNodeStickerSeriesId ? " is-active" : ""}" type="button" role="tab" aria-selected="${series.id === activeNodeStickerSeriesId}" data-node-sticker-series="${series.id}" style="--series-color:${series.color}">
        <i aria-hidden="true"></i>${escapeHtml(series.name)}
      </button>
    `).join("");
    $$("[data-node-sticker-series]", nodeStickerSeriesTabs).forEach((button) => {
      button.addEventListener("click", () => {
        activeNodeStickerSeriesId = button.dataset.nodeStickerSeries;
        renderNodeStickerSeriesTabs(chart);
        renderStickerGrid();
      });
    });
  }

  function openAvatarDialog() {
    pendingAvatarSticker = safeSticker(state.profile.avatar);
    renderAvatarTabs();
    renderAvatarGrid();
    avatarDialog.showModal();
  }

  function renderAvatarTabs() {
    avatarStickerTabs.innerHTML = Object.keys(STICKER_PACKS).map((name) => `
      <button class="sticker-tab${name === activeAvatarPack ? " is-active" : ""}" type="button" role="tab" aria-selected="${name === activeAvatarPack}" data-avatar-pack="${name}">${name}</button>
    `).join("");

    $$('[data-avatar-pack]', avatarStickerTabs).forEach((button) => {
      button.addEventListener("click", () => {
        activeAvatarPack = button.dataset.avatarPack;
        renderAvatarTabs();
        renderAvatarGrid();
      });
    });
  }

  function renderAvatarGrid() {
    const stickers = STICKER_PACKS[activeAvatarPack] || [];
    avatarStickerGrid.innerHTML = stickers.map((path, index) => `
      <button class="sticker-item${pendingAvatarSticker === path ? " is-selected" : ""}" type="button" data-avatar-sticker="${escapeAttr(path)}" aria-label="${activeAvatarPack}头像 ${index + 1}">
        <img src="${escapeAttr(path)}" alt="" loading="lazy" />
      </button>
    `).join("");

    $$('[data-avatar-sticker]', avatarStickerGrid).forEach((button) => {
      button.addEventListener("click", () => {
        pendingAvatarSticker = safeSticker(button.dataset.avatarSticker);
        renderAvatarGrid();
      });
    });
  }

  function saveAvatarFromDialog(event) {
    event.preventDefault();
    if (!pendingAvatarSticker) {
      showToast("先挑一个喜欢的表情吧");
      return;
    }
    state.profile.avatar = pendingAvatarSticker;
    renderProfileAvatar();
    saveState();
    avatarDialog.close();
    showToast("表情包头像换好啦");
  }

  function clearAvatar() {
    state.profile.avatar = "";
    pendingAvatarSticker = "";
    renderProfileAvatar();
    saveState();
    avatarDialog.close();
    showToast("已恢复默认头像");
  }

  function openJokeEditor() {
    renderJokeEditor(coldJokes);
    jokeEditorDialog.showModal();
  }

  function collectJokeEditorRows(keepEmpty = false) {
    return $$(".joke-editor-row", jokeEditorList).map((row) => ({
      question: safeString($("[data-joke-question]", row)?.value, 160),
      answer: safeString($("[data-joke-answer]", row)?.value, 160),
    })).filter((joke) => keepEmpty || (joke.question && joke.answer));
  }

  function renderJokeEditor(jokes) {
    const items = jokes.length ? jokes : [{ question: "", answer: "" }];
    jokeEditorList.innerHTML = items.map((joke, index) => `
      <div class="joke-editor-row">
        <span class="joke-editor-number">${index + 1}</span>
        <label class="field">
          <span>题目</span>
          <textarea data-joke-question maxlength="160" rows="2" placeholder="例如：生蚝掉进泥土里……">${escapeHtml(joke.question)}</textarea>
        </label>
        <label class="field">
          <span>答案</span>
          <textarea data-joke-answer maxlength="160" rows="2" placeholder="例如：蚝喜欢泥。">${escapeHtml(joke.answer)}</textarea>
        </label>
        <button class="joke-remove-row" type="button" data-remove-joke="${index}" aria-label="删除第 ${index + 1} 条笑话">×</button>
      </div>
    `).join("");

    $$("[data-remove-joke]", jokeEditorList).forEach((button) => {
      button.addEventListener("click", () => {
        const draft = collectJokeEditorRows(true);
        draft.splice(Number(button.dataset.removeJoke), 1);
        renderJokeEditor(draft);
      });
    });
  }

  function addJokeEditorRow() {
    const draft = collectJokeEditorRows(true);
    if (draft.length >= 100) {
      showToast("最多保存 100 条冷笑话");
      return;
    }
    draft.push({ question: "", answer: "" });
    renderJokeEditor(draft);
    const lastQuestion = $(".joke-editor-row:last-child [data-joke-question]", jokeEditorList);
    lastQuestion?.focus();
    lastQuestion?.scrollIntoView({ block: "nearest" });
  }

  function saveJokesFromEditor(event) {
    event.preventDefault();
    const next = collectJokeEditorRows(false);
    if (!next.length) {
      showToast("至少保留一条题目和答案都完整的笑话");
      return;
    }
    coldJokes = next;
    currentJokeIndex = -1;
    saveJokes();
    showRandomJoke();
    jokeEditorDialog.close();
    showToast("冷笑话卡片已经更新");
  }

  function resetJokesToFile() {
    if (!window.confirm("确定恢复为冷笑话.js 里的内容吗？网页里自行编辑的版本会被覆盖。\n\n如果刚替换过文件，请先按 Ctrl + F5 刷新网页，否则仍会恢复旧版本。")) return;
    coldJokes = DEFAULT_COLD_JOKES.map((joke) => ({ ...joke }));
    currentJokeIndex = -1;
    saveJokes();
    renderJokeEditor(coldJokes);
    showRandomJoke();
    showToast("已恢复文件里的冷笑话");
  }

  function exportJokesFile() {
    const header = `/* 从 Asoul 一个魂生活日记导出，可继续在网页中管理。 */\n`;
    const source = `${header}window.ASOUL_COLD_JOKES = ${JSON.stringify(collectJokeEditorRows(false), null, 2)};\n`;
    downloadTextFile("冷笑话.js", source, "text/javascript;charset=utf-8");
    showToast("新的冷笑话.js 已下载");
  }

  function showRandomJoke() {
    if (!coldJokes.length) {
      $("#jokeQuestion").textContent = "在冷笑话.js 里添加你的第一条冷笑话吧。";
      $("#jokeAnswerText").textContent = "等待一个有灵魂的答案。";
      $("#nextJokeButton").disabled = true;
      return;
    }
    $("#nextJokeButton").disabled = false;
    let nextIndex = currentJokeIndex;
    while (nextIndex === currentJokeIndex && coldJokes.length > 1) {
      nextIndex = Math.floor(Math.random() * coldJokes.length);
    }
    currentJokeIndex = nextIndex;
    const joke = coldJokes[currentJokeIndex];
    $("#jokeQuestion").textContent = joke.question;
    $("#jokeAnswerText").textContent = joke.answer;
    $("#jokeAnswer").hidden = true;
    $("#revealJokeButton").hidden = false;
  }

  function revealJokeAnswer() {
    $("#jokeAnswer").hidden = false;
    $("#revealJokeButton").hidden = true;
  }

  function exportBackup() {
    const backup = {
      backupType: "asoul-life-diary",
      exportedAt: new Date().toISOString(),
      ...state,
      jokes: coldJokes,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const date = todayIso();
    anchor.href = url;
    anchor.download = `Asoul生活日记-备份-${date}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1200);
    rememberManualBackup();
    showToast("备份文件已下载");
  }

  function downloadTextFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1200);
  }

  async function importBackup(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const imported = JSON.parse(await file.text());
      if (!isDiaryBackupPayload(imported)) throw new Error("invalid backup structure");
      const nextState = normalizeState(imported);
      if (!window.confirm("恢复备份会覆盖当前页面里的资料，确定继续吗？")) return;
      state = nextState;
      stateSaveBlocked = false;
      stateLoadIssue = "";
      const importedJokes = normalizeJokes(imported.jokes);
      if (importedJokes.length) {
        coldJokes = importedJokes;
        currentJokeIndex = -1;
        saveJokes();
        showRandomJoke();
      }
      saveState(false);
      selectedNodeByChart.clear();
      selectedDayByWeek.clear();
      chartZoomById.clear();
      chartScrollById.clear();
      selectedGoalId = state.goals[0]?.id || null;
      selectedProgressGoalId = state.progressGoals[0]?.id || null;
      hydrateProfileForm();
      renderProfileAvatar();
      renderGoals();
      renderProgressGoals();
      activeSpaceId = safeSpaceId(state.activeSpaceId);
      const activeWeeks = getActiveSpaceWeeks();
      const activePeriods = getActiveSpacePeriods();
      selectedWeekId = pickRelevantWeek(activeWeeks)?.id || null;
      if (activePeriods.length) weekYearFilter = activePeriods.at(-1).yearMonth.slice(0, 4);
      weekMonthFilter = activePeriods.at(-1)?.yearMonth.slice(5, 7) || "";
      renderSpaceSwitcher();
      renderWeeks();
      renderCharts();
      preloadCanvasAssets();
      showToast("生活日记已恢复");
    } catch (error) {
      showToast(error?.code === DATA_MODEL.UNSUPPORTED_VERSION_CODE
        ? "这个备份来自更新版本，请使用新版日记恢复"
        : "这个文件不是有效的生活日记备份");
    } finally {
      event.target.value = "";
    }
  }

  function isDiaryBackupPayload(candidate) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return false;
    if (candidate.backupType && !["asoul-health-diary", "asoul-life-diary"].includes(candidate.backupType)) return false;
    const hasProfile = candidate.profile && typeof candidate.profile === "object" && !Array.isArray(candidate.profile);
    const hasCharts = Array.isArray(candidate.charts);
    const hasWeeks = candidate.weeks === undefined || Array.isArray(candidate.weeks) || Array.isArray(candidate.weeklyPlans);
    return hasProfile && hasCharts && hasWeeks;
  }

  function findChart(id) {
    return state.charts.find((chart) => chart.id === id);
  }

  function makeId() {
    if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
    return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function safeId(value) {
    const text = String(value || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
    return text || makeId();
  }

  function safeString(value, maxLength) {
    return String(value ?? "").trim().slice(0, maxLength);
  }

  function safeDate(value) {
    const text = String(value || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return "";
    const [year, month, day] = text.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    const isExactDate = date.getFullYear() === year
      && date.getMonth() === month - 1
      && date.getDate() === day;
    return isExactDate ? text : "";
  }

  function safeWeight(value) {
    const text = String(value ?? "").trim();
    if (!text) return null;
    const weight = Number(text);
    if (!Number.isFinite(weight) || weight < 20 || weight > 500) return null;
    return Math.round(weight * 100) / 100;
  }

  function formatWeight(value) {
    return value === null || value === undefined ? "未填写" : `${formatNumber(value)} 斤`;
  }

  function todayIso() {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 10);
  }

  function startOfWeekIso(value) {
    const dateValue = safeDate(value) || todayIso();
    const date = new Date(`${dateValue}T12:00:00`);
    const offset = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - offset);
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 10);
  }

  function getMonthMondays(yearMonth) {
    if (!/^\d{4}-\d{2}$/.test(String(yearMonth || ""))) return [];
    const date = new Date(`${yearMonth}-01T12:00:00`);
    const offset = (8 - date.getDay()) % 7;
    date.setDate(date.getDate() + offset);
    const mondays = [];
    while (true) {
      const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
      const value = local.toISOString().slice(0, 10);
      if (!value.startsWith(yearMonth)) break;
      mondays.push(value);
      date.setDate(date.getDate() + 7);
    }
    return mondays;
  }

  function addDaysIso(value, amount) {
    const base = safeDate(value) || todayIso();
    const date = new Date(`${base}T12:00:00`);
    date.setDate(date.getDate() + Number(amount || 0));
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 10);
  }

  function formatMonthDay(value) {
    const date = new Date(`${safeDate(value) || todayIso()}T12:00:00`);
    return new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric" }).format(date);
  }

  function formatFriendlyDate(value) {
    const date = new Date(`${safeDate(value) || todayIso()}T12:00:00`);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }

  function formatGoalDate(value) {
    const date = new Date(`${safeDate(value) || todayIso()}T12:00:00`);
    return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric" }).format(date);
  }

  function getGoalCountdown(targetDate, baseDate = todayIso()) {
    const [targetYear, targetMonth, targetDay] = (safeDate(targetDate) || todayIso()).split("-").map(Number);
    const [baseYear, baseMonth, baseDay] = (safeDate(baseDate) || todayIso()).split("-").map(Number);
    const days = Math.round((
      Date.UTC(targetYear, targetMonth - 1, targetDay) - Date.UTC(baseYear, baseMonth - 1, baseDay)
    ) / 86_400_000);
    if (days > 0) return { days, value: String(days), unit: "天后", phrase: `还有 ${days} 天`, state: "upcoming" };
    if (days === 0) return { days, value: "今天", unit: "就是此刻", phrase: "就是今天", state: "today" };
    return { days, value: String(Math.abs(days)), unit: "天前", phrase: `已过去 ${Math.abs(days)} 天`, state: "past" };
  }

  function formatCompactDate(value) {
    const date = new Date(`${safeDate(value) || todayIso()}T12:00:00`);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${month}${day}`;
  }

  function formatDateRange(startDate) {
    return `${formatMonthDay(startDate)} — ${formatMonthDay(addDaysIso(startDate, 6))}`;
  }

  function safeSticker(value) {
    const sticker = String(value || "");
    if (!sticker) return "";
    const allLocalStickers = Object.values(STICKER_PACKS).flat();
    if (allLocalStickers.includes(sticker)) return sticker;
    const legacyPack = sticker.match(/^图片\/(贝拉|嘉然|乃琳)表情包\//)?.[1];
    if (legacyPack) return LEGACY_STICKER_FALLBACKS[legacyPack];
    const numberedFolderMatch = sticker.match(/^图片\/(贝拉|嘉然|乃琳)\/(.+)$/);
    if (!numberedFolderMatch) return "";
    const [, packName, oldWithinPack] = numberedFolderMatch;
    return (STICKER_PACKS[packName] || []).find((path) => {
      const currentWithinPack = path.replace(new RegExp(`^图片/${packName}/\\d+-`), "");
      return currentWithinPack === oldWithinPack.replace(/^\d+-/, "");
    }) || "";
  }

  function assetUrl(value) {
    try {
      return new URL(value, document.baseURI).href;
    } catch (error) {
      return "";
    }
  }

  function parseSeriesValue(series, rawValue) {
    const text = String(rawValue ?? "").trim();
    if (/配速/.test(series.name)) {
      const paceMatch = text.match(/^(\d{1,2})\s*[:′']\s*(\d{1,2})\s*[″"]?$/);
      if (paceMatch) {
        const minutes = Number(paceMatch[1]);
        const seconds = Number(paceMatch[2]);
        return seconds < 60 ? minutes + seconds / 60 : NaN;
      }
    }
    return text === "" ? NaN : Number(text);
  }

  function formatSeriesInput(series, value) {
    if (!/配速/.test(series.name)) return String(value);
    let minutes = Math.floor(value);
    let seconds = Math.round((value - minutes) * 60);
    if (seconds === 60) {
      minutes += 1;
      seconds = 0;
    }
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }

  function formatSeriesValue(series, value) {
    if (!/配速/.test(series.name)) return formatNumber(value);
    let minutes = Math.floor(value);
    let seconds = Math.round((value - minutes) * 60);
    if (seconds === 60) {
      minutes += 1;
      seconds = 0;
    }
    return `${minutes}′${String(seconds).padStart(2, "0")}″`;
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 2 }).format(Number(value));
  }

  function formatProgressNumber(value) {
    return new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 2 }).format(Number(value) || 0);
  }

  function formatProgressInput(value) {
    const number = Number(value);
    return Number.isFinite(number) ? String(Math.round(number * 100) / 100) : "";
  }

  function formatProgressUpdateTime(value) {
    const date = new Date(Number(value));
    if (Number.isNaN(date.getTime())) return "刚刚";
    return new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric" }).format(date);
  }

  function shortLabel(value) {
    const text = String(value);
    return text.length > 9 ? `${text.slice(0, 8)}…` : text;
  }

  function parseChartDate(value) {
    const text = String(value || "").trim();
    let match = text.match(/^(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})(?:日)?$/);
    if (match) return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
    match = text.match(/^(\d{1,2})[-/.月](\d{1,2})(?:日)?$/);
    if (match) return { year: null, month: Number(match[1]), day: Number(match[2]) };
    return null;
  }

  function formatChartAxisLabel(value, includeYear = false) {
    const date = parseChartDate(value);
    if (!date || date.month < 1 || date.month > 12 || date.day < 1 || date.day > 31) return shortLabel(value);
    const monthDay = `${String(date.month).padStart(2, "0")}/${String(date.day).padStart(2, "0")}`;
    return includeYear && date.year ? `${String(date.year).slice(-2)}/${monthDay}` : monthDay;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeXml(value) {
    return escapeHtml(value);
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  function focusDialogFieldWithoutScrolling(scrollContainer, field) {
    window.setTimeout(() => {
      scrollContainer.scrollTop = 0;
      field.focus({ preventScroll: true });
    }, 40);
  }

  function initSectionNavigation() {
    const links = $$('[data-nav-section]');
    const sections = [...new Set(links.map((link) => link.dataset.navSection))]
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    if (!links.length || !sections.length) return;
    const views = $$('[data-app-view]');
    const mobileQuery = window.matchMedia("(max-width: 900px)");
    const setActive = (id) => {
      links.forEach((link) => {
        const active = link.dataset.navSection === id;
        link.classList.toggle("is-active", active);
        if (active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    };

    const resolveHashView = () => {
      const id = location.hash.slice(1);
      if (id === "weeklySection") return "spaceSectionStart";
      if (id === "dataVaultStart") return "personalSectionStart";
      return views.some((view) => view.dataset.appView === id) ? id : "home";
    };
    const showMobileView = (id, { updateHistory = false, scroll = true } = {}) => {
      const nextId = views.some((view) => view.dataset.appView === id) ? id : "home";
      views.forEach((view) => { view.hidden = view.dataset.appView !== nextId; });
      document.body.classList.add("is-mobile-app");
      document.body.dataset.activeView = nextId;
      setActive(nextId);
      if (nextId === "spaceSectionStart") renderWeeks();
      if (nextId === "chartsSection") renderCharts();
      if (updateHistory) history.pushState({ appView: nextId }, "", nextId === "home" ? "#top" : `#${nextId}`);
      if (scroll) window.scrollTo({ top: 0, behavior: "auto" });
    };
    const syncLayout = () => {
      if (mobileQuery.matches) {
        showMobileView(resolveHashView(), { scroll: false });
        return;
      }
      document.body.classList.remove("is-mobile-app");
      document.body.removeAttribute("data-active-view");
      views.forEach((view) => { view.hidden = false; });
      setActive(sections[0].id);
    };

    links.forEach((link) => {
      link.addEventListener("click", (event) => {
        if (!mobileQuery.matches) return;
        event.preventDefault();
        const nextId = link.dataset.navSection;
        const isCurrentMobileTab = link.closest(".mobile-bottom-nav") && document.body.dataset.activeView === nextId;
        if (isCurrentMobileTab && nextId === "goalSectionStart") {
          const progressSection = $(".progress-goal-section");
          const progressTop = progressSection?.getBoundingClientRect().top ?? 0;
          const nearProgress = progressTop < Math.max(150, window.innerHeight * .34);
          (nearProgress ? $("#goalSectionStart") : progressSection)?.scrollIntoView({ behavior: "smooth", block: "start" });
          showToast(nearProgress ? "回到倒计时" : "已切换到进度目标");
          return;
        }
        if (isCurrentMobileTab) {
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
        showMobileView(nextId, { updateHistory: true });
      });
    });
    $$('[data-nav-home]').forEach((link) => {
      link.addEventListener("click", (event) => {
        if (!mobileQuery.matches) return;
        event.preventDefault();
        showMobileView("home", { updateHistory: true });
      });
    });
    window.addEventListener("popstate", () => {
      if (mobileQuery.matches) showMobileView(resolveHashView());
    });
    mobileQuery.addEventListener?.("change", syncLayout);
    syncLayout();

    if (!("IntersectionObserver" in window)) return;
    const visible = new Map();
    const observer = new IntersectionObserver((entries) => {
      if (mobileQuery.matches) return;
      entries.forEach((entry) => visible.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0));
      const current = sections
        .map((section) => ({ id: section.id, ratio: visible.get(section.id) || 0, top: Math.abs(section.getBoundingClientRect().top - 110) }))
        .filter((item) => item.ratio > 0)
        .sort((a, b) => b.ratio - a.ratio || a.top - b.top)[0];
      if (current) setActive(current.id);
    }, { rootMargin: "-12% 0px -58% 0px", threshold: [0, .08, .22, .45] });
    sections.forEach((section) => observer.observe(section));
  }

  function initPwa() {
    const action = $("#installAppButton");
    const installRow = $("#installPreferenceRow");
    const updateAction = $("#updateAppButton");
    if (!action) return;
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    const setInstallAction = (label, title) => {
      action.querySelector("span").textContent = label;
      action.title = title;
      action.classList.add("is-ready");
    };
    installRow.hidden = true;
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      deferredInstallPrompt = event;
      if (!isStandalone) installRow.hidden = false;
      setInstallAction("安装应用", "安装到桌面或手机主屏幕");
    });
    action.addEventListener("click", async () => {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        await deferredInstallPrompt.userChoice;
        deferredInstallPrompt = null;
        return;
      }
      if (location.protocol === "file:") {
        showToast("安装需要通过 Cloudflare 地址或本地启动器打开");
      } else if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
        showToast("iPhone：点 Safari 分享按钮，再选“添加到主屏幕”");
      } else {
        showToast("浏览器暂未提供安装，可在浏览器菜单中选择“安装应用”");
      }
    });
    window.addEventListener("appinstalled", () => {
      deferredInstallPrompt = null;
      installRow.hidden = true;
      showToast("一个魂生活日记已经安装到桌面");
    });
    updateAction?.addEventListener("click", () => {
      if (!waitingServiceWorker) return;
      updateAction.hidden = true;
      waitingServiceWorker.postMessage({ type: "SKIP_WAITING" });
    });

    if (!("serviceWorker" in navigator) || location.protocol === "file:") return;
    navigator.serviceWorker.addEventListener("controllerchange", () => window.location.reload());
    navigator.serviceWorker.register("sw.js").then((registration) => {
      const offerUpdate = (worker) => {
        waitingServiceWorker = worker;
        if (!updateAction) return;
        updateAction.hidden = false;
        updateAction.title = "点击刷新到刚刚部署的新版本";
      };
      if (registration.waiting) offerUpdate(registration.waiting);
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) offerUpdate(worker);
        });
      });
    }).catch(() => {
      // The diary still works as a normal website if PWA registration is unavailable.
    });
  }

  function preloadCanvasAssets() {
    preloadCanvasAsset("icons/icon-192.png", true);
    preloadCanvasAsset(state.profile.avatar);
    state.goals.forEach((goal) => preloadCanvasAsset(goal.sticker));
    state.progressGoals.forEach((goal) => preloadCanvasAsset(goal.sticker));
    state.weeks.forEach((week) => week.days.forEach((day) => preloadCanvasAsset(day.sticker)));
    state.charts.forEach((chart) => chart.nodes.forEach((node) => {
      preloadCanvasAsset(node.sticker);
      Object.values(node.stickers || {}).forEach(preloadCanvasAsset);
    }));
  }

  function preloadCanvasAsset(value, allowNonSticker = false) {
    const path = allowNonSticker ? String(value || "") : safeSticker(value);
    if (!path || canvasImageCache.has(path)) return;
    const image = new Image();
    image.decoding = "async";
    image.src = assetUrl(path);
    canvasImageCache.set(path, image);
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
  }
})();
