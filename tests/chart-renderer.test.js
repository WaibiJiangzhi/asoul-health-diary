"use strict";

const assert = require("node:assert/strict");

require("../js/core/app-utils.js");
require("../js/domain/chart-domain.js");
require("../js/ui/canvas-utils.js");
require("../js/ui/chart-renderer.js");

function makeContext() {
  const gradient = { addColorStop() {} };
  return {
    arc() {},
    beginPath() {},
    bezierCurveTo() {},
    clip() {},
    closePath() {},
    createLinearGradient: () => gradient,
    drawImage() {},
    fill() {},
    fillRect() {},
    fillText() {},
    lineTo() {},
    measureText: (value) => ({ width: [...String(value)].length * 8 }),
    moveTo() {},
    quadraticCurveTo() {},
    restore() {},
    save() {},
    scale() {},
    setLineDash() {},
    stroke() {},
    translate() {},
  };
}

const createdCanvases = [];
global.document = {
  createElement(tagName) {
    assert.equal(tagName, "canvas");
    const context = makeContext();
    const canvas = { width: 0, height: 0, getContext: () => context };
    createdCanvases.push(canvas);
    return canvas;
  },
};

global.window = {
  innerWidth: 1280,
  matchMedia(query) {
    const maximumWidth = Number(query.match(/max-width:\s*([\d.]+)px/)?.[1] || Infinity);
    return { matches: this.innerWidth <= maximumWidth };
  },
};

const renderer = globalThis.ASOUL_CHART_RENDERER.createChartRenderer({
  utils: globalThis.ASOUL_APP_UTILS,
  chartDomain: globalThis.ASOUL_CHART_DOMAIN,
  canvasUtils: globalThis.ASOUL_CANVAS_UTILS,
  getSpaceTemplate: () => ({ id: "study" }),
  safeSticker: (value) => String(value || ""),
  assetUrl: (value) => value,
  imageCache: new Map(),
  defaultColor: "#576690",
});

function makeChart(nodeCount = 3) {
  return {
    id: "chart-study",
    spaceId: "study",
    title: "有效学习",
    xLabel: "日期",
    series: [{
      id: "hours",
      name: "有效学习 / 小时",
      unit: "小时",
      color: "#576690",
      axisMin: null,
      axisMax: null,
    }],
    nodes: Array.from({ length: nodeCount }, (_, index) => ({
      id: `node-${index + 1}`,
      x: new Date(Date.UTC(2026, 0, index + 1)).toISOString().slice(0, 10),
      values: { hours: 3 + index / Math.max(nodeCount, 1) },
      sticker: "",
      stickers: {},
      note: "",
    })),
  };
}

const chart = makeChart();
const desktopLayout = renderer.createChartSvgLayout(chart, 1);
assert.equal(desktopLayout.width, 920);
assert.equal(desktopLayout.height, 370);

const selectedMarkup = renderer.renderChartSvg(chart, {
  zoom: 1,
  levels: [1, 2, 4],
  selectedNodeId: "node-2",
});
assert.match(selectedMarkup, /data-zoom-action="min"/);
assert.match(selectedMarkup, /data-zoom-action="max"/);
assert.match(selectedMarkup, /class="chart-point is-selected"[\s\S]*?data-node-id="node-2"/);

const emptyMarkup = renderer.renderEmptyChart({ ...chart, nodes: [] });
assert.match(emptyMarkup, /添加第一个节点/);

const canvas = renderer.createChartCanvas(chart);
assert.equal(canvas.width, 3840, "curve exports must keep 2x 1920px resolution");
assert.equal(canvas.height, 2160, "curve exports must keep 2x 1080px resolution");

window.innerWidth = 425;
const phoneLayout = renderer.createChartSvgLayout(chart, 1);
assert.equal(phoneLayout.width, 360);
assert.equal(phoneLayout.height, 360);

const denseChart = makeChart(300);
const denseMarkup = renderer.renderChartSvg(denseChart, {
  zoom: 1,
  levels: [1, 2, 4, 8, 16, 32, 64, 80.32],
  selectedNodeId: "",
});
assert.equal((denseMarkup.match(/data-node-id=/g) || []).length, 300, "decluttering must preserve every interactive node");
const visibleCores = (denseMarkup.match(/class="point-core"/g) || []).length;
assert.ok(visibleCores > 1 && visibleCores < 100, "the global view must sample dense visual markers without dropping node hit targets");

assert.equal(createdCanvases.length, 1);
console.log("chart renderer: ok");
