# 交接文档：个人学术主页维护

> 接收方：deepseek harness（接替原助手维护 songyu0903 的学术主页）
> 交接时间：2026-10-03 ／ 最后更新：2026-10-05（8 篇论文上线 `/papers/`；旧的 14 篇组合优化文章下线）
> 站点仓库：`songyu0903/songyu0903.github.io`

---

## 0. 一句话任务

维护 songyu0903 的个人学术主页：**改内容 → 本地构建 → 同步到线上两个地址**。
用户说"更新主页"时，默认包含最后一步同步，**不要停在"我改好了，你要推送吗"**。

---

## 1. 用户硬性规则（违反会惹恼用户）

1. **更新就必须同步。** 任何内容修改后，立刻同步到**两个**线上地址，不要问"要不要推送""确认一下吗"。用户原话："不要再问我这种弱智的问题，更新就必须同步。"
2. **执行要快。** 少解释、少铺垫、直接干活。用户会用"立刻推送""加速推进""继续"催促。
3. 用户是**数学专业研究生**，研究方向**投资组合优化**（Markowitz → 鲁棒优化 → 分布鲁棒优化 DRO），当前处于**开题前文献调研阶段**。写作和代码示例要贴合这个背景。
4. 页面数学公式用 **KaTeX**，正文直接写 `$...$` / `$$...$$`，无需额外配置（渲染链路已在站点内配好，见 §4）。
5. **换主题时"内容不要变"**：只改版式/配置，不动笔记正文与既有 URL（2026-10-04 换 Hugo Book 时即按此执行，17 篇笔记正文一字未改）。

---

## 2. 两个线上地址（每次都要更新）

| 用途 | 地址 | 来源 |
|---|---|---|
| 正式（GitHub Pages） | https://songyu0903.github.io/ | 仓库 `main` 分支（= `academic-homepage/public-gh/` 的内容） |
| 备用（WorkBuddy） | https://songyu-academic-home.app.workbuddy.host/ | `academic-homepage/public/` 通过部署工具上传 |

GitHub 仓库两个分支：
- `main` → **构建产物**（HTML/CSS/图片），由 `public-gh/` 这个**独立 git 仓库**推送
- `source` → **源码**（Hugo 站点），由 `academic-homepage/` 这个 git 仓库推送

**注意**：DSH 侧没有 `workbuddy_sites_deploy` 工具，备用链接**只能由用户在 WorkBuddy 里点部署**；DSH 只能保证 GitHub Pages 同步（当前备用站仍是旧 HugoBlox 版本）。

---

## 3. 工作区结构

```
C:/Users/eiegant/WorkBuddy/2026-10-01-16-16-12/
├── academic-homepage/          # Hugo 源码站（git 仓库，推 source 分支）
│   ├── hugo.toml               # ★ 站点配置（Hugo Book 主题：菜单/参数/markup/KaTeX passthrough）
│   ├── content/
│   │   ├── _index.md           # 首页（正文含"研究方向" + 六个专题导览）
│   │   ├── about.md            # 关于页（weight: 1 → 侧栏目录树第一项）
│   │   ├── blog/<slug>/index.md# 笔记文章（4 篇工具/写作类；weight 定「全部笔记」列表顺序——**新文章要给 weight: 1、其余整体 +1**，否则会掉到最后一页；bookHidden 使其不进侧栏）
│   │   ├── blog/_index.md      # 「📝 全部笔记」页（bookHidden: true）
│   │   ├── papers/_index.md    # 「📄 论文」板块页（weight: 3 → 侧栏第三项；正文列 8 篇论文）
│   │   ├── papers/<slug>/index.md # 论文 page bundle（正文 + fig1.png/fig2.png + reproduce.py|.R + 结果 CSV/JSON，全部随页面发布；每篇 bookHidden: true）
│   │   └── topics/<topic>/_index.md # 6 个专题页 = 侧栏大目录（front matter notes: [slug…]；slug 先在 /blog/ 找、找不到再到 /papers/ 找）
│   ├── layouts/
│   │   ├── index.html          # 首页版式（标准 Book 版式 → 保留左侧目录）
│   │   ├── single.html         # 覆盖主题：渲染 front matter 标题 + 日期（主题默认不渲染 H1）
│   │   ├── list.html           # section 列表：有 notes: 则列该专题笔记，否则分页列出（/blog/ 10/页）
│   │   ├── term.html / taxonomy.html  # 标签页
│   │   ├── _shortcodes/badges.html    # ★ 技术栈徽章墙（首页与关于页共用 → 改一处两页同步）
│   │   ├── _shortcodes/visitors.html  # ★ 首页访客计数（唯一外部服务依赖，见 §5）
│   │   └── _partials/docs/inject/head.html  # ★ 注入 KaTeX 前端 auto-render
│   ├── assets/styles/custom.css# 站点自定义样式（主题最后加载，可覆盖主题）
│   ├── static/
│   │   ├── .nojekyll           # 必留！GitHub Pages 修复下划线资源 404
│   │   ├── badges/             # ★ 技术栈徽章 SVG ×16（本地化；生成脚本 tools/fetch_badges.ps1）
│   │   ├── typing/             # ★ 首页打字动画 SVG（typing-dark/typing-light，自包含动画）
│   │   ├── heatmap/snake.svg   # ★ 首页「📈 GitHub 活跃度」热力图贪吃蛇（自包含 SMIL 动效；生成脚本 tools/gen_heatmap_snake.py）
│   │   ├── katex/              # ★ 前端 KaTeX（JS 由本仓库提供，CSS/字体主题也有）
│   │   ├── media/authors/me.jpg# 头像（URL /media/authors/me.jpg）
│   │   └── uploads/resume.pdf
│   ├── themes/hugo-book/       # Hugo Book 主题（**不入库**，获取方式见 §4）
│   ├── public/                 # 构建产物 A（→ 备用链接）
│   └── public-gh/              # 构建产物 B（独立 git 仓库 → main 分支）
├── tools/
│   ├── hugo/hugo.exe           # Hugo extended v0.167.0（★ 不在 PATH，必须用全路径）
│   ├── gh_api_push.py          # 走 REST API 推送（git push 走代理基本必失败）
│   ├── fetch_badges.ps1        # ★ 重下徽章墙/打字动画 SVG（改脚本里 $badges 列表即可增删徽章）
│   ├── gen_heatmap_snake.py    # ★ 生成首页热力图贪吃蛇 SVG（联网抓 GitHub 贡献数据；--offline 用缓存重画）
│   └── data/contrib_songyu0903.json   # 贡献日历原始 JSON 缓存（gen_heatmap_snake.py 写入）
└── HANDOVER.md                 # 本文档（与 academic-homepage/HANDOVER.md 同内容）
```

---

## 4. 构建（Hugo Book 版，不再需要 Go / Node）

**前提**：`academic-homepage/themes/hugo-book/` 必须存在（主题不入库，见下方获取方式）。

