# 刘俊威的个人网站

A small, responsive Chinese-language personal homepage built with plain HTML, CSS, and JavaScript.

## Run locally

Open `index.html` in a browser, or serve this directory with any static file server.

## Deploy with GitHub Pages

Push the repository to GitHub, then open **Settings → Pages** and select **Deploy from a branch**, `main`, and `/ (root)`.

## 创作工具箱

`tools.html` 是六个小工具的统一入口，`tool-catalog.js` 维护公开介绍和访问地址。首页共用同一份目录，旧 `workbench.html` 跳转到新工作台。

- 在线嵌入：科普工作台、动效镜头库、取景（真实 AI 点评仍需本机助手）。
- 拾片：嵌入线上预览，提供 Mac 下载与本机入口。
- 剪辑助手、声样：只提供本机工具入口，不在公共网页中连接本机 API。
- 工具切换保留已打开的页面；「独立打开」使用各工具原地址，便于使用原来的浏览器记录和登录状态。
- 只发布静态页面及公开元数据。不要提交账号配置、声音样本、用户素材、生成记录、`data/` 或 `exports/`。

## 3D 创作岛（2026-10-21）

首页改为可驾驶探索的 Three.js 场景：方向键/WASD、移动端方向控件、镜头跟随与拖动旋转、碰撞反馈、站点内容面板、静音起步的可选音效。八个站点对应个人介绍、参与项目以及六个真实工具。

- `index.html` / `island.css` / `island.js`：3D 首页。
- `portfolio.html`：保留的完整平面作品集，含成片、职责、公开数据和工具目录。
- `tools.html`：统一工具箱，功能及本机运行边界保持不变。
- `assets/vendor/`：本地固定版本 Three.js 及 MIT 许可，避免依赖外部 CDN。
- `assets/name-outlines.json`：仅姓名三个字的展示轮廓，不包含字体文件。
- 场景模型、路面、树木、工作站和车辆均为本站独立程序化制作。交互参考 https://bruno-simon.com/ ，没有复制其模型、代码或音频。
- 不支持 WebGL 的浏览器提供作品集和工具箱直接入口。页面不请求麦克风、位置或本机文件权限。
