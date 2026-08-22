(() => {
  "use strict";

  function getChartSeriesGeometry(chart, { xAt, yAt, anchorCustomMax = true }) {
    return chart.series.map((series) => {
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
      const customMin = series.axisMin !== null && series.axisMin !== undefined && Number.isFinite(Number(series.axisMin))
        ? Number(series.axisMin)
        : null;
      const customMax = series.axisMax !== null && series.axisMax !== undefined && Number.isFinite(Number(series.axisMax))
        ? Number(series.axisMax)
        : null;
      let min = customMin ?? automaticMin;
      let max = customMax ?? automaticMax;
      if (max <= min) {
        const fallbackRange = Math.max(Math.abs(min) * 0.12, 1);
        if (anchorCustomMax && customMax !== null && customMin === null) min = max - fallbackRange;
        else max = min + fallbackRange;
      }
      const points = chart.nodes.map((node, index) => {
        const raw = node.values?.[series.id];
        const value = raw === null || raw === undefined ? NaN : Number(raw);
        if (!Number.isFinite(value)) return null;
        const visibleValue = Math.max(min, Math.min(max, value));
        const x = xAt(index);
        const y = yAt(visibleValue, min, max);
        return { node, value, x, y, px: x, py: y };
      }).filter(Boolean);
      return {
        ...series,
        min,
        max,
        points,
        pointByNode: new Map(points.map((point) => [point.node.id, point])),
        hasData,
      };
    });
  }

  function buildSmoothPath(points) {
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

  function getLabelEvery(nodeCount, maxLabels) {
    return Math.max(1, Math.ceil(Math.max(nodeCount - 1, 1) / Math.max(maxLabels - 1, 1)));
  }

  function buildChartZoomLevels({
    nodeCount,
    baseWidth,
    horizontalMargins = 0,
    minimumNodeSpacing = 96,
    steps = [1, 2, 4, 8, 16, 32, 64],
  }) {
    const totalNodes = Math.max(0, Math.floor(Number(nodeCount) || 0));
    const safeBaseWidth = Math.max(1, Number(baseWidth) || 1);
    const safeMargins = Math.max(0, Number(horizontalMargins) || 0);
    const safeNodeSpacing = Math.max(1, Number(minimumNodeSpacing) || 1);
    if (totalNodes <= 1) return [1];

    // At the final zoom level every recorded node receives one full date-label slot.
    const requiredWidth = safeMargins + totalNodes * safeNodeSpacing;
    const maximumZoom = Math.max(1, Math.ceil((requiredWidth / safeBaseWidth) * 100) / 100);
    const progressiveLevels = [...new Set((Array.isArray(steps) ? steps : [])
      .map(Number)
      .filter((level) => Number.isFinite(level) && level >= 1 && level < maximumZoom - 0.001))]
      .sort((left, right) => left - right);
    if (progressiveLevels[0] !== 1) progressiveLevels.unshift(1);
    if (maximumZoom > progressiveLevels.at(-1) + 0.001) progressiveLevels.push(maximumZoom);
    return progressiveLevels;
  }

  function getNextZoom(current, action, levels) {
    const zoomLevels = [...new Set((Array.isArray(levels) && levels.length ? levels : [1])
      .map(Number)
      .filter((level) => Number.isFinite(level) && level >= 1))]
      .sort((left, right) => left - right);
    if (action === "reset" || action === "min") return zoomLevels[0];
    if (action === "max") return zoomLevels.at(-1);
    const safeCurrent = Number(current) || zoomLevels[0];
    if (action === "in") {
      return zoomLevels.find((level) => level > safeCurrent + 0.001) ?? zoomLevels.at(-1);
    }
    for (let index = zoomLevels.length - 1; index >= 0; index -= 1) {
      if (zoomLevels[index] < safeCurrent - 0.001) return zoomLevels[index];
    }
    return zoomLevels[0];
  }

  globalThis.ASOUL_CHART_DOMAIN = Object.freeze({
    buildSmoothPath,
    buildChartZoomLevels,
    getChartSeriesGeometry,
    getLabelEvery,
    getNextZoom,
  });
})();
