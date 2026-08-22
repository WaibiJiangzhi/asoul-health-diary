# JavaScript 架构与重构记录

## 当前结论

本轮重构没有改用框架，也没有为了形式把每个功能拆成一个文件。项目仍是可直接由本地启动器、普通静态网页和 PWA 加载的经典脚本应用，但数据迁移、归一化、持久化、业务纯逻辑和 DOM 控制已经有明确边界。

迁移开始时 `js/app.js` 约 4730 行，应用启动、配置、数据修复、本地存储、页面渲染、弹窗、图片导出和 PWA 全在一个闭包中。当前 `js/app.js` 约 3070 行，仍是唯一的页面控制器；共享 Canvas 原语、周报绘制以及曲线的屏幕 SVG/下载 PNG 渲染已经移出。被移出的代码都拥有独立职责和测试，不存在“只是换了文件名”的循环依赖。

当前 PWA 缓存版本为 `asoul-life-v133-0938`。

## 加载顺序与依赖

`index.html` 按以下顺序加载脚本：

1. `js/core/data-model.js`：版本迁移。
2. `js/core/app-utils.js`：日期、数值、文本与格式化纯函数。
3. `js/core/backup-codec.js`：备份包生成、解析和外层校验。
4. `js/domain/milestone-domain.js`、`js/domain/chart-domain.js`、`js/domain/schedule-domain.js`：目标、曲线和日程的无 DOM 业务计算；曲线模块统一计算数值几何、日期抽样和按节点密度生成的动态缩放阶梯。
5. `js/ui/snap-carousel.js`：手机横向卡片吸附后的选择同步。
6. `js/ui/canvas-utils.js`：周报与曲线图片共用的画布下载、图标、卡片、文本和圆角绘制原语。
7. `js/ui/weekly-report-renderer.js`：通过显式注入的格式化、业务和视觉依赖生成竖版完整周报与横版摘要。
8. `js/ui/chart-renderer.js`：用同一份领域几何生成曲线屏幕 SVG 与下载 PNG，并处理轴线、节点抽样和表情布局。
9. `js/content/stickers.js`、`js/content/冷笑话.js`：静态内容资源。
10. `js/core/app-config.js`：存储键、限制、模板、默认状态和快速示例。
11. `js/core/state-normalizer.js`：把迁移后的候选数据整理为当前运行时结构。
12. `js/core/state-store.js`：本地读取、保存保护、延迟保存、冲刷和清空生命周期。
13. `js/app.js`：组合以上模块，负责 DOM、事件、弹窗、页面渲染、曲线选择与缩放状态、下载触发、导航和 PWA 外壳。

依赖由 `js/app.js` 组合。领域模块不读取 DOM、不访问本地存储，也不反向调用入口；周报渲染器不读取全局 `state`，而由入口在用户点击下载时显式传入当前周与目标集合；曲线渲染器同样不读取入口的选择和缩放变量，当前缩放层级与选中节点都通过参数传入。

## 数据流

### 启动

`localStorage 原始文本 → js/core/state-store.js → JSON 解析 → js/core/state-normalizer.js → js/core/data-model.js 迁移 → 当前 state → js/app.js 渲染`

如果原始数据损坏或来自未来版本，`state-store` 会返回一份隔离的默认状态用于显示，同时锁住自动保存，避免空白状态覆盖仍在浏览器里的原始数据。只有恢复有效备份或用户明确清空记录才解除保护。

### 页面编辑

`用户操作 → js/app.js 修改当前 state → persistState → js/core/state-store.js 立即或延迟保存 → 只刷新受影响视图`

跨页面的空间变更统一走 `persistSpaceChange`，由一个入口协调目标、空间、日程和曲线，避免各页面各自补渲染。

### 备份恢复

`JSON 文件 → backup-codec 外层校验 → state-normalizer/data-model 迁移与整理 → 用户确认 → 替换 state → state-store 保存 → 全视图刷新`

导出方向相反，但只导出用户状态。冷笑话是随应用发布的静态内容，不再写入本地存储，也不进入新备份；旧文件中即使仍有 `jokes` 字段也会被安全忽略。

## 旧数据策略

