# 维护指南（GUIDE.md）

这是「小C的工作台」个人博客的维护说明。整个站点是纯静态的，托管在 GitHub Pages 上，不需要后端。所有内容都用 Markdown / JSON 维护，运行一次构建脚本即可更新网页。

## 目录结构

```text
.
├── index.html            首页（项目列表 + 树洞入口）
├── project.html          项目详情页（作业 / 模块 / 章节 / 文档导航）
├── treehole.html         树洞页（Twikoo 匿名留言墙）
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
    └── projects/
        └── <项目id>/...  项目文档（.md）
```

核心原则：**只编辑 `content/`，然后运行 `python3 build.py`。**

## 私人知识库（md知识库/）

`md知识库/` 存放原始讲义与笔记，**已被 `.gitignore` 排除，永远不会上传到 GitHub**；网站只发布 `content/projects/` 中的内容。

推荐工作流：

1. 在 `md知识库/<项目>/` 里按「作业 / 模块 / 章节」层级整理原始文档；
2. 把要公开的部分复制到 `content/projects/<项目id>/` 的相同层级下；
3. 新项目需先在 `content/projects.json` 的 `projects` 数组注册（见场景二）；
4. 运行 `python3 build.py` 并推送。

## 快速开始

```bash
# 1. 预览（在项目根目录）
python3 -m http.server 8000
# 浏览器打开 http://localhost:8000

# 2.修改 content/ 里的内容后重新构建， 满意后推送
python3 build.py && git add -A && git commit -m "更新内容" && git push origin main
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

## 场景三：启用树洞（Twikoo 匿名留言）

树洞页（`treehole.html`）基于 [Twikoo](https://twikoo.js.org/)：访客起个昵称就能发言，无需注册账号；留言存在你自己的 MongoDB 数据库里。以下两种方式全免费，**推荐方式 A**（大陆访问较快，本站在用）。

### 方式 A：Netlify 部署（本站在用）

1. **建免费数据库**：注册 [MongoDB Atlas](https://www.mongodb.com/atlas/database) → 创建 M0 免费集群 → Database Access 里创建用户 → Network Access 里放行 `0.0.0.0/0` → Connect 获取连接串 `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/twikoo`（把 `<password>` 换成真实密码）。
2. **部署后端**：把 [twikoojs/twikoo-netlify](https://github.com/twikoojs/twikoo-netlify) fork 到自己账号 → 登录 [Netlify](https://www.netlify.com) → Add new site → Import an existing project → Deploy with GitHub → 选刚 fork 的仓库 → Add environment variables 加 `MONGODB_URI` = 连接串 → Deploy。
3. **确认成功**：打开站点链接（可在 Domain settings → Edit site name 改名），看到「Twikoo 云函数运行正常」即成功。本站后端：`https://chaserspaces.netlify.app/.netlify/functions/twikoo`。
4. **启用树洞**：把「站点域名 + `/.netlify/functions/twikoo`」填入 `content/projects.json` 的 `site.twikoo.envId`（注意是函数地址，不是网站首页），`enabled` 改为 `true`，运行 `python3 build.py` 并推送。
5. **管理留言**：打开树洞页，点评论区的**齿轮图标** → 首次会引导「设置管理密码」，直接输入密码即可（密码加密存入 MongoDB，**不需要**在 Netlify 加环境变量）。之后管理/删除留言都从同一个齿轮图标登录。忘记密码的话：去 MongoDB Atlas 的 `config` 表删掉 `ADMIN_PASS` 这条配置，再回齿轮处重设。

需要知道的事：

- **免费额度**：每月 125,000 次请求 + 100 小时函数时长，个人博客完全够用。
- 前端组件从 jsdelivr CDN 加载，国内偶尔偏慢，刷新即可。

### 方式 B：Vercel

用 GitHub 账号登录 [vercel.com](https://vercel.com) → New Project → Import 仓库 `https://github.com/imaegoo/twikoo` → Deploy；在 Settings → Environment Variables 加 `MONGODB_URI`（同上）→ Redeploy；把 `https://twikoo-xxx.vercel.app` 填入 `site.twikoo.envId` 并启用。⚠️ `*.vercel.app` 在部分大陆网络下无法访问，介意的话给 Vercel 项目绑自己的域名。

> Hugging Face 曾经免费且大陆访问快，但 2026 年 7 月起新免费账号的 Docker Space 已改为付费，不再推荐。

官方文档：[后端部署（含各平台对比）](https://twikoo.js.org/backend.html) · [前端引入](https://twikoo.js.org/frontend.html) · [MongoDB Atlas 配置](https://twikoo.js.org/mongodb-atlas.html)

## 场景四：配置个人主页链接（首页）

编辑 `content/projects.json` 的 `site.social`，键是平台，值是主页链接：

```json
"social": {
  "github": "https://github.com/chaser026",
  "bilibili": "https://space.bilibili.com/488678545",
  "xiaohongshu": "https://www.xiaohongshu.com/user/profile/5eb672450000000001001f5b"
}
```

- 含「你的 / 请填 / xxx」占位符的链接会被自动跳过，不会显示；
- 支持任意平台键：`github`、`bilibili`、`xiaohongshu`、`zhihu`、`twitter`、`juejin`、`email` 等；
- `email` 会自动生成 `mailto:` 链接；
- 第一个链接显示为主色按钮，其余为浅色按钮。

这些链接显示在首页 hero 区（原「浏览项目 / 查看 github」按钮的位置）。对应的 HTML 容器是 `index.html` 中的 `<div class="hero-actions" id="social-links"></div>`，由 `assets/app.js` 填充。

## 场景五：开启评论功能（giscus）

评论基于 GitHub Discussions，用 [giscus](https://giscus.app) 实现，显示在每篇文档底部。开启步骤：

1. 在 GitHub 仓库 `Settings → General → Features` 勾选 **Discussions**；
2. 打开 https://github.com/apps/giscus ，点 **Install**，授权给 `chaser026.github.io` 仓库；
3. 打开 https://giscus.app ，在「仓库」填 `chaser026/chaser026.github.io`，选择映射方式 `pathname`，选一个 Discussion 分类（推荐 `Announcements`）；
4. 页面下方会生成一段配置，把其中的 `data-repo-id` 和 `data-category-id` 复制出来；
5. 填入 `content/projects.json` 的 `site.giscus`，并把 `enabled` 改成 `true`：

   ```json
   "giscus": {
     "enabled": true,
     "repo": "chaser026/chaser026.github.io",
     "repoId": "R_kgD...",
     "category": "Announcements",
     "categoryId": "DIC_kwD...",
     "mapping": "pathname",
     "theme": "light",
     "lang": "zh-CN"
   }
   ```

6. 运行 `python3 build.py` 并推送。未配置前，文档底部会显示一条「评论功能尚未配置」的提示，不影响其他功能。

## 常见问题

- **`git push` 报 `HTTP2 framing layer` 或连不上 443？** 本仓库已设置 `git config http.version HTTP/1.1`。若仍失败多为网络波动，稍后重试即可。
- **GitHub 贡献者显示 no contributor？** 需保证提交邮箱与 GitHub 账号绑定的邮箱一致。本仓库已配置 `user.name=chaser026`、`user.email=1615629622@qq.com`；请确认该邮箱已加入你的 GitHub 账号（Settings → Emails）。


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
