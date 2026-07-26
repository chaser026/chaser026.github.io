# 小C的工作台

个人技术博客与项目文档库，纯静态，托管在 GitHub Pages。

- 首页以项目为粒度展示，进入项目后按作业 / 模块 / 章节浏览文档
- 文档用 Markdown 维护，支持多级标题、表格、代码高亮、LaTeX 公式和飞书风格提示块
- 「近期所想」记录阶段性思考

## 快速使用

```bash
python3 -m http.server 8000   # 本地预览 http://localhost:8000
python3 build.py              # 修改 content/ 后重新生成 data/site.js
```

## 如何维护

所有内容都在 `content/` 目录，编辑后运行 `python3 build.py` 即可。新增文档、新建项目、写今日思考的完整步骤见 [GUIDE.md](GUIDE.md)。

## 部署

仓库 `chaser026.github.io`，`main` 分支根目录，GitHub Pages 选择 `Deploy from a branch → main → / (root)`。

