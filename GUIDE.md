# 维护指南（GUIDE.md）

这是「小C的工作台」个人博客的维护说明。整个站点是纯静态的，托管在 GitHub Pages 上，不需要后端。所有内容都用 Markdown / JSON 维护，运行一次构建脚本即可更新网页。

## 目录结构

```text
.
├── index.html            首页（项目列表 + 近期所想 + 关于）
├── project.html          项目详情页（作业 / 模块 / 章节 / 文档导航）
├── reader.html           文档阅读页（Markdown 渲染 + 代码高亮 + 公式）
├── build.py              构建脚本：扫描 content/ 生成 data/site.js
├── assets/               样式与前端逻辑
│   ├── styles.css        全站通用样式
│   ├── app.js            首页逻辑
│   ├── project.css/js    项目页
│   └── reader.css/js     阅读页
├── data/
│   └── site.js           构建产物（不要手改）
└── content/              ← 你唯一需要编辑的目录
    ├── projects.json     站点信息 + 项目列表
    ├── thoughts.json     近期所想
    └── projects/
        └── <项目id>/...  项目文档（.md）
```

核心原则：**只编辑 `content/`，然后运行 `python3 build.py`。**

## 快速开始

```bash
# 1. 预览（在项目根目录）
python3 -m http.server 8000
# 浏览器打开 http://localhost:8000

# 2. 修改 content/ 里的内容后重新构建
python3 build.py

# 3. 满意后推送
git add -A
git commit -m "更新内容"
git push origin main
```

## 场景一：上传一篇新文档

1. 把 Markdown 文件放进对应项目目录，目录层级会自动变成导航层级：

   ```text
   content/projects/CS336/CS336-1讲义/架构实现与预训练实战/8. 新章节/8.1 新文档.md
                          └─ 作业 ─┘ └──── 模块 ────┘ └─ 章节 ─┘ └─ 文档 ─┘
   ```

   层级映射规则：
   - 第 1 层目录 = 作业（可在 `projects.json` 的 `assignments` 里映射成 A1/A5 等短名）
   - 第 2 层目录 = 模块
   - 第 3 层目录 = 章节（没有则归入「概述」）
   - `.md` 文件 = 文档

2. 文档标题取自 Markdown 里的第一个 `#` / `##` / `###` 标题；没有则用文件名。

3. 运行 `python3 build.py` 并推送。

### Markdown 支持的写法

- 多级标题 `#`、`##`、`###`、`####`
- 有序 / 无序列表、表格、加粗、行内 `code`
- 代码块（带语言标识，自动语法高亮）：

  ~~~markdown
  ```python
  def hello():
      print("hi")
  ```
  ~~~

- LaTeX 公式：行内 `$...$`，独立 `$$...$$`
- 飞书风格提示块（callout）：

  ```markdown
  > [!NOTE]
  > **本节目标**
  > - 目标一
  > - 目标二
  ```

  支持的类型：`NOTE`（蓝）、`TIP`（绿）、`IMPORTANT`（紫）、`WARNING`（橙）、`CAUTION`（红）。

## 场景二：新建一个项目

1. 编辑 `content/projects.json`，在 `projects` 数组中新增一项：

   ```json
   {
     "id": "MyProject",
     "name": "My Project",
     "subtitle": "一句话副标题",
     "description": "项目简介，显示在首页卡片上。",
     "assignments": { "第一层目录名": "显示短名" }
   }
   ```

2. 新建目录 `content/projects/MyProject/`，按场景一的层级放文档。

3. 运行 `python3 build.py` 并推送。首页会自动出现新项目卡片。

## 场景三：写一条今日思考

编辑 `content/thoughts.json`，在数组最前面加一条（第一条会作为首页 hero 语和置顶卡片）：

```json
{
  "date": "2026-08-01",
  "topic": "今日主题",
  "title": "一句话核心想法。",
  "body": "补充说明，可留空。"
}
```

运行 `python3 build.py` 并推送即可。

## 常见问题

- **改了内容但网页没变？** 一定要先跑 `python3 build.py` 重新生成 `data/site.js`，再刷新浏览器（必要时强制刷新）。
- **`data/site.js` 能手动改吗？** 不建议，它是构建产物，下次构建会被覆盖。
- **代码 / 公式没正常显示？** 阅读页依赖 CDN 上的 marked、highlight.js、KaTeX，需要能访问外网。
- **GitHub Pages 多久生效？** 推送后通常几十秒到几分钟自动重新部署，访问 https://chaser026.github.io。

## 部署说明

仓库为 `chaser026.github.io`，`main` 分支根目录即站点根目录。GitHub Pages 设置：

```text
Settings → Pages → Build and deployment
Source: Deploy from a branch
Branch: main   Folder: / (root)
```
