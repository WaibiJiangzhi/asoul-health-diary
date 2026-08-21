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
const serviceWorker = read("sw.js");
const appUtils = read("app-utils.js");
const backupCodec = read("backup-codec.js");
const milestoneDomain = read("milestone-domain.js");
const chartDomain = read("chart-domain.js");
const scheduleDomain = read("schedule-domain.js");
const designSystemCss = read("design-system.css");
const homeCss = read("home.css");
const goalsCss = read("goals.css");
const scheduleCss = read("schedule.css");
const chartsCss = read("charts.css");
const personalCss = read("personal.css");
const mobileAppCss = read("mobile-app.css");
const responsivePlatformCss = read("responsive-platform.css");
const weeklyCss = read("weekly-polish.css");
const legacyResponsiveCss = [
  weeklyCss,
  read("complete-polish.css"),
  read("mobile-app.css"),
  read("responsive-platform.css")
].join("\n");
const legacyScheduleCss = [
  read("styles.css"),
  legacyResponsiveCss,
].join("\n");
const legacyChartsCss = [
  read("styles.css"),
  legacyResponsiveCss,
].join("\n");
const legacyPersonalCss = [
  read("styles.css"),
  legacyResponsiveCss,
].join("\n");
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
  "shiftWeekButton",
  "copyPreviousWeekButton",
  "aiPreviousWeekSummary",
  "installAppButton",
  "updateAppButton",
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
assert.match(html, /href="icons\/1\.png(?:\?v=\d+)?"/, "current app icon must be linked with an optional cache version");
assert.ok(fs.existsSync(path.join(projectRoot, "icons", "1.png")), "missing current yigehun icon master");
assert.match(html, /rel="manifest" href="manifest\.webmanifest(?:\?[^\"]+)?"/, "PWA manifest must be linked");
assert.match(html, /src="app-utils\.js\?v=\d+"/, "shared app utilities must be loaded");
assert.ok(html.indexOf("app-utils.js") < html.indexOf("app.js"), "shared app utilities must load before the application entry");
const appUtilsHref = html.match(/src="(app-utils\.js\?v=\d+)"/)?.[1] || "";
assert.ok(appUtilsHref && serviceWorker.includes(`"./${appUtilsHref}"`), "the service worker must precache the current app utility version");
assert.match(appUtils, /ASOUL_APP_UTILS/, "the utility file must expose its explicit boundary");
assert.match(app, /const APP_UTILS = globalThis\.ASOUL_APP_UTILS/, "app.js must consume the shared utility boundary");
const utilityExports = appUtils.match(/ASOUL_APP_UTILS\s*=\s*Object\.freeze\(\{([\s\S]*?)\}\);/)?.[1]
  .split(",")
  .map((name) => name.trim())
  .filter(Boolean) || [];
const utilityImports = new Set((app.match(/const\s*\{([\s\S]*?)\}\s*=\s*APP_UTILS;/)?.[1] || "")
  .split(",")
  .map((name) => name.trim())
  .filter(Boolean));
