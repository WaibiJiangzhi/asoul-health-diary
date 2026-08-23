"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const read = (filename) => fs.readFileSync(path.join(projectRoot, filename), "utf8");
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

assert.ok(fs.existsSync(path.join(projectRoot, "images")), "the canonical images/ directory must exist");
assert.ok(fs.existsSync(path.join(projectRoot, "sample-data")), "the canonical sample-data/ directory must exist");
assert.equal(fs.existsSync(path.join(projectRoot, "图片")), false, "the retired 图片/ directory must not return");
assert.equal(fs.existsSync(path.join(projectRoot, "示例数据")), false, "the retired 示例数据/ directory must not return");
assert.deepEqual(
  fs.readdirSync(path.join(projectRoot, "sample-data")).filter((filename) => filename.endsWith(".json")).sort(),
  ["考研加健身用户示例.json", "长期用户300节点示例.json"].sort(),
  "sample-data/ should keep only the realistic and long-term representative fixtures",
);

const source = [
  read("index.html"),
  read("js/app.js"),
  read("js/content/stickers.js"),
].join("\n");
const imageRefs = [...new Set(source.match(/images\/[^"'`\r\n]+?\.(?:png|jpe?g|gif|webp)/gi) || [])];
const missingImages = imageRefs.filter((reference) => {
  const absolutePath = path.join(projectRoot, ...reference.split("/"));
  return !fs.existsSync(absolutePath);
});
assert.deepEqual(missingImages, [], `missing image files: ${missingImages.join(", ")}`);

const html = read("index.html");
const versionedAssetHref = (attribute, assetPath) => html.match(new RegExp(`${attribute}="(${escapeRegExp(assetPath)}\\?v=\\d+)"`))?.[1] || "";
const localAssetRefs = [...new Set(
  [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((reference) => !reference.startsWith("#") && !/^https?:\/\//i.test(reference))
    .map((reference) => reference.split(/[?#]/, 1)[0])
    .filter(Boolean)
)];
const missingLocalAssets = localAssetRefs.filter((reference) => !fs.existsSync(path.join(projectRoot, ...reference.split("/"))));
assert.deepEqual(missingLocalAssets, [], `HTML references missing local assets: ${missingLocalAssets.join(", ")}`);
const app = read("js/app.js");
const serviceWorker = read("sw.js");
const manifest = read("manifest.webmanifest");
const manifestData = JSON.parse(manifest);
const shellAssetRefs = [...new Set(
  [...serviceWorker.matchAll(/"\.\/([^"]*)"/g)]
    .map((match) => match[1].split("?", 1)[0])
    .filter(Boolean)
)];
const missingShellAssets = shellAssetRefs.filter((reference) => !fs.existsSync(path.join(projectRoot, ...reference.split("/"))));
assert.deepEqual(missingShellAssets, [], `service worker references missing shell assets: ${missingShellAssets.join(", ")}`);
const appUtils = read("js/core/app-utils.js");
const backupCodec = read("js/core/backup-codec.js");
const appConfig = read("js/core/app-config.js");
const milestoneDomain = read("js/domain/milestone-domain.js");
const chartDomain = read("js/domain/chart-domain.js");
const scheduleDomain = read("js/domain/schedule-domain.js");
const snapCarousel = read("js/ui/snap-carousel.js");
const canvasUtils = read("js/ui/canvas-utils.js");
const weeklyReportRenderer = read("js/ui/weekly-report-renderer.js");
const chartRenderer = read("js/ui/chart-renderer.js");
const stateNormalizer = read("js/core/state-normalizer.js");
const stateStore = read("js/core/state-store.js");
const coldJokes = read("js/content/冷笑话.js");
const packageRelease = read("tools/package-release.ps1");
const generateLongTermData = read("tools/generate-long-term-data.mjs");
const longTermDemo = JSON.parse(read("sample-data/长期用户300节点示例.json"));
const generateStickers = read("tools/generate-stickers.ps1");
const designSystemCss = read("css/design-system.css");
const homeCss = read("css/pages/home.css");
const goalsCss = read("css/pages/goals.css");
const scheduleCss = read("css/pages/schedule.css");
const chartsCss = read("css/pages/charts.css");
const personalCss = read("css/pages/personal.css");
const mobileAppCss = read("css/platform/mobile-app.css");
const responsivePlatformCss = read("css/platform/responsive-platform.css");
const weeklyCss = read("css/legacy/weekly-polish.css");
const legacyResponsiveCss = [
  weeklyCss,
  read("css/legacy/complete-polish.css"),
  read("css/platform/mobile-app.css"),
  read("css/platform/responsive-platform.css")
].join("\n");
const legacyScheduleCss = [
  read("css/legacy/styles.css"),
  legacyResponsiveCss,
].join("\n");
const legacyChartsCss = [
  read("css/legacy/styles.css"),
  legacyResponsiveCss,
].join("\n");
const legacyPersonalCss = [
  read("css/legacy/styles.css"),
  legacyResponsiveCss,
].join("\n");
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
assert.deepEqual(duplicateIds, [], `duplicate HTML ids: ${duplicateIds.join(", ")}`);
const referencedIds = [...new Set([...app.matchAll(/\$\("#([a-zA-Z][a-zA-Z0-9_-]*)"\)/g)].map((match) => match[1]))];
const missingIds = referencedIds.filter((id) => !ids.includes(id));
assert.deepEqual(missingIds, [], `app.js references missing HTML ids: ${missingIds.join(", ")}`);
const appFunctionNames = [...app.matchAll(/\b(?:async\s+)?function\s+([a-zA-Z][a-zA-Z0-9_]*)\s*\(/g)].map((match) => match[1]);
const unreferencedAppFunctions = appFunctionNames.filter((name) => (app.match(new RegExp(`\\b${name}\\b`, "g")) || []).length === 1);
assert.deepEqual(unreferencedAppFunctions, [], `app.js contains unreferenced functions: ${unreferencedAppFunctions.join(", ")}`);

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
  "clearSelectedDayButton",
  "clearSelectedWeekButton",
  "shiftWeekButton",
  "copyPreviousWeekButton",
  "aiPreviousWeekSummary",
  "installAppButton",
  "updateAppButton",
]) {
  assert.ok(ids.includes(requiredId), `missing HTML id: ${requiredId}`);
}

assert.doesNotMatch(source, /images\/(?:贝拉|嘉然|乃琳)表情包\//, "legacy sticker directories must not be referenced");

const stickerSource = read("js/content/stickers.js");
for (const [packName, expectedFirstFolder] of [["贝拉", "5-"], ["嘉然", "5-"], ["乃琳", "4-"]]) {
  const packStart = stickerSource.indexOf(`"${packName}": [`);
  const firstPath = stickerSource.slice(packStart).match(/"images\/[^\"]+"/)?.[0] || "";
  assert.ok(firstPath.includes(`images/${packName}/${expectedFirstFolder}`), `${packName} stickers should start with the highest numbered folder`);
}

assert.match(html, /AI 规划本周/);
for (const directory of ["js", "css", "icons", "images"]) {
  assert.match(packageRelease, new RegExp(`Join-Path \\$projectRoot "${directory}"`), `release packaging must include ${directory}/`);
}
assert.doesNotMatch(packageRelease, /Join-Path \\$projectRoot "(?:app|data-model|styles|weekly-polish|stickers)\.(?:js|css)"/, "release packaging must not use retired root-level asset paths");
assert.match(generateLongTermData, /path\.join\(rootDir, "js", "content", "stickers\.js"\)/, "long-term test-data generation must load the organized sticker manifest");
assert.match(generateLongTermData, /path\.join\(rootDir, "sample-data", "考研加健身用户示例\.json"\)/, "long-term test-data generation must use the canonical sample-data directory");
assert.match(generateLongTermData, /长期用户300节点示例\.json/, "test-data generation must maintain the long-term chart fixture");
const longTermChart = longTermDemo.charts.find((chart) => chart.id === "chart-long-term-study-hours");
const dailyLongTermChart = longTermDemo.charts.find((chart) => chart.id === "chart-daily-300-study-hours");
assert.equal(dailyLongTermChart?.nodes.length, 300, "the daily long-term fixture must keep exactly 300 chart nodes");
assert.equal(dailyLongTermChart?.series.length, 1, "the daily long-term fixture must isolate the one-series mobile case");
assert.equal(dailyLongTermChart?.nodes.filter((node) => node.sticker && Object.keys(node.stickers || {}).length === 1).length, 300, "every daily node must keep its one-series sticker");
assert.ok(dailyLongTermChart?.nodes.every((node, index, nodes) => index === 0 || Date.parse(node.x) - Date.parse(nodes[index - 1].x) === 86400000), "the daily long-term fixture must contain every calendar day without gaps");
assert.equal(longTermChart?.nodes.length, 300, "the long-term fixture must keep exactly 300 chart nodes");
assert.equal(longTermChart?.series.length, 3, "the long-term fixture must exercise the supported three-series limit");
assert.equal(longTermChart?.nodes.filter((node) => node.sticker && Object.keys(node.stickers || {}).length === 3).length, 300, "every long-term node must exercise three-series sticker decluttering");
assert.match(generateStickers, /\[string\]\$OutputFile = "js\/content\/stickers\.js"/, "sticker generation must write to the organized content directory");
assert.match(html, /把下面两段内容发给 AI，再把生成的计划粘贴到最下方/, "AI planning should lead with the simple outcome");
assert.match(scheduleCss, /\.ai-copy-row\{[\s\S]*?--ai-step-color:\s*var\(--member-diana\)/, "the first AI import step must use Diana's support colour");
assert.match(scheduleCss, /\.ai-copy-row:nth-child\(2\)\{\s*--ai-step-color:\s*var\(--member-bella\)/, "the second AI import step must use Bella's support colour");
assert.match(scheduleCss, /#copyAiPromptButton\{[^}]*background:var\(--member-bella\)/, "the second AI copy action must visibly carry Bella's support colour");
assert.match(scheduleCss, /\.ai-import-final\{[\s\S]*?--ai-step-color:\s*var\(--member-eileen\)/, "the final AI import step must use Eileen's support colour");
assert.match(app, /function copyPreviousWeekContext\(/, "AI planning should copy the previous week separately");
assert.doesNotMatch(html, /id="aiPromptOutput"/, "AI planning should not expose a large generated-prompt preview");
assert.doesNotMatch(html, /本周便签/, "the PWA should replace the old mobile-note export");
assert.match(app, /data-shift-current-day/);
assert.match(html, /class="hero-jump" href="#goalSectionStart"[^>]*>点击开始/, "hero action must open countdowns");
assert.doesNotMatch(html, /AI 规划本月/);
assert.match(html, /href="icons\/icon-v3\.png(?:\?v=\d+)?"/, "current app icon must be linked with an optional cache version");
assert.ok(fs.existsSync(path.join(projectRoot, "icons", "icon-v3.png")), "missing current yigehun icon master");
assert.match(html, /rel="manifest" href="manifest\.webmanifest(?:\?[^\"]+)?"/, "PWA manifest must be linked");
assert.match(html, /src="js\/core\/app-utils\.js\?v=\d+"/, "shared app utilities must be loaded");
assert.ok(html.indexOf("js/core/app-utils.js") < html.indexOf("js/app.js"), "shared app utilities must load before the application entry");
const appUtilsHref = versionedAssetHref("src", "js/core/app-utils.js");
assert.ok(appUtilsHref && serviceWorker.includes(`"./${appUtilsHref}"`), "the service worker must precache the current app utility version");
assert.match(appUtils, /ASOUL_APP_UTILS/, "the utility file must expose its explicit boundary");
assert.match(app, /const APP_UTILS = globalThis\.ASOUL_APP_UTILS/, "app.js must consume the shared utility boundary");
const utilityExports = appUtils.match(/ASOUL_APP_UTILS\s*=\s*Object\.freeze\(\{([\s\S]*?)\}\);/)?.[1]
  .split(",")
  .map((name) => name.trim())
  .filter(Boolean) || [];
const utilityConsumers = `${app}\n${stateNormalizer}\n${appConfig}\n${weeklyReportRenderer}\n${chartRenderer}`;
assert.deepEqual(
  utilityExports.filter((name) => !new RegExp(`\\b${name}\\b`).test(utilityConsumers)),
  [],
  "every exported app utility must be consumed by an application boundary"
);
assert.match(html, /src="js\/core\/backup-codec\.js\?v=\d+"/, "the backup codec must be loaded");
assert.ok(html.indexOf("js/core/backup-codec.js") < html.indexOf("js/app.js"), "the backup codec must load before the application entry");
const backupCodecHref = versionedAssetHref("src", "js/core/backup-codec.js");
assert.ok(backupCodecHref && serviceWorker.includes(`"./${backupCodecHref}"`), "the service worker must precache the current backup codec version");
assert.match(backupCodec, /ASOUL_BACKUP_CODEC/, "the backup codec must expose its explicit boundary");
assert.match(app, /const BACKUP_CODEC = globalThis\.ASOUL_BACKUP_CODEC/, "app.js must consume the backup codec boundary");
assert.match(app, /createDiaryBackupPayload\(state, new Date\(\)\.toISOString\(\)\)/, "backup export must use the shared codec");
assert.match(app, /parseDiaryBackup\(await file\.text\(\)\)/, "backup import must use the shared codec");
assert.doesNotMatch(app, /function isDiaryBackupPayload\(/, "backup validation must not be duplicated in app.js");
assert.doesNotMatch(app, /JOKES_STORAGE_KEY|loadJokes\(|saveJokes\(|imported\.jokes|normalizeJokes\(/, "static cold jokes must not be treated as mutable user data");
assert.doesNotMatch(backupCodec, /jokes:\s*Array\.isArray/, "new backups must not export static cold jokes");
assert.equal((coldJokes.match(/"question":/g) || []).length, 74, "the static cold-joke library must contain the complete curated set");
assert.doesNotMatch(coldJokes, /新增网络冷笑话|本次新增/, "cold jokes must not retain temporary batch comments");
assert.doesNotMatch(coldJokes, /从 Asoul 一个魂生活日记导出|网页中管理/, "static cold jokes must not claim to be exportable user data");
assert.doesNotMatch(coldJokes, /"answer":\s*"[^"\r\n]*[。.]"/, "cold-joke answers must not end with a full stop");
for (const question of [
  "猎人朝狐狸开了一枪，为什么最后猎人自己倒下了？",
  "一只面包走着走着突然扭伤了脚，它是什么面包？",
  "有一只熊走过来，猜一个成语",
  "哪一种蝙蝠从来不用休息？",
  "一个人被全身刷成金色，猜一个成语",
  "一只蜜蜂停在日历上，猜一个成语",
]) {
  assert.ok(coldJokes.includes(`"question": "${question}"`), `missing curated cold joke: ${question}`);
}
for (const [filename, globalName, moduleSource] of [
  ["js/core/app-config.js", "ASOUL_APP_CONFIG", appConfig],
  ["js/domain/milestone-domain.js", "ASOUL_MILESTONE_DOMAIN", milestoneDomain],
  ["js/domain/chart-domain.js", "ASOUL_CHART_DOMAIN", chartDomain],
  ["js/domain/schedule-domain.js", "ASOUL_SCHEDULE_DOMAIN", scheduleDomain],
  ["js/ui/snap-carousel.js", "ASOUL_SNAP_CAROUSEL", snapCarousel],
  ["js/ui/canvas-utils.js", "ASOUL_CANVAS_UTILS", canvasUtils],
  ["js/ui/weekly-report-renderer.js", "ASOUL_WEEKLY_REPORT_RENDERER", weeklyReportRenderer],
  ["js/ui/chart-renderer.js", "ASOUL_CHART_RENDERER", chartRenderer],
  ["js/core/state-normalizer.js", "ASOUL_STATE_NORMALIZER", stateNormalizer],
  ["js/core/state-store.js", "ASOUL_STATE_STORE", stateStore],
]) {
  const href = versionedAssetHref("src", filename);
  assert.ok(href, `${filename} must be loaded`);
  assert.ok(html.indexOf(filename) < html.indexOf("js/app.js"), `${filename} must load before app.js`);
  assert.ok(serviceWorker.includes(`"./${href}"`), `the service worker must precache ${filename}`);
  assert.match(moduleSource, new RegExp(globalName), `${filename} must expose ${globalName}`);
  assert.match(app, new RegExp(`globalThis\\.${globalName}`), `app.js must consume ${globalName}`);
}
const appHref = versionedAssetHref("src", "js/app.js");
assert.ok(appHref && serviceWorker.includes(`"./${appHref}"`), "the service worker must precache the current app entry");
assert.match(app, /function bindEvents\(\)\s*\{\s*bindMilestoneEvents\(\);[\s\S]*bindDialogShellEvents\(\);\s*\}/, "the event shell must delegate to domain binders");
assert.match(app, /function persistSpaceChange\(/, "space changes must use one cross-view persistence boundary");
assert.match(html, /class="header-tools"[\s\S]*id="installAppButton"/, "PWA installation must be discoverable in the mobile header");
assert.match(html, /href="https:\/\/www\.doubao\.com\/chat\/"/, "AI planning should offer an optional Doubao jump link");
assert.doesNotMatch(html, /class="pwa-prompt"/, "PWA installation must not interrupt users with an automatic popup");
assert.ok(fs.existsSync(path.join(projectRoot, "sw.js")), "missing service worker");
assert.ok(fs.existsSync(path.join(projectRoot, "icons", "icon-v3.png")), "missing current PWA icon: icon-v3.png");
assert.match(manifest, /icons\/icon-v3\.png/, "the install manifest must use the current app icon");
for (const size of [192, 512]) {
  const iconPath = `icons/icon-v3-${size}.png`;
  assert.ok(fs.existsSync(path.join(projectRoot, ...iconPath.split("/"))), `missing explicit ${size}px PWA icon`);
  assert.ok(manifestData.icons.some((icon) => icon.src === iconPath && icon.sizes === `${size}x${size}`), `manifest must declare an explicit ${size}px install icon`);
  assert.ok(serviceWorker.includes(`"./${iconPath}"`), `service worker must precache the ${size}px install icon`);
}
assert.equal(manifestData.id, "./", "the PWA manifest must expose a stable app identity");
assert.match(app, /else if \(!window\.isSecureContext\)[\s\S]*HTTPS 地址[\s\S]*localhost/, "desktop installation must explain insecure non-local addresses");
assert.doesNotMatch(html, /name="height"/, "profile must not ask for height");
assert.doesNotMatch(html, /name="project"/, "profile must not ask for a project");
assert.match(html, /name="signature"/);
assert.match(html, />个性签名</);
assert.doesNotMatch(html, /写一句现在想送给自己的话/);
assert.doesNotMatch(html, /weekPlanTextDialog|copyWeekPlanTextButton|exportSelectedWeekButton/, "legacy weekly-note UI must be removed");
assert.doesNotMatch(app, /【备注】/, "AI plan format must not ask AI to write daily notes");
assert.doesNotMatch(app, /day\.note\s*=\s*plannedDay\.note/, "AI import must preserve daily notes");
assert.match(app, /selectedDayByWeek\.get\(week\.id\)/, "schedule shift must start from the selected day");
assert.match(scheduleDomain, /index\s*>\s*startIndex/, "schedule shift must preserve days before the selected day");
assert.match(scheduleDomain, /function clearWeekDayContent\(/, "day-card clearing must stay in the schedule domain");
assert.match(scheduleDomain, /function clearWeekContent\(/, "week-card clearing must stay in the schedule domain");
assert.match(app, /if \(!\$\("#spaceIconPicker"\)\.open\)/, "collapsed space sticker picker must avoid rendering sticker images");
assert.match(app, /function renderGoals\(/, "global goals must be rendered independently of spaces");
assert.match(app, /renderWeeklyReportGoals/, "weekly reports must include goal countdowns");
assert.match(app, /function renderGoalStickerPicker\(/, "countdowns must support optional stickers");
assert.match(app, /function renderGoalSpaceOptions\(/, "countdowns must allow selecting report spaces");
assert.match(app, /goal\.spaceIds\.includes\(spaceId\)/, "weekly reports must filter countdowns by space");
assert.match(app, /new Set\(Array\.isArray\(selectedSpaceIds\) \? selectedSpaceIds : \[\]\)/, "countdowns must allow no report space");
assert.doesNotMatch(app, /请至少选择一个要显示周报的空间/, "countdown space selection must be optional");
assert.match(stateNormalizer, /const source = Array\.isArray\(candidate\) \? candidate : defaultSpaces/, "an explicitly empty space list must stay empty");
assert.doesNotMatch(app, /至少要保留一个空间/, "all spaces must be removable");
assert.doesNotMatch(app, /data-edit-goal/, "countdown cards must not contain their own edit buttons");
assert.match(app, /week-node-progress/, "week cards must show recorded-day progress");
assert.match(app, /function pickRelevantWeek\(/, "week navigation must prefer the current or nearest week");
assert.match(scheduleDomain, /day\?\.recorded === true/, "recorded-day count must use the explicit day setting");
assert.match(app, /data-record-today/, "single-day editor must expose the recorded-day switch");
assert.match(app, /记录今天|今天已记录/, "recorded-day control must live with daily completion settings");
assert.doesNotMatch(html, /计入周记录/, "legacy recorded-day wording must be removed");
assert.match(app, /weekStickerDialog\.close\(\);\s*playWeekFeedback\("recorded"\);\s*persistState\(\["schedule"\]\)/, "saving a daily sticker must play the shared confirmation sound before refreshing the schedule");
assert.match(appConfig, /WEEK_ITEM_STATES = new Set\(\["", "done", "changed", "missed"\]\)/, "weekly items must support done, changed, and missed states");
assert.match(app, /\["changed", "⚡", "调整"\]/, "weekly items must expose the lightning changed-plan state");
assert.match(app, /data-record-today/, "the day editor must expose a direct record-today action");
assert.match(app, /day\.items = plannedDay\.items\.map/, "AI import must use the unified weekly item model");
assert.doesNotMatch(app, /data-pair-field=|data-set-pair-done|完成与记录/, "the legacy two-column plan/actual editor must be removed");
assert.doesNotMatch(html, /目标独立于空间保存|背单词、读书或工作项目|用模板或从空白开始|曲线图日记/, "redundant section explanations must be removed");
assert.match(html, /class="personal-preferences"[\s\S]*id="weekSoundToggle"[^>]*aria-pressed="true"/, "sound preference must live in the personal view and default on");
assert.match(html, /选择状态、记录今天或保存表情时，给今天一个轻轻的回应/, "the sound preference copy must describe all supported schedule feedback");
assert.match(app, /function playWeekFeedback\(feedback = "positive"\)[\s\S]*adjusted:[\s\S]*missed:[\s\S]*recorded:/, "schedule feedback must provide three outcome sounds and one confirmation sound");
assert.match(app, /recorded:\s*\[\s*\[523\.25,[^\]]+\],\s*\[659\.25,[^\]]+\],\s*\[783\.99,[^\]]+\],\s*\]/, "recording and sticker saves must use one deliberate three-note confirmation sound");
assert.match(app, /\{ done: "positive", changed: "adjusted", missed: "missed" \}/, "task outcomes must map to the three sound profiles");
assert.match(app, /\{ "好好好": "positive", "还不错": "adjusted", "这期拉了": "missed" \}/, "day outcomes must map to the three sound profiles");
assert.match(app, /if \(day\.recorded\) playWeekFeedback\("recorded"\)/, "recording today must use the confirmation sound without sounding when the action is undone");
assert.match(html, /id="footerResetDataButton"/, "mobile personal view must provide record clearing without the header");
assert.match(scheduleCss, /week-node-head/, "week overview cards must be styled");
assert.doesNotMatch(scheduleCss, /week-node-dot/, "legacy circular week nodes must be removed");
assert.match(weeklyCss, /grid-auto-rows:\s*96px/, "photo sticker rows must not be compressed");

const demoBackup = JSON.parse(read("sample-data/考研加健身用户示例.json"));
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
assert.equal((html.match(/data-theme-color-field/g) || []).length, 3, "countdowns, progress goals, and spaces must share the theme-colour control");
assert.match(stateNormalizer, /function safeCardColor\(/, "card colours must pass through one allow-list boundary");
assert.match(app, /function getCardColor\(/, "automatic and explicit card colours must share one resolver");
assert.match(stateNormalizer, /color:\s*safeCardColor\(item\?\.color\)/, "spaces must normalize their optional colour");
assert.ok((stateNormalizer.match(/color:\s*safeCardColor\(goal\.color\)/g) || []).length >= 2, "both milestone types must normalize their optional colour");
assert.doesNotMatch(app, /function (?:normalizeState|normalizeWeekDay|normalizeWeek|normalizeGoal|normalizeProgressGoal|safeSticker|safeId|makeId)\(/, "the application entry must not duplicate state-normalization responsibilities");
assert.match(app, /STATE_NORMALIZER_MODULE\.createStateNormalizer\(/, "app.js must configure the shared state-normalization boundary once");
assert.match(app, /STATE_STORE_MODULE\.createStateStore\(/, "app.js must configure the local-state persistence boundary once");
assert.doesNotMatch(app, /storageAvailable|stateSaveBlocked|stateLoadIssue|saveTimer/, "storage lifecycle flags must stay inside state-store.js");
assert.match(app, /function initSectionNavigation\([\s\S]*?revealMobileViewSelection\(nextId\)/, "mobile tab activation must restore the selected card after its view becomes visible");
assert.match(app, /--goal-color:\$\{escapeAttr\(getCardColor\(goal, index\)\)\}/, "countdown cards must use the resolved colour");
assert.match(app, /--progress-color:\$\{escapeAttr\(getCardColor\(goal, index\)\)\}/, "progress cards must use the resolved colour");
assert.match(app, /--space-color:\$\{escapeAttr\(color\)\}/, "space cards must use the resolved colour");
assert.match(scheduleCss, /\.space-switcher-button::before\{[\s\S]*?background:\s*var\(--space-color\)/, "every space card must expose its colour even when inactive");
assert.match(weeklyReportRenderer, /const tone = getCardColor\(item\.data, toneIndex\)/, "downloaded milestones must use the same colour as the app");
assert.doesNotMatch(`${html}\n${app}\n${read("docs/使用说明.md")}`, /折线图|折线颜色|每条折线/, "user-facing chart terminology must use 曲线图");
assert.match(chartRenderer, /formatChartAxisLabel/, "curve charts must format readable date labels");
assert.match(chartRenderer, /const minimumLabelGap = Math\.max\(72, 88 \* visualScale\);/, "long-running curves must keep a safe horizontal gap between date labels");
assert.doesNotMatch(chartRenderer, /visibleStickerKeys/, "dense curve decoration must not depend on a second sampled data collection");
assert.match(chartRenderer, /const densityScale = chart\.nodes\.length >= 12/, "dense curve charts must scale their sticker presentation");
assert.match(chartRenderer, /const lineWidth = \(compactChart \? 2\.5 : 2\.7\) \* visualScale;/, "screen curves must retain the refined lighter line weight");
assert.match(chartRenderer, /context\.lineWidth = seriesIndex === 0 \? 7\.2 : 5\.4;/, "downloaded curves must match the lighter on-screen line hierarchy");
assert.match(chartRenderer, /const desiredStickerSize = 44 \* nodeVisualScale \* densityScale;/, "single and multi-series curves must share one enlarged sticker-size baseline");
assert.match(chartRenderer, /const visibleNodeSpacing = nodeSpacing \* \(declutterDensePoints \? denseMarkerEvery : 1\);/, "dense curve sticker sizing must use the distance between visible sampled nodes");
assert.match(chartRenderer, /const targetVisibleMarkers = \(phoneChart \? 6 : compactChart \? 10 : 12\) \* zoom;/, "zooming in must reveal more sampled nodes inside the visible chart window");
assert.match(app, /buildChartZoomLevels\(\{[\s\S]*?minimumNodeSpacing:\s*96/, "maximum curve zoom must be derived from the node count and readable date spacing");
assert.match(chartRenderer, /data-zoom-action="max"/, "curve controls must offer a direct maximum-detail action");
assert.match(chartRenderer, /data-zoom-action="min"/, "curve controls must offer a direct minimum global-view action");
assert.match(chartsCss, /grid-template-columns:72px minmax\(0,1fr\) 54px minmax\(0,1fr\) 72px;/, "desktop curve zoom controls must reserve symmetric endpoint actions");
assert.match(chartsCss, /\.chart-card-actions > \.chart-action--add\{[\s\S]*?border-color:var\(--chart-color\);[\s\S]*?background:var\(--chart-color\);/, "the primary chart action must use its first series colour");
assert.match(chartsCss, /\.chart-zoom-bar button\{[\s\S]*?color-mix\(in srgb,var\(--chart-color\)[\s\S]*?background:color-mix\(in srgb,var\(--chart-color\)/, "chart zoom controls must use the first series colour family");
assert.match(chartsCss, /@media \(max-width:899\.98px\)[\s\S]*?\.chart-heading-line\{[\s\S]*?grid-template-columns:minmax\(0,1fr\) auto;[\s\S]*?align-items:end;/, "compact curve metadata must share the title baseline");
assert.match(chartsCss, /\.chart-space-context button\{[\s\S]*?min-height:54px;[\s\S]*?font-size:13px;/, "desktop curve space controls must use a readable touch and type scale");
assert.match(chartRenderer, /compactChart && pointValues\.length > 1 && chart\.nodes\.length > 8/, "compact multi-series charts must avoid stacking every sticker at one node");
assert.match(chartRenderer, /const declutterDensePoints = chart\.nodes\.length > 8 && nodeSpacing < denseSpacingThreshold \* visualScale;/, "dense curves must declutter nodes and stickers at every viewport size");
assert.match(chartRenderer, /const stickerPointValues = !declutterDensePoints \|\| showPointMarker \? availableStickerPointValues : \[\]/, "curve decluttering must preserve node data while reducing stickers");
assert.match(chartRenderer, /<g class="chart-point[\s\S]*?data-node-id=[\s\S]*?<rect class="node-hit-area"/, "decluttered chart nodes must retain their full interactive hit areas");
assert.match(app, /function downloadWeeklyReportImage\(/, "weekly reports must support PNG download");
assert.match(canvasUtils, /canvas\.toDataURL\("image\/png"\)/, "weekly report download must stay inside the user's click gesture");
assert.match(app, /function downloadWeeklySummaryImage\(/, "weekly reports must provide a landscape summary image");
assert.doesNotMatch(app, /function createWeekly(?:Report|Summary)Canvas\(/, "the application entry must not duplicate weekly canvas rendering");
assert.match(app, /createWeeklyReportCanvas\(week, state\)/, "the application entry must pass the current state explicitly to the weekly renderer");
const weeklySummaryCanvasSource = weeklyReportRenderer.slice(
  weeklyReportRenderer.indexOf("function createWeeklySummaryCanvas"),
  weeklyReportRenderer.indexOf("function drawWeeklySummaryBackground"),
);
assert.match(weeklySummaryCanvasSource, /const daysY = milestones\.length > 2 \? 576 : 450;[\s\S]*?const height = daysY \+ 374;/, "landscape weekly exports must derive their height from their content");
assert.doesNotMatch(weeklySummaryCanvasSource, /const height = 1080;/, "landscape weekly exports must not keep a fixed blank canvas height");
assert.match(scheduleCss, /\.weekly-report-goal-list\{ display:grid; grid-template-columns:1fr; gap:7px; \}/, "phone weekly-report milestones must render in one column");
assert.match(scheduleCss, /\.weekly-report-milestone-group \+ \.weekly-report-milestone-group\{[\s\S]*?margin-top:10px/, "phone weekly-report countdowns and progress goals must remain visually separated");
assert.match(weeklyReportRenderer, /const dayCardWidth = \(width - outer \* 2 - gap\) \/ 2;/, "portrait weekly exports must use two daily cards per row");
assert.match(weeklyReportRenderer, /const cardX = outer \+ index % 2 \* \(dayCardWidth \+ gap\);/, "an odd portrait daily card must keep half-row width");
assert.match(weeklyReportRenderer, /if \(day\.note\) \{[\s\S]*?drawCanvasText\(context, day\.note,/, "landscape daily cards must show the actual note when present");
assert.doesNotMatch(app, /把一周摊开看见，也把下一步留给自己。/, "the retired weekly-export slogan must stay removed");
assert.match(scheduleCss, /@media \(min-width:899\.99px\)[\s\S]*?\.space-section-copy\{[\s\S]*?grid-template-areas:"space-eyebrow space-actions" "space-title space-actions"/, "desktop spaces must share the cross-page heading and action grammar from the shared 900px breakpoint");
assert.match(app, /<nav class="week-day-navigation"[\s\S]*?data-week-day-step="-1"[\s\S]*?data-week-day-step="1"/, "day navigation must live inside the selected day editor");
assert.match(app, /class="week-day-heading-group"[\s\S]*?class="week-day-title-edit" title="点击修改当天名称"[\s\S]*?data-day-text-field="title"[\s\S]*?<nav class="week-day-navigation"/, "the desktop day navigator must follow the editable day title directly");
assert.doesNotMatch(`${app}\n${scheduleCss}`, /week-day-stepper/, "the retired floating day stepper must not return");
assert.match(scheduleCss, /@media \(min-width:899\.99px\)[\s\S]*?\.week-timeline-caption\{[\s\S]*?display:flex;[\s\S]*?justify-content:space-between/, "desktop week controls must keep the explanatory copy left and actions right");
assert.doesNotMatch(scheduleCss, /@media \(min-width:901px\)/, "schedule desktop styling must not start one pixel after the shared web breakpoint");
assert.match(scheduleCss, /\.week-board\{[\s\S]*?background:transparent;[\s\S]*?box-shadow:none/, "desktop day navigation must not sit inside a full-width empty band");
assert.match(scheduleCss, /\.week-day-navigation\{[\s\S]*?grid-template-columns:36px minmax\(104px,1fr\) 36px/, "day navigation must use the shared compact control geometry");
assert.match(scheduleCss, /grid-template-columns:minmax\(420px,560px\) minmax\(250px,290px\) minmax\(12px,1fr\) 96px;[\s\S]*?grid-template-areas:"heading heading \. sticker" "statuses actions \. sticker" "help help \. sticker"/, "wide day cards must keep navigation and actions beside the day identity instead of pushing them against the sticker");
assert.match(scheduleCss, /\.week-day-sticker-button\{ width:96px; height:96px; align-self:center; justify-self:end; \}/, "the desktop day sticker must stay vertically centred in the complete day header");
assert.match(scheduleCss, /\.week-day-sticker-button\{ background:#fff; \}/, "day sticker frames must use a white canvas for white-background stickers");
assert.match(scheduleCss, /--day-sticker-size:clamp\(80px,16vw,94px\);[\s\S]*?grid-template-columns:minmax\(0,1fr\) var\(--day-sticker-size\)/, "compact day cards must share one responsive sticker size between the grid and image frame");
assert.match(scheduleCss, /\.weekly-report-status--great\{ color:#fff; background:#db7d74; \}[\s\S]*?\.weekly-report-status--okay\{ color:#593c49; background:#f7cbd7; \}[\s\S]*?\.weekly-report-status--missed\{ color:#fff; background:#89777f; \}[\s\S]*?\.weekly-report-status--pending\{ color:#fff; background:#576690; \}/, "weekly report pills must use the same four-state color contract as day cards");
assert.match(scheduleCss, /\.weekly-report-score span:nth-child\(2\)\{ color:#9a6c25; background:#fff7df; \}/, "the adjusted-item report summary must use its yellow state colour");
assert.match(scheduleCss, /body\.is-mobile-app \.week-day-statuses \.week-day-status--missed\.is-active\{[\s\S]*?border-color:#89777f;[\s\S]*?background:#89777f;/, "compact day cards must preserve the restrained brown missed state");
assert.match(scheduleCss, /body\.is-mobile-app \.week-day-statuses \.week-day-status--pending\.is-active\{[\s\S]*?border-color:#576690;[\s\S]*?background:#576690;/, "compact day cards must use Eileen dark blue-gray for the pending state");
assert.match(app, /const DAY_STATUS_PALETTE = Object\.freeze\([\s\S]*?"这期拉了": Object\.freeze\(\{ fill: "#89777f", ink: "#ffffff" \}\)[\s\S]*?"未设置": Object\.freeze\(\{ fill: "#576690", ink: "#ffffff" \}\)/, "downloaded weekly cards must use the same brown missed and Eileen pending colours");
assert.match(app, /const ITEM_SUMMARY_PALETTE = Object\.freeze\([\s\S]*?changed:[\s\S]*?fill: "#fff7df"[\s\S]*?ink: "#9a6c25"/, "downloaded weekly reports must share the yellow adjusted-item palette");
assert.match(mobileAppCss, /@media \(max-width:899\.98px\)\{[\s\S]*?\.dialog \.sticker-grid\{[\s\S]*?grid-template-columns:repeat\(4,minmax\(0,1fr\)\) !important;[\s\S]*?grid-auto-rows:max-content !important;[\s\S]*?align-content:start !important;/, "medium compact sticker pickers must show complete images in non-collapsing four-column rows");
assert.match(mobileAppCss, /@media \(max-width:599\.98px\)\{[\s\S]*?\.dialog \.sticker-grid\{[\s\S]*?grid-template-columns:repeat\(3,minmax\(0,1fr\)\) !important;/, "phone sticker pickers must use a readable three-column grid");
assert.doesNotMatch(goalsCss, /@media \(max-width: 379px\)[\s\S]*?#progressGoalForm \.dialog-fields\s*,[\s\S]*?grid-template-columns: minmax\(0, 1fr\)/, "narrow progress forms must keep target/unit and progress/adjustment pairs on two-column rows");
assert.match(app, /class="week-day-title-help">点击今日标题可以直接修改哟~<\/small>/, "day cards must explain title editing below the status controls");
assert.match(scheduleCss, /\.week-day-title-edit input:focus\{[\s\S]*?border-bottom-color:/, "editable day titles must retain a restrained focus underline");
assert.doesNotMatch(scheduleCss, /\.week-day-title-edit::after/, "editable day titles must not keep the rejected inline edit label");
assert.match(scheduleCss, /@media \(min-width:640px\) and \(max-width:899\.98px\)[\s\S]*?grid-template-areas:"heading sticker" "statuses statuses" "help help" "actions actions"/, "tablet day cards must keep the navigator beside the editable title before desktop mode begins");
assert.match(scheduleCss, /\.week-node-actions > button\{ border-style:solid; \}/, "week toolbar buttons must not inherit the browser's two-tone outset border");
assert.match(app, /class="week-item-legend"[\s\S]*?is-done[\s\S]*?is-changed[\s\S]*?is-missed/, "the day editor must expose a readable semantic status legend");
assert.match(app, /function downloadChartImage\(/, "curve charts must support PNG download");
assert.doesNotMatch(app, /曲线图会采用每条曲线自己的纵轴范围/, "downloaded curve images must not include the retired axis explanation");
assert.ok((`${app}\n${weeklyReportRenderer}\n${chartRenderer}\n${canvasUtils}`.match(/drawCanvasAppIcon\(/g) || []).length >= 4, "every exported image type must use the current app icon");
assert.ok((`${app}\n${weeklyReportRenderer}\n${chartRenderer}`.match(/const scale = 2;/g) || []).length >= 3, "weekly and curve PNG exports must use 2x canvas resolution");
assert.match(app, /CHART_RENDERER_MODULE\.createChartRenderer\(/, "app.js must configure the curve-rendering boundary once");
assert.doesNotMatch(app, /function (?:createChartCanvas|renderChartSvg|createChartSvgLayout)\(/, "the application entry must not duplicate curve rendering");
assert.match(app, /function moveSelectedMilestone\(/, "countdowns and progress goals must be reorderable");
assert.match(html, /class="section-nav"/, "desktop section navigation must exist");
assert.match(html, /class="mobile-bottom-nav"/, "mobile section navigation must exist");
assert.match(html, /data-app-view="home"/, "the mobile home view must exist");
assert.match(app, /function initSectionNavigation\(\)[\s\S]*showMobileView/, "mobile navigation must switch real app views");
assert.doesNotMatch(app, /data-fullscreen-chart|toggleChartFullscreen/, "mobile curve charts should be readable inline without a second fullscreen mode");
assert.ok(fs.existsSync(path.join(projectRoot, "css", "platform", "mobile-app.css")), "missing final mobile app stylesheet");
assert.match(html, /href="css\/design-system\.css\?v=\d+"/, "the shared design system must be loaded");
assert.ok(html.indexOf("css/design-system.css") < html.indexOf("css/legacy/styles.css"), "design tokens must load before page styles");
for (const filename of [
  "css/design-system.css",
  "css/legacy/styles.css",
  "css/legacy/weekly-polish.css",
  "css/legacy/complete-polish.css",
  "css/platform/mobile-app.css",
  "css/platform/responsive-platform.css",
  "css/pages/home.css",
  "css/pages/goals.css",
  "css/pages/schedule.css",
  "css/pages/charts.css",
  "css/pages/personal.css",
]) {
  const href = versionedAssetHref("href", filename);
  assert.ok(href && serviceWorker.includes(`"./${href}"`), `the service worker must precache the current ${filename} version`);
}
assert.match(designSystemCss, /--member-diana:\s*#e799b0/i, "the design system must preserve Diana's support colour");
assert.match(designSystemCss, /--member-bella:\s*#db7d74/i, "the design system must preserve Bella's support colour");
assert.match(designSystemCss, /--member-eileen:\s*#576690/i, "the design system must preserve Eileen's support colour");
assert.doesNotMatch(html, /page-glow/, "the retired decorative page glow must not return");
assert.match(homeCss, /\.hero-cast::before\s*\{\s*display:\s*none/, "the character stage must keep the overlapping circular glow disabled");
assert.match(homeCss, /\.hero-copy h1 em\s*\{[\s\S]*?display:\s*inline-block;[\s\S]*?margin-top:\s*\.08em;/, "the second cover-title line must retain a small readable gap from the first line");
assert.match(homeCss, /top:\s*var\(--caption-top,\s*auto\)/, "character captions must use explicit safe-area anchors");
assert.match(homeCss, /\.hero-sticker--bella\s*\{[\s\S]*?--caption-top:\s*64%;[\s\S]*?--caption-left:\s*76%;[\s\S]*?top:\s*-30px;[\s\S]*?left:\s*-39px;/, "Bella must share the tuned character and caption anchors at every width");
assert.match(homeCss, /\.hero-sticker--diana\s*\{[\s\S]*?--caption-right:\s*76%;[\s\S]*?top:\s*-28px;[\s\S]*?left:\s*1px;[\s\S]*?transform:\s*translateX\(clamp\(14px, 2vw, 26px\)\) rotate\(-3deg\)/, "Diana must share the tuned character and caption anchors at every width");
assert.match(homeCss, /\.hero-sticker--eileen\s*\{[\s\S]*?--caption-right:\s*-22%;[\s\S]*?--caption-bottom:\s*-4px;[\s\S]*?top:\s*-9px;[\s\S]*?left:\s*-13px;/, "Eileen must share the tuned character and caption anchors at every width");
assert.match(homeCss, /@media \(min-width:\s*899\.99px\)[\s\S]*?\.hero-sticker--bella\s*\{\s*top:\s*45px;\s*\}[\s\S]*?\.hero-sticker--diana\s*\{\s*left:\s*-52px;\s*\}/, "web view must share the requested Bella and Diana anchors without a fractional-pixel gap");
assert.match(homeCss, /@media \(max-width:\s*899\.98px\)/, "the mobile cover composition must end immediately before the 900px web view without a fractional-pixel gap");
assert.match(html, /class="home-joke-confetti"[\s\S]*?hero-fan-symbol--star[\s\S]*?hero-fan-symbol--candy[\s\S]*?hero-fan-symbol--icecream/, "the three fan symbols must live in the joke-card decoration area");
assert.match(homeCss, /\.home-joke-card\s*\{[\s\S]*?grid-template-areas:[\s\S]*?"question art"[\s\S]*?"response art"/, "the joke card must reserve one stable response row beside the decoration column");
assert.match(homeCss, /\.joke-answer\s*\{[\s\S]*?grid-area:\s*response;[\s\S]*?white-space:\s*nowrap;/, "revealed joke answers must remain on one stable line");
assert.match(homeCss, /\.joke-answer\s*\{[\s\S]*?padding:\s*0;[\s\S]*?color:\s*var\(--member-eileen\);/, "revealed joke answers must align with the question and use Eileen dark blue-gray");
assert.match(homeCss, /\.joke-reveal\s*\{[\s\S]*?grid-area:\s*response;/, "the joke button and answer must occupy the same response row without resizing the card");
assert.doesNotMatch(html, /hero-sticker--(?:bella|diana|eileen)[\s\S]{0,180}?hero-fan-symbol/, "fan symbols must not return beside character stickers");
assert.match(homeCss, /\.home-joke-confetti \.hero-fan-symbol--star\s*\{[\s\S]*?left:\s*-8px;[\s\S]*?width:\s*65px;/, "the shared star must keep its smaller individual size and tuned anchor");
assert.match(homeCss, /\.home-joke-confetti \.hero-fan-symbol--candy\s*\{[\s\S]*?right:\s*auto;[\s\S]*?left:\s*-1px;[\s\S]*?width:\s*75px;/, "the shared candy must clear its retired right anchor");
assert.match(homeCss, /\.home-joke-confetti \.hero-fan-symbol--icecream\s*\{[\s\S]*?bottom:\s*auto;[\s\S]*?left:\s*34px;[\s\S]*?width:\s*75px;/, "the shared ice cream must clear its retired bottom anchor");
assert.match(scheduleCss, /\.space-switcher-desktop\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2/, "desktop spaces must use a balanced two-column layout");
assert.match(scheduleCss, /\.week-inline-note textarea\s*\{[\s\S]*?border-radius:/, "daily notes must use the designed textarea instead of browser defaults");
assert.match(chartsCss, /\.chart-action-menu\[open\]\s*>\s*div\s*\{[\s\S]*?position:\s*absolute/, "desktop curve actions must open as a styled popover");
assert.match(chartsCss, /@media \(max-width:\s*899\.98px\)[\s\S]*?\.chart-action-menu\[open\]\s*>\s*div\s*\{[\s\S]*?top:\s*auto;[\s\S]*?width:\s*auto;/, "compact curve actions must reset the desktop popover geometry below the shared web breakpoint");
assert.match(chartsCss, /\.chart-meta\s*>\s*span\s*\{[\s\S]*?min-height:27px;[\s\S]*?border-radius:999px;/, "curve metric and node counts must use readable shared badges");
assert.match(chartsCss, /\.chart-series-fixed\{[\s\S]*?left:auto;[\s\S]*?justify-content:flex-end;/, "curve legends must stay in the upper-right safe area away from the y axis");
assert.match(chartsCss, /\.selected-node-heading\{[\s\S]*?display:grid;[\s\S]*?grid-template-columns:auto minmax\(0,1fr\)/, "curve node dates and metric values must use an explicit non-overlapping layout");
assert.match(chartsCss, /\.selected-node-detail p\{[\s\S]*?min-height:0;[\s\S]*?margin:0;/, "empty curve notes must not reserve a large blank panel");
assert.match(chartRenderer, /Math\.max\(920, Math\.min\(1600, viewportWidth - 104\)\)/, "desktop curve viewBoxes must follow the readable canvas width and avoid collapsing into a fixed narrow mobile-style canvas");
assert.match(chartRenderer, /left: Math\.round\(\(compactChart\s*\?\s*\(chart\.series\.length > 1 \? 82 : 72\)\s*:\s*chart\.series\.length > 1 \? 106 : 84\)/, "curve plots must keep a compact safe inset for first-node stickers");
assert.match(chartRenderer, /--chart-axis-rail:\$\{axisRailWidth\}px/, "single and multi-series curves must expose their fixed y-axis rail width to CSS");
assert.doesNotMatch(`${html}\n${app}`, /pushups|俯卧撑数量|俯卧撑记录/, "the retired push-up quick-start preset must be removed");
assert.doesNotMatch(chartsCss, /\.chart-meta span \+ span::before\{[\s\S]*?content:"·"/, "curve metadata must not fall back to the retired tiny dot-separated label");
assert.doesNotMatch(responsivePlatformCss, /Homepage: every character|Tablet \/ narrow window: the same stage/, "retired responsive layout fragments must be removed");
assert.match(responsivePlatformCss, /@media \(max-width:899\.98px\)[\s\S]*?\.section-add-button,[\s\S]*?min-height:34px/, "mobile section actions need one shared touch target");
assert.match(responsivePlatformCss, /@media \(max-width:899\.98px\)\{[\s\S]*?\.site-header,\s*main,\s*footer\{[\s\S]*?width:100%;[\s\S]*?max-width:none;/, "mobile pages must use the full viewport before page cards apply their shared safe gutter");
assert.match(html, /class="section-add-button" id="addChartButton"/, "curve creation must use the same section action component as the other pages");
assert.doesNotMatch(`${mobileAppCss}\n${chartsCss}`, /#addChartButton\s*\{/, "curve creation must not retain a page-specific circular override");
assert.match(responsivePlatformCss, /@media \(min-width:1920px\)[\s\S]*?--page-max-width:1600px/, "ultrawide screens must use the large reading canvas instead of the legacy narrow column");
assert.match(mobileAppCss, /\.dialog-card\s*\{[\s\S]*?overflow-x:\s*hidden\s*!important/, "mobile dialogs must not expose a horizontal scrollbar");
assert.match(html, /href="css\/pages\/goals\.css\?v=\d+"/, "the goals page stylesheet must be loaded");
assert.ok(html.indexOf("css/pages/goals.css") > html.indexOf("css/platform/responsive-platform.css"), "page-owned goal styles must load after legacy responsive styles");
assert.match(goalsCss, /\.progress-goal-card/, "goals.css must own progress goal cards");
assert.match(goalsCss, /@media \(max-width: 699px\)[\s\S]*?\.goal-card \{[\s\S]*?align-content: center;/, "phone countdown cards must centre their two-row content without stretching a false gap");
assert.match(goalsCss, /grid-template-areas:\s*"date date date"\s*"sticker copy countdown"/, "countdown values must share the content row's visual centre instead of spanning the date row");
assert.match(goalsCss, /\.goal-card-countdown\s*\{[\s\S]*?background:\s*transparent;/, "countdown values must sit directly on the card instead of using a separate white tile");
assert.match(goalsCss, /@media \(max-width: 699px\)[\s\S]*?\.goal-list:not\(\[data-count="1"\]\),[\s\S]*?padding: 4px 13px 8px;/, "phone milestone carousels must reserve room for the selected card outline");
assert.match(goalsCss, /scroll-snap-stop: always;/, "phone milestone cards must settle on a complete card after a swipe");
assert.match(snapCarousel, /function bindSnapSelection\([\s\S]*?addEventListener\("scrollend", syncSelection[\s\S]*?addEventListener\("pointerup", onPointerUp[\s\S]*?addEventListener\("touchend", onTouchEnd/, "the carousel controller must synchronize selection after scroll, pointer, and touch completion");
assert.match(snapCarousel, /const syncSelection = \(\) => \{[\s\S]*?clearTimeout\(timer\);[\s\S]*?if \(!container\.isConnected\) return;/, "snap selection must cancel stale callbacks from rails replaced by a page rerender");
assert.match(snapCarousel, /const bindings = new WeakMap\(\)[\s\S]*?function bindSnapSelection[\s\S]*?const existing = bindings\.get\(container\)/, "carousel lifecycle ownership must prevent duplicate bindings without writing flags into the DOM");
assert.equal((app.match(/bindSnapSelection\(/g) || []).length, 4, "the shared snap-selection controller must bind countdown, progress, space, and week carousels");
assert.match(app, /bindSnapSelection\(mobileRail, "\[data-space-id\]"/, "phone space cards must select the card nearest the rail centre");
assert.match(app, /bindSnapSelection\(weekTimeline, "\[data-select-week\]"/, "phone week cards must select the card nearest the rail centre");
assert.match(scheduleCss, /Mobile schedule rails share the milestone carousel contract[\s\S]*?\.space-switcher-mobile,[\s\S]*?\.week-timeline,[\s\S]*?scroll-snap-type:x mandatory/, "space and week rails must share one mandatory mobile snap contract");
assert.match(scheduleCss, /\.space-switcher-item,[\s\S]*?\.week-node\{[\s\S]*?flex:0 0 100%;[\s\S]*?scroll-snap-align:center;/, "mobile schedule cards must centre while leaving a controlled neighbouring-card peek");
assert.match(html, /class="weekly-report-back-button"[^>]*data-close-dialog[^>]*>← 返回日程</, "the mobile weekly report must provide an explicit bottom return action");
assert.match(scheduleCss, /\.weekly-report-back-button\{ display:none; \}[\s\S]*?@media \(max-width:899\.98px\)[\s\S]*?\.weekly-report-back-button\{[\s\S]*?display:inline-flex;/, "the weekly-report return action must appear only in compact layouts");
assert.match(app, /class="week-day-sticker-empty"[\s\S]*?<b>＋<\/b><small>选表情<\/small>/, "empty day stickers must use one centred placeholder group");
assert.doesNotMatch(goalsCss, /!important/, "page-owned goal styles should not depend on !important");
assert.doesNotMatch(legacyResponsiveCss, /\.(?:goal-section|goal-list|goal-card|progress-goal|goal-space)(?:\b|-)/, "legacy stylesheets must not retain goal-page selectors");
assert.match(html, /href="css\/pages\/schedule\.css\?v=\d+"/, "the schedule page stylesheet must be loaded");
assert.ok(html.indexOf("css/pages/schedule.css") > html.indexOf("css/pages/goals.css"), "page-owned schedule styles must load after shared and earlier page styles");
assert.doesNotMatch(html, /weekly-planner\.css/, "the retired schedule stylesheet must not be loaded");
assert.match(scheduleCss, /\.week-inline-day/, "schedule.css must own day cards");
assert.doesNotMatch(scheduleCss, /!important/, "page-owned schedule styles should not depend on !important");
assert.doesNotMatch(
  legacyScheduleCss,
  /\.(?:space-(?:section|switcher|template)|week|weekly|ai)(?:\b|-)|#(?:spaceForm|spaceSectionStart|weeklySection|weeklyTrackStart)\b/,
  "legacy stylesheets must not retain schedule-page selectors",
);
assert.match(html, /href="css\/pages\/charts\.css\?v=\d+"/, "the charts page stylesheet must be loaded");
assert.ok(html.indexOf("css/pages/charts.css") > html.indexOf("css/pages/schedule.css"), "page-owned chart styles must load after shared and earlier page styles");
const chartsHref = versionedAssetHref("href", "css/pages/charts.css");
assert.ok(chartsHref && serviceWorker.includes(`"./${chartsHref}"`), "the service worker must precache the current chart stylesheet version");
assert.match(chartsCss, /\.chart-plot-shell/, "charts.css must own the curve plot shell");
assert.match(chartsCss, /\.node-sticker-series-tab/, "charts.css must own the per-series node sticker picker");
assert.doesNotMatch(chartsCss, /!important/, "page-owned chart styles should not depend on !important");
assert.doesNotMatch(
  legacyChartsCss,
  /(?:#charts(?:Section|TrackStart)\b|#chart(?:Dialog|Form)\b|#node(?:Dialog|Form)\b|\.(?:charts-(?:section|grid)|chart(?:\b|-)|empty-(?:state|visual|dot)\b|selected-node\b|latest-note\b|series-(?:editor|number|remove|axis|color|legend)\b|node-(?:series|sticker|hit)\b|point-(?:halo|core|sticker)\b|preset-row\b|sticker-(?:section|title)\b))/i,
  "legacy stylesheets must not retain chart-page selectors",
);
assert.match(html, /href="css\/pages\/personal\.css\?v=\d+"/, "the personal page stylesheet must be loaded");
assert.ok(html.indexOf("css/pages/personal.css") > html.indexOf("css/pages/charts.css"), "page-owned personal styles must load after the other page styles");
const personalHref = versionedAssetHref("href", "css/pages/personal.css");
assert.ok(personalHref && serviceWorker.includes(`"./${personalHref}"`), "the service worker must precache the current personal stylesheet version");
assert.match(personalCss, /\.profile-dock/, "personal.css must own the profile card");
assert.match(personalCss, /#avatarDialog/, "personal.css must own avatar-dialog details");
assert.match(personalCss, /\.data-vault/, "personal.css must own local backup actions");
assert.match(personalCss, /\.data-vault-actions button\s*\{[\s\S]*?width:\s*112px;[\s\S]*?min-width:\s*112px;/, "desktop data-vault actions must use matching button widths");
assert.match(personalCss, /\.data-vault-actions button\s*\{[\s\S]*?font-size:\s*14px;[\s\S]*?font-weight:\s*850;/, "desktop data-vault actions must share one typography rule");
assert.match(personalCss, /#footerExportButton\s*\{[\s\S]*?background:var\(--member-eileen\)/, "backup must remain the primary Eileen data action");
assert.match(personalCss, /#footerImportButton\s*\{[\s\S]*?color:#675aa6;[\s\S]*?background:#f3f0ff;/, "recovery must use a distinct restrained violet secondary treatment");
assert.match(personalCss, /#footerResetDataButton\s*\{[\s\S]*?color:#bf4056;[\s\S]*?background:#fff1f3;/, "record clearing must use an explicit danger treatment");
assert.match(html, /class="personal-device-note"[^>]*>\s*<strong>Asoul 一个魂生活日记<\/strong>\s*<small>作者：就一枝匠纸 · AI 生成<\/small>/, "the compact personal signature must stay concise without a third explanatory line");
assert.match(personalCss, /body\.is-mobile-app \.personal-device-note\s*\{[\s\S]*?display:grid;/, "the local-data note must appear in the compact personal view");
assert.match(mobileAppCss, /body\.is-mobile-app \.header-tools>#exportButton\{ color:#576690 !important; \}[\s\S]*?body\.is-mobile-app \.header-tools>#importButton\{ color:#675aa6 !important; \}/, "mobile backup and recovery must preserve their blue-primary and violet-secondary hierarchy");
assert.match(responsivePlatformCss, /\.header-data-action--backup\{ color:var\(--member-eileen\); \}\s*\.header-data-action--restore\{ color:#675aa6; \}/, "desktop backup and recovery must preserve the same hierarchy as mobile");
assert.match(personalCss, /\.avatar-button img\[hidden\][\s\S]*?display:\s*none/, "the avatar placeholder and sticker must never render on top of each other");
assert.doesNotMatch(personalCss, /!important/, "page-owned personal styles should not depend on !important");
assert.doesNotMatch(
  legacyPersonalCss,
  /(?:#(?:personalSectionStart|dataVaultStart)\b|\.(?:personal-(?:section|section-head|preferences|preference-copy|preference-icon)\b|profile-(?:card|intro|form-wrap|dock|identity|tag|form)\b|avatar-(?:button|placeholder|edit|editor|dialog-copy)\b|autosave-status\b|preference-switch\b|data-vault(?:\b|-)))/i,
  "legacy stylesheets must not retain personal-page selectors",
);
assert.match(app, /data-series-axis-min/, "each curve must expose an optional y-axis minimum");
assert.match(app, /data-series-axis-max/, "each curve must expose an optional y-axis maximum");
assert.match(chartsCss, /grid-template-columns:31px minmax\(0,1fr\) minmax\(220px,\.72fr\) 34px;/, "desktop curve colour fields must be wide enough for complete supporter-colour names");
assert.match(chartDomain, /customMin \?\? automaticMin/, "curve rendering must respect custom y-axis bounds");
assert.match(chartRenderer, /getChartSeriesGeometry\(chart,/, "the chart renderer must use the shared geometry boundary");

assert.equal(longTermDemo.version, 9, "the long-term demo backup should remain a migration test for version 9");
assert.equal(longTermDemo.goals.length, 4, "long-term demo data must exercise every countdown layout slot");
assert.equal(longTermDemo.progressGoals.length, 4, "long-term demo data must contain several progress goals");
assert.ok(longTermDemo.progressGoals.every((goal) => goal.sticker && Array.isArray(goal.spaceIds) && goal.updates.length), "long-term demo progress goals must include stickers, report spaces, and updates");
assert.ok(longTermDemo.weeks.every((week) => week.days.every((day) => day.recorded === true && day.sticker)), "long-term demo days must be recorded and carry stickers");
assert.ok(longTermDemo.charts.some((chart) => chart.series.length > 1), "long-term demo data must include a multi-series curve chart");
assert.ok(longTermDemo.charts.every((chart) => chart.nodes.every((node) => Object.keys(node.stickers || {}).length)), "every long-term demo curve node must carry a sticker");
const longTermDemoStickerRefs = JSON.stringify(longTermDemo).match(/images\/[^"'`\r\n]+?\.(?:png|jpe?g|gif|webp)/gi) || [];
const missingLongTermDemoStickers = [...new Set(longTermDemoStickerRefs)].filter((reference) => !fs.existsSync(path.join(projectRoot, ...reference.split("/"))));
assert.deepEqual(missingLongTermDemoStickers, [], `long-term demo data references missing stickers: ${missingLongTermDemoStickers.join(", ")}`);

const weekActionOrder = [
  "importWeekButton",
  "showSelectedWeekReportButton",
  "addWeekButton",
  "deleteSelectedPeriodButton",
  "clearSelectedWeekButton",
  "clearSelectedDayButton",
  "shiftWeekButton",
];
for (let index = 1; index < weekActionOrder.length; index += 1) {
  assert.ok(html.indexOf(`id="${weekActionOrder[index - 1]}"`) < html.indexOf(`id="${weekActionOrder[index]}"`), "weekly action buttons are out of order");
}

console.log(`project integrity: ok (${imageRefs.length} image references, ${ids.length} unique ids)`);
