# 小C的工作台

个人技术博客与项目文档库，面向 GitHub Pages 静态托管。

## 内容

- `项目文档`：按项目和主题组织的 CS336 学习、训练、推理与对齐文档
- `近期所想`：记录阶段性思考和正在实践的事情
- `reader.html`：浏览器内阅读文档摘要，并下载原始 `.docx`

## 本地预览

```bash
python3 -m http.server 8000
```

然后打开 <http://localhost:8000>。

## 更新文档

把新的 `.docx` 放入 `docs/` 后，重新生成 `data/documents.js`。当前索引生成逻辑会提取 Word 文档中的纯文本摘要；后续可以扩展为 Markdown 正文转换、目录层级和搜索索引。

## GitHub Pages

建议创建名为 `chaser026.github.io` 的公开仓库，将本目录推送到 `main` 分支，再在仓库设置中启用 GitHub Pages。
