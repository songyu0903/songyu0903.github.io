# 交接文档：个人学术主页维护

> 接收方：deepseek harness（接替原助手维护 songyu0903 的学术主页）
> 交接时间：2026-10-03 ／ 最后更新：2026-10-04（主题更换为 Hugo Book）
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
│   │   ├── blog/<slug>/index.md# 笔记文章（17 篇；weight 定"全部笔记"列表顺序，bookHidden 使其不进侧栏）
│   │   ├── blog/_index.md      # 「📝 全部笔记」页（bookHidden: true）
│   │   └── topics/<topic>/_index.md # 6 个专题页 = 侧栏大目录（front matter notes: [笔记 slug…]）
│   ├── layouts/
│   │   ├── index.html          # 首页版式（标准 Book 版式 → 保留左侧目录）
│   │   ├── single.html         # 覆盖主题：渲染 front matter 标题 + 日期（主题默认不渲染 H1）
│   │   ├── list.html           # section 列表：有 notes: 则列该专题笔记，否则分页列出（/blog/ 10/页）
│   │   ├── term.html / taxonomy.html  # 标签页
│   │   └── _partials/docs/inject/head.html  # ★ 注入 KaTeX 前端 auto-render
│   ├── assets/styles/custom.css# 站点自定义样式（主题最后加载，可覆盖主题）
│   ├── static/
│   │   ├── .nojekyll           # 必留！GitHub Pages 修复下划线资源 404
│   │   ├── katex/              # ★ 前端 KaTeX（JS 由本仓库提供，CSS/字体主题也有）
│   │   ├── media/authors/me.jpg# 头像（URL /media/authors/me.jpg）
│   │   └── uploads/resume.pdf
│   ├── themes/hugo-book/       # Hugo Book 主题（**不入库**，获取方式见 §4）
│   ├── _blox-backup/           # 旧 HugoBlox 配置备份（不入库，仅本机留档）
│   ├── public/                 # 构建产物 A（→ 备用链接）
│   └── public-gh/              # 构建产物 B（独立 git 仓库 → main 分支）
├── tools/
│   ├── hugo/hugo.exe           # Hugo extended v0.167.0（★ 不在 PATH，必须用全路径）
│   ├── gh_api_push.py          # 走 REST API 推送（git push 走代理基本必失败）
│   └── build.sh                # 旧 HugoBlox 构建脚本（**已失效，勿用**）
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

- 成功标志：`exit=0`，摘要 `Pages │ 139` 左右，`Static files │ 31`
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
| 个人简介 / 教育 / 研究兴趣 / 技能 / 语言 / 链接 | `content/about.md` | 原先由 `data/authors/me.yaml` 渲染，现已写成正文；`data/authors/me.yaml` 仅作留档 |
| 新增/修改一篇笔记 | `content/blog/<slug>/index.md` | front matter：`title / date / summary / tags / weight`；**正文不要写 H1**（`layouts/single.html` 已用 title 渲染标题）；**写完还要把 slug 加进对应专题页的 `notes:` 列表**，否则专题页不显示它 |
| 笔记在「全部笔记」列表里的顺序 | 各笔记 front matter 的 `weight` | 数值越小越靠前；当前 1–17（侧栏**不**列单篇笔记） |
| 侧栏大目录（专题分组） | `content/topics/<topic>/_index.md` | `weight`（1–6）定侧栏顺序、`notes: [笔记 slug…]` 定该专题收录哪些笔记；`content/topics/_index.md` 是目录树的根 |
| 全部笔记页导语 | `content/blog/_index.md` | 「📝 全部笔记」页；`bookHidden: true` 使其不单独出现在侧栏目录树 |
| 头像 | 覆盖 `static/media/authors/me.jpg` | URL 固定 `/media/authors/me.jpg` |
| 公式渲染 | `layouts/_partials/docs/inject/head.html` | 前端 KaTeX（auto-render），改动前先读主题同名文件 |
| 版式微调 | `assets/styles/custom.css` | 主题 `assets/styles/index.yaml` 中最后加载，可覆盖主题 |

### 新增一篇文章（模板）

```markdown
---
weight: 18
title: "文章标题"
date: 2026-10-05
summary: "一两句话摘要。"
tags: ["投资组合优化", "鲁棒优化"]
---

正文，支持 KaTeX：

$$\min_{w}\ w^{\top}\Sigma w \quad \text{s.t.} \quad w^{\top}\mathbf{1}=1$$
```

写完新笔记后：① 把 slug 加进对应专题页 `content/topics/<topic>/_index.md` 的 `notes:` 列表（六选一，否则侧栏专题页里看不到它）；② `weight` 决定「全部笔记」列表顺序 → 构建（§4）→ 两仓库提交 → 推送两个分支 → 验证。

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
$env:PYTHONUTF8 = "1"     # ★ 不加会把中文路径解成 GBK，脚本静默失败
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
| KaTeX 只显示源码 | 页面上是 `$…$` 原文 | 主题不带 `katex.min.js`：需 `static/katex/katex.min.js` + `inject/head.html` 里的 auto-render |
| LaTeX 转义被吃掉 | `\max\{p,2\}` 变成 `\max{p,2}` | `hugo.toml` 开 `[markup.goldmark.extensions.passthrough]`（block/inline 定界符） |
| `--minify` 去掉属性引号 | 校验正则 `href="/blog/` 全部 0 命中 | 校验时不要强制引号（写 `href=/blog/` 或用正则 `href=[""]?`） |
| `$home` 是只读自动变量 | `$home = @'…'@` 静默失败，文件被写成 16 字节路径 | 变量改名为 `$homeMd` 之类，**永远别用 `$home`** |
| `[regex]::Replace` 的 `$1` 未展开 | 文件第一行变成字面量 `$1weight: 1`，`---` 丢失 | 不要在此处依赖 `$1`；用 `ReadAllLines` 重建前两行 |
| 本机 pwsh 实为 Windows PowerShell 5.1 | `Set-Content -Encoding utf8NoBOM` 报"无法将标识符名称 utf8NoBOM 与有效的枚举器名称相匹配" | 写无 BOM UTF-8 用 `[System.IO.File]::WriteAllText($f,$t,(New-Object System.Text.UTF8Encoding($false)))` |
| 沙箱拦网络/写工作区外 | `curl: (35) schannel: AcquireCredentialsHandle failed: SEC_NO_CREDENTIALS`、`[sandbox: file access denied]` | 需要网络或写站点目录时申请放宽权限 |
| DSH 沙箱内 bash 不可用 | MSYS bash 启动即 `fatal error - NtCreateDirectoryObject(\BaseNamedObjects\msys-2.0S5-…): 0xC0000022` | 用 PowerShell 等价命令，别调 `bash tools/build.sh` |
| HugoBlox 时代的 `tools/build.sh` | 已失效（要 Go 模块 + Tailwind） | 直接用 §4 的 PowerShell 命令 |
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

