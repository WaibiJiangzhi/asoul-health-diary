(() => {
  "use strict";

  function createChartRenderer(options = {}) {
    const {
      utils,
      chartDomain,
      canvasUtils,
      getSpaceTemplate,
      safeSticker,
      assetUrl,
      imageCache,
      defaultColor = "#8f7aea",
    } = options;
    if (!utils || !chartDomain || !canvasUtils) {
      throw new Error("chart renderer requires utility, domain, and canvas boundaries");
    }

    const {
      escapeAttr,
      escapeHtml,
      escapeXml,
      formatChartAxisLabel,
      formatFriendlyDate,
      formatNumber,
      formatSeriesValue,
      parseChartDate,
      todayIso,
    } = utils;
    const { buildSmoothPath, getChartSeriesGeometry, getLabelEvery } = chartDomain;
    const {
      colorMixForCanvas,
      drawCanvasAppIcon,
      drawCanvasSticker,
    } = canvasUtils;

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
      drawChartCanvasHeader(context, chart, template, width, height);

      const plot = { left: 134, top: 304, right: 106, bottom: 150 };
      const plotWidth = width - plot.left - plot.right;
      const plotHeight = height - plot.top - plot.bottom;
      const xAt = (index) => chart.nodes.length === 1
        ? plot.left + plotWidth / 2
        : plot.left + index / (chart.nodes.length - 1) * plotWidth;
      const seriesData = getChartSeriesGeometry(chart, {
        xAt,
        yAt: (value, min, max) => plot.top + (max - value) / (max - min) * plotHeight,
        anchorCustomMax: false,
      });

      drawChartCanvasGrid(context, seriesData[0], plot, plotHeight, width);
      drawChartCanvasSeries(context, seriesData, plot, plotHeight);
      drawChartCanvasNodes(context, chart, seriesData[0], { xAt, plotWidth, height });
      return canvas;
    }

    function drawChartCanvasHeader(context, chart, template, width, height) {
      const primaryColor = chart.series[0]?.color || defaultColor;
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
      drawCanvasAppIcon(context, width - 145, 64, 76, imageCache);
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
    }

    function drawChartCanvasGrid(context, primarySeries, plot, plotHeight, width) {
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
        context.fillText(formatSeriesValue(primarySeries, primarySeries.max - ratio * (primarySeries.max - primarySeries.min)), plot.left - 18, y + 6);
      }
      context.textAlign = "left";
    }

    function drawChartCanvasSeries(context, seriesData, plot, plotHeight) {
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
        context.lineWidth = seriesIndex === 0 ? 7.2 : 5.4;
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
    }

    function drawChartCanvasNodes(context, chart, primarySeries, { xAt, plotWidth, height }) {
      const labelEvery = getLabelEvery(chart.nodes.length, 9);
      chart.nodes.forEach((node, index) => {
        const x = xAt(index);
        if (index === 0 || index === chart.nodes.length - 1 || index % labelEvery === 0) {
          context.fillStyle = "#777182";
          context.font = "700 17px system-ui, sans-serif";
          context.textAlign = "center";
          context.fillText(formatChartAxisLabel(node.x, index === 0), x, height - 102);
        }
        const sticker = Object.values(node.stickers || {}).map(safeSticker).find(Boolean) || safeSticker(node.sticker);
        const image = imageCache.get(sticker);
        if (image?.complete && image.naturalWidth) {
          const spacing = plotWidth / Math.max(1, chart.nodes.length - 1);
          const size = Math.max(28, Math.min(58, spacing * .42));
          const primaryPoint = primarySeries.points.find((point) => point.node.id === node.id);
          if (primaryPoint) drawCanvasSticker(context, image, primaryPoint.x - size / 2, primaryPoint.y - size - 26, size);
        }
      });
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

    function renderChartSvg(chart, renderState) {
      const { zoom, levels: zoomLevels, selectedNodeId = "" } = renderState;
      const minimumZoom = zoomLevels[0];
      const maximumZoom = zoomLevels.at(-1);
      const canZoom = zoomLevels.length > 1;
      const isMinimumZoom = zoom <= minimumZoom + 0.001;
      const isMaximumZoom = zoom >= maximumZoom - 0.001;
      const layout = createChartSvgLayout(chart, zoom);
      const { compactChart, visualScale, axisRailWidth, width, height, margin, plotWidth, plotHeight, xAt } = layout;
      const seriesData = getChartSeriesGeometry(chart, {
        xAt,
        yAt: (value, min, max) => margin.top + ((max - value) / (max - min)) * plotHeight,
      });

      const baseline = margin.top + plotHeight;
      const primary = seriesData[0];
      const primaryPath = buildSmoothPath(primary.points);
      const areaPath = primary.points.length > 1
        ? `${primaryPath} L ${primary.points.at(-1).px.toFixed(2)} ${baseline} L ${primary.points[0].px.toFixed(2)} ${baseline} Z`
        : "";
      const gradientId = `gradient-${chart.id}-${primary.id}`;
      const tickCount = 5;
      const grid = renderChartSvgGrid(chart, seriesData, layout, tickCount);

      const nodeSpacing = plotWidth / Math.max(chart.nodes.length - 1, 1);
      const labelEvery = getLabelEvery(chart.nodes.length, Math.max(2, Math.floor(plotWidth / 96)));
      const xLabels = renderChartSvgXLabels(chart, layout, labelEvery);
      const lineMarkup = renderChartSvgLines(seriesData, compactChart, visualScale);
      const pointMarkup = renderChartSvgPoints(chart, seriesData, layout, { compactChart, labelEvery, nodeSpacing, selectedNodeId });
      const { fixedYAxis, fixedYAxisUnits, fixedSeriesLegend } = renderChartFixedAxes(seriesData, layout, tickCount);

      return `
        <div class="chart-zoom-bar" aria-label="曲线图缩放">
          <button class="chart-zoom-min" type="button" data-zoom-chart="${chart.id}" data-zoom-action="min" aria-label="回到最小全局视图"${!canZoom || isMinimumZoom ? " disabled" : ""}>最小</button>
          <button type="button" data-zoom-chart="${chart.id}" data-zoom-action="out"${!canZoom || isMinimumZoom ? " disabled" : ""}>− 缩小</button>
          <strong>${formatChartZoom(zoom)}×</strong>
          <button type="button" data-zoom-chart="${chart.id}" data-zoom-action="in"${!canZoom || isMaximumZoom ? " disabled" : ""}>＋ 放大</button>
          <button class="chart-zoom-max" type="button" data-zoom-chart="${chart.id}" data-zoom-action="max" aria-label="放大到每个记录日期都能显示"${!canZoom || isMaximumZoom ? " disabled" : ""}>最大</button>
        </div>
        <div class="chart-plot-shell" style="--chart-axis-rail:${axisRailWidth}px">
        <div class="chart-y-axis-fixed" aria-hidden="true"><em class="chart-y-axis-unit">${fixedYAxisUnits}</em>${fixedYAxis}</div>
        <div class="chart-series-fixed" aria-hidden="true">${fixedSeriesLegend}</div>
        <div class="chart-x-axis-fixed" aria-hidden="true">${escapeHtml(chart.xLabel)}</div>
        <div class="chart-scroll" data-chart-scroll="${chart.id}" tabindex="0" aria-label="可横向滑动的${escapeAttr(chart.title)}曲线图">
        <svg class="chart-svg" style="width:${(zoom * 100).toFixed(2)}%;min-width:${(zoom * 100).toFixed(2)}%;max-width:none;aspect-ratio:${width}/${height};--chart-visual-scale:${visualScale}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttr(chart.title)}曲线图">
          <defs>
            <linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="${primary.color}" stop-opacity="0.24" />
              <stop offset="100%" stop-color="${primary.color}" stop-opacity="0" />
            </linearGradient>
          </defs>
          ${grid}
          ${areaPath ? `<path class="chart-area" d="${areaPath}" fill="url(#${gradientId})" />` : ""}
          ${lineMarkup}
          ${xLabels}
          ${pointMarkup}
        </svg>
        </div>
        </div>`;
    }

    function formatChartZoom(zoom) {
      return Number.isInteger(zoom) ? String(zoom) : zoom.toFixed(1).replace(/\.0$/, "");
    }

    function createChartSvgLayout(chart, zoom) {
      const compactChart = window.matchMedia("(max-width: 899.98px)").matches;
      const phoneChart = window.matchMedia("(max-width: 520px)").matches;
      const visualScale = 1;
      const nodeVisualScale = 1;
      const viewportWidth = Math.max(280, Number(window.innerWidth) || 1280);
      const baseWidth = phoneChart
        ? 360
        : compactChart
          ? Math.max(560, Math.min(820, viewportWidth - 56))
          : Math.max(920, Math.min(1600, viewportWidth - 104));
      const width = Math.round(baseWidth * zoom);
      const height = phoneChart ? 360 : 370;
      const margin = {
        top: Math.round((compactChart ? 54 : 58) * visualScale),
        right: Math.round((compactChart ? 28 : 34) * visualScale),
        bottom: Math.round((compactChart ? 51 : 62) * visualScale),
        left: Math.round((compactChart
          ? (chart.series.length > 1 ? 82 : 72)
          : chart.series.length > 1 ? 106 : 84) * visualScale),
      };
      const axisRailWidth = margin.left;
      const axisFontSize = (phoneChart ? 10 : compactChart ? 12 : 11) * visualScale;
      const plotWidth = width - margin.left - margin.right;
      const plotHeight = height - margin.top - margin.bottom;
      const xAt = (index) => chart.nodes.length === 1
        ? margin.left + plotWidth / 2
        : margin.left + (index / (chart.nodes.length - 1)) * plotWidth;
      return { compactChart, phoneChart, visualScale, nodeVisualScale, axisRailWidth, zoom, width, height, margin, axisFontSize, plotWidth, plotHeight, xAt };
    }

    function renderChartSvgGrid(chart, seriesData, layout, tickCount) {
      const { margin, plotHeight, width, axisFontSize, visualScale } = layout;
      const primary = seriesData[0];
      return Array.from({ length: tickCount }, (_, index) => {
        const ratio = index / (tickCount - 1);
        const y = margin.top + ratio * plotHeight;
        const value = primary.max - ratio * (primary.max - primary.min);
        const scaleLabels = seriesData
          .filter((item) => item.hasData)
          .map((item, seriesIndex) => `${seriesIndex ? '<tspan class="chart-axis-separator"> / </tspan>' : ""}<tspan style="fill:${item.color}">${escapeXml(formatSeriesValue(item, item.max - ratio * (item.max - item.min)))}</tspan>`)
          .join("");
        return `
          <line class="chart-grid-line" x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" />
          <text class="chart-axis-text chart-axis-text--y${chart.series.length > 1 ? " chart-axis-text--multi" : ""}" style="font-size:${axisFontSize.toFixed(2)}px" x="${margin.left - 9 * visualScale}" y="${y + 4 * visualScale}" text-anchor="end">${chart.series.length === 1 ? escapeXml(formatNumber(value)) : scaleLabels}</text>`;
      }).join("");
    }

    function renderChartSvgXLabels(chart, layout, labelEvery) {
      const { axisFontSize, xAt, height, visualScale } = layout;
      const parsedNodeDates = chart.nodes.map((node) => parseChartDate(node.x));
      const candidates = chart.nodes.map((node, index) => {
        const date = parsedNodeDates[index];
        const previousDate = parsedNodeDates[index - 1];
        const yearChanged = Boolean(date?.year && previousDate?.year && date.year !== previousDate.year);
        const isEdge = index === 0 || index === chart.nodes.length - 1;
        if (!isEdge && index % labelEvery !== 0 && !yearChanged) return null;
        return { index, node, x: xAt(index), yearChanged };
      }).filter(Boolean);
      const minimumLabelGap = Math.max(72, 88 * visualScale);
      const visible = [];
      candidates.forEach((candidate) => {
        const previous = visible.at(-1);
        if (!previous) {
          visible.push(candidate);
          return;
        }
        if (candidate.index === chart.nodes.length - 1) {
          if (candidate.x - previous.x < minimumLabelGap && previous.index !== 0) visible.pop();
          visible.push(candidate);
          return;
        }
        if (candidate.x - previous.x >= minimumLabelGap) {
          visible.push(candidate);
          return;
        }
        if (candidate.yearChanged && !previous.yearChanged && previous.index !== 0) {
          visible.pop();
          const nextPrevious = visible.at(-1);
          if (!nextPrevious || candidate.x - nextPrevious.x >= minimumLabelGap) visible.push(candidate);
        }
      });
      return visible.map(({ index, node, x, yearChanged }) =>
        `<text class="chart-axis-text" style="font-size:${axisFontSize.toFixed(2)}px" x="${x}" y="${height - 21 * visualScale}" text-anchor="middle">${escapeXml(formatChartAxisLabel(node.x, index === 0 || yearChanged))}</text>`
      ).join("");
    }

    function renderChartSvgLines(seriesData, compactChart, visualScale) {
      return seriesData.map((item) => {
        const path = buildSmoothPath(item.points);
        const lineWidth = (compactChart ? 2.5 : 2.7) * visualScale;
        return `<path class="chart-line" style="--chart-color:${item.color};stroke-width:${lineWidth.toFixed(2)}" d="${path}" />`;
      }).join("");
    }

    function renderChartSvgPoints(chart, seriesData, layout, { compactChart, labelEvery, nodeSpacing, selectedNodeId }) {
      const { phoneChart, nodeVisualScale, visualScale, zoom, plotWidth, plotHeight, margin, xAt } = layout;
      const targetVisibleMarkers = (phoneChart ? 6 : compactChart ? 10 : 12) * zoom;
      const denseMarkerEvery = Math.max(1, Math.ceil((chart.nodes.length - 1) / targetVisibleMarkers));
      const denseSpacingThreshold = phoneChart ? 44 : compactChart ? 32 : chart.series.length > 1 ? 44 : 28;
      const declutterDensePoints = chart.nodes.length > 8 && nodeSpacing < denseSpacingThreshold * visualScale;
      return chart.nodes.map((node, nodeIndex) => {
        const pointValues = seriesData.map((item) => ({
          series: item,
          point: item.pointByNode.get(node.id),
        })).filter((item) => item.point);
        const label = `${node.x}：${pointValues.map(({ series, point }) => `${series.name} ${formatSeriesValue(series, point.value)}`).join("；")}`;
        const isSelected = selectedNodeId === node.id;
        const isEdgeNode = nodeIndex === 0 || nodeIndex === chart.nodes.length - 1;
        const showPointMarker = isSelected || isEdgeNode || (declutterDensePoints
          ? nodeIndex % denseMarkerEvery === 0
          : nodeSpacing >= 14 || nodeIndex % labelEvery === 0);
        const availableStickerPointValues = compactChart && pointValues.length > 1 && chart.nodes.length > 8 && declutterDensePoints
          ? pointValues.filter(({ series }, pointIndex) => safeSticker(node.stickers?.[series.id] ?? (pointIndex === 0 ? node.sticker : ""))).slice(0, 1)
          : pointValues;
        const stickerPointValues = !declutterDensePoints || showPointMarker ? availableStickerPointValues : [];
        const hasMultipleStickers = stickerPointValues.length > 1;
        const densityScale = chart.nodes.length >= 12
          ? (phoneChart ? .9 : 1)
          : (chart.nodes.length >= 9
            ? (phoneChart ? .96 : 1)
            : 1);
        const desiredStickerSize = 44 * nodeVisualScale * densityScale;
        const minimumStickerSize = 22 * nodeVisualScale;
        const visibleNodeSpacing = nodeSpacing * (declutterDensePoints ? denseMarkerEvery : 1);
        const stickerGap = (hasMultipleStickers ? 2 : 4) * visualScale;
        const spacingCap = hasMultipleStickers
          ? Math.max(minimumStickerSize, (visibleNodeSpacing - stickerGap * (stickerPointValues.length - 1)) / stickerPointValues.length)
          : Math.max(minimumStickerSize, visibleNodeSpacing * .84);
        const stickerSize = Math.max(minimumStickerSize, Math.min(desiredStickerSize, spacingCap));
        const stickerMarkup = stickerPointValues.map(({ series, point }, pointIndex) => {
          const sticker = safeSticker(node.stickers?.[series.id] ?? (pointIndex === 0 ? node.sticker : ""));
          if (!sticker) return "";
          const centerX = point.px + (pointIndex - (stickerPointValues.length - 1) / 2) * (stickerSize + stickerGap);
          const centerY = point.py - stickerSize / 2 - 12 * visualScale;
          const clipRadius = stickerSize / 2;
          const clipId = `clip-${chart.id}-${node.id}-${series.id}`;
          return `<circle class="point-sticker-bg" cx="${centerX}" cy="${centerY}" r="${clipRadius + 3}" />
            <clipPath id="${clipId}"><circle cx="${centerX}" cy="${centerY}" r="${clipRadius}" /></clipPath>
            <image href="${escapeAttr(assetUrl(sticker))}" x="${centerX - clipRadius}" y="${centerY - clipRadius}" width="${stickerSize}" height="${stickerSize}" preserveAspectRatio="xMidYMid meet" clip-path="url(#${clipId})" />`;
        }).join("");
        const cores = showPointMarker ? pointValues.map(({ series, point }) => `
          <circle class="point-halo" style="--chart-color:${series.color}" cx="${point.px}" cy="${point.py}" r="${(10 * nodeVisualScale).toFixed(2)}" />
          <circle class="point-core" style="--chart-color:${series.color}" cx="${point.px}" cy="${point.py}" r="${(6 * nodeVisualScale).toFixed(2)}" />
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
    }

    function renderChartFixedAxes(seriesData, layout, tickCount) {
      const { margin, plotHeight, height } = layout;
      const fixedYAxis = Array.from({ length: tickCount }, (_, index) => {
        const ratio = index / (tickCount - 1);
        const top = ((margin.top + ratio * plotHeight) / height) * 100;
        const labels = seriesData
          .filter((item) => item.hasData)
          .map((item) => `<b style="color:${item.color}">${escapeHtml(formatSeriesValue(item, item.max - ratio * (item.max - item.min)))}</b>`)
          .join("<i>/</i>");
        return `<span style="top:${top.toFixed(3)}%">${labels}</span>`;
      }).join("");
      const fixedYAxisUnits = seriesData
        .filter((item) => item.hasData)
        .map((item) => {
          const parts = String(item.name || "").split("/");
          const unit = item.unit || (parts.length > 1 ? parts.at(-1).trim() : item.name);
          return `<b style="color:${item.color}">${escapeHtml(unit)}</b>`;
        })
        .join("<i>·</i>");
      const fixedSeriesLegend = seriesData
        .filter((item) => item.hasData)
        .map((item) => `<b style="color:${item.color}"><i></i>${escapeHtml(item.name)}</b>`)
        .join("");
      return { fixedYAxis, fixedYAxisUnits, fixedSeriesLegend };
    }

    return Object.freeze({
      createChartCanvas,
      createChartSvgLayout,
      renderChartSvg,
      renderEmptyChart,
    });
  }

  globalThis.ASOUL_CHART_RENDERER = Object.freeze({ createChartRenderer });
})();
