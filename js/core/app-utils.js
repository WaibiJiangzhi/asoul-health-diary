(() => {
  "use strict";

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

  function formatNumber(value) {
    return new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 2 }).format(Number(value));
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

  globalThis.ASOUL_APP_UTILS = Object.freeze({
    addDaysIso,
    escapeAttr,
    escapeHtml,
    escapeXml,
    formatChartAxisLabel,
    formatCompactDate,
    formatDateRange,
    formatFriendlyDate,
    formatGoalDate,
    formatMonthDay,
    formatNumber,
    formatProgressInput,
    formatProgressNumber,
    formatProgressUpdateTime,
    formatSeriesInput,
    formatSeriesValue,
    formatWeight,
    getGoalCountdown,
    getMonthMondays,
    parseChartDate,
    parseSeriesValue,
    safeDate,
    safeString,
    safeWeight,
    shortLabel,
    startOfWeekIso,
    todayIso,
  });
})();
