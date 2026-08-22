(() => {
  "use strict";

  function createStateNormalizer(options = {}) {
    const dataModel = options.dataModel;
    const utils = options.utils;
    if (!dataModel?.migrateState || !utils) throw new Error("state normalizer requires data-model and app-utils");

    const {
      addDaysIso,
      formatMonthDay,
      getMonthMondays,
      safeDate,
      safeString,
      safeWeight,
      startOfWeekIso,
      todayIso,
    } = utils;
    const defaultState = options.defaultState || {};
    const defaultSpaces = Array.isArray(options.defaultSpaces) ? options.defaultSpaces : [];
    const spaceTemplates = options.spaceTemplates || {};
    const allowedColors = Array.isArray(options.allowedColors) ? options.allowedColors : [];
    const stickerPacks = options.stickerPacks || {};
    const legacyStickerFallbacks = options.legacyStickerFallbacks || {};
    const selectValidSpaceIds = options.selectValidSpaceIds || (() => []);
    const limits = {
      spaces: Number(options.limits?.spaces) || 8,
      goals: Number(options.limits?.goals) || 4,
      progressGoals: Number(options.limits?.progressGoals) || 6,
    };
    const weekItemStates = options.weekItemStates || new Set(["", "done", "changed", "missed"]);
    const weekItemsNotTracked = options.weekItemsNotTracked || new Set();
    const allLocalStickers = new Set(Object.values(stickerPacks).flat());

    const cloneDefault = () => JSON.parse(JSON.stringify(defaultState));

    function makeId() {
      if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
      return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
    }

    function safeId(value) {
      const text = String(value || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
      return text || makeId();
    }

    function safeSticker(value) {
      const sticker = String(value || "");
      if (!sticker) return "";
      if (allLocalStickers.has(sticker)) return sticker;
      const legacyPack = sticker.match(/^图片\/(贝拉|嘉然|乃琳)表情包\//)?.[1];
      if (legacyPack) return legacyStickerFallbacks[legacyPack] || "";
      const numberedFolderMatch = sticker.match(/^图片\/(贝拉|嘉然|乃琳)\/(.+)$/);
      if (!numberedFolderMatch) return "";
      const [, packName, oldWithinPack] = numberedFolderMatch;
      return (stickerPacks[packName] || []).find((path) => {
        const currentWithinPack = path.replace(new RegExp(`^图片/${packName}/\\d+-`), "");
        return currentWithinPack === oldWithinPack.replace(/^\d+-/, "");
      }) || "";
    }

    function safeCardColor(value) {
      const normalized = String(value || "").trim().toLowerCase();
      return allowedColors.find((color) => color.toLowerCase() === normalized) || "";
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
            state: weekItemStates.has(state) ? state : "",
            legacyActual: safeString(item?.legacyActual, 160),
          };
        })
        .filter((item) => item.text || item.state || item.legacyActual);
    }

    function safeTemplateId(value) {
      return Object.hasOwn(spaceTemplates, value) ? value : "custom";
    }

    function normalizeDayType(value, templateId = "custom") {
      const text = safeString(value, 36);
      if (/休息|恢复|慢走/.test(text)) return "休息日";
      const activeDayLabel = spaceTemplates[safeTemplateId(templateId)]?.activeDayLabel || "行动日";
      return text ? activeDayLabel : "休息日";
    }

    function normalizeWeekDay(candidate, index, startDate, templateId = "custom") {
      const day = candidate && typeof candidate === "object" ? candidate : {};
      const allowedStatuses = ["", "这期拉了", "还不错", "好好好"];
      const status = safeString(day.status, 12);
      const items = normalizeWeekItems(day.items, day)
        .filter((item) => !weekItemsNotTracked.has(item.text.split("：")[0]));
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

    function safeSpaceIdForList(value, spaces) {
      const candidates = Array.isArray(spaces) ? spaces : defaultSpaces;
      return candidates.some((space) => space.id === value) ? value : (candidates[0]?.id || "");
    }

    function normalizeWeek(candidate, spaces = defaultSpaces) {
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
      const source = Array.isArray(candidate) ? candidate : defaultSpaces;
      const seen = new Set();
      const spaces = [];
      source.slice(0, limits.spaces).forEach((item, index) => {
        const rawId = safeString(item?.id, 60).replace(/[^a-zA-Z0-9_-]/g, "");
        let id = rawId || `space-${index + 1}`;
        while (seen.has(id)) id = `${id}-${index + 1}`;
        seen.add(id);
        const templateId = safeTemplateId(item?.templateId || item?.type || item?.id);
        const template = spaceTemplates[templateId];
        spaces.push({
          id,
          type: templateId,
          templateId,
          name: safeString(item?.name, 16) || template.name,
          icon: safeString(item?.icon, 2) || template.icon,
          iconSticker: safeSticker(item?.iconSticker),
          color: safeCardColor(item?.color),
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
      const availableSpaces = Array.isArray(spaces) ? spaces : defaultSpaces;
      return {
        id: safeId(goal.id),
        title,
        targetDate,
        note: safeString(goal.note, 80),
        sticker: safeSticker(goal.sticker),
        color: safeCardColor(goal.color),
        spaceIds: selectValidSpaceIds(goal.spaceIds, availableSpaces),
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
      const availableSpaces = Array.isArray(spaces) ? spaces : defaultSpaces;
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
        color: safeCardColor(goal.color),
        spaceIds: selectValidSpaceIds(goal.spaceIds, availableSpaces),
        updates,
        createdAt: Number(goal.createdAt) || Date.now(),
      };
    }

    function normalizeState(candidate) {
      const clean = cloneDefault();
      if (!candidate || typeof candidate !== "object") return clean;
      const migrated = dataModel.migrateState(candidate);

      clean.spaces = normalizeSpaces(migrated.spaces);
      clean.activeSpaceId = safeSpaceIdForList(migrated.activeSpaceId, clean.spaces);
      if (migrated.profile && typeof migrated.profile === "object") {
        clean.profile.name = safeString(migrated.profile.name, 20);
        clean.profile.gender = safeString(migrated.profile.gender, 20);
        clean.profile.age = safeString(migrated.profile.age, 4);
        clean.profile.signature = safeString(migrated.profile.signature, 60);
        clean.profile.avatar = safeSticker(migrated.profile.avatar);
      }
      clean.goals = (Array.isArray(migrated.goals) ? migrated.goals : [])
        .slice(0, limits.goals)
        .map((goal) => normalizeGoal(goal, clean.spaces))
        .filter(Boolean);
      clean.progressGoals = (Array.isArray(migrated.progressGoals) ? migrated.progressGoals : [])
        .slice(0, limits.progressGoals)
        .map((goal) => normalizeProgressGoal(goal, clean.spaces))
        .filter(Boolean);

      const sourceWeeks = Array.isArray(migrated.weeks)
        ? migrated.weeks
        : Array.isArray(migrated.weeklyPlans)
          ? migrated.weeklyPlans
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

      if (Array.isArray(migrated.charts)) {
        clean.charts = migrated.charts.slice(0, 160).map((chart) => {
          const sourceSeries = Array.isArray(chart.series) && chart.series.length
            ? chart.series
            : [{ id: makeId(), name: chart.yLabel || "纵轴", color: chart.color }];
          const series = sourceSeries.slice(0, 3).map((item, index) => ({
            id: safeId(item.id),
            name: safeString(item.name, 24) || `指标 ${index + 1}`,
            color: allowedColors.includes(item.color) ? item.color : allowedColors[index % allowedColors.length],
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

    return Object.freeze({
      cloneDefault,
      makeId,
      normalizeAiContext,
      normalizeGoal,
      normalizeProgressGoal,
      normalizeSpaces,
      normalizeState,
      normalizeWeek,
      normalizeWeekDay,
      safeCardColor,
      safeId,
      safeSpaceIdForList,
      safeSticker,
      safeTemplateId,
    });
  }

  globalThis.ASOUL_STATE_NORMALIZER = Object.freeze({ createStateNormalizer });
})();
