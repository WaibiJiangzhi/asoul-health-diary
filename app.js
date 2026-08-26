(() => {
  "use strict";

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
  const CHART_ZOOM_LEVELS = [1, 2, 4, 8, 12];
  const WEEK_ITEMS_NOT_TRACKED = new Set(["跑前热身", "跑后拉伸"]);
  const DEFAULT_STATE = {
    version: 4,
    profile: {
      name: "",
      gender: "",
      height: "",
      age: "",
      avatar: "",
    },
    weeks: [],
    charts: [],
  };

  const FALLBACK_STICKER_PACKS = {
    贝拉: [
      "图片/贝拉表情包/一期拉/元气满满.png",
      "图片/贝拉表情包/一期拉/ok.png",
      "图片/贝拉表情包/一期拉/hahaha.png",
      "图片/贝拉表情包/一期拉/sorry.png",
      "图片/贝拉表情包/一期拉/吃惊.png",
      "图片/贝拉表情包/一期拉/出拳.png",
      "图片/贝拉表情包/一期拉/出去.png",
      "图片/贝拉表情包/一期拉/哒咩.png",
      "图片/贝拉表情包/一期拉/哼哼.png",
      "图片/贝拉表情包/一期拉/在吗.png",
      "图片/贝拉表情包/一期拉/惊呆.png",
      "图片/贝拉表情包/脑洞波拉/b1.gif",
      "图片/贝拉表情包/脑洞波拉/b2.gif",
      "图片/贝拉表情包/脑洞波拉/b3.gif",
      "图片/贝拉表情包/脑洞波拉/b4.gif",
      "图片/贝拉表情包/脑洞波拉/b5.gif",
    ],
    嘉然: [
      "图片/嘉然表情包/脑洞波/08b405b62c7ee9e292b6f1e1db77d1fa346efca8.gif",
      "图片/嘉然表情包/脑洞波/453ca99b758e56d4dc0cd7c886d547267f2e4a07.gif",
      "图片/嘉然表情包/脑洞波/4a319c2c0bb374d401f9fce15846e171e347becb.gif",
      "图片/嘉然表情包/脑洞波/6a65648a1970a66a1107a650e5444a9fb545250b.gif",
      "图片/嘉然表情包/脑洞波/6bfe2cc2b5f9aff63a384922a62eb3c5f6f1ed93.gif",
      "图片/嘉然表情包/脑洞波/7308257f8ea72a2f8a97e0feb431fab69d815e26.gif",
      "图片/嘉然表情包/脑洞波/88060ddc32e170d39f14c84d8f4efd2145caaa0f.gif",
      "图片/嘉然表情包/脑洞波/885b1f5b22d34706e86b0c52d179a9a3c5b9e210.gif",
      "图片/嘉然表情包/绚烂心迹/01aa7121bc0d3b9fc81e607a44204dc8353403349.png",
      "图片/嘉然表情包/绚烂心迹/02b01ad7082c6f147d0a00f4af891ed1353403349.png",
      "图片/嘉然表情包/绚烂心迹/1501bb1ed7c45644f2ed07badad02c34353403349.png",
      "图片/嘉然表情包/绚烂心迹/233fefc6eebd3fefee52f713c3a63c8e353403349.png",
      "图片/嘉然表情包/绚烂心迹/27b6129ca973c0b76104df3c2b31b9e0353403349.png",
      "图片/嘉然表情包/绚烂心迹/2f524707bcd7ad88349bf02d5b583d80353403349.png",
      "图片/嘉然表情包/绚烂心迹/30389617929d52bfc8c541ca1e0a571f353403349.png",
      "图片/嘉然表情包/绚烂心迹/3edc58157c081a12f40b5eccbdacb6db353403349.png",
    ],
    乃琳: [
      "图片/乃琳表情包/一期/我们是asoul.png",
      "图片/乃琳表情包/二期/a1.gif",
      "图片/乃琳表情包/二期/a2.gif",
      "图片/乃琳表情包/二期/a3.gif",
      "图片/乃琳表情包/二期/a4.gif",
      "图片/乃琳表情包/二期/a5.gif",
      "图片/乃琳表情包/二期/a6.gif",
      "图片/乃琳表情包/二期/a7.gif",
      "图片/乃琳表情包/二期/a8.gif",
      "图片/乃琳表情包/二期/a9.gif",
      "图片/乃琳表情包/二期/a10.gif",
      "图片/乃琳表情包/二期/a11.gif",
      "图片/乃琳表情包/二期/a12.gif",
      "图片/乃琳表情包/二期/a13.gif",
      "图片/乃琳表情包/二期/a14.gif",
      "图片/乃琳表情包/二期/a15.gif",
    ],
  };
  const STICKER_PACKS = globalThis.ASOUL_STICKER_PACKS || FALLBACK_STICKER_PACKS;

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
  let state = loadState();
  let editingChartId = null;
  let editingNodeId = null;
  let activeNodeChartId = null;
  let editingWeekId = null;
  let selectedWeekId = state.weeks.at(-1)?.id || null;
  let weekYearFilter = state.weeks.at(-1)?.startDate.slice(0, 4) || String(new Date().getFullYear());
  let weekMonthFilter = state.weeks.at(-1)?.startDate.slice(5, 7) || String(new Date().getMonth() + 1).padStart(2, "0");
  let openWeekStickerWeekId = null;
  let openWeekStickerDayId = null;
  let activeStickerPack = "贝拉";
  let activeNodeStickerSeriesId = "";
  let selectedNodeStickers = {};
  let activeWeekStickerPack = "贝拉";
  let selectedWeekSticker = "";
  let activeAvatarPack = "嘉然";
  let pendingAvatarSticker = "";
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

  const profileForm = $("#profileForm");
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
    renderStickerTabs();
    renderStickerGrid();
    renderAvatarTabs();
    renderAvatarGrid();
    showRandomJoke();
    renderWeeks();
    renderCharts();
    renderBackupStatus();
    bindEvents();
    renderWeekSoundToggle();

    if (!storageAvailable) {
      autosaveStatus.textContent = "浏览器限制了本地保存，请使用 Chrome 或 Edge 打开";
      autosaveStatus.classList.remove("is-saved");
    }
  }

  function bindEvents() {
    $("#addChartButton").addEventListener("click", () => openChartDialog());
    $("#emptyAddButton").addEventListener("click", () => openChartDialog());
    $("#addWeekButton").addEventListener("click", () => openWeekDialog());
    $("#emptyAddWeekButton").addEventListener("click", () => openWeekDialog());
    $("#importWeekButton").addEventListener("click", openWeekImportDialog);
    $("#exportSelectedWeekButton").addEventListener("click", () => selectedWeekId && exportWeekPlan(selectedWeekId));
    $("#chooseWeekFileButton").addEventListener("click", () => $("#weekPlanInput").click());
    $("#fillWeekTemplateButton").addEventListener("click", fillWeekImportTemplate);
    $("#weekPlanInput").addEventListener("change", loadWeekImportFile);
    $("#weekYearSelect").addEventListener("change", (event) => {
      weekYearFilter = event.currentTarget.value;
      weekMonthFilter = "";
      renderWeeks();
    });
    $("#weekMonthSelect").addEventListener("change", (event) => {
      weekMonthFilter = event.currentTarget.value;
      renderWeeks();
    });
    $("#weekSoundToggle").addEventListener("click", toggleWeekSound);
    $("#showSelectedWeekReportButton").addEventListener("click", () => selectedWeekId && openWeeklyReport(selectedWeekId));
    $("#copySelectedWeekReportButton").addEventListener("click", () => selectedWeekId && copyWeekReportText(selectedWeekId));
    $("#deleteSelectedWeekButton").addEventListener("click", () => selectedWeekId && deleteWeekById(selectedWeekId));
    $("#avatarButton").addEventListener("click", openAvatarDialog);
    $("#exportButton").addEventListener("click", exportBackup);
    $("#legacyMigrationExportButton").addEventListener("click", exportBackup);
    $("#importButton").addEventListener("click", () => $("#importInput").click());
    $("#footerExportButton").addEventListener("click", exportBackup);
    $("#footerImportButton").addEventListener("click", () => $("#importInput").click());
    $("#resetDataButton").addEventListener("click", resetDiaryData);
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
    weekForm.addEventListener("submit", saveWeekFromDialog);
    weekStickerForm.addEventListener("submit", saveWeekSticker);
    weekImportForm.addEventListener("submit", importWeekPlan);
    avatarForm.addEventListener("submit", saveAvatarFromDialog);
    jokeEditorForm.addEventListener("submit", saveJokesFromEditor);
    $("#clearAvatarButton").addEventListener("click", clearAvatar);
    deleteNodeButton.addEventListener("click", deleteActiveNode);
    $("#clearWeekStickerButton").addEventListener("click", clearWeekSticker);

    $$('[data-close-dialog]').forEach((button) => {
      button.addEventListener("click", () => button.closest("dialog").close());
    });

    $$("[data-preset]").forEach((button) => {
      button.addEventListener("click", () => applyPreset(button.dataset.preset));
    });

    [chartDialog, nodeDialog, weekDialog, weekStickerDialog, weekImportDialog, weeklyReportDialog, avatarDialog, jokeEditorDialog].forEach((dialog) => {
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) dialog.close();
      });
    });
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? normalizeState(JSON.parse(raw)) : cloneDefault();
    } catch (error) {
      storageAvailable = false;
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
    $("#weekSoundLabel").textContent = weekSoundEnabled ? "提示音开" : "提示音关";
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

  function normalizeWeekDay(candidate, index, startDate) {
    const day = candidate && typeof candidate === "object" ? candidate : {};
    const planItems = day.planItems ?? day.schedule ?? day.plans;
    const records = day.records ?? day.actual ?? day.results;
    const allowedStatuses = ["", "这期拉了", "还不错", "好好好"];
    const status = safeString(day.status, 12);
    return {
      id: safeId(day.id),
      dayNumber: index + 1,
      date: safeDate(day.date) || addDaysIso(startDate, index),
      title: normalizeDayType(day.title),
      duration: safeString(day.duration, 40),
      planItems: normalizePairList(planItems).filter((item) => !WEEK_ITEMS_NOT_TRACKED.has(item.name)),
      records: normalizePairList(records)
        .filter((item) => !WEEK_ITEMS_NOT_TRACKED.has(item.name))
        .map((item) => ({ ...item, done: item.done ?? (item.value ? true : null) })),
      dietPlan: safeString(day.dietPlan, 500),
      dietRecord: safeString(day.dietRecord, 500),
      weight: safeWeight(day.weight),
      note: safeString(day.note, 600),
      status: allowedStatuses.includes(status) ? status : "",
      sticker: safeSticker(day.sticker),
    };
  }

  function normalizeDayType(value) {
    const text = safeString(value, 36);
    if (/休息|恢复|慢走/.test(text)) return "休息日";
    return text ? "训练日" : "休息日";
  }

  function normalizeWeek(candidate) {
    const week = candidate && typeof candidate === "object" ? candidate : {};
    const startDate = safeDate(week.startDate) || todayIso();
    const sourceDays = Array.isArray(week.days) ? week.days : [];
    return {
      id: safeId(week.id),
      startDate,
      title: safeString(week.title, 36) || `${formatMonthDay(startDate)} 开始的一周`,
      goal: safeString(week.goal, 240),
      note: safeString(week.note, 360),
      createdAt: Number(week.createdAt) || Date.now(),
      days: Array.from({ length: 7 }, (_, index) => normalizeWeekDay(sourceDays[index], index, startDate)),
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

    if (candidate.profile && typeof candidate.profile === "object") {
      clean.profile.name = safeString(candidate.profile.name, 20);
      clean.profile.gender = safeString(candidate.profile.gender, 20);
      clean.profile.height = safeString(candidate.profile.height, 8);
      clean.profile.age = safeString(candidate.profile.age, 4);
      clean.profile.avatar = safeSticker(candidate.profile.avatar);
    }

    const sourceWeeks = Array.isArray(candidate.weeks)
      ? candidate.weeks
      : Array.isArray(candidate.weeklyPlans)
        ? candidate.weeklyPlans
        : [];
    clean.weeks = sourceWeeks
      .slice(0, 104)
      .map(normalizeWeek)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));

    if (Array.isArray(candidate.charts)) {
      clean.charts = candidate.charts.slice(0, 30).map((chart) => {
        const sourceSeries = Array.isArray(chart.series) && chart.series.length
          ? chart.series
          : [{ id: makeId(), name: chart.yLabel || "纵轴", color: chart.color }];
        const series = sourceSeries.slice(0, 3).map((item, index) => ({
          id: safeId(item.id),
          name: safeString(item.name, 24) || `指标 ${index + 1}`,
          color: ALLOWED_COLORS.includes(item.color) ? item.color : ALLOWED_COLORS[index % ALLOWED_COLORS.length],
        }));

        return {
          id: safeId(chart.id),
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
    if (!storageAvailable) return;
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
    if (!hasProfile && state.charts.length === 0 && state.weeks.length === 0) {
      showToast("现在已经是空白日记啦");
      return;
    }
    if (!window.confirm("确定清空这台浏览器里的个人资料、每周计划、图表和全部节点吗？\n\n冷笑话不会被删除；如果记录还需要保留，请先点击“备份”。")) return;

    state = cloneDefault();
    selectedNodeByChart.clear();
    selectedDayByWeek.clear();
    chartZoomById.clear();
    chartScrollById.clear();
    selectedWeekId = null;
    window.clearTimeout(saveTimer);
    saveTimer = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      storageAvailable = false;
    }
    hydrateProfileForm();
    renderProfileAvatar();
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

  function findWeek(id) {
    return state.weeks.find((week) => week.id === id);
  }

  function openWeekDialog(weekId = null) {
    editingWeekId = weekId;
    weekForm.reset();
    const week = weekId ? findWeek(weekId) : null;
    $("#weekDialogTitle").textContent = week ? "设置开始日期" : "新建周计划";

    if (week) {
      weekForm.elements.startDate.value = week.startDate;
    } else {
      weekForm.elements.startDate.value = todayIso();
    }

    weekDialog.showModal();
    window.setTimeout(() => weekForm.elements.startDate.focus(), 40);
  }

  function saveWeekFromDialog(event) {
    event.preventDefault();
    if (!weekForm.reportValidity()) return;
    const data = new FormData(weekForm);
    const startDate = safeDate(data.get("startDate"));
    const next = { startDate };
    const conflictingWeek = state.weeks.find((week) => week.startDate === startDate && week.id !== editingWeekId);
    if (conflictingWeek) {
      showToast("这个开始日期已经有一周计划了");
      weekForm.elements.startDate.focus();
      return;
    }

    if (editingWeekId) {
      const week = findWeek(editingWeekId);
      if (!week) return;
      Object.assign(week, next);
      week.days.forEach((day, index) => {
        day.dayNumber = index + 1;
        day.date = addDaysIso(startDate, index);
      });
      selectedWeekId = week.id;
      showToast("这一周的设置已经更新");
    } else {
      const week = normalizeWeek({
        id: makeId(),
        ...next,
        title: `${formatMonthDay(startDate)} 开始的一周`,
        goal: "",
        note: "",
        createdAt: Date.now(),
        days: [],
      });
      state.weeks.push(week);
      selectedWeekId = week.id;
      showToast("Day1 到 Day7 已经准备好啦");
    }

    state.weeks.sort((a, b) => a.startDate.localeCompare(b.startDate));
    weekYearFilter = startDate.slice(0, 4);
    weekMonthFilter = startDate.slice(5, 7);
    saveState(false);
    weekDialog.close();
    renderWeeks();
  }

  function deleteWeekById(weekId) {
    const week = findWeek(weekId);
    if (!week) return;
    if (!window.confirm(`确定删除 ${formatDateRange(week.startDate)} 这一周以及 7 天的安排和记录吗？`)) return;
    state.weeks = state.weeks.filter((item) => item.id !== week.id);
    selectedWeekId = state.weeks.at(-1)?.id || null;
    selectedDayByWeek.delete(week.id);
    editingWeekId = null;
    saveState(false);
    renderWeeks();
    showToast("这一周已删除");
  }

  function exportWeekPlan(weekId) {
    const week = findWeek(weekId);
    if (!week) return;
    const payload = {
      format: "asoul-week-plan",
      exportedAt: new Date().toISOString(),
      weeks: [week],
    };
    downloadTextFile(
      `Asoul健康日记-周计划-${week.startDate}.json`,
      JSON.stringify(payload, null, 2),
      "application/json;charset=utf-8",
    );
    showToast("这周计划和记录已导出");
  }

  function renderWeeks() {
    renderWeekFilters();
    const filteredWeeks = state.weeks.filter((week) => {
      const [year, month] = week.startDate.split("-");
      return year === weekYearFilter && month === weekMonthFilter;
    });
    ["#exportSelectedWeekButton", "#showSelectedWeekReportButton", "#deleteSelectedWeekButton"].forEach((selector) => {
      $(selector).disabled = filteredWeeks.length === 0;
    });
    weekEmpty.hidden = state.weeks.length > 0;
    weekDetail.hidden = state.weeks.length === 0 || filteredWeeks.length === 0;

    if (!state.weeks.length) {
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

    if (!filteredWeeks.some((week) => week.id === selectedWeekId)) selectedWeekId = filteredWeeks.at(-1).id;
    weekTimeline.innerHTML = filteredWeeks.map((week) => {
      const absoluteIndex = state.weeks.findIndex((item) => item.id === week.id);
      const recorded = week.days.filter(hasWeekDayRecord).length;
      const isSelected = week.id === selectedWeekId;
      return `
        <button class="week-node${isSelected ? " is-selected" : ""}" type="button" role="listitem" data-select-week="${week.id}" aria-pressed="${isSelected}">
          <span class="week-node-dot"><i></i></span>
          <strong>${escapeHtml(formatCompactDate(week.startDate))}</strong>
          <small>第 ${absoluteIndex + 1} 周 · 已记 ${recorded}/7 天</small>
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

  function renderWeekFilters() {
    const years = [...new Set(state.weeks.map((week) => week.startDate.slice(0, 4)))].sort();
    if (!years.includes(weekYearFilter)) weekYearFilter = years.at(-1) || "";
    const yearSelect = $("#weekYearSelect");
    yearSelect.innerHTML = years.map((year) => `<option value="${year}">${year} 年</option>`).join("");
    yearSelect.value = weekYearFilter;

    const months = [...new Set(state.weeks
      .filter((week) => week.startDate.startsWith(`${weekYearFilter}-`))
      .map((week) => week.startDate.slice(5, 7)))].sort();
    if (!months.includes(weekMonthFilter)) weekMonthFilter = months.at(-1) || "";
    const monthSelect = $("#weekMonthSelect");
    monthSelect.innerHTML = months.map((month) => `<option value="${month}">${Number(month)} 月</option>`).join("");
    monthSelect.value = weekMonthFilter;
  }

  function hasWeekDayRecord(day) {
    return Boolean(day.status || day.records.some((item) => item.done !== null || item.value) || day.dietRecord || day.note || Number.isFinite(day.weight));
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
    weekDetail.innerHTML = `
      <article class="week-board">
        <div class="week-day-tabs" role="tablist" aria-label="选择这一周的某一天">
          ${week.days.map((day) => renderWeekDayTab(day, day.id === selectedDayId)).join("")}
        </div>
        ${renderWeekDayEditor(week, selectedDay)}
      </article>`;

    $$('[data-select-week-day]', weekDetail).forEach((button) => {
      button.addEventListener("click", () => {
        const dayId = button.dataset.selectWeekDay;
        selectedDayByWeek.set(week.id, dayId);
        renderWeekDetail(week);
      });
    });
    $$('[data-configure-week-day]', weekDetail).forEach((button) => {
      button.addEventListener("click", () => {
        const dayId = button.dataset.configureWeekDay;
        selectedDayByWeek.set(week.id, dayId);
        renderWeekDetail(week);
        openWeekStickerPicker(week.id, dayId);
      });
    });
    bindInlineWeekDayEditor(week, selectedDay);
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
            ${day.status ? `<em>${escapeHtml(day.status)}</em>` : ""}
          </span>
        </button>
        <button class="week-day-tab-settings" type="button" data-configure-week-day="${day.id}" aria-label="设置 Day${day.dayNumber}">设置</button>
        <i aria-hidden="true"></i>
      </div>`;
  }

  function renderWeekDayEditor(week, day) {
    const statusClass = ({ "这期拉了": "missed", "还不错": "okay", "好好好": "great" })[day.status] || "pending";
    const rowCount = Math.max(day.planItems.length, day.records.length, 1);
    const rows = Array.from({ length: rowCount }, (_, index) => {
      const plan = day.planItems[index] || {};
      const record = day.records[index] || {};
      return `
        <div class="week-pair-row" data-week-pair-index="${index}">
          <span class="week-pair-number">${String(index + 1).padStart(2, "0")}</span>
          <div class="week-pair-plan">
            <input data-pair-field="name" maxlength="36" aria-label="第 ${index + 1} 项计划名称" placeholder="项目，例如：俯卧撑" value="${escapeAttr(plan.name || record.name || "")}" />
            <input data-pair-field="plan" maxlength="80" aria-label="第 ${index + 1} 项计划目标" placeholder="目标，例如：4 组" value="${escapeAttr(plan.value || "")}" />
          </div>
          <div class="week-pair-record">
            <span class="week-pair-checks" aria-label="第 ${index + 1} 项是否完成">
              <button type="button" data-set-pair-done="true" aria-pressed="${record.done === true}" title="已完成">√</button>
              <button type="button" data-set-pair-done="false" aria-pressed="${record.done === false}" title="未完成">×</button>
            </span>
            <input data-pair-field="actual" maxlength="80" aria-label="第 ${index + 1} 项完成记录" placeholder="补一句记录，例如：平均每组 9 个" value="${escapeAttr(record.value || "")}" />
          </div>
          <button type="button" data-remove-week-pair="${index}" aria-label="删除第 ${index + 1} 项">×</button>
        </div>`;
    }).join("");

    return `
      <section class="week-inline-day week-inline-day--${statusClass}" data-inline-week="${week.id}" data-inline-day="${day.id}">
        <div class="week-paired-text">
          <label><span>饮食安排</span><input data-day-text-field="dietPlan" maxlength="500" placeholder="今天准备怎么吃？" value="${escapeAttr(day.dietPlan)}" /></label>
          <label><span>饮食记录</span><input data-day-text-field="dietRecord" maxlength="500" placeholder="实际怎么样" value="${escapeAttr(day.dietRecord)}" /></label>
        </div>

        <div class="week-pair-table">
          <div class="week-pair-table-head"><span></span><strong>计划安排</strong><strong>完成与记录</strong><span></span></div>
          <div class="week-pair-rows">${rows}</div>
          <button class="week-add-pair" type="button" data-add-week-pair>＋ 添加一项安排</button>
        </div>

        <div class="week-paired-text week-weight-text">
          <label><span>今日体重</span><span class="week-weight-input"><input data-day-weight type="number" min="20" max="500" step="0.1" inputmode="decimal" aria-label="今日体重，单位斤" placeholder="例如：105" value="${day.weight === null ? "" : escapeAttr(day.weight)}" /><b>斤</b></span></label>
        </div>

        <label class="week-inline-note">
          <span>当天小记</span>
          <textarea data-day-text-field="note" maxlength="600" placeholder="写下一句想留给今天的话">${escapeHtml(day.note)}</textarea>
        </label>
      </section>`;
  }

  function ensureWeekPair(day, index) {
    while (day.planItems.length <= index) day.planItems.push({ id: makeId(), name: "", value: "" });
    while (day.records.length <= index) day.records.push({ id: makeId(), name: day.planItems[index]?.name || "", value: "", done: null });
    return { plan: day.planItems[index], record: day.records[index] };
  }

  function bindInlineWeekDayEditor(week, day) {
    $$('[data-pair-field]', weekDetail).forEach((input) => {
      input.addEventListener("input", () => {
        const row = input.closest('[data-week-pair-index]');
        const index = Number(row.dataset.weekPairIndex);
        const pair = ensureWeekPair(day, index);
        const value = safeString(input.value, input.dataset.pairField === "name" ? 36 : 80);
        if (input.dataset.pairField === "name") {
          pair.plan.name = value;
          pair.record.name = value;
        } else if (input.dataset.pairField === "plan") {
          pair.plan.value = value;
        } else {
          pair.record.value = value;
        }
        scheduleSave();
      });
      input.addEventListener("change", () => window.setTimeout(() => renderWeekDetail(week), 0));
    });

    $$('[data-set-pair-done]', weekDetail).forEach((button) => {
      button.addEventListener("click", () => {
        const row = button.closest('[data-week-pair-index]');
        const pair = ensureWeekPair(day, Number(row.dataset.weekPairIndex));
        const nextDone = button.dataset.setPairDone === "true";
        pair.record.done = pair.record.done === nextDone ? null : nextDone;
        if (pair.record.done !== null) playWeekFeedback(pair.record.done);
        saveState(false);
        renderWeekDetail(week);
      });
    });

    $$('[data-day-text-field]', weekDetail).forEach((input) => {
      input.addEventListener("input", () => {
        const field = input.dataset.dayTextField;
        day[field] = safeString(input.value, field === "note" ? 600 : 500);
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

    $$('[data-remove-week-pair]', weekDetail).forEach((button) => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.removeWeekPair);
        day.planItems.splice(index, 1);
        day.records.splice(index, 1);
        saveState(false);
        renderWeekDetail(week);
      });
    });
    $("[data-add-week-pair]", weekDetail).addEventListener("click", () => {
      if (Math.max(day.planItems.length, day.records.length) >= 24) {
        showToast("一天最多添加 24 项");
        return;
      }
      day.planItems.push({ id: makeId(), name: "", value: "" });
      day.records.push({ id: makeId(), name: "", value: "", done: null });
      saveState(false);
      renderWeekDetail(week);
      const lastName = $$('[data-pair-field="name"]', weekDetail).at(-1);
      lastName?.focus();
    });
  }

  function openWeekStickerPicker(weekId, dayId) {
    const week = findWeek(weekId);
    const day = week?.days.find((item) => item.id === dayId);
    if (!week || !day) return;
    openWeekStickerWeekId = weekId;
    openWeekStickerDayId = dayId;
    selectedWeekSticker = day.sticker || "";
    $("#weekStickerEyebrow").textContent = `DAY ${day.dayNumber} · ${formatCompactDate(day.date)}`;
    $("#weekStickerDialogTitle").textContent = `设置 Day${day.dayNumber}`;
    weekStickerForm.elements.dayType.value = day.title === "训练日" ? "训练日" : "休息日";
    $$('[name="dayStatus"]', weekStickerForm).forEach((input) => { input.checked = input.value === day.status; });
    renderWeekStickerTabs();
    renderWeekStickerGrid();
    weekStickerDialog.showModal();
  }

  function saveWeekSticker(event) {
    event.preventDefault();
    const week = findWeek(openWeekStickerWeekId);
    const day = week?.days.find((item) => item.id === openWeekStickerDayId);
    if (!week || !day) return;
    const formData = new FormData(weekStickerForm);
    day.title = formData.get("dayType") === "训练日" ? "训练日" : "休息日";
    day.status = ["这期拉了", "还不错", "好好好"].includes(formData.get("dayStatus")) ? formData.get("dayStatus") : "";
    day.sticker = safeSticker(selectedWeekSticker);
    saveState(false);
    weekStickerDialog.close();
    renderWeekDetail(week);
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
      <button class="sticker-item${selectedWeekSticker ? "" : " is-selected"}" type="button" data-week-sticker="" aria-label="不使用表情"><span class="sticker-none">不选</span></button>
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
    weekImportForm.reset();
    $("#weekImportFileName").textContent = "还没有选择文件";
    $("#weekPlanInput").value = "";
    weekImportDialog.showModal();
  }

  async function loadWeekImportFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      weekImportForm.elements.payload.value = await file.text();
      $("#weekImportFileName").textContent = file.name;
    } catch (error) {
      showToast("这个文件暂时读不了，请换一个 JSON 文件");
    }
  }

  function getWeekImportTemplate() {
    const startDate = todayIso();
    return {
      weeks: [{
        startDate,
        title: `${formatMonthDay(startDate)} 开始的一周`,
        days: Array.from({ length: 7 }, (_, index) => ({
          date: addDaysIso(startDate, index),
          title: index === 0 ? "训练日" : "休息日",
          dietPlan: "",
          dietRecord: "",
          weight: null,
          status: "",
          planItems: [{ name: "", value: "" }],
          records: [{ name: "", value: "", done: null }],
          note: "",
        })),
      }],
    };
  }

  function fillWeekImportTemplate() {
    weekImportForm.elements.payload.value = JSON.stringify(getWeekImportTemplate(), null, 2);
    weekImportForm.elements.payload.focus();
    showToast("模板已填入下方，直接复制给 AI 就可以啦");
  }

  function parseWeekPayload(rawText) {
    const text = String(rawText || "").trim();
    if (!text) throw new Error("empty");
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidates = [fenced?.[1], text].filter(Boolean);
    for (const candidate of candidates) {
      try {
        return JSON.parse(candidate.trim());
      } catch (error) {
        const firstObject = candidate.indexOf("{");
        const lastObject = candidate.lastIndexOf("}");
        if (firstObject >= 0 && lastObject > firstObject) {
          try {
            return JSON.parse(candidate.slice(firstObject, lastObject + 1));
          } catch (nestedError) {
            // Try the next representation.
          }
        }
      }
    }
    throw new Error("invalid");
  }

  function importWeekPlan(event) {
    event.preventDefault();
    let imported;
    try {
      const payload = parseWeekPayload(new FormData(weekImportForm).get("payload"));
      const rawWeeks = Array.isArray(payload)
        ? payload
        : Array.isArray(payload.weeks)
          ? payload.weeks
          : Array.isArray(payload.weeklyPlans)
            ? payload.weeklyPlans
            : payload.week
              ? [payload.week]
              : payload.startDate
                ? [payload]
                : [];
      imported = rawWeeks.slice(0, 12).map(normalizeWeek);
      if (!imported.length) throw new Error("missing weeks");
    } catch (error) {
      showToast("没有找到可导入的周计划 JSON");
      return;
    }

    const duplicates = imported.filter((week) => state.weeks.some((item) => item.startDate === week.startDate));
    if (duplicates.length && !window.confirm(`有 ${duplicates.length} 个开始日期相同的计划。继续会用导入内容更新它们，确定吗？`)) return;

    imported.forEach((week) => {
      const existingIndex = state.weeks.findIndex((item) => item.startDate === week.startDate);
      if (existingIndex >= 0) {
        week.id = state.weeks[existingIndex].id;
        state.weeks[existingIndex] = week;
      } else {
        if (state.weeks.some((item) => item.id === week.id)) week.id = makeId();
        state.weeks.push(week);
      }
      selectedWeekId = week.id;
    });
    state.weeks.sort((a, b) => a.startDate.localeCompare(b.startDate));
    const selectedImportedWeek = findWeek(selectedWeekId);
    if (selectedImportedWeek) weekYearFilter = selectedImportedWeek.startDate.slice(0, 4);
    weekMonthFilter = selectedImportedWeek?.startDate.slice(5, 7) || "";
    saveState(false);
    weekImportDialog.close();
    renderWeeks();
    showToast(`${imported.length} 周计划已经导入`);
  }

  function buildWeekReportText(week) {
    const lines = [
      "# Asoul 一个魂健康周报",
      "",
      `- 周期：${formatDateRange(week.startDate)}`,
    ];

    week.days.forEach((day) => {
      const plannedItems = day.planItems.filter((item) => item.name || item.value);
      const actualItems = day.records.filter((item) => item.done !== null || item.value);
      lines.push("", "", `## Day${day.dayNumber} · ${formatCompactDate(day.date)} · ${day.title}`);
      lines.push(`- 完成状态：${day.status || "未选择"}`);
      lines.push(`- 体重：${formatWeight(day.weight)}`);
      lines.push(`- 饮食安排：${day.dietPlan || "未填写"}`);
      lines.push(`- 饮食记录：${day.dietRecord || "未填写"}`);
      lines.push("");
      lines.push("- 计划安排：");
      lines.push(...(plannedItems.length ? plannedItems.map((item) => `  - ${item.name}${item.value ? `：${item.value}` : ""}`) : ["  - 无"]));
      lines.push("- 实际完成：");
      lines.push(...(actualItems.length ? actualItems.map((item) => {
        const mark = item.done === true ? "√" : item.done === false ? "×" : "·";
        return `  - ${mark} ${item.name || "记录"}${item.value ? `：${item.value}` : ""}`;
      }) : ["  - 未记录"]));
    });
    return lines.join("\n");
  }

  function openWeeklyReport(weekId) {
    const week = findWeek(weekId);
    if (!week) return;
    const statusSummary = week.days.reduce((summary, day) => {
      const key = day.status || "未设置";
      summary[key] = (summary[key] || 0) + 1;
      return summary;
    }, {});
    const completedCount = week.days.reduce((count, day) => count + day.records.filter((item) => item.done === true).length, 0);
    const missedCount = week.days.reduce((count, day) => count + day.records.filter((item) => item.done === false).length, 0);

    weeklyReportContent.innerHTML = `
      <header class="weekly-report-capture-head">
        <div>
          <span>ASOUL HEALTH WEEKLY</span>
          <h3>${escapeHtml(week.title)}</h3>
          <p>${escapeHtml(formatDateRange(week.startDate))}</p>
        </div>
        <div class="weekly-report-score" aria-label="本周记录汇总">
          <span><b>${completedCount}</b> 已完成</span>
          <span><b>${missedCount}</b> 未完成</span>
        </div>
      </header>
      <div class="weekly-report-statuses" aria-label="每日状态汇总">
        ${["好好好", "还不错", "这期拉了", "未设置"].map((status) => `<span class="weekly-report-status weekly-report-status--${status === "好好好" ? "great" : status === "还不错" ? "okay" : status === "这期拉了" ? "missed" : "pending"}">${escapeHtml(status)} ${statusSummary[status] || 0}</span>`).join("")}
      </div>
      <div class="weekly-report-days">
        ${week.days.map((day) => renderWeeklyReportDay(day)).join("")}
      </div>`;
    weeklyReportDialog.showModal();
  }

  function renderWeeklyReportDay(day) {
    const rowCount = Math.max(day.planItems.length, day.records.length);
    const entries = Array.from({ length: rowCount }, (_, index) => {
      const plan = day.planItems[index] || {};
      const record = day.records[index] || {};
      return {
        name: record.name || plan.name || "",
        value: record.value || plan.value || "",
        done: typeof record.done === "boolean" ? record.done : null,
      };
    }).filter((item) => item.name || item.value || item.done !== null);
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
            const mark = item.done === true ? "√" : item.done === false ? "×" : "·";
            const markClass = item.done === true ? "done" : item.done === false ? "missed" : "pending";
            return `<li><b class="is-${markClass}">${mark}</b><span>${escapeHtml(item.name || "记录")}</span>${item.value ? `<small>${escapeHtml(item.value)}</small>` : ""}</li>`;
          }).join("") : "<li class=\"is-empty\">还没有安排</li>"}
        </ul>
        ${day.dietRecord ? `<p class="weekly-report-diet"><b>饮食</b>${escapeHtml(day.dietRecord)}</p>` : ""}
        ${day.weight !== null ? `<p class="weekly-report-weight"><b>体重</b><strong>${escapeHtml(formatWeight(day.weight))}</strong></p>` : ""}
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

  function openChartDialog(chartId = null) {
    editingChartId = chartId;
    chartForm.reset();
    seriesEditor.innerHTML = "";
    $("#chartDialogTitle").textContent = chartId ? "修改折线图" : "添加一张折线图";

    if (chartId) {
      const chart = findChart(chartId);
      if (!chart) return;
      chartForm.elements.title.value = chart.title;
      chartForm.elements.xLabel.value = chart.xLabel;
      chart.series.forEach((item) => addSeriesEditorRow(item));
    } else {
      addSeriesEditorRow({ name: "体重 / 斤", color: ALLOWED_COLORS[0] });
    }

    chartDialog.showModal();
    window.setTimeout(() => chartForm.elements.title.focus(), 40);
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
        <span>折线颜色</span>
        <select data-series-color>
          ${ALLOWED_COLORS.map((value) => `<option value="${value}"${value === color ? " selected" : ""}>${colorName(value)}</option>`).join("")}
        </select>
      </label>
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
    return $$('[data-series-row]', seriesEditor).map((row, index) => ({
      id: safeId(row.dataset.seriesId),
      name: safeString($("[data-series-name]", row).value, 24) || `指标 ${index + 1}`,
      color: ALLOWED_COLORS.includes($("[data-series-color]", row).value)
        ? $("[data-series-color]", row).value
        : ALLOWED_COLORS[index % ALLOWED_COLORS.length],
    }));
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
    })[value] || "折线颜色";
  }

  function saveChartFromDialog(event) {
    event.preventDefault();
    if (!chartForm.reportValidity()) return;
    const data = new FormData(chartForm);
    const next = {
      title: safeString(data.get("title"), 30),
      xLabel: safeString(data.get("xLabel"), 20),
      series: readSeriesEditor(),
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
        ...next,
        nodes: [],
        createdAt: Date.now(),
      });
      showToast("空白折线图已经准备好啦");
    }

    saveState(false);
    chartDialog.close();
    renderCharts();
  }

  function renderCharts() {
    captureChartScrollPositions();
    emptyState.hidden = state.charts.length > 0;
    chartsGrid.innerHTML = state.charts.map(renderChartCard).join("");

    $$("[data-add-node]", chartsGrid).forEach((button) => {
      button.addEventListener("click", () => openNodeDialog(button.dataset.addNode));
    });
    $$("[data-edit-chart]", chartsGrid).forEach((button) => {
      button.addEventListener("click", () => openChartDialog(button.dataset.editChart));
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

  function renderChartCard(chart, chartIndex) {
    const selectedId = selectedNodeByChart.get(chart.id);
    const selectedNode = chart.nodes.find((node) => node.id === selectedId) || chart.nodes.at(-1) || null;
    if (selectedNode) selectedNodeByChart.set(chart.id, selectedNode.id);
    const primaryColor = chart.series[0]?.color || ALLOWED_COLORS[0];
    const seriesLegend = chart.series.map((item) => `
      <span class="series-legend-item"><i style="--series-color:${item.color}"></i>${escapeHtml(item.name)}</span>
    `).join("");
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
              <div class="series-legend">${seriesLegend}</div>
            </div>
          </div>
          <div class="chart-card-actions">
            <button class="chart-action chart-action--add" type="button" data-add-node="${chart.id}">＋ 新节点</button>
            <span class="chart-order" aria-label="调整图表排序">
              <button class="chart-action chart-action--move" type="button" data-move-chart="${chart.id}" data-direction="-1" aria-label="曲线图上移"${chartIndex === 0 ? " disabled" : ""}>↑ 曲线图上移</button>
              <button class="chart-action chart-action--move" type="button" data-move-chart="${chart.id}" data-direction="1" aria-label="曲线图下移"${chartIndex === state.charts.length - 1 ? " disabled" : ""}>↓ 曲线图下移</button>
            </span>
            <span class="chart-manage" aria-label="图表管理">
              <button class="chart-action chart-action--settings" type="button" data-edit-chart="${chart.id}"><span aria-hidden="true">⚙</span> 图表设置</button>
              <button class="chart-action chart-action--danger" type="button" data-delete-chart="${chart.id}"><span aria-hidden="true">×</span> 删除图表</button>
            </span>
          </div>
        </div>
        <div class="chart-wrap">${chartBody}</div>
        ${selectedNode ? `<div class="chart-card-foot">${nodeDetailHtml}</div>` : ""}
      </article>`;
  }

  function renderEmptyChart(chart) {
    const names = chart.series.map((item) => item.name).join("、");
    return `
      <div class="chart-empty">
        <div class="chart-empty-inner">
          <div class="chart-empty-line" aria-hidden="true"></div>
          <h4>这张图还没有节点</h4>
          <p>添加第一个“${escapeHtml(chart.xLabel)} / ${escapeHtml(names)}”记录后，折线就会从这里开始生长。</p>
          <button class="secondary-button" type="button" data-add-node="${chart.id}">
            <span aria-hidden="true">＋</span> 添加第一个节点
          </button>
        </div>
      </div>`;
  }

  function renderChartSvg(chart) {
    const zoom = chartZoomById.get(chart.id) || 1;
    const zoomIndex = CHART_ZOOM_LEVELS.indexOf(zoom);
    const canZoom = chart.nodes.length > 1;
    const width = 920 * zoom;
    const height = 370;
    const margin = { top: 58, right: 34, bottom: 62, left: chart.series.length > 1 ? 112 : 76 };
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
      let min = finiteValues.length ? Math.min(...finiteValues) : 0;
      let max = finiteValues.length ? Math.max(...finiteValues) : 1;
      const naturalRange = max - min;
      const padding = naturalRange === 0 ? Math.max(Math.abs(max) * 0.12, 1) : naturalRange * 0.16;
      min = Math.max(0, min - padding);
      max += padding;
      const points = chart.nodes.map((node, index) => {
        const raw = node.values?.[series.id];
        const value = raw === null || raw === undefined ? NaN : Number(raw);
        if (!Number.isFinite(value)) return null;
        return {
          node,
          value,
          px: xAt(index),
          py: margin.top + ((max - value) / (max - min)) * plotHeight,
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
        <text class="chart-axis-text${chart.series.length > 1 ? " chart-axis-text--multi" : ""}" x="${margin.left - 13}" y="${y + 4}" text-anchor="end">${chart.series.length === 1 ? escapeXml(formatNumber(value)) : scaleLabels}</text>`;
    }).join("");

    const labelEvery = Math.max(1, Math.ceil(chart.nodes.length / (8 * zoom)));
    const nodeSpacing = plotWidth / Math.max(chart.nodes.length - 1, 1);
    const xLabels = chart.nodes.map((node, index) => {
      if (index % labelEvery !== 0 && index !== chart.nodes.length - 1) return "";
      return `<text class="chart-axis-text" x="${xAt(index)}" y="${height - 34}" text-anchor="middle">${escapeXml(shortLabel(node.x))}</text>`;
    }).join("");

    const lineMarkup = seriesData.map((item) => {
      const path = smoothPath(item.points);
      return `<path class="chart-line" style="--chart-color:${item.color}" d="${path}" />`;
    }).join("");

    const pointMarkup = chart.nodes.map((node, nodeIndex) => {
      const pointValues = seriesData.map((item) => ({
        series: item,
        point: item.pointByNode.get(node.id),
      })).filter((item) => item.point);
      const label = `${node.x}：${pointValues.map(({ series, point }) => `${series.name} ${formatSeriesValue(series, point.value)}`).join("；")}`;
      const isSelected = selectedNodeByChart.get(chart.id) === node.id;
      const showPointMarker = isSelected || nodeSpacing >= 14 || nodeIndex % labelEvery === 0 || nodeIndex === chart.nodes.length - 1;
      const stickerMarkup = pointValues.map(({ series, point }, pointIndex) => {
        const sticker = safeSticker(node.stickers?.[series.id] ?? (pointIndex === 0 ? node.sticker : ""));
        const showSticker = sticker && (isSelected || (showPointMarker && nodeSpacing >= 58));
        if (!showSticker) return "";
        const centerX = point.px;
        const centerY = point.py - 37;
        const clipId = `clip-${chart.id}-${node.id}-${series.id}`;
        return `<circle class="point-sticker-bg" cx="${centerX}" cy="${centerY}" r="22" />
          <clipPath id="${clipId}"><circle cx="${centerX}" cy="${centerY}" r="19" /></clipPath>
          <image href="${escapeAttr(assetUrl(sticker))}" x="${centerX - 19}" y="${centerY - 19}" width="38" height="38" preserveAspectRatio="xMidYMid meet" clip-path="url(#${clipId})" />`;
      }).join("");
      const cores = showPointMarker ? pointValues.map(({ series, point }) => `
        <circle class="point-halo" style="--chart-color:${series.color}" cx="${point.px}" cy="${point.py}" r="10" />
        <circle class="point-core" style="--chart-color:${series.color}" cx="${point.px}" cy="${point.py}" r="6" />
      `).join("") : "";
      const hitWidth = Math.max(6, Math.min(36, plotWidth / Math.max(chart.nodes.length, 1)));
      return `
        <g class="chart-point${isSelected ? " is-selected" : ""}" role="button" tabindex="0" aria-pressed="${isSelected}" aria-label="${escapeAttr(label)}，点击查看" data-chart-id="${chart.id}" data-node-id="${node.id}">
          <title>${escapeXml(label)}，点击查看当天记录</title>
          <rect class="node-hit-area" x="${xAt(nodeIndex) - hitWidth / 2}" y="${margin.top}" width="${hitWidth}" height="${plotHeight}" />
          ${stickerMarkup}
          ${cores}
        </g>`;
    }).join("");

    const rangeSummary = seriesData.map((item) => `
      <span><i style="--series-color:${item.color}"></i>${escapeHtml(item.name)}：${item.hasData ? `${formatSeriesValue(item, item.min)}—${formatSeriesValue(item, item.max)}` : "暂无数据"}</span>
    `).join("");
    const axisSeriesNames = seriesData.map((item, index) => `
      ${index ? '<tspan class="chart-axis-separator" dx="10">·</tspan>' : ""}<tspan class="chart-axis-series-name" style="fill:${item.color}"${index ? ' dx="10"' : ""}>● ${escapeXml(item.name)}</tspan>
    `).join("");

    return `
      <div class="chart-range-summary">
        ${rangeSummary}
        ${chart.series.length > 1 ? `<small>纵轴数值按折线颜色对应，各项指标使用独立刻度</small>` : ""}
      </div>
      <div class="chart-view-tools" aria-label="折线图查看范围">
        <div class="chart-view-status">
          <span class="chart-view-icon" aria-hidden="true">${chart.nodes.length === 1 ? "◎" : zoom === 1 ? "⌁" : "↔"}</span>
          <span>
            <strong>${chart.nodes.length === 1 ? "起点视图" : zoom === 1 ? "全局视图" : `${zoom}× 局部视图`}</strong>
            <small>${chart.nodes.length === 1 ? "1 个节点 · 第一条轨迹已点亮" : zoom === 1 ? `${chart.nodes.length} 个节点 · 完整趋势` : `${chart.nodes.length} 个节点 · 左右滑动查看`}</small>
          </span>
        </div>
        <div>
          <button type="button" data-zoom-chart="${chart.id}" data-zoom-action="out"${!canZoom || zoomIndex <= 0 ? " disabled" : ""}>− 缩小</button>
          <button type="button" data-zoom-chart="${chart.id}" data-zoom-action="in"${!canZoom || zoomIndex >= CHART_ZOOM_LEVELS.length - 1 ? " disabled" : ""}>＋ 放大</button>
          <button type="button" data-zoom-chart="${chart.id}" data-zoom-action="reset"${!canZoom || zoom === 1 ? " disabled" : ""}>看全局</button>
        </div>
      </div>
      <div class="chart-scroll" data-chart-scroll="${chart.id}" tabindex="0" aria-label="可横向滑动的${escapeAttr(chart.title)}折线图">
      <svg class="chart-svg" style="width:${zoom * 100}%;aspect-ratio:${width}/${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttr(chart.title)}折线图">
        <defs>
          <linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${primary.color}" stop-opacity="0.24" />
            <stop offset="100%" stop-color="${primary.color}" stop-opacity="0" />
          </linearGradient>
        </defs>
        ${grid}
        <text class="chart-axis-name chart-axis-name--series" x="${margin.left}" y="28">${axisSeriesNames}</text>
        <text class="chart-axis-name" x="${width - margin.right}" y="${height - 10}" text-anchor="end">${escapeXml(chart.xLabel)}</text>
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
      nodeForm.elements.x.value = new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric" }).format(new Date());
    }

    renderNodeStickerSeriesTabs(chart);
    renderStickerGrid();
    nodeDialog.showModal();
    window.setTimeout(() => nodeForm.elements.x.focus(), 40);
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
    const index = state.charts.findIndex((chart) => chart.id === chartId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= state.charts.length) return;
    [state.charts[index], state.charts[target]] = [state.charts[target], state.charts[index]];
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
    const header = `/* 从 Asoul 一个魂健康日记导出，可继续在网页中管理。 */\n`;
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
      backupType: "asoul-health-diary",
      exportedAt: new Date().toISOString(),
      ...state,
      jokes: coldJokes,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const date = todayIso();
    anchor.href = url;
    anchor.download = `Asoul健康日记-备份-${date}.json`;
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
      hydrateProfileForm();
      renderProfileAvatar();
      selectedWeekId = state.weeks.at(-1)?.id || null;
      if (state.weeks.length) weekYearFilter = state.weeks.at(-1).startDate.slice(0, 4);
      weekMonthFilter = state.weeks.at(-1)?.startDate.slice(5, 7) || "";
      renderWeeks();
      renderCharts();
      showToast("健康日记已恢复");
    } catch (error) {
      showToast("这个文件不是有效的健康日记备份");
    } finally {
      event.target.value = "";
    }
  }

  function isDiaryBackupPayload(candidate) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return false;
    if (candidate.backupType && candidate.backupType !== "asoul-health-diary") return false;
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
    return allLocalStickers.includes(sticker) ? sticker : "";
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

  function shortLabel(value) {
    const text = String(value);
    return text.length > 9 ? `${text.slice(0, 8)}…` : text;
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

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
  }
})();
