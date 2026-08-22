# Asoul 一个魂生活日记

这是一个本地优先、无需后端的静态生活记录应用。Windows 用户可双击 `Asoul一个魂健康日记.cmd` 启动，也可以把整个目录部署到静态网站。

## 从哪里开始

- 使用方法：`docs/使用说明.md`
- 视觉规范：`docs/设计系统.md`
- JavaScript 架构、数据流与旧备份策略：`docs/JavaScript重构计划.md`

## 目录地图

```text
js/
  app.js           页面控制与跨领域编排
  core/            配置、迁移、归一化、存储和备份
  domain/          目标、日程与曲线的纯业务计算
  ui/              可复用页面交互
  content/         表情清单与冷笑话等静态内容

css/
  design-system.css  全站设计变量和基础控件
  pages/             首页、目标、日程、曲线和个人页
  platform/          手机应用壳和跨尺寸适配
  legacy/            仍在迁移期使用的共享旧样式

tests/             Node 自动测试与项目完整性检查
示例数据/          可以通过“恢复”导入的演示备份
图片/、icons/      页面图片、表情和 PWA 图标
docs/              使用、设计与架构文档
```

`index.html`、`sw.js`、`manifest.webmanifest` 和本地启动器保留在根目录；`sw.js` 必须位于这里才能控制整个应用。表情图片路径会进入用户数据和备份，因此不要随意移动 `图片/`。

## 示例数据

- `示例数据/考研加健身用户示例.json`：日常功能演示。
- `示例数据/全功能测试数据.json`：覆盖主要功能与多种卡片状态。
- `示例数据/长期用户300节点示例.json`：连续 300 天单曲线，以及约两年半、三曲线 300 个节点（共 900 组指标表情）的长期压力测试。

## 验证

修改代码后运行：

```powershell
node --test tests/app-utils.test.js tests/backup-codec.test.js tests/chart-domain.test.js tests/data-model.test.js tests/milestone-domain.test.js tests/project-integrity.test.js tests/schedule-domain.test.js tests/snap-carousel.test.js tests/state-normalizer.test.js tests/state-store.test.js
```

目录或静态资源发生变化时，还必须同步更新 `index.html`、`sw.js` 和 `tests/project-integrity.test.js`。