```powershell
$site = "C:\Users\eiegant\WorkBuddy\2026-10-01-16-16-12\academic-homepage"
$hugo = "C:\Users\eiegant\WorkBuddy\2026-10-01-16-16-12\tools\hugo\hugo.exe"

# 1) 清空产物目录（public-gh 保留 .git！）
Get-ChildItem "$site\public" -Force | Remove-Item -Recurse -Force
Get-ChildItem "$site\public-gh" -Force | Where-Object { $_.Name -ne '.git' } | Remove-Item -Recurse -Force

# 2) 构建
Set-Location $site
& $hugo --minify                  # → public/
& $hugo --minify -d public-gh     # → public-gh/
```

- 成功标志：`exit=0`，摘要 `Pages │ 139` 左右，`Static files │ 50`（2026-10-04 加 R 徽章后由 49 → 50）
- 清理输出目录是**必须**的：清空后旧主题残留（`_headers`、`_redirects`、`backlinks.json`、`css/`、`dist/`、`js/`）才会消失，推送脚本也才会在远端删除它们
- **不要**用 `hugo --cleanDestinationDir`（可能误删 `public-gh/.git`）

**主题获取（本机已装好，仅在换机器/目录丢失时需要）**：

```powershell
# GitHub Releases 资产域名在本机被墙；codeload 归档可用
curl.exe -L -o "$env:TEMP\hugo-book.zip" "https://github.com/alex-shpak/hugo-book/archive/refs/heads/master.zip"
Expand-Archive "$env:TEMP\hugo-book.zip" "$env:TEMP\hugo-book" -Force
Copy-Item "$env:TEMP\hugo-book\hugo-book-main" "$site\themes\hugo-book" -Recurse
# 可选瘦身：删 themes\hugo-book\exampleSite、images、.github，以及
#   static\mermaid.min.js（3.5MB）、static\asciinema\、static\katex\fonts\*.ttf|*.woff（留 .woff2）
```

**KaTeX 前端资源**：主题自带 `katex.min.css` + 字体，但**不带 katex.min.js**，所以站点 `static/katex/` 里放了
`katex.min.js`、`katex.min.css`、`contrib/auto-render.min.js`、`fonts/*.woff2`（KaTeX 0.19.0，已入库）。
如需重下：`https://mirrors.cloud.tencent.com/npm/katex/-/katex-0.19.0.tgz`（jsDelivr 可用，npmjs/unpkg 在本机不通）。

---

## 5. 内容编辑地图（改哪里对应改什么）

| 想改什么 | 改哪个文件 | 说明 |
|---|---|---|
| 站点名 / 菜单 / 主题外观 / 搜索 / 目录树根 | `hugo.toml` | `title`、`[[menu.home]]`（仅 landing 版式用）、`[[menu.after]]`（侧栏底部链接）、`[params] BookTheme=light|dark|auto`、`BookSection="*"`（侧栏目录树以**站点顶层**为根 → 只显示「关于」+「笔记专题」两个大目录） |
| 首页文案（研究方向、笔记导览） | `content/_index.md` + `layouts/index.html` | 首页与其它页**统一使用 Book 标准版式**（左侧目录树 + 正文）；若想用主题的 landing 版式，给 front matter 加 `layout: landing`，但那会**隐藏左侧目录** |
| 个人简介 / 教育 / 研究兴趣 / 技能 / 语言 / 链接 | `content/about.md` | 原先由 HugoBlox 的 `data/authors/me.yaml` 渲染，现已写成正文（该 yaml 已于 2026-10-04 清理删除）；「🛠 技能」是本地 SVG 徽章墙（图片在 `static/badges/`） |
| 新增/修改一篇笔记 | `content/blog/<slug>/index.md` | front matter：`title / date / summary / tags / weight`；**正文不要写 H1**（`layouts/single.html` 已用 title 渲染标题）；**写完还要把 slug 加进对应专题页的 `notes:` 列表**，否则专题页不显示它 |
| 笔记在「全部笔记」列表里的顺序 | 各笔记 front matter 的 `weight` | 数值越小越靠前；当前只有 4 篇笔记（`r-tikz-figures`=1、`math-typesetting`=16、`vscode-setup`=17、`writing-workflow`=18；中间的 2–15 随 2026-10-05 删除旧文而空出，加新笔记时按「新文给 1、其余整体 +1」由脚本重排即可）。论文列表同理（`/papers/` 与首页 `## 📄 论文` 都按 weight 升序，当前 1–8）；侧栏**不**列单篇笔记/论文 |
| 侧栏大目录（专题分组） | `content/topics/<topic>/_index.md` | `weight`（1–6）定侧栏顺序、`notes: [slug…]` 定该专题收录哪些内容——slug **可以是笔记也可以是论文**（`layouts/list.html` 先查 `/blog/<slug>/`，查不到再查 `/papers/<slug>/`）；`content/topics/_index.md` 是目录树的根 |
| 「📄 论文」板块 | `content/papers/_index.md`（板块页）+ `content/papers/<slug>/index.md`（单篇） | `weight: 3` → 侧栏第三项；单篇一律 `bookHidden: true`。首页 `content/_index.md` 的 `## 📄 论文` 小节是 8 篇的入口清单 |
| 全部笔记页导语 | `content/blog/_index.md` | 「📝 全部笔记」页；`bookHidden: true` 使其不单独出现在侧栏目录树 |
| 头像 | 覆盖 `static/media/authors/me.jpg` | URL 固定 `/media/authors/me.jpg` |
| 技术栈徽章墙 / 首页打字动画 | 徽章墙＝`layouts/_shortcodes/badges.html`（首页与关于页共用，改一处两页同步；正文里写 `{{< badges >}}`）；图＝`static/badges/*.svg`、`static/typing/*.svg`；生成脚本＝`tools/fetch_badges.ps1` | 图片**全部本地化**，页面不依赖 shields.io 在线服务；增删徽章＝改短代码里的 `<img>` 行（并可用脚本的 `$badges` 列表重下图）；simple-icons 已下架 matlab/cvxpy/powershell/vscode/windows 图标 → 这 5 个是纯文字胶囊（不是 bug） |
| 首页访客计数 | `layouts/_shortcodes/visitors.html`（首页正文末尾写 `{{< visitors >}}`）；CSS 在 `assets/styles/custom.css` 的 `.visitors` | **全站唯一的外部服务依赖**：`https://visitor-badge.laobi.icu/badge?page_id=songyu0903.github.io&left_text=visits`（实测国内直连约 1s、响应头 `Cache-Control: no-cache` → 每次加载真实 +1）。`page_id` 固定为站点域名，正式站与备用站共用同一计数器（即「总访问量」）。**加载失败时 `onerror` 整块隐藏**，不会出现破图；换服务只改短代码里那一行 URL（备选：`https://komarev.com/ghpvc/?username=songyu0903&label=Views&color=0e75b6&style=flat`）；不蒜子 busuanzi 已实测不可用（JS 能下但计数接口 `busuanzi.ibruce.info/busuanzi` 从国内超时） |
| 首页「📈 GitHub 活跃度」热力图贪吃蛇 | 图＝`static/heatmap/snake.svg`（自包含 SMIL 动效，**运行时不依赖任何外部服务**）；生成脚本＝`tools/gen_heatmap_snake.py`；首页正文在 `content/_index.md`（`.heatmap` / `.heatmap-note` 样式在 `assets/styles/custom.css`） | 数据＝GitHub 贡献日历，抓 `https://github-contributions-api.jogruber.de/v4/songyu0903?y=last`（本机直连可用；`github.com/users/<user>/contributions` 在本机被重置）。**静态站没有后端，所以数据是构建前抓下来烘进 SVG 的**：要更新数据就重新跑 `python tools\gen_heatmap_snake.py`（加 `--offline` 用 `tools/data/contrib_songyu0903.json` 缓存重画），再按 §6 构建推送。小蛇每跑一趟（18 s）会把有贡献的格子依次吃掉、走完再恢复，循环播放 |
| 公式渲染 | `layouts/_partials/docs/inject/head.html` | 前端 KaTeX（auto-render），改动前先读主题同名文件 |
| 版式微调 | `assets/styles/custom.css` | 主题 `assets/styles/index.yaml` 中最后加载，可覆盖主题 |

