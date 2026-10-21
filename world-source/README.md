# 3D 首页源码

基于 Bruno Simon / folio-2025，保留原版 Three.js / TSL 渲染、Rapier 驾驶物理、模型、声效和场景。MIT 许可见 `license.md`，音乐 CC0 许可见 `../world/sounds/musics/license.md`。

个人改编：刘俊威姓名立体字、中文介绍、三条视频项目、六个创作工具、中文地图入口、内容工作流。移除原作者个人项目及社交链接，关闭原作服务器连接和统计脚本。

- 首页渲染后的静态文件位于 `../world/`。根目录 `index.html` 使用 `<base href="./world/">` 访问它们。
- `sources/data/tools.js` 是公开工具目录。编辑目录时同步根目录 `tool-catalog.js`。
- `sources/Game/World/Areas/LandingArea.js` 生成姓名。
- `sources/Game/Personalize.js` 接入个人信息与工具菜单。
- 当前固定原版秋季黄昏（day = 0.25, year = 0.8），以保持参考画面的橙粉地面和紫色光影。
- `npm install --legacy-peer-deps` 后可 `npm run dev` 或 `npm run build`。
- `build/` 为产物目录，素材来自现有 `../world/`。发布时将构建产物同步回 `world/`，根入口从构建后的 index.html 复制并添加上述 base 标签。
- 本网站只链接工具及公开介绍。用户媒体、旁白、账号配置和导出成片不在这里保存或上传。

原作基线提交：`41046b57eeed8d156d9c3fd7fa259900baef7816`。
