# 刘俊威的个人网站

A small, responsive Chinese-language personal homepage built with plain HTML, CSS, and JavaScript.

## Run locally

Serve this directory with a static HTTP server, for example `python3 -m http.server 4191`.

## Deploy with GitHub Pages

Push the repository to GitHub, then open **Settings → Pages** and select **Deploy from a branch**, `main`, and `/ (root)`.

## 创作工具箱

`tools.html` 是六个小工具的统一入口，`tool-catalog.js` 维护公开介绍和访问地址。首页共用同一份目录，旧 `workbench.html` 跳转到新工作台。

- 在线嵌入：科普工作台、动效镜头库、取景（真实 AI 点评仍需本机助手）。
- 拾片：嵌入线上预览，提供 Mac 下载与本机入口。
- 剪辑助手、声样：只提供本机工具入口，不在公共网页中连接本机 API。
- 工具切换保留已打开的页面；「独立打开」使用各工具原地址，便于使用原来的浏览器记录和登录状态。
- 只发布静态页面及公开元数据。不要提交账号配置、声音样本、用户素材、生成记录、`data/` 或 `exports/`。

## 3D 创作世界（2026-10-21）

首页现基于 [Bruno Simon / folio-2025](https://github.com/brunosimon/folio-2025) 开源原作改编，直接保留原版模型、配色、材质、光照、开场和车辆物理，按要求复现原站视觉。

- `index.html`：公开首页入口。
- `world/`：构建后的 3D 程序与公开场景素材。
- `world-source/`：可维护源码、依赖版本及构建说明。
- `portfolio.html`：完整平面作品集，含视频、职责、公开数据。
- `tools.html` / `tool-catalog.js`：六个工具的统一入口与公开目录。
- 地面姓名已替换为刘俊威；项目展台为三条参与的科普视频；工具展台为六个创作工具。
- 原作采用 MIT 许可，保留 `world/BRUNO-LICENSE.md`；音乐为 Kounine 的 CC0 作品，保留相应许可。菜单「关于网站」有完整署名。
- 原版服务器和 Google 统计已关闭。姓名、作品和工具元数据为用户内容；3D 世界原作归 Bruno Simon。
- 旧 `island.js` / `island.css` 为上一版历史代码，现首页不再加载。
- 必须使用 HTTP 静态服务器预览，不能通过 file:// 直接运行模块。

## 工具内页主题（2026-10-22）

工具箱使用原场景背景、深紫窗口、顶部方形页签与暖橙按钮。`tool-world.css` 仅作用于工具入口和工作区。各工具自己的 `world-theme.css` 统一操作页面颜色；保留原本的功能、媒体画面与数据存储。声样的服务使用已有 `style.css` 路由加载主题，保持原 CSP。

专注模式收起外围导航，返回全部工具后自动退出。场景动态可以暂停，系统减弱动态偏好默认生效。