## 9. 当前状态快照（2026-10-04）

- **主题**：**Hugo Book**（`github.com/alex-shpak/hugo-book`，min_version 0.158.0，本机 Hugo v0.167.0+extended；主题不入库，vendored 于 `themes/hugo-book`）
- **版式**：首页与所有页面统一 Book 标准版式（**左侧大目录树** + 正文）；侧栏 = 「👤 关于」+「📝 笔记专题」（展开 6 个专题页：分布鲁棒与鲁棒优化 / 估计误差与高维统计 / 风险度量与组合结构 / 动态与计算 / 策略评估与决策聚焦学习 / 研究入门与写作工具），底部 `menu.after` = 📚 全部笔记 / 🐙 GitHub；**侧栏不列单篇笔记标题**（笔记与 `/blog/`、`/authors/` 均 `bookHidden: true`）；`/blog/` = 「📝 全部笔记」分页 10/页 + `/blog/page/2/` 7 篇；专题页按 front matter `notes:` 列出该方向笔记（2/2/3/3/2/5 = 17 篇）；KaTeX 前端渲染；搜索框（MiniSearch）；深色/浅色自动（`BookTheme="auto"`）
- **源码仓库最新提交**：`fc4a1dc Sidebar: group notes into six topic sections (big directory instead of article titles)` → 已推送 `PUSH_OK a0303d5`（source 分支）；此后若仅更新本文档，可能另有提交，以 `git -C <site> log -1` 为准
- **产物仓库最新提交**：`b989f31 Sidebar: group notes into six topic sections` → 已推送 `PUSH_OK ee895cc`（main 分支）
- **构建**：`Pages 139`、`Static files 31`、81 个 HTML、无 localhost/livereload 污染
- **头像**：`static/media/authors/me.jpg`（用户提供的 logo.jpg，19 059 字节，URL `/media/authors/me.jpg`）
- **已发布文章**（`content/blog/`，共 **17 篇**）：原有 5 篇 `portfolio-optimization`、`thesis-proposal`、`vscode-setup`、`math-typesetting`、`writing-workflow`；2026-10-04 新增 12 篇文献调研笔记 —— `wasserstein-dro-portfolio`、`robust-portfolio-uncertainty-sets`、`high-dim-covariance-estimation`、`end-to-end-portfolio-learning`、`risk-measures-cvar-spectral-drawdown`、`factor-models-sparsity-cardinality`、`mean-estimation-error-and-1n-paradox`、`multiperiod-portfolio-and-transaction-costs`、`backtest-overfitting-and-strategy-evaluation`、`large-scale-portfolio-optimization-algorithms`、`dynamic-risk-measures-time-consistency`、`risk-parity-and-risk-budgeting`
- **侧栏专题分组**（`content/topics/`，侧栏顺序按 weight 1–6）：`dro-robust` ← wasserstein-dro-portfolio, robust-portfolio-uncertainty-sets；`estimation-highdim` ← mean-estimation-error-and-1n-paradox, high-dim-covariance-estimation；`risk-structure` ← risk-measures-cvar-spectral-drawdown, factor-models-sparsity-cardinality, risk-parity-and-risk-budgeting；`dynamic-compute` ← multiperiod-portfolio-and-transaction-costs, dynamic-risk-measures-time-consistency, large-scale-portfolio-optimization-algorithms；`evaluation-learning` ← backtest-overfitting-and-strategy-evaluation, end-to-end-portfolio-learning；`research-writing` ← portfolio-optimization, thesis-proposal, math-typesetting, vscode-setup, writing-workflow
- **GitHub Pages 已同步并逐页验证**：`/`、`/about/`、`/blog/`、`/blog/page/2/`、`/tags/`、`/index.xml`、`/sitemap.xml`、`/robots.txt`、`/404.html` 及 **17/17 篇笔记详情页全部 200**；`/katex/katex.min.js`、`/katex/katex.min.css`、`/katex/contrib/auto-render.min.js`、`/katex/fonts/KaTeX_Main-Regular.woff2`、`/minisearch.min.js`、`/favicon.ico`、`/media/authors/me.jpg`、`/uploads/resume.pdf` 均 200；旧 HugoBlox 资源（`/backlinks.json`、`/_headers`、`/_redirects`、`/css/_entry.*.css`、`/js/hb-*.js`、`/publication_types/`）**全部 404**
- **备用链接 https://songyu-academic-home.app.workbuddy.host/ 仍为旧版**（仍含 `css/_entry.*.css`）—— DSH 侧没有 `workbuddy_sites_deploy` 工具，只能由用户在 WorkBuddy 里点部署

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
