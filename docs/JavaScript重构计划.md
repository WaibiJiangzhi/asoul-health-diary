# JavaScript 架构与重构记录

## 当前结论

本轮重构没有改用框架，也没有为了形式把每个功能拆成一个文件。项目仍是可直接由本地启动器、普通静态网页和 PWA 加载的经典脚本应用，但数据迁移、归一化、持久化、业务纯逻辑和 DOM 控制已经有明确边界。

迁移开始时 `js/app.js` 约 4730 行，应用启动、配置、数据修复、本地存储、页面渲染、弹窗、图片导出和 PWA 全在一个闭包中。当前 `js/app.js` 约 3850 行，仍是唯一的页面控制器；被移出的代码都拥有独立职责和测试，不存在“只是换了文件名”的循环依赖。

当前 PWA 缓存版本为 `asoul-life-v120-0925`。

## 加载顺序与依赖

`index.html` 按以下顺序加载脚本：

1. `js/core/data-model.js`：版本迁移。
2. `js/core/app-utils.js`：日期、数值、文本与格式化纯函数。
3. `js/core/backup-codec.js`：备份包生成、解析和外层校验。
4. `js/domain/milestone-domain.js`、`js/domain/chart-domain.js`、`js/domain/schedule-domain.js`：目标、曲线和日程的无 DOM 业务计算；曲线模块统一计算数值几何、日期抽样和按节点密度生成的动态缩放阶梯。
5. `js/ui/snap-carousel.js`：手机横向卡片吸附后的选择同步。
6. `js/content/stickers.js`、`js/content/冷笑话.js`：静态内容资源。
7. `js/core/app-config.js`：存储键、限制、模板、默认状态和快速示例。
8. `js/core/state-normalizer.js`：把迁移后的候选数据整理为当前运行时结构。
9. `js/core/state-store.js`：本地读取、保存保护、延迟保存、冲刷和清空生命周期。
10. `js/app.js`：组合以上模块，负责 DOM、事件、弹窗、页面渲染、画布导出、导航与 PWA 外壳。

依赖只朝 `js/app.js` 汇聚。领域模块不读取 DOM、不访问本地存储，也不反向调用入口。

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
| `js/domain/*-domain.js` | 可单测的领域计算 | 页面节点和弹窗 |
| `js/ui/snap-carousel.js` | 卡片停稳后的中心项选择 | 决定业务上选择哪个空间或目标 |
| `js/app.js` | 页面控制与跨模块编排 | 重复定义迁移、归一化或存储规则 |

## 以后增加功能怎么放

1. 先判断它是数据、纯计算、页面表现还是浏览器生命周期。
2. 新字段先进入 `js/core/data-model.js` 的版本迁移，再进入 `js/core/state-normalizer.js` 的当前结构校验。
3. 可脱离页面输入输出的计算放入对应领域模块并先写测试。
4. 页面 DOM 与弹窗继续由 `js/app.js` 编排；只有一个领域形成稳定、低耦合接口后才单独抽控制器。
5. 静态内容放配置或资源文件，不能混入用户备份。
6. 新脚本必须同步 `index.html`、`sw.js` 和完整性测试，避免线上仍运行旧缓存。

下一批如果继续压缩 `js/app.js`，优先候选是“周报画布导出”和“曲线 SVG/画布渲染”。这两块体积大但当前内部逻辑已分层；应在建立渲染上下文接口和截图回归后整体迁移，不能只搬一半导致依赖参数到处传递。

## 验证护栏

- 纯逻辑模块各有 Node 测试。
- 真实 v4 备份、v8 示例、当前 v10、损坏 JSON 和未来版本均有迁移或拒绝测试。
- 完整性测试检查脚本加载顺序、Service Worker 缓存、HTML ID、静态资源、模块消费关系和主入口未引用函数。
- 每次结构调整后运行全部测试、`node --check`、`git diff --check`，再检查桌面和手机关键流程。

## 明天建议阅读顺序

先读 `index.html` 最后的脚本顺序，再读 `js/core/app-config.js` 和 `js/core/data-model.js`；随后看 `js/core/state-normalizer.js`、`js/core/state-store.js` 理解数据如何进入运行态；再看 `js/domain/` 及测试；最后从 `js/app.js` 的 `init → bindEvents → render/persist` 主线进入具体页面。这样比从 `js/app.js` 第一行一路读到最后更容易建立整体地图。