assert.deepEqual(
  utilityExports.filter((name) => !utilityImports.has(name)),
  [],
  "every exported app utility must be wired into app.js"
);
assert.match(html, /src="backup-codec\.js\?v=\d+"/, "the backup codec must be loaded");
assert.ok(html.indexOf("backup-codec.js") < html.indexOf("app.js"), "the backup codec must load before the application entry");
const backupCodecHref = html.match(/src="(backup-codec\.js\?v=\d+)"/)?.[1] || "";
assert.ok(backupCodecHref && serviceWorker.includes(`"./${backupCodecHref}"`), "the service worker must precache the current backup codec version");
assert.match(backupCodec, /ASOUL_BACKUP_CODEC/, "the backup codec must expose its explicit boundary");
assert.match(app, /const BACKUP_CODEC = globalThis\.ASOUL_BACKUP_CODEC/, "app.js must consume the backup codec boundary");
assert.match(app, /createDiaryBackupPayload\(state, coldJokes, new Date\(\)\.toISOString\(\)\)/, "backup export must use the shared codec");
assert.match(app, /parseDiaryBackup\(await file\.text\(\)\)/, "backup import must use the shared codec");
assert.doesNotMatch(app, /function isDiaryBackupPayload\(/, "backup validation must not be duplicated in app.js");
for (const [filename, globalName, moduleSource] of [
  ["milestone-domain.js", "ASOUL_MILESTONE_DOMAIN", milestoneDomain],
  ["chart-domain.js", "ASOUL_CHART_DOMAIN", chartDomain],
  ["schedule-domain.js", "ASOUL_SCHEDULE_DOMAIN", scheduleDomain],
]) {
  const href = html.match(new RegExp(`src="(${filename.replace(".", "\\.")}\\?v=\\d+)"`))?.[1] || "";
  assert.ok(href, `${filename} must be loaded`);
  assert.ok(html.indexOf(filename) < html.indexOf("app.js"), `${filename} must load before app.js`);
  assert.ok(serviceWorker.includes(`"./${href}"`), `the service worker must precache ${filename}`);
  assert.match(moduleSource, new RegExp(globalName), `${filename} must expose ${globalName}`);
  assert.match(app, new RegExp(`globalThis\\.${globalName}`), `app.js must consume ${globalName}`);
}
const appHref = html.match(/src="(app\.js\?v=\d+)"/)?.[1] || "";
assert.ok(appHref && serviceWorker.includes(`"./${appHref}"`), "the service worker must precache the current app entry");
assert.match(app, /function bindEvents\(\)\s*\{\s*bindMilestoneEvents\(\);[\s\S]*bindDialogShellEvents\(\);\s*\}/, "the event shell must delegate to domain binders");
assert.match(app, /function persistSpaceChange\(/, "space changes must use one cross-view persistence boundary");
assert.match(html, /class="header-tools"[\s\S]*id="installAppButton"/, "PWA installation must be discoverable in the mobile header");
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
assert.doesNotMatch(html, /weekPlanTextDialog|copyWeekPlanTextButton|exportSelectedWeekButton/, "legacy weekly-note UI must be removed");
assert.doesNotMatch(app, /【备注】/, "AI plan format must not ask AI to write daily notes");
assert.doesNotMatch(app, /day\.note\s*=\s*plannedDay\.note/, "AI import must preserve daily notes");
assert.match(app, /selectedDayByWeek\.get\(week\.id\)/, "schedule shift must start from the selected day");
assert.match(scheduleDomain, /index\s*>\s*startIndex/, "schedule shift must preserve days before the selected day");
assert.match(app, /if \(!\$\("#spaceIconPicker"\)\.open\)/, "collapsed space sticker picker must avoid rendering sticker images");
assert.match(app, /function renderGoals\(/, "global goals must be rendered independently of spaces");
assert.match(app, /renderWeeklyReportGoals/, "weekly reports must include goal countdowns");
assert.match(app, /function renderGoalStickerPicker\(/, "countdowns must support optional stickers");
assert.match(app, /function renderGoalSpaceOptions\(/, "countdowns must allow selecting report spaces");
assert.match(app, /goal\.spaceIds\.includes\(spaceId\)/, "weekly reports must filter countdowns by space");
assert.match(app, /new Set\(Array\.isArray\(selectedSpaceIds\) \? selectedSpaceIds : \[\]\)/, "countdowns must allow no report space");
assert.doesNotMatch(app, /请至少选择一个要显示周报的空间/, "countdown space selection must be optional");
assert.match(app, /const source = Array\.isArray\(candidate\) \? candidate : DEFAULT_SPACES/, "an explicitly empty space list must stay empty");
assert.doesNotMatch(app, /至少要保留一个空间/, "all spaces must be removable");
assert.doesNotMatch(app, /data-edit-goal/, "countdown cards must not contain their own edit buttons");
assert.match(app, /week-node-progress/, "week cards must show recorded-day progress");
assert.match(app, /function pickRelevantWeek\(/, "week navigation must prefer the current or nearest week");
assert.match(scheduleDomain, /day\?\.recorded === true/, "recorded-day count must use the explicit day setting");
assert.match(app, /data-record-today/, "single-day editor must expose the recorded-day switch");
assert.match(app, /记录今天|今天已记录/, "recorded-day control must live with daily completion settings");
assert.doesNotMatch(html, /计入周记录/, "legacy recorded-day wording must be removed");
assert.match(app, /weekStickerDialog\.close\(\);\s*persistState\(\["schedule"\]\)/, "saving daily settings must persist and refresh the week timeline immediately");
assert.match(app, /WEEK_ITEM_STATES = new Set\(\["", "done", "changed", "missed"\]\)/, "weekly items must support done, changed, and missed states");
assert.match(app, /\["changed", "⚡", "调整"\]/, "weekly items must expose the lightning changed-plan state");
assert.match(app, /data-record-today/, "the day editor must expose a direct record-today action");
assert.match(app, /day\.items = plannedDay\.items\.map/, "AI import must use the unified weekly item model");
assert.doesNotMatch(app, /data-pair-field=|data-set-pair-done|完成与记录/, "the legacy two-column plan/actual editor must be removed");
assert.doesNotMatch(html, /目标独立于空间保存|背单词、读书或工作项目|用模板或从空白开始|曲线图日记/, "redundant section explanations must be removed");
assert.match(html, /class="personal-preferences"[\s\S]*id="weekSoundToggle"[^>]*aria-pressed="true"/, "sound preference must live in the personal view and default on");
assert.match(html, /id="footerResetDataButton"/, "mobile personal view must provide record clearing without the header");
assert.match(scheduleCss, /week-node-head/, "week overview cards must be styled");
assert.doesNotMatch(scheduleCss, /week-node-dot/, "legacy circular week nodes must be removed");
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
assert.equal((html.match(/data-theme-color-field/g) || []).length, 3, "countdowns, progress goals, and spaces must share the theme-colour control");
assert.match(app, /function safeCardColor\(/, "card colours must pass through one allow-list boundary");
assert.match(app, /function getCardColor\(/, "automatic and explicit card colours must share one resolver");
assert.match(app, /color:\s*safeCardColor\(item\?\.color\)/, "spaces must normalize their optional colour");
assert.ok((app.match(/color:\s*safeCardColor\(goal\.color\)/g) || []).length >= 2, "both milestone types must normalize their optional colour");
assert.match(app, /--goal-color:\$\{escapeAttr\(getCardColor\(goal, index\)\)\}/, "countdown cards must use the resolved colour");
assert.match(app, /--progress-color:\$\{escapeAttr\(getCardColor\(goal, index\)\)\}/, "progress cards must use the resolved colour");
assert.match(app, /--space-color:\$\{escapeAttr\(color\)\}/, "space cards must use the resolved colour");
assert.match(scheduleCss, /\.space-switcher-button::before\{[\s\S]*?background:\s*var\(--space-color\)/, "every space card must expose its colour even when inactive");
assert.match(app, /const tone = getCardColor\(item\.data, toneIndex\)/, "downloaded milestones must use the same colour as the app");
assert.doesNotMatch(`${html}\n${app}\n${read("使用说明.md")}`, /折线图|折线颜色|每条折线/, "user-facing chart terminology must use 曲线图");
assert.match(app, /formatChartAxisLabel/, "curve charts must format readable date labels");
assert.doesNotMatch(app, /visibleStickerKeys/, "dense curve decoration must not depend on a second sampled data collection");
assert.match(app, /const densityScale = chart\.nodes\.length >= 12/, "dense curve charts must scale their sticker presentation");
assert.match(app, /const desiredStickerSize = \(hasMultipleStickers \? 29 : 44\) \* nodeVisualScale \* densityScale;/, "curve stickers must use the enlarged shared presentation size");
assert.match(app, /nodeSpacing \* \(hasMultipleStickers \? \.68 : \.84\)/, "dense curve stickers must retain enough node-spacing allowance to remain readable");
assert.match(app, /compactChart && pointValues\.length > 1 && chart\.nodes\.length > 8/, "compact multi-series charts must avoid stacking every sticker at one node");
assert.match(app, /const declutterDensePoints = phoneChart && chart\.nodes\.length > 8 && nodeSpacing < 44 \* visualScale/, "phone charts must declutter dense node decoration at overview scale");
assert.match(app, /const stickerPointValues = !declutterDensePoints \|\| showPointMarker \? availableStickerPointValues : \[\]/, "phone chart decluttering must preserve node data while reducing stickers");
assert.match(app, /<g class="chart-point[\s\S]*?data-node-id=[\s\S]*?<rect class="node-hit-area"/, "decluttered chart nodes must retain their full interactive hit areas");
assert.match(app, /function downloadWeeklyReportImage\(/, "weekly reports must support PNG download");
assert.match(app, /canvas\.toDataURL\("image\/png"\)/, "weekly report download must stay inside the user's click gesture");
assert.match(app, /function downloadWeeklySummaryImage\(/, "weekly reports must provide a landscape summary image");
const weeklySummaryCanvasSource = app.slice(
  app.indexOf("function createWeeklySummaryCanvas"),
  app.indexOf("function drawWeeklySummaryBackground"),
);
assert.match(weeklySummaryCanvasSource, /const daysY = milestones\.length > 2 \? 576 : 450;[\s\S]*?const height = daysY \+ 374;/, "landscape weekly exports must derive their height from their content");
assert.doesNotMatch(weeklySummaryCanvasSource, /const height = 1080;/, "landscape weekly exports must not keep a fixed blank canvas height");
assert.match(scheduleCss, /\.weekly-report-goal-list\{ display:grid; grid-template-columns:1fr; gap:7px; \}/, "phone weekly-report milestones must render in one column");
assert.match(scheduleCss, /\.weekly-report-milestone-group \+ \.weekly-report-milestone-group\{[\s\S]*?margin-top:10px/, "phone weekly-report countdowns and progress goals must remain visually separated");
assert.match(app, /const dayCardWidth = \(width - outer \* 2 - gap\) \/ 2;/, "portrait weekly exports must use two daily cards per row");
assert.match(app, /const cardX = outer \+ index % 2 \* \(dayCardWidth \+ gap\);/, "an odd portrait daily card must keep half-row width");
assert.match(app, /if \(day\.note\) \{[\s\S]*?drawCanvasText\(context, day\.note,/, "landscape daily cards must show the actual note when present");
assert.doesNotMatch(app, /把一周摊开看见，也把下一步留给自己。/, "the retired weekly-export slogan must stay removed");
assert.match(scheduleCss, /@media \(min-width:900px\)[\s\S]*?\.space-section-copy\{[\s\S]*?grid-template-areas:"space-eyebrow space-actions" "space-title space-actions"/, "desktop spaces must share the cross-page heading and action grammar");
assert.match(app, /<nav class="week-day-navigation"[\s\S]*?data-week-day-step="-1"[\s\S]*?data-week-day-step="1"/, "day navigation must live inside the selected day editor");
assert.match(app, /class="week-day-heading-group"[\s\S]*?class="week-day-title-edit" title="点击修改当天名称"[\s\S]*?data-day-text-field="title"[\s\S]*?<nav class="week-day-navigation"/, "the desktop day navigator must follow the editable day title directly");
assert.doesNotMatch(`${app}\n${scheduleCss}`, /week-day-stepper/, "the retired floating day stepper must not return");
assert.match(scheduleCss, /@media \(min-width:900px\)[\s\S]*?\.week-timeline-caption\{[\s\S]*?display:flex;[\s\S]*?justify-content:space-between/, "desktop week controls must keep the explanatory copy left and actions right");
assert.match(scheduleCss, /\.week-board\{[\s\S]*?background:transparent;[\s\S]*?box-shadow:none/, "desktop day navigation must not sit inside a full-width empty band");
assert.match(scheduleCss, /\.week-day-navigation\{[\s\S]*?grid-template-columns:36px minmax\(104px,1fr\) 36px/, "day navigation must use the shared compact control geometry");
assert.match(scheduleCss, /grid-template-columns:minmax\(420px,560px\) minmax\(250px,290px\) minmax\(12px,1fr\) 96px;[\s\S]*?grid-template-areas:"heading heading \. sticker" "statuses actions \. sticker" "help help \. sticker"/, "wide day cards must keep navigation and actions beside the day identity instead of pushing them against the sticker");
assert.match(scheduleCss, /\.week-day-sticker-button\{ width:96px; height:96px; align-self:center; justify-self:end; \}/, "the desktop day sticker must stay vertically centred in the complete day header");
assert.match(scheduleCss, /\.week-day-sticker-button\{ background:#fff; \}/, "day sticker frames must use a white canvas for white-background stickers");
assert.match(app, /class="week-day-title-help">点击今日标题可以直接修改哟~<\/small>/, "day cards must explain title editing below the status controls");
assert.match(scheduleCss, /\.week-day-title-edit input:focus\{[\s\S]*?border-bottom-color:/, "editable day titles must retain a restrained focus underline");
assert.doesNotMatch(scheduleCss, /\.week-day-title-edit::after/, "editable day titles must not keep the rejected inline edit label");
assert.match(scheduleCss, /@media \(min-width:640px\) and \(max-width:900px\)[\s\S]*?grid-template-areas:"heading sticker" "statuses statuses" "help help" "actions actions"/, "tablet day cards must keep the navigator beside the editable title");
assert.match(scheduleCss, /\.week-node-actions > button\{ border-style:solid; \}/, "week toolbar buttons must not inherit the browser's two-tone outset border");
assert.match(app, /class="week-item-legend"[\s\S]*?is-done[\s\S]*?is-changed[\s\S]*?is-missed/, "the day editor must expose a readable semantic status legend");
assert.match(app, /function downloadChartImage\(/, "curve charts must support PNG download");
assert.doesNotMatch(app, /曲线图会采用每条曲线自己的纵轴范围/, "downloaded curve images must not include the retired axis explanation");
assert.ok((app.match(/drawCanvasAppIcon\(/g) || []).length >= 4, "every exported image type must use the current app icon");
assert.ok((app.match(/const scale = 2;/g) || []).length >= 3, "weekly and curve PNG exports must use 2x canvas resolution");
assert.match(app, /function moveSelectedMilestone\(/, "countdowns and progress goals must be reorderable");
assert.match(html, /class="section-nav"/, "desktop section navigation must exist");
assert.match(html, /class="mobile-bottom-nav"/, "mobile section navigation must exist");
assert.match(html, /data-app-view="home"/, "the mobile home view must exist");
assert.match(app, /function initSectionNavigation\(\)[\s\S]*showMobileView/, "mobile navigation must switch real app views");
assert.doesNotMatch(app, /data-fullscreen-chart|toggleChartFullscreen/, "mobile curve charts should be readable inline without a second fullscreen mode");
assert.ok(fs.existsSync(path.join(projectRoot, "mobile-app.css")), "missing final mobile app stylesheet");
assert.match(html, /href="design-system\.css\?v=\d+"/, "the shared design system must be loaded");
assert.ok(html.indexOf("design-system.css") < html.indexOf("styles.css"), "design tokens must load before page styles");
for (const filename of [
  "design-system.css",
  "styles.css",
  "complete-polish.css",
  "mobile-app.css",
  "responsive-platform.css",
  "home.css",
  "goals.css",
  "schedule.css",
  "charts.css",
  "personal.css",
]) {
  const href = html.match(new RegExp(`href="(${filename.replace(".", "\\.")}\\?v=\\d+)"`))?.[1] || "";
  assert.ok(href && serviceWorker.includes(`"./${href}"`), `the service worker must precache the current ${filename} version`);
}
assert.match(designSystemCss, /--member-diana:\s*#e799b0/i, "the design system must preserve Diana's support colour");
assert.match(designSystemCss, /--member-bella:\s*#db7d74/i, "the design system must preserve Bella's support colour");
assert.match(designSystemCss, /--member-eileen:\s*#576690/i, "the design system must preserve Eileen's support colour");
assert.doesNotMatch(html, /page-glow/, "the retired decorative page glow must not return");
assert.match(homeCss, /\.hero-cast::before\s*\{\s*display:\s*none/, "the character stage must keep the overlapping circular glow disabled");
assert.match(homeCss, /\.hero-copy h1 em\s*\{[\s\S]*?display:\s*inline-block;[\s\S]*?margin-top:\s*\.08em;/, "the second cover-title line must retain a small readable gap from the first line");
assert.match(homeCss, /top:\s*var\(--caption-top,\s*auto\)/, "character captions must use explicit safe-area anchors");
assert.match(homeCss, /\.hero-sticker--bella\s*\{[\s\S]*?--caption-top:\s*78%/, "Bella's desktop caption must stay below her facial features");
assert.match(homeCss, /@media \(max-width:\s*699px\)[\s\S]*?\.hero-sticker--eileen\s*\{[\s\S]*?--caption-bottom:\s*-8px;[\s\S]*?grid-row:\s*8 \/ 12/, "Eileen's phone caption must reserve space below her face");
assert.match(scheduleCss, /\.space-switcher-desktop\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2/, "desktop spaces must use a balanced two-column layout");
assert.match(scheduleCss, /\.week-inline-note textarea\s*\{[\s\S]*?border-radius:/, "daily notes must use the designed textarea instead of browser defaults");
assert.match(chartsCss, /\.chart-action-menu\[open\]\s*>\s*div\s*\{[\s\S]*?position:\s*absolute/, "desktop curve actions must open as a styled popover");
assert.match(chartsCss, /@media \(max-width:\s*699px\)[\s\S]*?\.chart-action-menu\[open\]\s*>\s*div\s*\{[\s\S]*?top:\s*auto;[\s\S]*?width:\s*auto;/, "mobile curve actions must reset the desktop popover geometry");
assert.match(chartsCss, /\.chart-meta\s*>\s*span\s*\{[\s\S]*?min-height:27px;[\s\S]*?border-radius:999px;/, "curve metric and node counts must use readable shared badges");
assert.doesNotMatch(chartsCss, /\.chart-meta span \+ span::before\{[\s\S]*?content:"·"/, "curve metadata must not fall back to the retired tiny dot-separated label");
assert.doesNotMatch(responsivePlatformCss, /Homepage: every character|Tablet \/ narrow window: the same stage/, "retired responsive layout fragments must be removed");
assert.match(responsivePlatformCss, /@media \(max-width:899px\)[\s\S]*?\.section-add-button,[\s\S]*?min-height:34px/, "mobile section actions need one shared touch target");
assert.match(responsivePlatformCss, /@media \(max-width:899px\)\{[\s\S]*?\.site-header,\s*main,\s*footer\{[\s\S]*?width:100%;[\s\S]*?max-width:none;/, "mobile pages must use the full viewport before page cards apply their shared safe gutter");
assert.match(html, /class="section-add-button" id="addChartButton"/, "curve creation must use the same section action component as the other pages");
assert.doesNotMatch(`${mobileAppCss}\n${chartsCss}`, /#addChartButton\s*\{/, "curve creation must not retain a page-specific circular override");
assert.match(responsivePlatformCss, /@media \(min-width:1920px\)[\s\S]*?--page-max-width:1600px/, "ultrawide screens must use the large reading canvas instead of the legacy narrow column");
assert.match(mobileAppCss, /\.dialog-card\s*\{[\s\S]*?overflow-x:\s*hidden\s*!important/, "mobile dialogs must not expose a horizontal scrollbar");
assert.match(html, /href="goals\.css\?v=\d+"/, "the goals page stylesheet must be loaded");
assert.ok(html.indexOf("goals.css") > html.indexOf("responsive-platform.css"), "page-owned goal styles must load after legacy responsive styles");
assert.match(goalsCss, /\.progress-goal-card/, "goals.css must own progress goal cards");
assert.match(goalsCss, /@media \(max-width: 699px\)[\s\S]*?\.goal-card \{[\s\S]*?align-content: center;/, "phone countdown cards must centre their two-row content without stretching a false gap");
assert.match(goalsCss, /grid-template-areas:\s*"date date date"\s*"sticker copy countdown"/, "countdown values must share the content row's visual centre instead of spanning the date row");
assert.match(goalsCss, /\.goal-card-countdown\s*\{[\s\S]*?background:\s*transparent;/, "countdown values must sit directly on the card instead of using a separate white tile");
assert.match(goalsCss, /@media \(max-width: 699px\)[\s\S]*?\.goal-list:not\(\[data-count="1"\]\),[\s\S]*?padding: 4px 13px 8px;/, "phone milestone carousels must reserve room for the selected card outline");
assert.match(goalsCss, /scroll-snap-stop: always;/, "phone milestone cards must settle on a complete card after a swipe");
assert.match(app, /function bindSnapSelection\([\s\S]*?addEventListener\("scrollend", syncSelection[\s\S]*?addEventListener\("pointerup"[\s\S]*?addEventListener\("touchend"/, "phone milestone carousels must synchronize selection after scroll, pointer, and touch completion");
assert.equal((app.match(/bindSnapSelection\(/g) || []).length, 3, "the shared snap-selection helper must bind both countdown and progress carousels");
assert.doesNotMatch(goalsCss, /!important/, "page-owned goal styles should not depend on !important");
assert.doesNotMatch(legacyResponsiveCss, /\.(?:goal-section|goal-list|goal-card|progress-goal|goal-space)(?:\b|-)/, "legacy stylesheets must not retain goal-page selectors");
assert.match(html, /href="schedule\.css\?v=\d+"/, "the schedule page stylesheet must be loaded");
assert.ok(html.indexOf("schedule.css") > html.indexOf("goals.css"), "page-owned schedule styles must load after shared and earlier page styles");
assert.doesNotMatch(html, /weekly-planner\.css/, "the retired schedule stylesheet must not be loaded");
assert.match(scheduleCss, /\.week-inline-day/, "schedule.css must own day cards");
assert.doesNotMatch(scheduleCss, /!important/, "page-owned schedule styles should not depend on !important");
assert.doesNotMatch(
  legacyScheduleCss,
  /\.(?:space-(?:section|switcher|template)|week|weekly|ai)(?:\b|-)|#(?:spaceForm|spaceSectionStart|weeklySection|weeklyTrackStart)\b/,
  "legacy stylesheets must not retain schedule-page selectors",
);
assert.match(html, /href="charts\.css\?v=\d+"/, "the charts page stylesheet must be loaded");
assert.ok(html.indexOf("charts.css") > html.indexOf("schedule.css"), "page-owned chart styles must load after shared and earlier page styles");
const chartsHref = html.match(/href="(charts\.css\?v=\d+)"/)?.[1] || "";
assert.ok(chartsHref && serviceWorker.includes(`"./${chartsHref}"`), "the service worker must precache the current chart stylesheet version");
assert.match(chartsCss, /\.chart-plot-shell/, "charts.css must own the curve plot shell");
assert.match(chartsCss, /\.node-sticker-series-tab/, "charts.css must own the per-series node sticker picker");
assert.doesNotMatch(chartsCss, /!important/, "page-owned chart styles should not depend on !important");
assert.doesNotMatch(
  legacyChartsCss,
  /(?:#charts(?:Section|TrackStart)\b|#chart(?:Dialog|Form)\b|#node(?:Dialog|Form)\b|\.(?:charts-(?:section|grid)|chart(?:\b|-)|empty-(?:state|visual|dot)\b|selected-node\b|latest-note\b|series-(?:editor|number|remove|axis|color|legend)\b|node-(?:series|sticker|hit)\b|point-(?:halo|core|sticker)\b|preset-row\b|sticker-(?:section|title)\b))/i,
  "legacy stylesheets must not retain chart-page selectors",
);
assert.match(html, /href="personal\.css\?v=\d+"/, "the personal page stylesheet must be loaded");
assert.ok(html.indexOf("personal.css") > html.indexOf("charts.css"), "page-owned personal styles must load after the other page styles");
const personalHref = html.match(/href="(personal\.css\?v=\d+)"/)?.[1] || "";
assert.ok(personalHref && serviceWorker.includes(`"./${personalHref}"`), "the service worker must precache the current personal stylesheet version");
assert.match(personalCss, /\.profile-dock/, "personal.css must own the profile card");
assert.match(personalCss, /#avatarDialog/, "personal.css must own avatar-dialog details");
assert.match(personalCss, /\.data-vault/, "personal.css must own local backup actions");
assert.match(personalCss, /\.data-vault-actions button\s*\{[\s\S]*?width:\s*112px;[\s\S]*?min-width:\s*112px;/, "desktop data-vault actions must use matching button widths");
assert.match(personalCss, /\.data-vault-actions button\s*\{[\s\S]*?font-size:\s*14px;[\s\S]*?font-weight:\s*850;/, "desktop data-vault actions must share one typography rule");
assert.match(personalCss, /\.avatar-button img\[hidden\][\s\S]*?display:\s*none/, "the avatar placeholder and sticker must never render on top of each other");
assert.doesNotMatch(personalCss, /!important/, "page-owned personal styles should not depend on !important");
assert.doesNotMatch(
  legacyPersonalCss,
  /(?:#(?:personalSectionStart|dataVaultStart)\b|\.(?:personal-(?:section|section-head|preferences|preference-copy|preference-icon)\b|profile-(?:card|intro|form-wrap|dock|identity|tag|form)\b|avatar-(?:button|placeholder|edit|editor|dialog-copy)\b|autosave-status\b|preference-switch\b|data-vault(?:\b|-)))/i,
  "legacy stylesheets must not retain personal-page selectors",
);
assert.match(app, /data-series-axis-min/, "each curve must expose an optional y-axis minimum");
assert.match(app, /data-series-axis-max/, "each curve must expose an optional y-axis maximum");
assert.match(chartDomain, /customMin \?\? automaticMin/, "curve rendering must respect custom y-axis bounds");
assert.match(app, /getChartSeriesGeometry\(chart,/, "the chart UI must use the shared geometry boundary");

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
  "showSelectedWeekReportButton",
  "addWeekButton",
  "deleteSelectedPeriodButton",
  "shiftWeekButton",
];
for (let index = 1; index < weekActionOrder.length; index += 1) {
  assert.ok(html.indexOf(`id="${weekActionOrder[index - 1]}"`) < html.indexOf(`id="${weekActionOrder[index]}"`), "weekly action buttons are out of order");
}

console.log(`project integrity: ok (${imageRefs.length} image references, ${ids.length} unique ids)`);
