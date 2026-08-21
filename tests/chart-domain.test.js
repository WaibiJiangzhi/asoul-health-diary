"use strict";

const assert = require("node:assert/strict");

require("../chart-domain.js");

const domain = globalThis.ASOUL_CHART_DOMAIN;

assert.ok(Object.isFrozen(domain));

const chart = {
  series: [{ id: "weight", name: "体重 / 斤", axisMin: null, axisMax: null }],
  nodes: [
    { id: "one", values: { weight: 60 } },
    { id: "two", values: { weight: 62 } },
    { id: "missing", values: { weight: null } },
  ],
};
const geometry = domain.getChartSeriesGeometry(chart, {
  xAt: (index) => index * 100,
  yAt: (value, min, max) => (max - value) / (max - min) * 200,
});
assert.equal(geometry.length, 1);
assert.equal(geometry[0].hasData, true);
assert.equal(geometry[0].points.length, 2);
assert.equal(geometry[0].points[1].x, 100);
assert.equal(geometry[0].pointByNode.get("two").value, 62);
assert.ok(geometry[0].min < 60 && geometry[0].max > 62);

const customMaxChart = {
  series: [{ id: "score", axisMin: null, axisMax: 10 }],
  nodes: [{ id: "high", values: { score: 20 } }],
};
const anchored = domain.getChartSeriesGeometry(customMaxChart, { xAt: () => 0, yAt: () => 0 });
assert.equal(anchored[0].max, 10);
assert.equal(anchored[0].min, 7.888);
const canvasRange = domain.getChartSeriesGeometry(customMaxChart, { xAt: () => 0, yAt: () => 0, anchorCustomMax: false });
assert.equal(canvasRange[0].min, 17.6);
assert.ok(Math.abs(canvasRange[0].max - 19.712) < 1e-9);

assert.equal(domain.buildSmoothPath([]), "");
assert.equal(domain.buildSmoothPath([{ px: 2, py: 3 }]), "M 2.00 3.00");
assert.equal(domain.buildSmoothPath([{ px: 0, py: 0 }, { px: 10, py: 10 }]), "M 0.00 0.00 L 10.00 10.00");
assert.match(domain.buildSmoothPath([{ px: 0, py: 0 }, { px: 10, py: 10 }, { px: 20, py: 0 }]), /^M .* C .* C /);

assert.equal(domain.getLabelEvery(18, 9), 3);
assert.equal(domain.getLabelEvery(1, 9), 1);
assert.equal(domain.getNextZoom(1, "in", [1, 2, 4, 8]), 2);
assert.equal(domain.getNextZoom(8, "in", [1, 2, 4, 8]), 8);
assert.equal(domain.getNextZoom(4, "out", [1, 2, 4, 8]), 2);
assert.equal(domain.getNextZoom(4, "reset", [1, 2, 4, 8]), 1);

console.log("chart domain: ok");