### 新增一篇文章（模板）

```markdown
---
weight: 1
title: "文章标题"
date: 2026-10-05
summary: "一两句话摘要。"
tags: ["投资组合优化", "鲁棒优化"]
---

正文，支持 KaTeX：

$$\min_{w}\ w^{\top}\Sigma w \quad \text{s.t.} \quad w^{\top}\mathbf{1}=1$$
```

写完新笔记后：① 把 slug 加进对应专题页 `content/topics/<topic>/_index.md` 的 `notes:` 列表（六选一，否则侧栏专题页里看不到它）；② `weight` 决定「全部笔记」列表顺序——**「全部笔记」按 `weight` 升序排，所以新文章必须给 `weight: 1`、其余文章整体 +1**（否则掉到最后一页；脚本 `C:\Users\eiegant\WorkBuddy\2026-10-01-16-16-12\tools\reorder_blog_weights.py` 幂等处理，见 §7）；③ 构建（§4）→ 两仓库提交 → 推送两个分支 → 验证。

### 新增一篇论文（`content/papers/`）

**给用户／Codex 的写作模板**：`academic-homepage/PAPER-TEMPLATE.md`（front matter、正文骨架、"哪些 KaTeX 命令不能用"、Codex 提示词、定稿自检清单都在里面）。用户说「写好后我给你，由你负责同步」——所以同步这一步是我们的活。

1. 建目录 `content/papers/<slug>/`，`index.md` 与插图放**同一目录**（page bundle，正文用相对路径 `![图注](fig1.png)`）；复现脚本与结果 CSV/JSON 也一起放进该目录，会作为页面资源发布（可直接下载）；`figures-list.md` 这类内部 .md **不会**发布、也不会生成多余页面。`content/papers/_index.md` 已存在（`title: "📄 论文"`、`weight: 3`、**未** bookHidden → 侧栏出现第三项「📄 论文」）。
2. 单篇 front matter 与笔记一致，另可用 `pdf:` / `code:` / `doi:` / `status:` 字段；**每篇都写 `bookHidden: true`**（单篇不进侧栏树）。
3. 首页 `content/_index.md` 的 `## 📄 论文` 小节（已存在，位于 `## 🔬 研究方向` 与 `## 📝 阅读笔记` 之间）追加条目：`- **[标题](/papers/<slug>/)**：一句话说明`（按 `weight` 升序，规则同笔记）。若要把论文归入某个方向，把 slug 加进对应 `content/topics/<topic>/_index.md` 的 `notes:` 即可——`layouts/list.html` 会先在 `/blog/` 找、找不到再到 `/papers/` 找。
4. 正文不写 H1；KaTeX **不支持** `\label`/`\eqref`/`\ref`/`\begin{equation}`/`\begin{align}`（要引用就手写「式 (1)」）；合成数据必须显式标注；**不要出现编造的参考文献**。
5. 构建（§4）→ 两仓库提交 → 推送两个分支 → 验证（§6 步骤 5）→ 同步两份 HANDOVER。

### 提供 PDF 下载链接（用户问过）

两种方式，任选：

1. **放在 static 目录**（最简单）：把 `paper.pdf` 放进 `academic-homepage/static/uploads/`，文中写：
   ```markdown
   [论文 PDF 下载](/uploads/paper.pdf)
   ```
2. **放在页面 bundle 内**：把 PDF 放到 `content/blog/<slug>/` 下，用相对路径 `[PDF](paper.pdf)`。

外链用完整 URL。建议加 `target="_blank"` 时用 HTML：`<a href="/uploads/paper.pdf" target="_blank">PDF</a>`（Hugo 的 markdown 默认允许内联 HTML）。

---

## 6. 部署流程（每次更新照做，顺序不能乱）

### 步骤 1：构建
见 §4（清空 `public/`、`public-gh/` 后各跑一次 `hugo --minify`）。

### 步骤 2：提交两个 git 仓库

```powershell
$site = "C:\Users\eiegant\WorkBuddy\2026-10-01-16-16-12\academic-homepage"
$git  = "C:\Users\eiegant\.workbuddy\binaries\PortableGit\versions\1.2.0\cmd\git.exe"
& $git -C $site add -A;            & $git -C $site commit -m "描述本次改动"     # 源码 → source 分支
& $git -C "$site\public-gh" add -A; & $git -C "$site\public-gh" commit -m "描述本次改动"  # 产物 → main 分支
```

若需要清理 public-gh 里的旧产物（比如删了大文件），**只能**：
`cd public-gh && git rm -rfq . && git commit -m "clean"`
**绝对不要 `rm -rf public-gh`** —— 里面有独立的 `.git`，删了要重建仓库和远端历史。

### 步骤 3：推送（用 API 脚本，git push 走代理基本必失败）

```powershell
$env:PYTHONUTF8 = "1"     # ★ 不加会把中文路径解成 GBK，脚本静默失败（实测：只打印一行 Traceback 就退出）
$env:Path = "C:\Users\eiegant\.workbuddy\binaries\PortableGit\versions\1.2.0\cmd;" + $env:Path  # ★ 脚本内部要调 git（git credential fill），git 必须在本进程 PATH 里
$py = "C:\Users\eiegant\AppData\Local\Programs\Python\Python314\python.exe"
Set-Location "C:\Users\eiegant\WorkBuddy\2026-10-01-16-16-12"
& $py tools\gh_api_push.py "$site\public-gh" main
& $py tools\gh_api_push.py $site source
```

- 脚本从 `git credential fill` 取 token，无需手动填；输出会打印 `branch=… remote=… local=…`、`changed=… deleted=…`
- 输出以 `PUSH_OK <commit-sha>` 结尾即成功
- `urllib.error.URLError: <urlopen error [SSL: UNEXPECTED_EOF_WHILE_READING] …>` 是**本机常态**：脚本内置 5 次重试；失败就整条命令重跑（幂等）
- 若提示 `ALREADY_UP_TO_DATE` 但你明明改了 → 一定是**忘了 commit**，回去做步骤 2

