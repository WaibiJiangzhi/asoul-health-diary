"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const read = (filename) => fs.readFileSync(path.join(projectRoot, filename), "utf8");

const source = [
  read("Asoul一个魂健康日记.html"),
  read("app.js"),
  read("stickers.js"),
].join("\n");
const imageRefs = [...new Set(source.match(/图片\/[^"'`\r\n]+?\.(?:png|jpe?g|gif|webp)/gi) || [])];
const missingImages = imageRefs.filter((reference) => {
  const absolutePath = path.join(projectRoot, ...reference.split("/"));
  return !fs.existsSync(absolutePath);
});
assert.deepEqual(missingImages, [], `missing image files: ${missingImages.join(", ")}`);

const html = read("Asoul一个魂健康日记.html");
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
assert.deepEqual(duplicateIds, [], `duplicate HTML ids: ${duplicateIds.join(", ")}`);

for (const requiredId of [
  "spaceSwitcher",
  "weeklyEyebrow",
  "weeklyTitle",
  "weeklyDescription",
  "chartsEyebrow",
  "chartsTitle",
  "emptyChartExample",
]) {
  assert.ok(ids.includes(requiredId), `missing HTML id: ${requiredId}`);
}

assert.doesNotMatch(source, /图片\/(?:贝拉|嘉然|乃琳)表情包\//, "legacy sticker directories must not be referenced");

console.log(`project integrity: ok (${imageRefs.length} image references, ${ids.length} unique ids)`);