- 保留真实发布过的 `本地备份文件/Asoul健康日记-备份-2026-08-19.json` 作为 v4 回归样本。
- 自动测试确认该文件可以迁移到当前 v10，并保留个人资料、两周记录和五张曲线图。
- v4 里的旧健康日记映射为 `health` 空间；旧日期和日记录按现有迁移规则整理。
- 只兼容真实发布过或仓库示例实际使用过的结构，不为从未发布的实验字段继续增加分支。
- 静态冷笑话不属于用户数据；旧备份中的 52 条冷笑话不会恢复为可编辑数据。

## 模块职责

| 文件 | 负责 | 不负责 |
| --- | --- | --- |
| `js/core/data-model.js` | 按版本逐级迁移 | DOM、存储、视觉默认值 |
| `js/core/state-normalizer.js` | 类型、ID、空间关联、周数据和颜色归一化 | 读取或写入浏览器 |
| `js/core/state-store.js` | 本地存取及保存保护 | 理解目标、日程或曲线业务 |
| `js/core/app-config.js` | 不随运行变化的配置和默认内容 | 修改用户状态 |
| `js/core/backup-codec.js` | 备份容器格式 | 修复内部业务字段 |
| `js/domain/*-domain.js` | 可单测的领域计算，包括保留卡片身份的日卡/周卡内容重置 | 页面节点和弹窗 |
| `js/ui/snap-carousel.js` | 卡片停稳后的中心项选择 | 决定业务上选择哪个空间或目标 |
| `js/ui/canvas-utils.js` | 图片下载与通用画布绘图原语 | 读取业务状态、决定周报布局 |
| `js/ui/weekly-report-renderer.js` | 竖版和横版周报布局与绘制 | 读取全局状态、绑定下载按钮 |
| `js/ui/chart-renderer.js` | 曲线 SVG、PNG、坐标轴、节点抽样和表情布局 | 保存缩放状态、绑定节点事件、修改曲线数据 |
| `js/app.js` | 页面控制与跨模块编排 | 重复定义迁移、归一化或存储规则 |

## 以后增加功能怎么放

1. 先判断它是数据、纯计算、页面表现还是浏览器生命周期。
2. 新字段先进入 `js/core/data-model.js` 的版本迁移，再进入 `js/core/state-normalizer.js` 的当前结构校验。
3. 可脱离页面输入输出的计算放入对应领域模块并先写测试。
4. 页面 DOM 与弹窗继续由 `js/app.js` 编排；只有一个领域形成稳定、低耦合接口后才单独抽控制器。
5. 静态内容放配置或资源文件，不能混入用户备份。
6. 新脚本必须同步 `index.html`、`sw.js` 和完整性测试，避免线上仍运行旧缓存。

周报画布和曲线渲染已经按完整边界迁移。下一批不应马上继续按行数拆文件，而应先盘点 `app.js` 内目标、日程、曲线和个人页的事件入口及跨页面刷新关系。只有当某一页可以形成“输入状态与依赖、输出用户意图”的稳定控制器接口时，再整块迁移；不能把大量 DOM 与状态回调伪装成模块参数，也不能为了文件变短制造循环依赖。

## 验证护栏

- 纯逻辑模块各有 Node 测试；周报和曲线渲染器另有无浏览器 Canvas/SVG 契约测试。
- 真实 v4 备份、v8 示例、当前 v10、损坏 JSON 和未来版本均有迁移或拒绝测试。
- 完整性测试检查脚本加载顺序、Service Worker 缓存、HTML ID、静态资源、模块消费关系和主入口未引用函数。
- 每次结构调整后运行全部测试、`node --check`、`git diff --check`，再检查桌面和手机关键流程。

## 明天建议阅读顺序

先读 `index.html` 最后的脚本顺序，再读 `js/core/app-config.js` 和 `js/core/data-model.js`；随后看 `js/core/state-normalizer.js`、`js/core/state-store.js` 理解数据如何进入运行态；再看 `js/domain/` 及测试；最后从 `js/app.js` 的 `init → bindEvents → render/persist` 主线进入具体页面。这样比从 `js/app.js` 第一行一路读到最后更容易建立整体地图。