### 步骤 4：同步备用链接
调用部署工具（`workbuddy_sites_deploy`）——**DSH 侧没有这个工具**，只能请用户在 WorkBuddy 里点部署：
目录 `academic-homepage/public`、`domainPrefix: songyu-academic-home`、`appName: 个人学术主页`。

### 步骤 5：验证

```powershell
$r = Get-Random
curl.exe -s -o NUL -w "home:%{http_code}`n" "https://songyu0903.github.io/?v=$r"
curl.exe -s -o NUL -w "blog:%{http_code}`n" "https://songyu0903.github.io/blog/?v=$r"
curl.exe -s -o NUL -w "note:%{http_code}`n" "https://songyu0903.github.io/blog/wasserstein-dro-portfolio/?v=$r"
curl.exe -s -o NUL -w "katex:%{http_code}`n" "https://songyu0903.github.io/katex/katex.min.js"
curl.exe -s -o NUL -w "bak:%{http_code}`n"  "https://songyu-academic-home.app.workbuddy.host/?v=$r"
```

- GitHub Pages 有约 1 分钟缓存；推送后轮询 2–4 轮（每轮 15 秒）即可看到新版本，用 `?v=$RANDOM` 绕过缓存
- 判断"新版本已生效"：首页 HTML 里出现 `book.min.<hash>.css`（旧版是 `css/_entry.<hash>.css`）
- 若样式全丢 → 检查 `static/.nojekyll` 是否存在（Jekyll 会忽略下划线开头的文件）
- 校验脚本里**不要用 `$home` 作变量名**（见 §7）

---

## 7. 坑清单（每一条都真实踩过）

| 坑 | 现象 | 解法 |
|---|---|---|
| `hugo` 不在 PATH | `无法将"hugo"项识别为 cmdlet…` | 用全路径 `tools\hugo\hugo.exe`（v0.167.0+extended） |
| 主题不入库 | 换机器/清目录后构建报找不到主题 | 按 §4 下载 Hugo Book 到 `themes\hugo-book` |
| GitHub Releases 资产域名被墙 | 下载 `katex.zip` 得到 **0 字节** | 改用 `codeload`（主题）/腾讯 npm 镜像（KaTeX） |
| 主题默认不渲染 H1 | 笔记页没有标题 | 站点 `layouts/single.html` 覆盖，用 `{{ partial "docs/title" . }}` 渲染 front matter 标题 |
| 首页没有左侧目录 | 首页用了主题 landing 版式（`landing.html` 清空 `menu-container`） | 去掉 `content/_index.md` 的 `layout: landing`，改用站点 `layouts/index.html`（默认 Book 版式，自带左侧目录树） |
| 侧栏目录为空 | 左侧只有站名 | `hugo.toml` 的 `BookSection` 必须指向存在的章节（`"*"` = 站点顶层） |
| 侧栏列出一堆文章标题 | 想要「大目录」却看到 17 篇笔记 | 用 `BookSection="*"` + `content/topics/` 做粗粒度目录，并给 `content/blog/_index.md`、`content/authors/_index.md` 及各笔记所在章节加 `bookHidden: true` |
| 新写的文章排到「全部笔记」最后一页 | 「全部笔记」按 front matter `weight` **升序**排，新文章若随手给个最大值（如 18）就会掉到第 2 页 | 新文章给 `weight: 1`，其余文章 weight 整体 +1（脚本 `C:\Users\eiegant\WorkBuddy\2026-10-01-16-16-12\tools\reorder_blog_weights.py`，幂等，既有相对顺序不变）；专题页顺序另由 `content/topics/<topic>/_index.md` 的 `notes:` 列表决定 |
| KaTeX 只显示源码 | 页面上是 `$…$` 原文 | 主题不带 `katex.min.js`：需 `static/katex/katex.min.js` + `inject/head.html` 里的 auto-render |
| LaTeX 转义被吃掉 | `\max\{p,2\}` 变成 `\max{p,2}` | `hugo.toml` 开 `[markup.goldmark.extensions.passthrough]`（block/inline 定界符） |
| `--minify` 去掉属性引号 | 校验正则 `href="/blog/` 全部 0 命中 | 校验时不要强制引号（写 `href=/blog/` 或用正则 `href=[""]?`） |
| `$home` 是只读自动变量 | `$home = @'…'@` 静默失败，文件被写成 16 字节路径 | 变量改名为 `$homeMd` 之类，**永远别用 `$home`** |
| `[regex]::Replace` 的 `$1` 未展开 | 文件第一行变成字面量 `$1weight: 1`，`---` 丢失 | 不要在此处依赖 `$1`；用 `ReadAllLines` 重建前两行 |
| 本机 pwsh 实为 Windows PowerShell 5.1 | `Set-Content -Encoding utf8NoBOM` 报"无法将标识符名称 utf8NoBOM 与有效的枚举器名称相匹配" | 写无 BOM UTF-8 用 `[System.IO.File]::WriteAllText($f,$t,(New-Object System.Text.UTF8Encoding($false)))` |
| 沙箱拦网络/写工作区外 | `curl: (35) schannel: AcquireCredentialsHandle failed: SEC_NO_CREDENTIALS`、`[sandbox: file access denied]` | 需要网络或写站点目录时申请放宽权限 |
| DSH 沙箱内 bash 不可用 | MSYS bash 启动即 `fatal error - NtCreateDirectoryObject(\BaseNamedObjects\msys-2.0S5-…): 0xC0000022` | 用 PowerShell 等价命令，别调 `bash tools/build.sh` |
| HugoBlox 时代的 `tools/build.sh` | 已于 2026-10-04 删除；若在旧笔记/旧终端里见到它，勿用（要 Go 模块 + Tailwind） | 直接用 §4 的 PowerShell 命令 |
| 删了 public-gh 的 .git | 远端历史丢失、推送异常 | 永远用 `git rm -rfq .`，不要 `rm -rf public-gh` |
| git push 失败 | 代理超时/中断 | 用 `tools/gh_api_push.py` |
| 推送脚本报 up-to-date 但没生效 | 忘了 commit | 先 `git status` 确认干净再推 |
| 推送脚本 `AttributeError: 'NoneType' object has no attribute 'strip'` | 中文路径被按 GBK 解码，`stdout` 为 None | 脚本 L20-24/L81-83 的 `subprocess.run` 已加 `encoding="utf-8", errors="replace"`；运行时另设 `$env:PYTHONUTF8="1"` |
| 备用站不自动更新 | 正式站已是新版，备用站还是旧版 | 只能由用户在 WorkBuddy 侧部署（DSH 无该工具） |

---

## 8. 常见任务 Playbook

