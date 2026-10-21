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
