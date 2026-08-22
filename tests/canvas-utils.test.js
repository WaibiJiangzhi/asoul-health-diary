"use strict";

const assert = require("node:assert/strict");

require("../js/ui/canvas-utils.js");
const canvas = globalThis.ASOUL_CANVAS_UTILS;

assert.equal(canvas.colorMixForCanvas("#576690", .25), "rgba(87,102,144,0.25)");
assert.equal(canvas.colorMixForCanvas("invalid", .4), "rgba(143,122,234,0.4)");

const writtenLines = [];
const textContext = {
  measureText: (value) => ({ width: [...value].length * 10 }),
  fillText: (value, x, y) => writtenLines.push({ value, x, y }),
};
canvas.drawCanvasText(textContext, "ABCDE", 4, 8, 25, 12, 2);
assert.deepEqual(writtenLines, [
  { value: "AB", x: 4, y: 8 },
  { value: "C…", x: 4, y: 20 },
], "canvas text wrapping must keep its line limit and ellipsis");

const pathCalls = [];
const pathContext = {
  beginPath: () => pathCalls.push("begin"),
  moveTo: (...args) => pathCalls.push(["move", ...args]),
  lineTo: (...args) => pathCalls.push(["line", ...args]),
  quadraticCurveTo: (...args) => pathCalls.push(["curve", ...args]),
  closePath: () => pathCalls.push("close"),
};
canvas.drawCanvasRoundedRectPath(pathContext, 0, 0, 20, 10, 99);
assert.deepEqual(pathCalls[1], ["move", 5, 0], "rounded rectangles must clamp their radius to half the shortest side");

console.log("canvas utils: ok");