**A. 新增一篇笔记**
新建 `content/blog/<slug>/index.md`（含 `weight`，正文不写 H1）→ 把 slug 加进 `content/topics/<topic>/_index.md` 的 `notes:`（六选一）→ 构建（§4）→ 两仓库 commit → 推两个分支（§6 步骤 3）→ curl 验证新 URL 与所属专题页均 200。

**B. 换头像**
覆盖 `static/media/authors/me.jpg`（JPG/PNG）→ 构建 → 提交推送 → 验证 `/media/authors/me.jpg` 200。

**C. 改个人简介 / 教育经历**
改 `content/about.md`（首页文案改 `content/_index.md`）→ 构建 → 提交推送 → 验证 `/about/`。

**D. 加 PDF 下载**
PDF 放 `static/uploads/` → 在 `_index.md`、`about.md` 或笔记里加 `[PDF](/uploads/xxx.pdf)` → 构建 → 同步。

**E. 调侧栏大目录 / 新建专题**
侧栏由 `hugo.toml` 的 `BookSection="*"` + `content/topics/` 决定：新建 `content/topics/<slug>/_index.md`（`weight` 定侧栏顺序、`notes: [笔记 slug…]` 定收录哪些笔记、正文写 2–3 句导语）就多一个侧栏大目录；笔记顺序改各笔记 `weight`；笔记只用 `##` 及以下标题（ToC 从 2 级起）。

---

## 9. 当前状态快照（2026-10-04 起按时间倒序追加）

> 以下各条是当时的状态记录；**"当前状态"以最后一条为准**（例如侧栏条目数、文章篇数会随更新变化）。

