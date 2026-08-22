(() => {
  "use strict";

  const DATA_MODEL = globalThis.ASOUL_DATA_MODEL || {
    CURRENT_STATE_VERSION: 10,
    UNSUPPORTED_VERSION_CODE: "ASOUL_UNSUPPORTED_STATE_VERSION",
    DEFAULT_SPACES: [
      { id: "health", type: "health", templateId: "health", name: "健康", icon: "♡" },
    ],
    migrateState: (candidate) => candidate,
  };
  const APP_UTILS = globalThis.ASOUL_APP_UTILS;
  if (!APP_UTILS) throw new Error("js/core/app-utils.js must load before js/app.js");
  const {
    addDaysIso,
    escapeAttr,
    escapeHtml,
    escapeXml,
    formatCompactDate,
    formatDateRange,
    formatFriendlyDate,
    formatGoalDate,
    formatMonthDay,
    formatProgressInput,
    formatProgressNumber,
    formatProgressUpdateTime,
    formatSeriesInput,
    formatSeriesValue,
    formatWeight,
    getGoalCountdown,
    getMonthMondays,
    parseSeriesValue,
    safeString,
    shortLabel,
    todayIso,
  } = APP_UTILS;
  const BACKUP_CODEC = globalThis.ASOUL_BACKUP_CODEC;
  if (!BACKUP_CODEC) throw new Error("js/core/backup-codec.js must load before js/app.js");
  const {
    createDiaryBackupPayload,
    parseDiaryBackup,
  } = BACKUP_CODEC;
  const MILESTONE_DOMAIN = globalThis.ASOUL_MILESTONE_DOMAIN;
  if (!MILESTONE_DOMAIN) throw new Error("js/domain/milestone-domain.js must load before js/app.js");
  const {
    applyProgressDelta,
    getProgressPercent,
    getReportSpaceNames,
    moveItemById,
    selectValidSpaceIds,
  } = MILESTONE_DOMAIN;
  const CHART_DOMAIN = globalThis.ASOUL_CHART_DOMAIN;
  if (!CHART_DOMAIN) throw new Error("js/domain/chart-domain.js must load before js/app.js");
  const {
    buildChartZoomLevels,
    getNextZoom,
  } = CHART_DOMAIN;
  const SCHEDULE_DOMAIN = globalThis.ASOUL_SCHEDULE_DOMAIN;
  if (!SCHEDULE_DOMAIN) throw new Error("js/domain/schedule-domain.js must load before js/app.js");
  const {
    clearWeekContent,
    clearWeekDayContent,
    countWeekItemStates,
    hasScheduleDayContent,
    hasWeekDayRecord,
    parseAiPlanTemplate,
    shiftWeekDays,
    weekItemStateLabel,
    weekItemStateMark,
  } = SCHEDULE_DOMAIN;
  const SNAP_CAROUSEL = globalThis.ASOUL_SNAP_CAROUSEL;
  if (!SNAP_CAROUSEL) throw new Error("js/ui/snap-carousel.js must load before js/app.js");
  const { bindSnapSelection, revealSelectedCard } = SNAP_CAROUSEL;
  const CANVAS_UTILS = globalThis.ASOUL_CANVAS_UTILS;
  if (!CANVAS_UTILS) throw new Error("js/ui/canvas-utils.js must load before js/app.js");
  const { downloadCanvasAsPng } = CANVAS_UTILS;
  const WEEKLY_REPORT_RENDERER_MODULE = globalThis.ASOUL_WEEKLY_REPORT_RENDERER;
  if (!WEEKLY_REPORT_RENDERER_MODULE) throw new Error("js/ui/weekly-report-renderer.js must load before js/app.js");
  const CHART_RENDERER_MODULE = globalThis.ASOUL_CHART_RENDERER;
  if (!CHART_RENDERER_MODULE) throw new Error("js/ui/chart-renderer.js must load before js/app.js");
  const APP_CONFIG = globalThis.ASOUL_APP_CONFIG;
  if (!APP_CONFIG) throw new Error("js/core/app-config.js must load before js/app.js");
  const {
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
  } = APP_CONFIG;

  const STATE_NORMALIZER_MODULE = globalThis.ASOUL_STATE_NORMALIZER;
  if (!STATE_NORMALIZER_MODULE) throw new Error("js/core/state-normalizer.js must load before js/app.js");
  const STATE_NORMALIZER = STATE_NORMALIZER_MODULE.createStateNormalizer({
    dataModel: DATA_MODEL,
    utils: APP_UTILS,
    defaultState: DEFAULT_STATE,
    defaultSpaces: DEFAULT_SPACES,
    spaceTemplates: SPACE_TEMPLATES,
    allowedColors: ALLOWED_COLORS,
    stickerPacks: STICKER_PACKS,
    legacyStickerFallbacks: LEGACY_STICKER_FALLBACKS,
    selectValidSpaceIds,
    limits: { spaces: MAX_SPACES, goals: MAX_GOALS, progressGoals: MAX_PROGRESS_GOALS },
    weekItemStates: WEEK_ITEM_STATES,
    weekItemsNotTracked: WEEK_ITEMS_NOT_TRACKED,
  });
  const {
    cloneDefault,
    makeId,
    normalizeAiContext,
    normalizeGoal,
    normalizeProgressGoal,
    normalizeState,
    normalizeWeek,
    normalizeWeekDay,
    safeCardColor,
    safeId,
    safeSpaceIdForList,
    safeSticker,
    safeTemplateId,
  } = STATE_NORMALIZER;
  const STATE_STORE_MODULE = globalThis.ASOUL_STATE_STORE;
  if (!STATE_STORE_MODULE) throw new Error("js/core/state-store.js must load before js/app.js");
  const diaryStore = STATE_STORE_MODULE.createStateStore({
    key: STORAGE_KEY,
    normalize: normalizeState,
    createDefault: cloneDefault,
    getStorage: () => globalThis.localStorage,
    resolveLoadIssue: (error) => error?.code === DATA_MODEL.UNSUPPORTED_VERSION_CODE
      ? "数据来自更新版本，请用新版打开或恢复兼容备份"
      : "本地数据读取失败，请先恢复备份或清空记录",
    onSaveError: () => showToast("保存空间不足，请先备份并精简部分记录"),
  });

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const DAY_STATUS_PALETTE = Object.freeze({
    "好好好": Object.freeze({ fill: "#db7d74", ink: "#ffffff" }),
    "还不错": Object.freeze({ fill: "#f7cbd7", ink: "#593c49" }),
    "这期拉了": Object.freeze({ fill: "#89777f", ink: "#ffffff" }),
    "未设置": Object.freeze({ fill: "#576690", ink: "#ffffff" }),
  });
  const ITEM_SUMMARY_PALETTE = Object.freeze({
    done: Object.freeze({ fill: "#eaf6f2", ink: "#397f6d" }),
    changed: Object.freeze({ fill: "#fff7df", ink: "#9a6c25" }),
    missed: Object.freeze({ fill: "#fff0f2", ink: "#a85f6b" }),
  });

  let state = diaryStore.load();
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
  const coldJokes = DEFAULT_COLD_JOKES.map((joke) => ({ ...joke }));
  let currentJokeIndex = -1;
  let weekSoundEnabled = loadWeekSoundPreference();
  let lastManualBackupAt = loadLastManualBackupAt();
  let feedbackAudioContext = null;
  const selectedNodeByChart = new Map();
  const selectedDayByWeek = new Map();
  const chartZoomById = new Map();
  const chartScrollById = new Map();
  let toastTimer = null;
  let deferredInstallPrompt = null;
  let waitingServiceWorker = null;
  const canvasImageCache = new Map();
  const weeklyReportRenderer = WEEKLY_REPORT_RENDERER_MODULE.createWeeklyReportRenderer({
    utils: APP_UTILS,
    scheduleDomain: SCHEDULE_DOMAIN,
    milestoneDomain: MILESTONE_DOMAIN,
    canvasUtils: CANVAS_UTILS,
    getSpaceTemplate,
    getCardColor,
    imageCache: canvasImageCache,
    dayStatusPalette: DAY_STATUS_PALETTE,
    itemSummaryPalette: ITEM_SUMMARY_PALETTE,
  });
  const { createWeeklyReportCanvas, createWeeklySummaryCanvas } = weeklyReportRenderer;
  const chartRenderer = CHART_RENDERER_MODULE.createChartRenderer({
    utils: APP_UTILS,
    chartDomain: CHART_DOMAIN,
    canvasUtils: CANVAS_UTILS,
    getSpaceTemplate,
    safeSticker,
    assetUrl,
    imageCache: canvasImageCache,
    defaultColor: ALLOWED_COLORS[0],
  });
  const {
    createChartCanvas,
    createChartSvgLayout,
    renderChartSvg,
    renderEmptyChart,
  } = chartRenderer;

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
  const toast = $("#toast");

  init();

  function init() {
    renderAllDataViews({ hydrateProfile: true });
    showRandomJoke();
    renderBackupStatus();
    bindEvents();
    renderWeekSoundToggle();
    initSectionNavigation();
    initPwa();
    preloadCanvasAssets();

    const storageStatus = diaryStore.getStatus();
    if (storageStatus.issue) showToast(storageStatus.issue);
    else if (!storageStatus.available) showToast("浏览器限制了本地保存，请使用 Chrome 或 Edge 打开");
  }

  function bindEvents() {
    bindMilestoneEvents();
    bindSpaceEvents();
    bindScheduleEvents();
    bindChartEvents();
    bindProfileAndDataEvents();
    bindDialogShellEvents();
  }

  function bindMilestoneEvents() {
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
    goalForm.addEventListener("submit", saveGoalFromDialog);
    progressGoalForm.addEventListener("submit", saveProgressGoalFromDialog);
    $("#goalStickerPicker").addEventListener("toggle", renderGoalStickerPicker);
    $("#progressGoalStickerPicker").addEventListener("toggle", renderProgressGoalStickerPicker);
  }

  function bindSpaceEvents() {
    $("#addSpaceButton").addEventListener("click", () => openSpaceDialog());
    $("#editSpaceButton").addEventListener("click", () => openSpaceDialog(activeSpaceId));
    $("#deleteSpaceButton").addEventListener("click", () => deleteSpace(activeSpaceId));
    spaceForm.addEventListener("submit", saveSpaceFromDialog);
    $$('[name="templateId"]', spaceForm).forEach((input) => input.addEventListener("change", syncSpaceFormTemplate));
    spaceForm.elements.icon.addEventListener("input", () => {
      pendingSpaceIconSticker = "";
      renderSpaceIconPicker();
    });
    $("#spaceIconPicker").addEventListener("toggle", renderSpaceIconPicker);
  }

  function bindScheduleEvents() {
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
    $("#showSelectedWeekReportButton").addEventListener("click", () => selectedWeekId && openWeeklyReport(selectedWeekId));
    $("#copySelectedWeekReportButton").addEventListener("click", () => selectedWeekId && copyWeekReportText(selectedWeekId));
    $("#downloadWeeklyReportImageButton").addEventListener("click", () => selectedWeekId && downloadWeeklyReportImage(selectedWeekId));
    $("#downloadWeeklySummaryImageButton").addEventListener("click", () => selectedWeekId && downloadWeeklySummaryImage(selectedWeekId));
    $("#clearSelectedDayButton").addEventListener("click", clearSelectedDayCard);
    $("#clearSelectedWeekButton").addEventListener("click", clearSelectedWeekCard);
    $("#deleteSelectedPeriodButton").addEventListener("click", deleteSelectedPeriod);
    weekForm.addEventListener("submit", savePeriodFromDialog);
    weekStickerForm.addEventListener("submit", saveWeekSticker);
    weekImportForm.addEventListener("submit", importWeekPlan);
    $("#clearWeekStickerButton").addEventListener("click", clearWeekSticker);
  }

  function bindChartEvents() {
    $("#addChartButton").addEventListener("click", () => openChartDialog());
    $("#emptyAddButton").addEventListener("click", () => openChartDialog());
    $("#addSeriesButton").addEventListener("click", () => addSeriesEditorRow());
    chartForm.addEventListener("submit", saveChartFromDialog);
    nodeForm.addEventListener("submit", saveNodeFromDialog);
    deleteNodeButton.addEventListener("click", deleteActiveNode);
    $$("[data-preset]").forEach((button) => {
      button.addEventListener("click", () => applyPreset(button.dataset.preset));
    });
  }

  function bindProfileAndDataEvents() {
    $("#avatarButton").addEventListener("click", openAvatarDialog);
    avatarForm.addEventListener("submit", saveAvatarFromDialog);
    $("#clearAvatarButton").addEventListener("click", clearAvatar);
    $("#weekSoundToggle").addEventListener("click", toggleWeekSound);
    $("#nextJokeButton").addEventListener("click", showRandomJoke);
    $("#revealJokeButton").addEventListener("click", revealJokeAnswer);
    $("#exportButton").addEventListener("click", exportBackup);
    $("#importButton").addEventListener("click", () => $("#importInput").click());
    $("#footerExportButton").addEventListener("click", exportBackup);
    $("#footerImportButton").addEventListener("click", () => $("#importInput").click());
    $("#resetDataButton").addEventListener("click", resetDiaryData);
    $("#footerResetDataButton").addEventListener("click", resetDiaryData);
    $("#importInput").addEventListener("change", importBackup);
    window.addEventListener("pagehide", flushScheduledSave);
    profileForm.addEventListener("input", (event) => {
      const field = event.target;
      if (!field.name || !(field.name in state.profile)) return;
      state.profile[field.name] = field.value;
      persistState(field.name === "name" ? ["avatar"] : [], { deferred: true });
    });
  }

  function bindDialogShellEvents() {
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
    [goalDialog, progressGoalDialog, spaceDialog, chartDialog, nodeDialog, weekDialog, weekStickerDialog, weekImportDialog, weeklyReportDialog, avatarDialog].forEach((dialog) => {
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) dialog.close();
      });
    });
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
    if (weekSoundEnabled) playWeekFeedback("positive");
  }

  function renderWeekSoundToggle() {
    const button = $("#weekSoundToggle");
    if (!button) return;
    button.setAttribute("aria-pressed", String(weekSoundEnabled));
    $("#weekSoundLabel").textContent = weekSoundEnabled ? "开" : "关";
  }

  function playWeekFeedback(feedback = "positive") {
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
      const patterns = {
        positive: [
          [659.25, 0, 0.12, 0.072, "sine"],
          [783.99, 0.065, 0.13, 0.064, "sine"],
          [987.77, 0.135, 0.16, 0.055, "sine"],
        ],
        adjusted: [
          [523.25, 0, 0.13, 0.066, "sine"],
          [659.25, 0.085, 0.15, 0.058, "triangle"],
        ],
        missed: [
          [246.94, 0, 0.13, 0.06, "triangle"],
          [196, 0.075, 0.17, 0.052, "triangle"],
        ],
        recorded: [
          [523.25, 0, 0.1, 0.057, "sine"],
          [659.25, 0.085, 0.11, 0.052, "sine"],
          [783.99, 0.175, 0.14, 0.047, "sine"],
        ],
      };
      (patterns[feedback] || patterns.positive).forEach(([frequency, offset, duration, volume, type]) => {
        playTone(frequency, now + offset, duration, volume, type);
      });
    } catch (error) {
      // Audio feedback is optional and must never block recording.
    }
  }

  function saveState() {
    diaryStore.save(state);
  }

  function scheduleSave() {
    diaryStore.schedule(() => state);
  }

  function flushScheduledSave() {
    diaryStore.flush();
  }

  function renderViews(...viewNames) {
    const views = new Set(viewNames.flat());
    if (views.has("profileForm")) hydrateProfileForm();
    if (views.has("avatar")) renderProfileAvatar();
    if (views.has("goals")) renderGoals();
    if (views.has("progressGoals")) renderProgressGoals();
    if (views.has("spaces")) renderSpaceSwitcher();
    if (views.has("schedule")) renderWeeks();
    if (views.has("charts")) renderCharts();
    if (views.has("backupStatus")) renderBackupStatus();
  }

  function renderAllDataViews({ hydrateProfile = false } = {}) {
    renderViews(
      ...(hydrateProfile ? ["profileForm"] : []),
      "avatar",
      "goals",
      "progressGoals",
      "spaces",
      "schedule",
      "charts",
    );
  }

  function persistState(viewNames = [], { deferred = false } = {}) {
    if (deferred) scheduleSave();
    else saveState();
    renderViews(...viewNames);
  }

  function persistSpaceChange({ includeMilestones = false } = {}) {
    persistState([
      ...(includeMilestones ? ["goals", "progressGoals"] : []),
      "spaces",
      "schedule",
      "charts",
    ]);
  }

  function resetDiaryData() {
    const hasProfile = Object.values(state.profile).some((value) => String(value).trim());
    if (!diaryStore.getStatus().blocked && !hasProfile && state.goals.length === 0 && state.progressGoals.length === 0 && state.charts.length === 0 && state.weeks.length === 0) {
      showToast("现在已经是空白日记啦");
      return;
    }
    if (!window.confirm("确定清空这台浏览器里的个人资料、倒计时、进度目标、每周计划、曲线图和全部节点吗？\n\n冷笑话不会被删除；如果记录还需要保留，请先点击“备份”。")) return;

    state = cloneDefault();
    activeSpaceId = "health";
    selectedNodeByChart.clear();
    selectedDayByWeek.clear();
    chartZoomById.clear();
    chartScrollById.clear();
    selectedGoalId = null;
    selectedProgressGoalId = null;
    selectedWeekId = null;
    weekYearFilter = String(new Date().getFullYear());
    weekMonthFilter = String(new Date().getMonth() + 1).padStart(2, "0");
    diaryStore.clear();
    renderAllDataViews({ hydrateProfile: true });
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
      const reportSpaceNames = getReportSpaceNames(goal, state.spaces);
      return `
        <button class="goal-card goal-card--tone-${index % 4} goal-card--${countdown.state}${goal.id === selectedGoalId ? " is-selected" : ""}" type="button" data-select-goal="${escapeAttr(goal.id)}" aria-pressed="${goal.id === selectedGoalId}" style="--goal-color:${escapeAttr(getCardColor(goal, index))}">
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
        button.blur();
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
      const percent = getProgressPercent(goal);
      const isComplete = goal.current >= goal.target;
      const lastUpdate = goal.updates.at(-1);
      const reportSpaceNames = getReportSpaceNames(goal, state.spaces);
      return `
        <article class="progress-goal-card progress-goal-card--tone-${index % 4}${goal.id === selectedProgressGoalId ? " is-selected" : ""}${isComplete ? " is-complete" : ""}" style="--progress:${percent}%;--progress-color:${escapeAttr(getCardColor(goal, index))}">
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
        button.blur();
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
    setThemeColorField(progressGoalForm, goal?.color, state.progressGoals.length);
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
      color: formData.get("color"),
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
    persistState(["progressGoals"]);
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
    const updatedGoal = applyProgressDelta(goal, amount, { id: makeId(), createdAt: Date.now() });
    if (!updatedGoal) return;
    state.progressGoals[state.progressGoals.indexOf(goal)] = updatedGoal;
    selectedProgressGoalId = updatedGoal.id;
    persistState(["progressGoals"]);
    showToast(updatedGoal.current >= updatedGoal.target
      ? `${updatedGoal.title}已经达到目标`
      : `已${amount > 0 ? "增加" : "减少"} ${formatProgressNumber(Math.abs(amount))} ${updatedGoal.unit}`);
  }

  function deleteSelectedProgressGoal() {
    const goal = state.progressGoals.find((item) => item.id === selectedProgressGoalId);
    if (!goal) return;
    if (!window.confirm(`确定删除进度目标“${goal.title}”吗？\n\n已添加的进度记录也会一起删除。`)) return;
    state.progressGoals = state.progressGoals.filter((item) => item.id !== goal.id);
    selectedProgressGoalId = state.progressGoals[0]?.id || null;
    persistState(["progressGoals"]);
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
    setThemeColorField(goalForm, goal?.color, state.goals.length);
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
      color: formData.get("color"),
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
    persistState(["goals"]);
    showToast(existing ? "倒计时已经更新" : "新的倒计时已经建立");
  }

  function deleteSelectedGoal() {
    const goal = state.goals.find((item) => item.id === selectedGoalId);
    if (!goal) return;
    if (!window.confirm(`确定删除倒计时“${goal.title}”吗？\n\n空间、日程和周报记录不会受到影响。`)) return;
    state.goals = state.goals.filter((item) => item.id !== goal.id);
    selectedGoalId = state.goals[0]?.id || null;
    persistState(["goals"]);
    showToast("倒计时已删除，其他记录保持不变");
  }

  function moveSelectedGoal(direction) {
    moveSelectedMilestone("goals", selectedGoalId, direction, "倒计时");
  }

  function moveSelectedMilestone(collectionName, selectedId, direction, label) {
    const result = moveItemById(state[collectionName], selectedId, direction);
    if (!result.moved) return;
    state[collectionName] = result.items;
    persistState(["goals", "progressGoals"]);
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
      const color = getCardColor(space, state.spaces.indexOf(space));
      const periodCount = state.periods.filter((period) => period.spaceId === space.id).length;
      const isActive = space.id === activeSpaceId;
      const icon = template.iconSticker
        ? `<img src="${escapeAttr(assetUrl(template.iconSticker))}" alt="" />`
        : escapeHtml(template.icon);
      return `
        <div class="space-switcher-item${extraClass}">
          <button class="space-switcher-button${isActive ? " is-active" : ""}" type="button" data-space-id="${space.id}" aria-pressed="${isActive}" style="--space-color:${escapeAttr(color)}">
            <span class="space-switcher-icon${template.iconSticker ? " has-sticker" : ""}" aria-hidden="true">${icon}</span>
            <span><strong>${escapeHtml(template.name)}</strong><small>${periodCount ? `${periodCount} 个月份` : "从这里开始"}</small></span>
          </button>
        </div>`;
    };
    spaceSwitcher.innerHTML = state.spaces.length ? `
      <div class="space-switcher-mobile" data-count="${state.spaces.length}" data-space-rail aria-label="左右滑动切换日程空间">
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
    const mobileRail = $(".space-switcher-mobile", spaceSwitcher);
    if (mobileRail) {
      bindSnapSelection(mobileRail, "[data-space-id]", () => activeSpaceId, selectSpace, (control) => control?.dataset.spaceId);
      revealSelectedCard(mobileRail, `[data-space-id="${escapeSelectorValue(activeSpaceId)}"]`);
    }
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
    persistSpaceChange();
  }

  function syncSpaceCopy() {
    const space = getSpace();
    const hasSpace = Boolean(space);
    $("#weeklyEyebrow").textContent = "WEEKLY SOUL PLAN";
    $("#weeklyTitle").textContent = hasSpace ? `一个魂的${space.name}打卡` : "建立空间后，再开始安排日程";
    $("#chartsEyebrow").textContent = "MY SOUL TRACK";
    $("#chartsTitle").textContent = hasSpace ? `一个魂的${space.name}轨迹` : "建立空间后，再记录一条轨迹";
    $(".week-empty h3").textContent = hasSpace ? "先建立一个年月吧" : "先建立一个空间吧";
    $(".empty-state h3").textContent = hasSpace ? "从第一条轨迹开始吧" : "先建立一个空间吧";
    $("#emptyChartExample").textContent = hasSpace ? "添加一条想长期观察的变化。" : "建立空间后即可开始记录。";
    $("#weekEmptyDescription").textContent = hasSpace
      ? "新建年月后，会自动生成当月周条。"
      : "建立空间后即可新建年月。";
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
    setThemeColorField(spaceForm, editingSpace?.color, editingSpace ? state.spaces.indexOf(editingSpace) : state.spaces.length);
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
      color: safeCardColor(formData.get("color")),
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
    spaceDialog.close();
    persistSpaceChange({ includeMilestones: true });
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
    persistSpaceChange({ includeMilestones: true });
    showToast(`“${space.name}”空间已删除`);
  }

  function findWeek(id) {
    return state.weeks.find((week) => week.id === id);
  }

  function getSelectedWeekDayIndex(week) {
    if (!week?.days?.length) return -1;
    const visibleDayId = weekDetail.querySelector("[data-inline-day]")?.dataset.inlineDay;
    const selectedDayId = visibleDayId || selectedDayByWeek.get(week.id) || week.days[0].id;
    const selectedIndex = week.days.findIndex((day) => day.id === selectedDayId);
    return selectedIndex >= 0 ? selectedIndex : 0;
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
    weekDialog.close();
    persistState(["spaces", "schedule"]);
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
    persistState(["spaces", "schedule"]);
    showToast(`${label} 已删除`);
  }

  function clearSelectedDayCard() {
    const week = findWeek(selectedWeekId);
    const selectedIndex = getSelectedWeekDayIndex(week);
    if (!week || selectedIndex < 0) return;
    const day = week.days[selectedIndex];
    const label = `Day${day.dayNumber}（${formatMonthDay(day.date)}）`;
    if (!window.confirm(`确定清空 ${label} 吗？\n\n今日标题、重点、安排、完成状态、表情和当天小记都会清空；日期与日卡位置会保留。`)) return;
    week.days[selectedIndex] = clearWeekDayContent(day, selectedIndex, {
      startDate: week.startDate,
      templateId: getSpace(week.spaceId).templateId,
      normalizeDay: normalizeWeekDay,
    });
    selectedDayByWeek.set(week.id, week.days[selectedIndex].id);
    persistState(["schedule"]);
    showToast(`${label} 已清空`);
  }

  function clearSelectedWeekCard() {
    const week = findWeek(selectedWeekId);
    if (!week) return;
    const label = formatDateRange(week.startDate);
    if (!window.confirm(`确定清空 ${label} 的整张周卡吗？\n\n七张日卡里的标题、重点、安排、完成状态、表情和当天小记都会清空；所属空间、日期和周卡本身会保留。`)) return;
    week.days = clearWeekContent(week.days, {
      startDate: week.startDate,
      templateId: getSpace(week.spaceId).templateId,
      normalizeDay: normalizeWeekDay,
    });
    persistState(["schedule"]);
    showToast(`${label} 的周卡已清空`);
  }

  function shiftWeekScheduleByOneDay(weekId) {
    const week = findWeek(weekId);
    if (!week) return;
    const startIndex = getSelectedWeekDayIndex(week);
    if (startIndex < 0) return;
    selectedDayByWeek.set(week.id, week.days[startIndex].id);
    const startDayNumber = startIndex + 1;
    const hasLastDayData = hasScheduleDayContent(week.days[6]);
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
    const templateId = getSpace(week.spaceId).templateId;
    week.days = shiftWeekDays(week.days, startIndex, {
      startDate: week.startDate,
      templateId,
      normalizeDay: normalizeWeekDay,
    });
    persistState(["schedule"]);
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
    $("#clearSelectedDayButton").disabled = filteredWeeks.length === 0;
    $("#clearSelectedWeekButton").disabled = filteredWeeks.length === 0;
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
      button.addEventListener("click", () => selectWeek(button.dataset.selectWeek));
    });
    bindSnapSelection(weekTimeline, "[data-select-week]", () => selectedWeekId, selectWeek, (control) => control?.dataset.selectWeek);
    revealSelectedCard(weekTimeline, `[data-select-week="${escapeSelectorValue(selectedWeekId)}"]`);

    renderWeekDetail(findWeek(selectedWeekId));
  }

  function selectWeek(weekId) {
    if (!state.weeks.some((week) => week.id === weekId) || weekId === selectedWeekId) return;
    selectedWeekId = weekId;
    renderWeeks();
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
        ${renderWeekDayEditor(week, selectedDay, selectedIndex)}
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

  function renderWeekDayEditor(week, day, selectedIndex) {
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
          <div class="week-day-heading-group">
            <div class="week-day-identity">
              <span>DAY ${day.dayNumber} · ${escapeHtml(formatCompactDate(day.date))}</span>
              <label class="week-day-title-edit" title="点击修改当天名称">
                <input data-day-text-field="title" maxlength="20" aria-label="这一天的名称，可直接修改" value="${escapeAttr(day.title)}" />
              </label>
            </div>
            <nav class="week-day-navigation" aria-label="切换当天">
              <button type="button" data-week-day-step="-1" aria-label="前一天"${selectedIndex === 0 ? " disabled" : ""}>←</button>
              <strong><span>Day ${day.dayNumber} / ${week.days.length}</span><small>${escapeHtml(formatCompactDate(day.date))}</small></strong>
              <button type="button" data-week-day-step="1" aria-label="后一天"${selectedIndex === week.days.length - 1 ? " disabled" : ""}>→</button>
            </nav>
          </div>
          <button class="week-day-sticker-button" type="button" data-pick-day-sticker aria-label="选择今天的表情">
            ${sticker ? `<img src="${escapeAttr(assetUrl(sticker))}" alt="今天的表情" />` : `<span class="week-day-sticker-empty" aria-hidden="true"><b>＋</b><small>选表情</small></span>`}
          </button>
          <div class="week-day-statuses" aria-label="今天完成得怎么样">${statuses}</div>
          <small class="week-day-title-help">点击今日标题可以直接修改哟~</small>
          <div class="week-day-primary-actions">
            <button class="week-record-today${day.recorded ? " is-recorded" : ""}" type="button" data-record-today aria-pressed="${day.recorded}">${day.recorded ? "✓ 今天已记录" : "记录今天"}</button>
            <button class="week-shift-day" type="button" data-shift-current-day>顺延一天</button>
          </div>
        </header>

        <div class="week-focus-field">
          <label><span>今日重点</span><input data-day-text-field="focus" maxlength="500" placeholder="今天最想推进的一件事" value="${escapeAttr(day.focus)}" /></label>
        </div>

        <div class="week-item-table">
          <div class="week-item-table-head">
            <strong>计划安排</strong>
            <div class="week-item-legend" aria-label="安排状态说明">
              <span class="is-done">✓ 完成</span>
              <span class="is-changed">⚡ 调整过</span>
              <span class="is-missed">× 未完成</span>
            </div>
          </div>
          <div class="week-item-rows">${rows}</div>
          <button class="week-add-item" type="button" data-add-week-item>＋ 添加一项安排</button>
        </div>

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

  function persistWeekDetail(week, { deferred = false } = {}) {
    persistState([], { deferred });
    if (!deferred) renderWeekDetail(week);
  }

  function bindInlineWeekDayEditor(week, day) {
    $$('[data-week-item-text]', weekDetail).forEach((input) => {
      input.addEventListener("input", () => {
        const row = input.closest('[data-week-item-index]');
        const item = ensureWeekItem(day, Number(row.dataset.weekItemIndex));
        item.text = safeString(input.value, 160);
        persistWeekDetail(week, { deferred: true });
      });
    });

    $$('[data-set-week-item-state]', weekDetail).forEach((button) => {
      button.addEventListener("click", () => {
        const row = button.closest('[data-week-item-index]');
        const item = ensureWeekItem(day, Number(row.dataset.weekItemIndex));
        item.state = WEEK_ITEM_STATES.has(button.dataset.setWeekItemState) ? button.dataset.setWeekItemState : "";
        if (item.state) playWeekFeedback({ done: "positive", changed: "adjusted", missed: "missed" }[item.state]);
        persistWeekDetail(week);
      });
    });

    $$('[data-day-text-field]', weekDetail).forEach((input) => {
      input.addEventListener("input", () => {
        const field = input.dataset.dayTextField;
        day[field] = safeString(input.value, field === "note" ? 600 : field === "title" ? 20 : 500);
        persistWeekDetail(week, { deferred: true });
      });
      input.addEventListener("change", () => window.setTimeout(() => renderWeekDetail(week), 0));
    });

    $$('[data-remove-week-item]', weekDetail).forEach((button) => {
      button.addEventListener("click", () => {
        day.items.splice(Number(button.dataset.removeWeekItem), 1);
        persistWeekDetail(week);
      });
    });
    $("[data-add-week-item]", weekDetail).addEventListener("click", () => {
      if (day.items.length >= 24) {
        showToast("一天最多添加 24 项");
        return;
      }
      day.items.push({ id: makeId(), text: "", state: "", legacyActual: "" });
      persistWeekDetail(week);
      $$('[data-week-item-text]', weekDetail).at(-1)?.focus();
    });

    $("[data-record-today]", weekDetail)?.addEventListener("click", () => {
      day.recorded = !day.recorded;
      if (day.recorded) playWeekFeedback("recorded");
      persistState(["schedule"]);
      showToast(day.recorded ? `Day${day.dayNumber} 已计入本周记录` : `Day${day.dayNumber} 已取消记录`);
    });
    $$('[data-set-day-status]', weekDetail).forEach((button) => {
      button.addEventListener("click", () => {
        day.status = ["这期拉了", "还不错", "好好好"].includes(button.dataset.setDayStatus) ? button.dataset.setDayStatus : "";
        if (day.status) playWeekFeedback({ "好好好": "positive", "还不错": "adjusted", "这期拉了": "missed" }[day.status]);
        persistWeekDetail(week);
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
    weekStickerDialog.close();
    playWeekFeedback("recorded");
    persistState(["schedule"]);
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
    persistState();
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
    persistState();
    await copyText(prompt);
    showToast("计划模板已复制，请继续粘贴到同一个 AI 对话");
  }

  function parseAiPlanText(rawText) {
    return parseAiPlanTemplate(rawText)
      .map((week) => normalizeWeek({ ...week, spaceId: activeSpaceId }, state.spaces));
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
    weekImportDialog.close();
    persistState(["schedule"]);
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
        const percent = getProgressPercent(goal);
        lines.push(`  - ${goal.title}：${formatProgressNumber(goal.current)} / ${formatProgressNumber(goal.target)} ${goal.unit}（${formatProgressNumber(percent)}%）`);
      });
    }

    week.days.forEach((day) => {
      const plannedItems = day.items.filter((item) => item.text || item.state);
      lines.push("", "", `## Day${day.dayNumber} · ${formatCompactDate(day.date)} · ${day.title}`);
      lines.push(`- 是否记录：${day.recorded ? "已记录" : "未记录"}`);
      lines.push(`- 完成状态：${day.status || "未选择"}`);
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
                    <article class="weekly-report-goal weekly-report-goal--tone-${index % 4}" style="--report-goal-color:${escapeAttr(getCardColor(goal, index))}">
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
                  const percent = getProgressPercent(goal);
                  return `
                    <article class="weekly-report-goal weekly-report-progress weekly-report-goal--tone-${(index + goals.length) % 4}" style="--report-progress:${percent}%;--report-goal-color:${escapeAttr(getCardColor(goal, index + goals.length))}">
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
      const canvas = createWeeklyReportCanvas(week, state);
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
      const canvas = createWeeklySummaryCanvas(week, state);
      downloadCanvasAsPng(canvas, `Asoul-${getSpaceTemplate(week.spaceId).name}周报摘要-${week.startDate}.png`);
      showToast("横版周报摘要已经下载");
    } catch {
      showToast("图片生成失败，请稍后再试");
    } finally {
      button.disabled = false;
      button.textContent = "下载 4K 横版";
    }
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
          <span>纵轴最小值</span>
          <input data-series-axis-min type="number" step="any" inputmode="decimal" placeholder="留空自动" value="${Number.isFinite(Number(item.axisMin)) && item.axisMin !== null && item.axisMin !== "" ? escapeAttr(item.axisMin) : ""}" />
        </label>
        <label class="field">
          <span>纵轴最大值</span>
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

  function getCardColor(item, index = 0) {
    return safeCardColor(item?.color) || CARD_AUTO_COLORS[Math.max(0, index) % CARD_AUTO_COLORS.length];
  }

  function setThemeColorField(form, selectedColor = "", fallbackIndex = 0) {
    const select = form?.elements?.color;
    if (!select) return;
    if (!select.options.length) {
      select.innerHTML = `
        <option value="">自动配色（按卡片顺序）</option>
        ${ALLOWED_COLORS.map((color) => `<option value="${color}">${escapeHtml(colorName(color))}</option>`).join("")}
      `;
    }
    const field = select.closest("[data-theme-color-field]");
    field.dataset.fallbackIndex = String(Math.max(0, fallbackIndex));
    select.value = safeCardColor(selectedColor);
    if (!select.dataset.themeColorBound) {
      select.dataset.themeColorBound = "true";
      select.addEventListener("change", () => updateThemeColorPreview(select));
    }
    updateThemeColorPreview(select);
  }

  function updateThemeColorPreview(select) {
    const field = select.closest("[data-theme-color-field]");
    if (!field) return;
    const fallbackIndex = Number(field.dataset.fallbackIndex) || 0;
    field.style.setProperty("--theme-preview-color", getCardColor({ color: select.value }, fallbackIndex));
    field.classList.toggle("is-auto", !safeCardColor(select.value));
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

    chartDialog.close();
    persistState(["charts"]);
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
    $$(".chart-action-menu", chartsGrid).forEach((menu) => {
      const panel = $(":scope > div", menu);
      panel?.addEventListener("click", (event) => event.stopPropagation());
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
           <p class="${selectedNode.note ? "" : "is-empty"}">${selectedNode.note ? escapeHtml(selectedNode.note) : "这一天还没有写小笔记。"}</p>
         </div>
         <button class="secondary-button" type="button" data-chart-id="${chart.id}" data-edit-selected-node="${selectedNode.id}">设置当前节点</button>`
      : "";
    const chartBody = chart.nodes.length
      ? renderChartSvg(chart, { ...getChartZoomState(chart), selectedNodeId: selectedNode?.id || "" })
      : renderEmptyChart(chart);

    return `
      <article class="chart-card" style="--chart-color:${primaryColor}">
        <div class="chart-card-head">
          <div class="chart-card-title">
            <div class="chart-heading-line">
              <h3>${escapeHtml(chart.title)}</h3>
              <div class="chart-meta">
                <span>${chart.series.length} 项指标</span>
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


  function getChartZoomState(chart) {
    const baseLayout = createChartSvgLayout(chart, 1);
    const levels = buildChartZoomLevels({
      nodeCount: chart.nodes.length,
      baseWidth: baseLayout.width,
      horizontalMargins: baseLayout.margin.left + baseLayout.margin.right,
      minimumNodeSpacing: 96,
    });
    const requestedZoom = Number(chartZoomById.get(chart.id)) || levels[0];
    const zoom = Math.max(levels[0], Math.min(levels.at(-1), requestedZoom));
    if (Math.abs(requestedZoom - zoom) > 0.001) chartZoomById.set(chart.id, zoom);
    return { zoom, levels };
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

    const existingSticker = Object.values(selectedNodeStickers).find(Boolean) || "";
    activeStickerPack = Object.entries(STICKER_PACKS)
      .find(([, stickers]) => stickers.includes(existingSticker))?.[0]
      || Object.keys(STICKER_PACKS)[0]
      || "";
    renderStickerTabs();
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

    nodeDialog.close();
    persistState(["charts"]);
  }

  function deleteActiveNode() {
    const chart = findChart(activeNodeChartId);
    if (!chart || !editingNodeId) return;
    if (!window.confirm("确定删除这个节点吗？这一步无法撤销。")) return;
    chart.nodes = chart.nodes.filter((node) => node.id !== editingNodeId);
    selectedNodeByChart.delete(chart.id);
    nodeDialog.close();
    persistState(["charts"]);
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
    persistState(["charts"]);
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
    persistState(["charts"]);
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
    const chart = findChart(chartId);
    if (!chart) return;
    const { zoom: current, levels } = getChartZoomState(chart);
    if (current <= 1.001 && (action === "in" || action === "max") && chart.nodes.length > 1) {
      const selectedId = selectedNodeByChart.get(chartId);
      const selectedIndex = Math.max(0, chart.nodes.findIndex((node) => node.id === selectedId));
      chartScrollById.set(chartId, selectedIndex / (chart.nodes.length - 1));
    }
    if (action === "reset" || action === "min") chartScrollById.set(chartId, 0);
    const next = getNextZoom(current, action, levels);
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
      <button class="sticker-item${activeSticker ? "" : " is-selected"}" type="button" data-sticker="" aria-label="表情留空"><span class="sticker-none">留空</span></button>
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
    persistState(["avatar"]);
    avatarDialog.close();
    showToast("表情包头像换好啦");
  }

  function clearAvatar() {
    state.profile.avatar = "";
    pendingAvatarSticker = "";
    persistState(["avatar"]);
    avatarDialog.close();
    showToast("已恢复默认头像");
  }

  function showRandomJoke() {
    if (!coldJokes.length) {
      $("#jokeQuestion").textContent = "今天的枝江冷笑话正在路上。";
      $("#jokeAnswerText").textContent = "晚一点再来看看吧。";
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
    const backup = createDiaryBackupPayload(state, new Date().toISOString());
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

  async function importBackup(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const imported = parseDiaryBackup(await file.text());
      const nextState = normalizeState(imported);
      if (!window.confirm("恢复备份会覆盖当前页面里的资料，确定继续吗？")) return;
      state = nextState;
      diaryStore.unblock();
      persistState();
      selectedNodeByChart.clear();
      selectedDayByWeek.clear();
      chartZoomById.clear();
      chartScrollById.clear();
      selectedGoalId = state.goals[0]?.id || null;
      selectedProgressGoalId = state.progressGoals[0]?.id || null;
      activeSpaceId = safeSpaceId(state.activeSpaceId);
      const activeWeeks = getActiveSpaceWeeks();
      const activePeriods = getActiveSpacePeriods();
      selectedWeekId = pickRelevantWeek(activeWeeks)?.id || null;
      if (activePeriods.length) weekYearFilter = activePeriods.at(-1).yearMonth.slice(0, 4);
      weekMonthFilter = activePeriods.at(-1)?.yearMonth.slice(5, 7) || "";
      renderAllDataViews({ hydrateProfile: true });
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

  function findChart(id) {
    return state.charts.find((chart) => chart.id === id);
  }

  function assetUrl(value) {
    try {
      return new URL(value, document.baseURI).href;
    } catch (error) {
      return "";
    }
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
    const mobileQuery = window.matchMedia("(max-width: 899.98px)");
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
    const revealMobileViewSelection = (id) => {
      if (id === "goalSectionStart") {
        revealSelectedCard(goalList, `[data-select-goal="${escapeSelectorValue(selectedGoalId)}"]`);
        revealSelectedCard(progressGoalList, `[data-select-progress-goal="${escapeSelectorValue(selectedProgressGoalId)}"]`);
      }
      if (id === "spaceSectionStart") {
        const spaceRail = $(".space-switcher-mobile", spaceSwitcher);
        revealSelectedCard(spaceRail, `[data-space-id="${escapeSelectorValue(activeSpaceId)}"]`);
        revealSelectedCard(weekTimeline, `[data-select-week="${escapeSelectorValue(selectedWeekId)}"]`);
      }
    };
    const showMobileView = (id, { updateHistory = false, scroll = true } = {}) => {
      const nextId = views.some((view) => view.dataset.appView === id) ? id : "home";
      views.forEach((view) => { view.hidden = view.dataset.appView !== nextId; });
      document.body.classList.add("is-mobile-app");
      document.body.dataset.activeView = nextId;
      document.body.classList.add("mobile-app-ready");
      setActive(nextId);
      if (nextId === "spaceSectionStart") renderWeeks();
      if (nextId === "chartsSection") renderCharts();
      revealMobileViewSelection(nextId);
      if (updateHistory) history.pushState({ appView: nextId }, "", nextId === "home" ? "#top" : `#${nextId}`);
      if (scroll) window.scrollTo({ top: 0, behavior: "auto" });
    };
    const syncLayout = () => {
      if (mobileQuery.matches) {
        showMobileView(resolveHashView(), { scroll: false });
        return;
      }
      document.body.classList.remove("is-mobile-app");
      document.body.classList.add("mobile-app-ready");
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
    const updateAction = $("#updateAppButton");
    if (!action) return;
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    const setInstallAction = (label, title) => {
      action.querySelector("span").textContent = label;
      action.title = title;
      action.classList.add("is-ready");
    };
    setInstallAction("安装", "安装到桌面或手机主屏幕");
    action.hidden = isStandalone;
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      deferredInstallPrompt = event;
      if (!isStandalone) action.hidden = false;
      setInstallAction("安装", "安装到桌面或手机主屏幕");
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
      } else if (!window.isSecureContext) {
        showToast("安装需要 HTTPS 地址，或在本机通过 localhost 打开");
      } else if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
        showToast("iPhone：点 Safari 分享按钮，再选“添加到主屏幕”");
      } else {
        showToast("浏览器暂未提供安装，可在浏览器菜单中选择“安装应用”");
      }
    });
    window.addEventListener("appinstalled", () => {
      deferredInstallPrompt = null;
      action.hidden = true;
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
    preloadCanvasAsset("icons/icon-v3.png", true);
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
