(() => {
  "use strict";

  function createWeeklyReportRenderer(options = {}) {
    const {
      utils,
      scheduleDomain,
      milestoneDomain,
      canvasUtils,
      getSpaceTemplate,
      getCardColor,
      imageCache,
      dayStatusPalette,
      itemSummaryPalette,
    } = options;
    if (!utils || !scheduleDomain || !milestoneDomain || !canvasUtils) {
      throw new Error("weekly report renderer requires utility, domain, and canvas boundaries");
    }

    const {
      addDaysIso,
      formatCompactDate,
      formatDateRange,
      formatFriendlyDate,
      formatGoalDate,
      formatProgressNumber,
      getGoalCountdown,
    } = utils;
    const { countWeekItemStates, weekItemStateMark } = scheduleDomain;
    const { getProgressPercent } = milestoneDomain;
    const {
      colorMixForCanvas,
      drawCanvasAppIcon,
      drawCanvasCard,
      drawCanvasPill,
      drawCanvasProgress,
      drawCanvasRoundedRectPath,
      drawCanvasSticker,
      drawCanvasText,
    } = canvasUtils;

    function getMilestones(week, reportState) {
      const goals = (reportState?.goals || []).filter((goal) => goal.spaceIds.includes(week.spaceId));
      const progressGoals = (reportState?.progressGoals || []).filter((goal) => goal.spaceIds.includes(week.spaceId));
      return [
        ...goals.map((goal) => ({ type: "countdown", data: goal })),
        ...progressGoals.map((goal) => ({ type: "progress", data: goal })),
      ];
    }

    function createWeeklyReportCanvas(week, reportState) {
      const template = getSpaceTemplate(week.spaceId);
      const milestones = getMilestones(week, reportState);
      const scale = 2;
      const width = 1080;
      const outer = 54;
      const gap = 14;
      const milestoneCardHeight = 104;
      const milestoneRows = Math.ceil(milestones.length / 2);
      const milestoneHeight = milestones.length ? 70 + milestoneRows * (milestoneCardHeight + gap) : 0;
      const dayCardWidth = (width - outer * 2 - gap) / 2;
      const dayHeights = week.days.map((day) => getCanvasDayHeight(day));
      const dayRowHeights = Array.from({ length: Math.ceil(week.days.length / 2) }, (_, rowIndex) => (
        Math.max(...dayHeights.slice(rowIndex * 2, rowIndex * 2 + 2))
      ));
      const daySectionHeight = dayRowHeights.reduce((sum, value) => sum + value, 0) + gap * Math.max(0, dayRowHeights.length - 1);
      const height = outer + 176 + milestoneHeight + 72 + daySectionHeight + 72;
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

      drawCanvasAppIcon(context, width - outer - 58, outer + 5, 58, imageCache);

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
      drawCanvasPill(context, outer, outer + 124, 126, 38, `${itemCounts.done} 项完成`, itemSummaryPalette.done.fill, itemSummaryPalette.done.ink);
      drawCanvasPill(context, outer + 136, outer + 124, 126, 38, `${itemCounts.changed} 项调整`, itemSummaryPalette.changed.fill, itemSummaryPalette.changed.ink);
      drawCanvasPill(context, outer + 272, outer + 124, 126, 38, `${itemCounts.missed} 项未完成`, itemSummaryPalette.missed.fill, itemSummaryPalette.missed.ink);
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
          drawCanvasMilestone(context, item, cardX, cardY, cardWidth, milestoneCardHeight, week, index);
        });
        y += milestoneHeight;
      }

      const statusSummary = week.days.reduce((summary, day) => {
        const key = day.status || "未设置";
        summary[key] = (summary[key] || 0) + 1;
        return summary;
      }, {});
      const statuses = ["好好好", "还不错", "这期拉了", "未设置"]
        .map((label) => [label, dayStatusPalette[label].fill, dayStatusPalette[label].ink]);
      let statusX = outer;
      statuses.forEach(([label, fill, color]) => {
        drawCanvasPill(context, statusX, y + 14, 118, 36, `${label} ${statusSummary[label] || 0}`, fill, color);
        statusX += 128;
      });
      y += 72;

      const dayRowOffsets = dayRowHeights.map((_, rowIndex) => (
        dayRowHeights.slice(0, rowIndex).reduce((sum, value) => sum + value, 0) + rowIndex * gap
      ));
      week.days.forEach((day, index) => {
        const rowIndex = Math.floor(index / 2);
        const cardX = outer + index % 2 * (dayCardWidth + gap);
        const cardY = y + dayRowOffsets[rowIndex];
        drawCanvasDayVertical(context, day, template, cardX, cardY, dayCardWidth, dayRowHeights[rowIndex], index);
      });
      context.fillStyle = "#938d9b";
      context.font = "600 12px system-ui, sans-serif";
      context.textAlign = "center";
      context.fillText("ASOUL 一个魂生活日记 · 数据保存在你的设备中", width / 2, height - 30);
      context.textAlign = "left";
      return canvas;
    }

    function drawCanvasMilestone(context, item, x, y, width, height, week, toneIndex = 0) {
      const tone = getCardColor(item.data, toneIndex);
      drawCanvasCard(context, x, y, width, height, "#ffffff", "#e9e3f3");
      context.fillStyle = tone;
      context.fillRect(x, y, 5, height);
      const sticker = imageCache.get(item.data.sticker);
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
        const percent = getProgressPercent(item.data);
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
      const entries = getCanvasDayEntries(day);
      const visibleEntries = (entries.length ? entries : [{ text: "当天没有安排事项" }]).slice(0, 7);
      const listHeight = visibleEntries.reduce((sum, entry) => {
        const lineCount = Math.min(2, Math.max(1, Math.ceil([...String(entry.text || "未填写安排")].length / 18)));
        return sum + lineCount * 18 + 11;
      }, 0);
      const hasFooter = Boolean(day.focus || day.note);
      return 132 + listHeight + (entries.length > 7 ? 22 : 0) + (hasFooter ? 80 : 28);
    }

    function drawCanvasDayVertical(context, day, template, x, y, width, height, index) {
      const tones = ["#8871ec", "#e88da9", "#4ea78e", "#dd756b"];
      const tone = dayStatusPalette[day.status]?.fill || tones[index % tones.length];
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
      const sticker = imageCache.get(day.sticker);
      if (sticker?.complete && sticker.naturalWidth) drawCanvasSticker(context, sticker, x + width - 84, y + 22, 58);

      const entries = getCanvasDayEntries(day);
      const listX = x + 128;
      const listY = y + 132;
      let rowY = listY;
      (entries.length ? entries : [{ text: "当天没有安排事项", state: "" }]).slice(0, 7).forEach((entry) => {
        const mark = weekItemStateMark(entry.state);
        context.fillStyle = entry.state === "done" ? "#32977c" : entry.state === "changed" ? "#d69a31" : entry.state === "missed" ? "#cc626c" : "#9a929f";
        context.font = "900 17px system-ui, sans-serif";
        context.fillText(mark, listX, rowY);
        context.fillStyle = "#484251";
        context.font = "760 14px system-ui, sans-serif";
        const lineCount = Math.min(2, Math.max(1, Math.ceil([...String(entry.text || "未填写安排")].length / 18)));
        drawCanvasText(context, entry.text || "未填写安排", listX + 28, rowY, width - 176, 18, 2);
        rowY += lineCount * 18 + 11;
      });
      if (entries.length > 7) {
        context.fillStyle = "#8e8794";
        context.font = "550 12px system-ui, sans-serif";
        context.fillText(`另有 ${entries.length - 7} 项，请在网页中查看`, listX + 28, rowY);
      }
      const footerParts = [];
      if (day.focus) footerParts.push(`${template.firstFieldLabel}：${day.focus}`);
      if (day.note) footerParts.push(`当天小记：${day.note}`);
      if (footerParts.length) {
        context.strokeStyle = "#ede9f0";
        context.setLineDash([5, 6]);
        context.beginPath();
        context.moveTo(listX, y + height - 67);
        context.lineTo(x + width - 26, y + height - 67);
        context.stroke();
        context.setLineDash([]);
        context.fillStyle = "#736d79";
        context.font = "520 12px system-ui, sans-serif";
        drawCanvasText(context, footerParts.join(" · "), listX, y + height - 40, width - 176, 17, 2);
      }
    }

    function createWeeklySummaryCanvas(week, reportState) {
      const scale = 2;
      const width = 1920;
      const outer = 78;
      const template = getSpaceTemplate(week.spaceId);
      const milestones = getMilestones(week, reportState).slice(0, 4);
      const daysY = milestones.length > 2 ? 576 : 450;
      const height = daysY + 374;
      const contextCanvas = document.createElement("canvas");
      contextCanvas.width = width * scale;
      contextCanvas.height = height * scale;
      const context = contextCanvas.getContext("2d");
      context.scale(scale, scale);
      const itemCounts = countWeekItemStates(week);
      const recordedCount = week.days.filter((day) => day.recorded === true).length;

      drawWeeklySummaryBackground(context, width, height, outer);
      drawWeeklySummaryHeader(context, week, template, itemCounts, recordedCount, width, outer);
      drawWeeklySummaryMilestones(context, milestones, week, width, outer);
      drawWeeklySummaryDays(context, week, daysY, width, outer);

      context.fillStyle = "#8c8693";
      context.font = "600 17px system-ui, sans-serif";
      context.textAlign = "center";
      context.fillText("ASOUL 一个魂生活日记", width / 2, height - 54);
      context.textAlign = "left";
      return contextCanvas;
    }

    function drawWeeklySummaryBackground(context, width, height, outer) {
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
      drawCanvasAppIcon(context, width - outer - 76, outer - 3, 76, imageCache);
    }

    function drawWeeklySummaryHeader(context, week, template, itemCounts, recordedCount, width, outer) {
      context.fillStyle = "#7865cf";
      context.font = "850 22px system-ui, sans-serif";
      context.fillText(`ASOUL ${template.id.toUpperCase()} WEEKLY`, outer, outer + 24);
      context.fillStyle = "#29263d";
      context.font = "900 54px system-ui, sans-serif";
      drawCanvasText(context, week.title, outer, outer + 88, 1040, 62, 1);
      context.fillStyle = "#777287";
      context.font = "650 24px system-ui, sans-serif";
      context.fillText(`${formatDateRange(week.startDate)} · 已记录 ${recordedCount}/7 天`, outer, outer + 132);
      drawCanvasPill(context, width - outer - 560, outer + 102, 132, 50, `${itemCounts.done} 完成`, itemSummaryPalette.done.fill, itemSummaryPalette.done.ink);
      drawCanvasPill(context, width - outer - 414, outer + 102, 132, 50, `${itemCounts.changed} 调整`, itemSummaryPalette.changed.fill, itemSummaryPalette.changed.ink);
      drawCanvasPill(context, width - outer - 268, outer + 102, 132, 50, `${itemCounts.missed} 未完成`, itemSummaryPalette.missed.fill, itemSummaryPalette.missed.ink);
    }

    function drawWeeklySummaryMilestones(context, milestones, week, width, outer) {
      const milestoneY = 280;
      context.fillStyle = "#6252ad";
      context.font = "850 18px system-ui, sans-serif";
      context.fillText("WEEKLY MILESTONES · 本周坐标", outer, milestoneY - 24);
      if (milestones.length) {
        const cardWidth = (width - outer * 2 - 22) / 2;
        milestones.forEach((item, index) => {
          const x = outer + index % 2 * (cardWidth + 22);
          const y = milestoneY + Math.floor(index / 2) * 132;
          drawCanvasMilestone(context, item, x, y, cardWidth, 112, week, index);
        });
      } else {
        context.fillStyle = "#918a98";
        context.font = "600 19px system-ui, sans-serif";
        context.fillText("这个空间暂时没有关联的倒计时或进度目标。", outer, milestoneY + 45);
      }
    }

    function drawWeeklySummaryDays(context, week, daysY, width, outer) {
      context.fillStyle = "#6252ad";
      context.font = "850 18px system-ui, sans-serif";
      context.fillText("SEVEN DAYS · 一周足迹", outer, daysY - 24);
      const dayGap = 13;
      const dayWidth = (width - outer * 2 - dayGap * 6) / 7;
      week.days.forEach((day, index) => {
        const x = outer + index * (dayWidth + dayGap);
        const tone = dayStatusPalette[day.status]?.fill || "#8a838d";
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
        const sticker = imageCache.get(day.sticker);
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
        context.fillText(`${done} 完成 · ${changed} 调整 · ${missed} 未完成`, x + 18, daysY + 180);
        if (day.note) {
          context.fillStyle = "#817b88";
          context.font = "600 12px system-ui, sans-serif";
          drawCanvasText(context, day.note, x + 18, daysY + 204, dayWidth - 36, 16, 2);
        }
        drawCanvasProgress(context, x + 18, daysY + 244, dayWidth - 36, entries.length ? (done + changed) / entries.length * 100 : 0, tone);
      });
    }

    return Object.freeze({
      createWeeklyReportCanvas,
      createWeeklySummaryCanvas,
      getCanvasDayHeight,
    });
  }

  globalThis.ASOUL_WEEKLY_REPORT_RENDERER = Object.freeze({ createWeeklyReportRenderer });
})();
