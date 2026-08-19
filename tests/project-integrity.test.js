"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const read = (filename) => fs.readFileSync(path.join(projectRoot, filename), "utf8");

const source = [
  read("index.html"),
  read("app.js"),
  read("stickers.js"),
].join("\n");
const imageRefs = [...new Set(source.match(/图片\/[^"'`\r\n]+?\.(?:png|jpe?g|gif|webp)/gi) || [])];
const missingImages = imageRefs.filter((reference) => {
  const absolutePath = path.join(projectRoot, ...reference.split("/"));
  return !fs.existsSync(absolutePath);
});
assert.deepEqual(missingImages, [], `missing image files: ${missingImages.join(", ")}`);

const html = read("index.html");
const app = read("app.js");
const weeklyCss = read("weekly-polish.css");
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
assert.deepEqual(duplicateIds, [], `duplicate HTML ids: ${duplicateIds.join(", ")}`);
const referencedIds = [...new Set([...app.matchAll(/\$\("#([a-zA-Z][a-zA-Z0-9_-]*)"\)/g)].map((match) => match[1]))];
const missingIds = referencedIds.filter((id) => !ids.includes(id));
assert.deepEqual(missingIds, [], `app.js references missing HTML ids: ${missingIds.join(", ")}`);

for (const requiredId of [
  "spaceSwitcher",
  "spaceDialog",
  "addSpaceButton",
  "editSpaceButton",
  "deleteSpaceButton",
  "spaceIconStickerGrid",
  "spaceIconPicker",
  "goalList",
  "goalDialog",
  "addGoalButton",
  "editGoalButton",
  "deleteGoalButton",
  "goalStickerPicker",
  "goalStickerGrid",
  "goalSpaceOptions",
  "progressGoalList",
  "progressGoalDialog",
  "progressGoalForm",
  "progressGoalSpaceOptions",
  "progressGoalStickerPicker",
  "progressGoalStickerGrid",
  "addProgressGoalButton",
  "editProgressGoalButton",
  "deleteProgressGoalButton",
  "moveGoalEarlierButton",
  "moveGoalLaterButton",
  "moveProgressGoalEarlierButton",
  "moveProgressGoalLaterButton",
  "downloadWeeklyReportImageButton",
  "downloadWeeklySummaryImageButton",
  "weeklyEyebrow",
  "weeklyTitle",
  "chartsEyebrow",
  "chartsTitle",
  "emptyChartExample",
  "weekPlanTextDialog",
  "shiftWeekButton",
  "copyPreviousWeekButton",
  "aiPreviousWeekSummary",
  "installAppButton",
]) {
  assert.ok(ids.includes(requiredId), `missing HTML id: ${requiredId}`);
}

assert.doesNotMatch(source, /图片\/(?:贝拉|嘉然|乃琳)表情包\//, "legacy sticker directories must not be referenced");

const stickerSource = read("stickers.js");
for (const [packName, expectedFirstFolder] of [["贝拉", "5-"], ["嘉然", "5-"], ["乃琳", "4-"]]) {
  const packStart = stickerSource.indexOf(`"${packName}": [`);
  const firstPath = stickerSource.slice(packStart).match(/"图片\/[^\"]+"/)?.[0] || "";
  assert.ok(firstPath.includes(`图片/${packName}/${expectedFirstFolder}`), `${packName} stickers should start with the highest numbered folder`);
}

assert.match(html, /AI 规划本周/);
assert.match(html, /使用你习惯的 AI，生成符合网页模板格式的本周计划即可/, "AI planning should lead with the simple outcome");
assert.match(app, /function copyPreviousWeekContext\(/, "AI planning should copy the previous week separately");
assert.doesNotMatch(html, /id="aiPromptOutput"/, "AI planning should not expose a large generated-prompt preview");
assert.match(html, /本周便签/);
assert.match(html, /从 Day1 起顺延一天/);
assert.match(html, /class="hero-jump" href="#goalSectionStart"[^>]*>点击开始/, "hero action must open countdowns");
assert.doesNotMatch(html, /AI 规划本月/);
assert.match(html, /href="icons\/icon-192\.png\?v=0820a"/);
assert.ok(fs.existsSync(path.join(projectRoot, "icons", "icon-yigehun-app.png")), "missing polished yigehun icon master");
assert.match(html, /rel="manifest" href="manifest\.webmanifest(?:\?[^\"]+)?"/, "PWA manifest must be linked");
assert.match(html, /class="personal-preferences personal-preferences--install"[\s\S]*id="installAppButton"/, "PWA installation must live in the personal view");
assert.match(html, /href="https:\/\/www\.doubao\.com\/chat\/"/, "AI planning should offer an optional Doubao jump link");
assert.doesNotMatch(html, /class="pwa-prompt"/, "PWA installation must not interrupt users with an automatic popup");
assert.ok(fs.existsSync(path.join(projectRoot, "sw.js")), "missing service worker");
for (const icon of ["icon-192.png", "icon-512.png", "icon-maskable-512.png"]) {
  assert.ok(fs.existsSync(path.join(projectRoot, "icons", icon)), `missing PWA icon: ${icon}`);
}
assert.doesNotMatch(html, /name="height"/, "profile must not ask for height");
assert.doesNotMatch(html, /name="project"/, "profile must not ask for a project");
assert.match(html, /name="signature"/);
assert.match(html, />个性签名</);
assert.doesNotMatch(html, /写一句现在想送给自己的话/);
assert.match(html, /id="copyWeekPlanTextButton"[^>]*>复制文本</);
assert.doesNotMatch(app, /【备注】/, "AI plan format must not ask AI to write daily notes");
assert.doesNotMatch(app, /day\.note\s*=\s*plannedDay\.note/, "AI import must preserve daily notes");
assert.match(app, /selectedDayByWeek\.get\(week\.id\)/, "schedule shift must start from the selected day");
assert.match(app, /index\s*>\s*startIndex/, "schedule shift must preserve days before the selected day");
assert.match(app, /if \(!\$\("#spaceIconPicker"\)\.open\)/, "collapsed space sticker picker must avoid rendering sticker images");
assert.match(app, /function renderGoals\(/, "global goals must be rendered independently of spaces");
assert.match(app, /renderWeeklyReportGoals/, "weekly reports must include goal countdowns");
assert.match(app, /function renderGoalStickerPicker\(/, "countdowns must support optional stickers");
assert.match(app, /function renderGoalSpaceOptions\(/, "countdowns must allow selecting report spaces");
assert.match(app, /goal\.spaceIds\.includes\(spaceId\)/, "weekly reports must filter countdowns by space");
assert.match(html, /可以不选，也可以选择一个或多个空间/, "countdowns must allow no report space");
assert.doesNotMatch(app, /请至少选择一个要显示周报的空间/, "countdown space selection must be optional");
assert.match(app, /const source = Array\.isArray\(candidate\) \? candidate : DEFAULT_SPACES/, "an explicitly empty space list must stay empty");
assert.doesNotMatch(app, /至少要保留一个空间/, "all spaces must be removable");
assert.doesNotMatch(app, /data-edit-goal/, "countdown cards must not contain their own edit buttons");
assert.match(app, /week-node-progress/, "week cards must show recorded-day progress");
assert.match(app, /function pickRelevantWeek\(/, "week navigation must prefer the current or nearest week");
assert.match(app, /return day\.recorded === true/, "recorded-day count must use the explicit day setting");
assert.match(html, /name="dayRecorded"/, "single-day settings must expose the recorded-day switch");
assert.match(html, /记录今天/, "recorded-day control must live with daily completion settings");
assert.doesNotMatch(html, /计入周记录/, "legacy recorded-day wording must be removed");
assert.match(app, /weekStickerDialog\.close\(\);\s*renderWeeks\(\)/, "saving daily settings must refresh the week timeline immediately");
assert.match(app, /WEEK_ITEM_STATES = new Set\(\["", "done", "changed", "missed"\]\)/, "weekly items must support done, changed, and missed states");
assert.match(app, /\["changed", "⚡", "调整"\]/, "weekly items must expose the lightning changed-plan state");
assert.match(app, /data-record-today/, "the day editor must expose a direct record-today action");
assert.match(app, /day\.items = plannedDay\.items\.map/, "AI import must use the unified weekly item model");
assert.doesNotMatch(app, /data-pair-field=|data-set-pair-done|完成与记录/, "the legacy two-column plan/actual editor must be removed");
assert.doesNotMatch(html, /目标独立于空间保存|背单词、读书或工作项目|用模板或从空白开始|曲线图日记/, "redundant section explanations must be removed");
assert.match(html, /class="personal-preferences"[\s\S]*id="weekSoundToggle"[^>]*aria-pressed="true"/, "sound preference must live in the personal view and default on");
assert.match(html, /id="footerResetDataButton"/, "mobile personal view must provide record clearing without the header");
assert.match(weeklyCss, /week-node-head/, "week overview cards must be styled");
assert.doesNotMatch(weeklyCss, /week-node-dot/, "legacy circular week nodes must be removed");
assert.match(weeklyCss, /grid-auto-rows:\s*96px/, "photo sticker rows must not be compressed");

const demoBackup = JSON.parse(read("示例数据/考研加健身用户示例.json"));
assert.equal(demoBackup.backupType, "asoul-life-diary", "demo data must be an importable diary backup");
assert.equal(demoBackup.version, 8, "the existing demo backup should remain untouched and migrate from version 8");
assert.equal(demoBackup.spaces.length, 2, "demo data should contain study and fitness spaces");
assert.equal(demoBackup.goals.length, 2, "demo data should contain two countdowns");
assert.ok(demoBackup.weeks.length >= 10, "demo data should represent a returning user");
assert.ok(demoBackup.weeks.every((week) => week.days.length === 7), "every demo week must contain seven days");
assert.ok(demoBackup.charts.length >= 3, "demo data should include long-term study and fitness charts");
const demoSpaceIds = new Set(demoBackup.spaces.map((space) => space.id));
assert.ok(demoBackup.goals.every((goal) => goal.spaceIds.every((spaceId) => demoSpaceIds.has(spaceId))), "demo countdowns may only reference existing spaces");
assert.ok(demoBackup.charts.every((chart) => demoSpaceIds.has(chart.spaceId)), "demo charts may only reference existing spaces");
assert.match(app, /function renderProgressGoals\(/, "progress goals must be rendered");
assert.match(app, /function addProgressFromCard\(/, "progress goals must support incremental updates");
assert.match(app, /amount === 0/, "progress adjustments must accept negative values and reject only zero");
assert.match(app, /function renderProgressGoalStickerPicker\(/, "progress goals must support optional stickers");
assert.match(app, /function renderProgressGoalSpaceOptions\(/, "progress goals must allow selecting report spaces");
assert.match(app, /state\.progressGoals\.filter\(\(goal\) => goal\.spaceIds\.includes\(spaceId\)\)/, "weekly reports must filter progress goals by space");
assert.doesNotMatch(`${html}\n${app}\n${read("使用说明.md")}`, /折线图|折线颜色|每条折线/, "user-facing chart terminology must use 曲线图");
assert.match(app, /formatChartAxisLabel/, "curve charts must format readable date labels");
assert.doesNotMatch(app, /visibleStickerKeys/, "sticker-bearing curve nodes must not be hidden by sampling");
assert.match(app, /const stickerSize = Math\.max\(20/, "dense curve charts must resize stickers instead of hiding them");
assert.match(app, /function downloadWeeklyReportImage\(/, "weekly reports must support PNG download");
assert.match(app, /canvas\.toDataURL\("image\/png"\)/, "weekly report download must stay inside the user's click gesture");
assert.match(app, /function downloadWeeklySummaryImage\(/, "weekly reports must provide a landscape summary image");
assert.match(app, /function downloadChartImage\(/, "curve charts must support PNG download");
assert.ok((app.match(/drawCanvasAppIcon\(/g) || []).length >= 4, "every exported image type must use the current app icon");
assert.ok((app.match(/const scale = 2;/g) || []).length >= 3, "weekly and curve PNG exports must use 2x canvas resolution");
assert.match(app, /function moveSelectedMilestone\(/, "countdowns and progress goals must be reorderable");
assert.match(html, /class="section-nav"/, "desktop section navigation must exist");
assert.match(html, /class="mobile-bottom-nav"/, "mobile section navigation must exist");
assert.match(html, /data-app-view="home"/, "the mobile home view must exist");
assert.match(app, /function initSectionNavigation\(\)[\s\S]*showMobileView/, "mobile navigation must switch real app views");
assert.match(app, /data-fullscreen-chart/, "mobile curve charts must support fullscreen viewing");
assert.ok(fs.existsSync(path.join(projectRoot, "mobile-app.css")), "missing final mobile app stylesheet");
assert.match(app, /data-series-axis-min/, "each curve must expose an optional y-axis minimum");
assert.match(app, /data-series-axis-max/, "each curve must expose an optional y-axis maximum");
assert.match(app, /customMin \?\? automaticMin/, "curve rendering must respect custom y-axis bounds");

const fullDemoBackup = JSON.parse(read("示例数据/全功能测试数据.json"));
assert.equal(fullDemoBackup.version, 9, "the full demo backup should remain a migration test for version 9");
assert.equal(fullDemoBackup.goals.length, 4, "full demo data must exercise every countdown layout slot");
assert.equal(fullDemoBackup.progressGoals.length, 4, "full demo data must contain several progress goals");
assert.ok(fullDemoBackup.progressGoals.every((goal) => goal.sticker && Array.isArray(goal.spaceIds) && goal.updates.length), "full demo progress goals must include stickers, report spaces, and updates");
assert.ok(fullDemoBackup.weeks.every((week) => week.days.every((day) => day.recorded === true && day.sticker)), "full demo days must be recorded and carry stickers");
assert.ok(fullDemoBackup.charts.some((chart) => chart.series.length > 1), "full demo data must include a multi-series curve chart");
assert.ok(fullDemoBackup.charts.every((chart) => chart.nodes.every((node) => Object.keys(node.stickers || {}).length)), "every full demo curve node must carry a sticker");
const fullDemoStickerRefs = JSON.stringify(fullDemoBackup).match(/图片\/[^"'`\r\n]+?\.(?:png|jpe?g|gif|webp)/gi) || [];
const missingFullDemoStickers = [...new Set(fullDemoStickerRefs)].filter((reference) => !fs.existsSync(path.join(projectRoot, ...reference.split("/"))));
assert.deepEqual(missingFullDemoStickers, [], `full demo data references missing stickers: ${missingFullDemoStickers.join(", ")}`);

const weekActionOrder = [
  "importWeekButton",
  "exportSelectedWeekButton",
  "showSelectedWeekReportButton",
  "addWeekButton",
  "deleteSelectedPeriodButton",
  "shiftWeekButton",
];
for (let index = 1; index < weekActionOrder.length; index += 1) {
  assert.ok(html.indexOf(`id="${weekActionOrder[index - 1]}"`) < html.indexOf(`id="${weekActionOrder[index]}"`), "weekly action buttons are out of order");
}

console.log(`project integrity: ok (${imageRefs.length} image references, ${ids.length} unique ids)`);
