(() => {
  "use strict";

  function hasWeekDayRecord(day) {
    return day?.recorded === true;
  }

  function hasScheduleDayContent(day) {
    return Boolean(day && (
      day.items?.length
      || day.focus
      || day.note
      || day.status
      || day.sticker
      || Number.isFinite(day.weight)
    ));
  }

  function weekItemStateMark(state) {
    return ({ done: "✓", changed: "⚡", missed: "×" })[state] || "·";
  }

  function weekItemStateLabel(state) {
    return ({ done: "完成", changed: "调整过计划", missed: "未完成" })[state] || "待记录";
  }

  function countWeekItemStates(week) {
    return (Array.isArray(week?.days) ? week.days : []).reduce((counts, day) => {
      (Array.isArray(day?.items) ? day.items : []).forEach((item) => {
        if (item.state === "done") counts.done += 1;
        else if (item.state === "changed") counts.changed += 1;
        else if (item.state === "missed") counts.missed += 1;
        else counts.pending += 1;
      });
      return counts;
    }, { done: 0, changed: 0, missed: 0, pending: 0 });
  }

  function parseAiPlanTemplate(rawText) {
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
        currentDay.title = String(dayMatch[2] ?? "").trim().slice(0, 36) || "休息日";
        currentWeek.days[index] = currentDay;
        return;
      }
      if (!currentDay) return;
      const focusMatch = line.match(/^【重点】\s*(.*)$/);
      if (focusMatch) {
        currentDay.focus = String(focusMatch[1] ?? "").trim().slice(0, 500);
        return;
      }
      const taskMatch = line.match(/^【任务】\s*(.*)$/);
      if (taskMatch) {
        const task = String(taskMatch[1] ?? "").replace(/[｜|]/, "：").trim().slice(0, 160);
        if (task) currentDay.items.push({ text: task, state: "", legacyActual: "" });
      }
    });
    return weeks;
  }

  function shiftWeekDays(days, startIndex, { startDate, templateId, normalizeDay }) {
    const currentDays = Array.isArray(days) ? days : [];
    if (currentDays.length !== 7 || !Number.isInteger(startIndex) || startIndex < 0 || startIndex > 6) return currentDays;
    const sourceDays = JSON.parse(JSON.stringify(currentDays));
    const shiftedDays = currentDays.slice();
    for (let index = 6; index > startIndex; index -= 1) {
      const identity = currentDays[index];
      const moved = normalizeDay(sourceDays[index - 1], index, startDate, templateId);
      moved.id = identity.id;
      moved.date = identity.date;
      shiftedDays[index] = moved;
    }
    const startIdentity = currentDays[startIndex];
    const emptyStartDay = normalizeDay({}, startIndex, startDate, templateId);
    emptyStartDay.id = startIdentity.id;
    emptyStartDay.date = startIdentity.date;
    shiftedDays[startIndex] = emptyStartDay;
    return shiftedDays;
  }

  globalThis.ASOUL_SCHEDULE_DOMAIN = Object.freeze({
    countWeekItemStates,
    hasScheduleDayContent,
    hasWeekDayRecord,
    parseAiPlanTemplate,
    shiftWeekDays,
    weekItemStateLabel,
    weekItemStateMark,
  });
})();