- **主题**：**Hugo Book**（`github.com/alex-shpak/hugo-book`，min_version 0.158.0，本机 Hugo v0.167.0+extended；主题不入库，vendored 于 `themes/hugo-book`）
- **版式**：首页与所有页面统一 Book 标准版式（**左侧大目录树** + 正文）；侧栏 = 「👤 关于」+「📝 笔记专题」（展开 6 个专题页：分布鲁棒与鲁棒优化 / 估计误差与高维统计 / 风险度量与组合结构 / 动态与计算 / 策略评估与决策聚焦学习 / 研究入门与写作工具），底部 `menu.after` = 📚 全部笔记 / 🐙 GitHub；**侧栏不列单篇笔记标题**（笔记与 `/blog/`、`/authors/` 均 `bookHidden: true`）；`/blog/` = 「📝 全部笔记」分页 10/页 + `/blog/page/2/` 8 篇；专题页按 front matter `notes:` 列出该方向笔记（2/2/3/3/2/6 = 18 篇）；KaTeX 前端渲染；搜索框（MiniSearch）；深色/浅色自动（`BookTheme="auto"`）
- **源码仓库最新提交**：`51a0fa3 Blog: new post on tikzDevice + XeLaTeX (R figures as TikZ); homepage count 18; topic list; weights shifted so newest is first` → 已推送 `PUSH_OK bff0258`（source 分支）；此后若仅更新本文档，可能另有提交，以 `git -C <site> log -1` 为准
- **产物仓库最新提交**：`d91976e Publish new post: R figures rendered as TikZ with tikzDevice (localized demo figure, tag page R)` → 已推送 `PUSH_OK cfbc49c`（main 分支）
- **构建**：`Pages 142`、`Static files 50`、83 个 HTML、无 localhost/livereload 污染
- **头像**：`static/media/authors/me.jpg`（用户提供的 logo.jpg，19 059 字节，URL `/media/authors/me.jpg`）
- **已发布文章**（`content/blog/`，共 **17 篇**）：原有 5 篇 `portfolio-optimization`、`thesis-proposal`、`vscode-setup`、`math-typesetting`、`writing-workflow`；2026-10-04 新增 12 篇文献调研笔记 —— `wasserstein-dro-portfolio`、`robust-portfolio-uncertainty-sets`、`high-dim-covariance-estimation`、`end-to-end-portfolio-learning`、`risk-measures-cvar-spectral-drawdown`、`factor-models-sparsity-cardinality`、`mean-estimation-error-and-1n-paradox`、`multiperiod-portfolio-and-transaction-costs`、`backtest-overfitting-and-strategy-evaluation`、`large-scale-portfolio-optimization-algorithms`、`dynamic-risk-measures-time-consistency`、`risk-parity-and-risk-budgeting`；2026-10-05 新增 1 篇工具笔记 `r-tikz-figures`（「让 R 图直出 LaTeX：tikzDevice 的配置方案与踩坑记录」，weight 1，页内配图 `fig-tikz-demo.png`，tag「R」）
- **侧栏专题分组**（`content/topics/`，侧栏顺序按 weight 1–6）：`dro-robust` ← wasserstein-dro-portfolio, robust-portfolio-uncertainty-sets；`estimation-highdim` ← mean-estimation-error-and-1n-paradox, high-dim-covariance-estimation；`risk-structure` ← risk-measures-cvar-spectral-drawdown, factor-models-sparsity-cardinality, risk-parity-and-risk-budgeting；`dynamic-compute` ← multiperiod-portfolio-and-transaction-costs, dynamic-risk-measures-time-consistency, large-scale-portfolio-optimization-algorithms；`evaluation-learning` ← backtest-overfitting-and-strategy-evaluation, end-to-end-portfolio-learning；`research-writing` ← r-tikz-figures, portfolio-optimization, thesis-proposal, math-typesetting, vscode-setup, writing-workflow
- **2026-10-04 本地清理（旧主题残留与缓存，共约 45.9 MB）**：已删 `node_modules/`(18.5MB，HugoBlox/Tailwind)、`resources/`(5.3MB，Hugo 资源缓存)、`_blox-backup/`、`data/authors/me.yaml`(HugoBlox 作者档案)、`assets/media/`(含 421KB slides-logo.svg)、`assets/jsconfig.json`、`.github/workflows/hugo.yml`(旧 Actions 工作流，本就只在 source 分支、不影响 main 的 Pages 部署)、`.hugo_build.lock`、`%TEMP%\hb`(19.4MB 主题/KaTeX 下载暂存)、`%LOCALAPPDATA%\hugo_cache`(2.6MB Hugo Modules 缓存)、`tools/build.sh`、`hugo_gh.txt`/`hugo_out.txt`(旧构建日志)。清理后重建输出与清理前逐字节一致（`Pages 139`、81 个 HTML），`README.md` 已改写为 Hugo Book 版
- **2026-10-04 视觉样式（参考 sun0225SUN 个人主页）**：①**首页与「👤 关于」页都显示本地化徽章墙**（15 个扁平徽章，分「编程与数值计算 / 写作与科研工作流 / 开发与站点工具」三行）—— 首页在标题与简介下方新增「🛠 技术栈」小节（右侧目录树也会列出），关于页在「🛠 技能」小节；两页共用短代码 `layouts/_shortcodes/badges.html`（正文写 `{{< badges >}}`），改一处两页同步；图片在 `static/badges/`；②首页标题 `# songyu0903` 下加**打字动画**（`static/typing/typing-dark.svg` / `typing-light.svg`，用 `<picture>` + `prefers-color-scheme` 自动切明暗）；③`assets/styles/custom.css` 增 `.badges`（flex 换行、gap 6px、图高 20px）与 `.typing`（`max-width:100%`）样式；④新增可重跑脚本 `tools/fetch_badges.ps1`（改 `$badges` 列表即可重下徽章）。**图片类资源全部本地化**（未搬 sun0225SUN 的 github-readme-stats / streak / wakatime / skillicons 等 vercel·heroku 卡片，国内访问不稳）；唯一的外部服务依赖是⑤的访客计数徽章。构建后 `Static files 31 → 48`（+15 徽章 +2 打字动画）
- **GitHub Pages 已同步并逐页验证**：`/`、`/about/`、`/blog/`、`/blog/page/2/`、`/tags/`、`/index.xml`、`/sitemap.xml`、`/robots.txt`、`/404.html` 及 **17/17 篇笔记详情页全部 200**；`/katex/katex.min.js`、`/katex/katex.min.css`、`/katex/contrib/auto-render.min.js`、`/katex/fonts/KaTeX_Main-Regular.woff2`、`/minisearch.min.js`、`/favicon.ico`、`/media/authors/me.jpg`、`/uploads/resume.pdf` 均 200；旧 HugoBlox 资源（`/backlinks.json`、`/_headers`、`/_redirects`、`/css/_entry.*.css`、`/js/hb-*.js`、`/publication_types/`）**全部 404**
- **2026-10-04 视觉样式上线后复验（GitHub Pages）**：**首页**与 `/about/` 均含 **15** 个 `/badges/*.svg` 引用（首页在「🛠 技术栈」小节，标题与简介下方，右侧目录树也列出该项）；`/badges/python.svg` 200（3102 B）、`/badges/matlab.svg` 200（988 B）、`/badges/hugo.svg` 200（2008 B）；首页含 `/typing/typing-dark.svg` 与 `/typing/typing-light.svg` 两个引用且两者均 200（各 10 793 B）；新 CSS `book.min.de9cec6e…css` 200（20 025 B）、旧 `book.min.246490aa…css` **404**（旧哈希资源已在远端删除）
- **2026-10-04 首页访客计数**：新增 `layouts/_shortcodes/visitors.html`（首页正文末尾 `{{< visitors >}}`），徽章服务 `https://visitor-badge.laobi.icu/badge?page_id=songyu0903.github.io&left_text=visits`，右下角小块（`.visitors`，右对齐、透明度 .85）。**全站唯一的外部服务依赖**：实测国内直连 ≈1.0 s、`Cache-Control: no-cache`（每次加载真实 +1，不会被缓存吞掉）；实测**不可用**的方案 —— busuanzi 的不蒜子（JS 能下但计数接口 `busuanzi.ibruce.info/busuanzi` 25 s 超时）、`hits.seeyoufarm.com`（DNS 解析失败）、`api.vercount.one`（DNS 解析失败）；`komarev.com` 可用但 ≈2.1 s（作为备选 URL 写进 §5）。页面加载失败时 `onerror` 整块隐藏、不留破图。CSS 哈希 `de9cec6e → a5543f11`（20 211 B，含 `.visitors`）；新旧哈希资源在 `public/` 与 `public-gh/` 均只保留最新一份。**线上复验（GitHub Pages）**：首页含 1 处 `visitor-badge.laobi.icu` 引用与 `class=visitors`，徽章仍 15 个、打字动画两张均在；`/book.min.a5543f11…css` 200（20 211 B）、旧 `/book.min.de9cec6e…css` **404**；`/about/` 200 且**不含**该计数（只在首页）；线上首页与本地 `public-gh/index.html` **逐字节一致**（各 10 338 B）；计数服务本身实测返回 `[访问量][visits|N]` 且 `Cache-Control: no-cache`
- **2026-10-04 站点显示名改为 `Y.S`**：首页 H1 `# songyu0903 → # Y.S`（标题锚点随之变为 `#ys`）、`hugo.toml` 的站点 `title` 与 `[languages.zh].title` 均改为 `Y.S`（影响浏览器标签页标题、侧栏左上角品牌、RSS 标题）、关于页头像 `alt` 与正文署名改为 `Y.S`。**功能标识一律未动**：`baseURL`、GitHub 链接（`https://github.com/songyu0903`）、访客计数 `page_id=songyu0903.github.io`（改了会把计数清零）。构建 `Pages 139 / Static files 48`；搜索索引哈希随之变化（`zh.search-data bdd1e88a → 1dd60f1b`、`zh.search.min 9f941e6c → 5a9a0648`），旧的两个搜索资源已在 `public/`、`public-gh/` 与远端删除；CSS 哈希不变（`a5543f11`）。**线上复验（GitHub Pages）**：首页标题 `🏠 首页 • Y.S`、H1 `Y.S`、侧栏品牌 `<span>Y.S</span>`；页面上剩下的 6 处 `songyu0903` **全是 URL**（`og:url`、`canonical`、RSS `<link>`、两处 `github.com/songyu0903`、访客计数 `page_id`）；`/about/` 标题 `👤 关于 • Y.S`、头像 `alt=Y.S`、徽章仍 15 个；新搜索资源 200 / 旧的两个 404；首页与本地 `public-gh/index.html` **逐字节一致**（10 266 B，SHA256 `C95B367D3ABE70B237B34479DC066409E461A707A57D297341E571933E3D3949`），`/about/` 同为 9 396 B 逐字节一致
- **2026-10-04 首页「📈 GitHub 活跃度」热力图贪吃蛇（用户要求：参考图是 GitHub 贡献日历 + 紫色小蛇）**：新增 `static/heatmap/snake.svg`（15 150 B，自包含 SMIL 动效，**运行时不依赖任何外部服务**）；`content/_index.md` 在「📝 阅读笔记」之后加「📈 GitHub 活跃度」小节（右侧目录树自动多出第 4 项）：图外包 `https://github.com/songyu0903` 链接，下面一行 `.heatmap-note` 说明「小蛇每跑一趟，会把有贡献的格子依次吃掉一遍」；`assets/styles/custom.css` 加 `.heatmap img{max-width:100%;height:auto}` 与 `.heatmap-note`。数据＝GitHub 贡献日历 `https://github-contributions-api.jogruber.de/v4/songyu0903?y=last`（本机直连 200、≈4 s；`github.com/users/<user>/contributions` 在本机被重置不可用）：**近一年 65 次贡献、8 天有贡献、单日最多 33 次**，范围 2025-10-05～2026-10-04（53 周 × 7 天）。生成脚本 `tools/gen_heatmap_snake.py`：把 371 个格子中心连成上下往返的折线（和 snk 走法一致），蛇身 7 节用 `animateMotion` 沿折线匀速滑动（18 s 一趟；折线两端各延伸 10 格到画面外，所以循环时整条蛇都在画面外、看不到跳变），**有贡献的格子**用 `animate opacity` 在蛇头经过时消失、一趟走完再恢复；空格子合并成一条 `<path>`（体积小）；明暗色、月份标签（英文 Oct/Nov…，避免 CJK 字形与裁切问题）与右下角统计文字都在 SVG 内（`prefers-color-scheme`）。CSS 哈希 `a5543f11 → fc1de341`（20 310 B，含 `.heatmap`/`.heatmap-note`），旧哈希在 `public/`、`public-gh/` 与远端删除；构建 `Pages 139 / Static files 49`（+1 个 SVG）。**线上复验（GitHub Pages）**：首页含 `/heatmap/snake.svg` 引用与 `.heatmap-note` 说明、右侧目录树 4 项、徽章仍 15 个、访客计数与打字动画均在；`/heatmap/snake.svg` 200（15 150 B）；新 CSS `book.min.fc1de341…css` 200（20 310 B）、旧 `book.min.a5543f11…css` **404**；`/badges/python.svg` 200（3 102 B）、`/typing/typing-light.svg` 200（10 793 B）、`/about/` 200（9 396 B）、`/blog/` 200（11 016 B）；首页与本地 `public-gh/index.html` **逐字节一致**（10 782 B，SHA256 `7C824E3521AE6DBC…`）
- **2026-10-04 技术栈徽章墙加「R」（用户要求：在学术主页加一个 R 语言的徽章）**：新增 `static/badges/r.svg`（**2 242 B**，label=`R`、color=`276DC3`、`logo=r` 走 simple-icons 的 R 图标，新徽章实测 **logo-ok**）；`tools/fetch_badges.ps1` 的 `$badges` 列表在 Python 之后加一条 R；`layouts/_shortcodes/badges.html` 在 `/badges/python.svg` 那一行之后插入 `<img src="/badges/r.svg" alt="R" height="20" />`（首页「🛠 技术栈」与关于页「🛠 技能」共用该短代码，改一处两页同步）。徽章墙 **15 → 16 枚**，`Static files 49 → 50`；CSS 哈希不变（仍 `book.min.fc1de341…css`，未动样式），搜索索引不变。**线上复验（GitHub Pages）**：`/badges/r.svg` 200（2 242 B，SHA256 `18AD5445…`，与本地一致）；首页 **16** 处 `/badges/*.svg`（含 1 处 `r.svg`）、`/about/` 200（9 436 B，含 1 处 `r.svg`）；首页与本地 `public-gh/index.html` **逐字节一致**（10 822 B，SHA256 `EEEB1BB1CFCB9D29EAD945E6B290D80D06C3E197802E998B499A573ACF9054F1`）
- **2026-10-05 新增论文写作模板 `PAPER-TEMPLATE.md`（用户要求：「我想借助 codex 写一些论文放到主页，请给我书写模板，书写好后我给你，由你负责同步」）**：仓库根目录新增 `academic-homepage/PAPER-TEMPLATE.md`（**不参与构建**，Hugo 只读 `content/`），内含 ① 目录与 slug 命名约定（`content/papers/<slug>/` + 插图同目录）② front matter 模板（含 `pdf` / `code` / `doi` / `status` / `bookHidden` 可选字段）③ 正文骨架表（引言结论先行 → 问题设定 → 方法 → 数值实验 → 结论与展望 → 复现说明 → 参考文献，2500–5000 字）④ **KaTeX 限制**：`\label`/`\eqref`/`\ref`/`\begin{equation}`/`\begin{align}` 一律不可用，引用公式手写「式 (1)」⑤ 图注规范（画的是什么 + 数据来源；合成数据显式标注；插图优先 tikz 渲染，PDF 转 PNG 用 `pdftoppm -png -r 300 -singlefile`）⑥ 交付清单与「我收到后做什么」⑦ 可直接粘贴给 Codex 的长提示词（含 11 条硬约束 + 输出前自检）⑧ 定稿自检清单。**顺带修了 §5 旧模板里的错误示例**：原来写 `weight: 18`，与「新文章要给 `weight: 1`、其余 +1」的规则矛盾，已改成 `weight: 1` 并把规则写进该小节。论文同步流程（建 `content/papers/<slug>/`、首次同时建 `_index.md`、首页插 `## 📄 论文` 小节、两仓库提交推送、线上复验）见 §5「新增一篇论文」。
- **2026-10-05 新增工具笔记「让 R 图直出 LaTeX：tikzDevice 的配置方案与踩坑记录」（用户要求：介绍 R 里用 tikz 渲染的配置方案）**：新文章 `content/blog/r-tikz-figures/index.md`（weight 1，正文不写 H1）+ 页内配图 `fig-tikz-demo.png`（62 646 B，tikzDevice + XeLaTeX 渲染的三面板图预览，由 `figures/robust_portfolio_demo/preview_tikz.png` 拷入页面 bundle）；内容含三套方案对照（tikzDevice+XeLaTeX+xeCJK / tikzDevice+pdfLaTeX / cairo_pdf）、可复制的最小配置、四个坑的根因表（`[T1]{fontenc}`×`xeCJK`、xeCJK requires XeTeX、standalone 整页裁切、plotmath 的 `\char-964`）、标签写法速查与四项自检。首页「📝 阅读笔记」计数 17 → 18 并补一句主题描述；专题 `research-writing` 的 `notes:` 首位加入该文（2/2/3/3/2/6 = 18 篇）；新增 tag「R」→ `tags/r/`。**顺带修了排序问题**：站点「全部笔记」按 `weight` 升序，新文章原先给 18 会掉到第 2 页，已把所有文章 weight 整体 +1、新文章置 1（脚本 `C:\Users\eiegant\WorkBuddy\2026-10-01-16-16-12\tools\reorder_blog_weights.py`，幂等），既有文章相对顺序不变。构建 `Pages 139 → 142`、`Static files 50`、81 → 83 个 HTML（+1 文章页 +1 tag 页 +1 taxonomy RSS）；搜索索引哈希更新（`zh.search.min 5a9a0648 → 1cca8f43`、`zh.search-data 1dd60f1b → 5d3d4226`），旧哈希在本地与远端均已删除；CSS 不变（`fc1de341`）。**线上复验（GitHub Pages）**：`/blog/r-tikz-figures/` 200（19 676 B）、配图 200（62 646 B）、`/blog/` 200（10 974 B，首篇即新文章）、`/blog/page/2/` 200（9 217 B）、`/topics/research-writing/` 200（8 432 B，含新文章）、`/tags/r/` 200（5 376 B）、`/` 200（10 849 B，含「共 18 篇」）——以上**全部与本地逐字节一致**；新搜索索引 200、旧 404。
- **2026-10-04 动效验证方法（可复用）**：`python -m http.server <port> --directory public-gh` 起本地服务，再用 Edge 无头截图（`msedge.exe --headless=new --disable-gpu --user-data-dir=<临时目录> --window-size=720,200 --virtual-time-budget=3000 --screenshot=<png> <url>`；**必须给 `--user-data-dir`**，否则会去碰用户正在用的 Edge 配置），分别取 3 s 与 11 s 两帧对比：蛇的位置不同、且先前有贡献的格子已消失 → 证明 SMIL 动画在 `<img>` 里真的在跑。注意 `--virtual-time-budget` 的采样点可能落在擦除/切换瞬间（打字动画在 6 s 时几乎空白属正常，3 s 帧能看到 `M.Sc. in Mathematics`），别据此误判成坏图
- **构建必须在站点目录内执行**（本次踩坑）：`-d public` 是相对**当前目录**的，在别处运行会生成一个空站点。本次误在 `C:\Users\eiegant\Desktop\投资组合优化` 生成了 `public/`、`public-gh/`（各 4 个 XML）与 `.hugo_build.lock`，已全部删除；正确做法是先 `Set-Location $site`（或在 pwsh 工具里用 `workdir`），再看输出里的 `Pages │ 139`、`Static files │ 49`
- **备用链接 https://songyu-academic-home.app.workbuddy.host/ 仍为旧版**（仍含 `css/_entry.*.css`）—— DSH 侧没有 `workbuddy_sites_deploy` 工具，只能由用户在 WorkBuddy 里点部署
- **2026-10-05 8 篇论文上线 `/papers/`，旧的 14 篇组合优化文章下线**（用户要求：`这里面是8篇推文，请推送到我的学术主页，删去我以前写的关于投资组合优化的文章`；删除范围经用户确认）：
  - 来源：`C:\Users\eiegant\Desktop\投资组合优化\主页推文\content\papers`（8 个 page bundle，合计 1 992 034 B）**整目录拷入**站点 `content/papers/`：`wasserstein-cvar-portfolio`、`high-dimensional-shrinkage`、`heavy-tail-robust-estimation`、`transaction-cost-regularization`、`decision-focused-portfolio`、`conformal-risk-calibration`、`time-consistent-dynamic-risk`、`moment-shortfall-sos`（front matter 已是 `date: 2026-10-05`、`status: "working paper"`、`bookHidden: true`、weight 1–8，与 README 顺序一致，未改动正文）。新增 `content/papers/_index.md`（`title: "📄 论文"`、`weight: 3`、不 bookHidden）→ 侧栏变为「👤 关于」→「📝 笔记专题」（6 个专题）→「📄 论文」。
  - **删除 14 篇**：12 篇阅读笔记（`wasserstein-dro-portfolio`、`robust-portfolio-uncertainty-sets`、`high-dim-covariance-estimation`、`end-to-end-portfolio-learning`、`risk-measures-cvar-spectral-drawdown`、`factor-models-sparsity-cardinality`、`mean-estimation-error-and-1n-paradox`、`multiperiod-portfolio-and-transaction-costs`、`backtest-overfitting-and-strategy-evaluation`、`large-scale-portfolio-optimization-algorithms`、`dynamic-risk-measures-time-consistency`、`risk-parity-and-risk-budgeting`）+ `portfolio-optimization` + `thesis-proposal`；只保留 4 篇工具/写作笔记（`r-tikz-figures`、`math-typesetting`、`vscode-setup`、`writing-workflow`）。副作用：`/blog/` 只剩 1 页（`Paginator pages 0`），`/blog/page/2/` 与 `/papers/page/1/` 之外的分页页不再生成。
  - 站点侧改动：首页 `content/_index.md` 新增 `## 📄 论文` 小节（8 条 `- **[短标题](/papers/<slug>/)**：一句话`），`## 📝 阅读笔记` 改为「共 4 篇」；`content/topics/_index.md`（改为「8 篇论文 + 4 篇笔记」）、`content/blog/_index.md`、`content/about.md`（新增 `- 论文：[论文列表](/papers/)`）同步改写；6 个专题页 `notes:` 改为指向论文 slug（dro-robust←wasserstein；estimation-highdim←shrinkage+heavy-tail；risk-structure←moment-shortfall-sos；dynamic-compute←transaction-cost+time-consistent；evaluation-learning←decision-focused+conformal；research-writing 保留 4 篇笔记）。
  - **`layouts/list.html` 关键改动**（专题页同时支持笔记与论文）：`{{- $p := $.Site.GetPage (printf "/blog/%s" .) }}` / `{{- if not $p }}{{ $p = $.Site.GetPage (printf "/papers/%s" .) }}{{ end }}` / `{{- with $p }}`。
  - 构建（§4 全流程）：`Pages 142 → 108`、`Static files 50`、`Non-page files 51`、HTML 83 → 55；CSS 哈希不变（`book.min.fc1de341…css`）；搜索索引 `zh.search-data 5d3d4226 → cc43a68d`、`zh.search.min 1cca8f43 → c30b566f`（旧的已随推送在远端删除）。`figures-list.md` 未发布、未生成多余页面；论文目录里的 `reproduce.py|.R` 与结果 CSV/JSON 作为页面资源发布（可直接下载）。
  - 提交与推送：源码 `2665eff`（source）、产物 `b36c26a`（main）；`PUSH_OK 7928346`（main，changed=129 deleted=85）、`PUSH_OK 912f5c3`（source，changed=78 deleted=14）。
  - **线上复验（GitHub Pages）**：`/`、`/papers/`、`/about/`、`/blog/`、`/topics/`、`/topics/dro-robust/`、`/topics/research-writing/` 与 **8 篇 `/papers/<slug>/` 全部 200**；`/papers/wasserstein-cvar-portfolio/fig1.png`、`…/reproduce.py`、`/papers/moment-shortfall-sos/reproduce.R`、`/katex/katex.min.js` 均 200；已删的 `/blog/wasserstein-dro-portfolio/`、`/blog/portfolio-optimization/` 均 **404**；首页含「共 8 篇」「共 4 篇」、8 条 `/papers/` 链接与侧栏「📄 论文」，`/blog/` 只剩 4 篇笔记；`index.html`、`papers/index.html`、`papers/wasserstein-cvar-portfolio/index.html`、`topics/dro-robust/index.html`、`topics/research-writing/index.html`、`blog/index.html`、`about/index.html`、`sitemap.xml` 与本地 `public-gh/` **逐字节一致**。
  - 公式链路未变：构建产物里保留 `$…$` / `$$…$$` 原文（例：`$$ P=\Sigma^{-1}-\frac{ss^{\top}}{\mathbf1^{\top}s}. \tag{2} $$`），由前端 KaTeX auto-render 渲染，与既有笔记同一约定。

---
## 10. 接手第一步建议

```powershell
$site = "C:\Users\eiegant\WorkBuddy\2026-10-01-16-16-12\academic-homepage"
$hugo = "C:\Users\eiegant\WorkBuddy\2026-10-01-16-16-12\tools\hugo\hugo.exe"
"themes_ok=" + (Test-Path "$site\themes\hugo-book\theme.toml")
Set-Location $site; & $hugo --minify            # 期望 Pages │ 139、exit=0
curl.exe -s "https://songyu0903.github.io/" | Select-String -Pattern "book\.min\." -Quiet
```

三分钟内能跑通这三步，说明环境完全就绪，可以直接开始改内容。
