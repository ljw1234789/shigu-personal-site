# 姓名展示字体

- 原字体：Adobe Source Han Serif CN Heavy。
- 官方来源：https://github.com/adobe-fonts/source-han-serif/tree/release/SubsetOTF/CN
- 许可：SIL Open Font License 1.1，完整文本见 `OFL-SourceHanSerif.txt`。
- 网站文件：`ljw-display-heavy.woff2`，仅包含“刘俊威.”。
- 子集已将字体族与 PostScript 名称改为 LJW Display / LJWDisplay-Heavy；版权和许可信息保持不变。

## 2026-10-29 姓名字形更新

- 使用朱雀仿宋 v0.212，替换原来粗重的思源宋体姓名字样。
- 官方来源：https://github.com/TrionesType/zhuque/releases/tag/v0.212
- 许可：SIL Open Font License 1.1，见 `OFL-ZhuqueFangsong.txt`。
- 网站文件：`ljw-signature.woff2`，仅包含“刘俊威.”，不改动字形轮廓。
- 子集名称：LJW Signature / LJWSignature-Regular；保留版权和许可信息。
- 原来的 Heavy 子集留存，用于旧页面的兼容性。

The 2026-10-29 3D name uses original vector outlines of 刘俊威 from Zhuque Fangsong, stored in ../name-sculpture.json. The same OFL license applies. The geometry, lighting and seasonal materials are authored for this portfolio.

## 2026-10-30 立体字

首页姓名使用霞鹜文楷轮廓生成圆润实体网格，结尾 CRAFT / & / TASTE 使用 Fredoka Bold 轮廓。建模过程见 `scripts/build-inflated-type.py`，网格位于 `../sculpture-v2/`，完整字体许可见 `OFL-LXGWWenKai.txt` 与 `OFL-Fredoka.txt`。参考 Haoqi Design 的版式、蓝白折射和入场次序；网格、背景及渲染代码为本项目重新实现。
