# 交接文档：个人学术主页维护

> 接收方：deepseek harness（接替原助手维护 songyu0903 的学术主页）
> 交接时间：2026-10-03
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
4. 页面数学公式用 **KaTeX**，直接写 `$$...$$`，不需要额外配置。

---

## 2. 两个线上地址（每次都要更新）

| 用途 | 地址 | 来源 |
|---|---|---|
| 正式（GitHub Pages） | https://songyu0903.github.io/ | 仓库 `main` 分支（= `academic-homepage/public-gh/` 的内容） |
| 备用（WorkBuddy） | https://songyu-academic-home.app.workbuddy.host/ | `academic-homepage/public/` 通过部署工具上传 |

GitHub 仓库两个分支：
- `main` → **构建产物**（HTML/CSS/图片），由 `public-gh/` 这个**独立 git 仓库**推送
- `source` → **源码**（Hugo 站点），由 `academic-homepage/` 这个 git 仓库推送

---

## 3. 工作区结构

```
C:/Users/eiegant/WorkBuddy/2026-10-01-16-16-12/
├── academic-homepage/          # Hugo 源码站（git 仓库，推 source 分支）
│   ├── config/_default/        # 站点配置
│   │   ├── hugo.yaml           # baseURL / title / 安全白名单
│   │   ├── params.yaml         # 站点身份、主题配色、数学开关
│   │   ├── menus.yaml          # 导航栏
│   │   ├── languages.yaml      # 单语言 zh
│   │   └── module.yaml         # Hugo 模块挂载
│   ├── content/
│   │   ├── _index.md           # 首页（landing，定义区块顺序）
│   │   ├── authors/            # 作者页
│   │   └── blog/<slug>/index.md# 笔记文章（5 篇）
│   ├── data/authors/me.yaml    # 作者档案（姓名/简介/教育/技能）
│   ├── assets/media/authors/   # 头像 me.jpg
│   ├── static/.nojekyll        # 必留！GitHub Pages 修复 CSS 404
│   ├── public/                 # 构建产物 A（→ 备用链接）
│   ├── public-gh/              # 构建产物 B（独立 git 仓库 → main 分支）
│   ├── go.mod / go.sum         # 模块版本已锁定，别乱动
│   └── package.json            # Tailwind 依赖
├── tools/
│   ├── hugo/hugo.exe           # Hugo extended v0.167.0
│   ├── go/go/bin/go.exe        # Go 1.27（Hugo 模块解析必需）
│   ├── gocache/ gopath/        # 本地 Go 缓存（避免沙箱拦 AppData）
│   ├── gh_api_push.py          # 走 REST API 推送（git push 走代理会失败）
│   └── build.sh                # ★ 一键构建脚本
└── HANDOVER.md                 # 本文档
```

---

## 4. 构建（直接跑脚本，别裸跑 hugo）

```bash
cd /c/Users/eiegant/WorkBuddy/2026-10-01-16-16-12
bash tools/build.sh            # 构建 public/ + public-gh/
bash tools/build.sh public     # 只构建 public/
```

脚本已内置全部环境变量。如需手动执行，等价命令是：

```bash
export PATH="tools/go/go/bin:tools/hugo:/c/Users/eiegant/.workbuddy/binaries/node/versions/22.22.2-3:academic-homepage/node_modules/.bin:$PATH"
export GOCACHE=tools/gocache GOMODCACHE=tools/gopath/pkg/mod GOPATH=tools/gopath
export GOPROXY=https://goproxy.cn
cd academic-homepage
hugo --minify                  # → public/
hugo --minify -d public-gh     # → public-gh/
```

**为什么必须这些环境变量：**
- 没有 Go → Hugo 无法解析 HugoBlox 模块，直接报错
- `GOPROXY=https://goproxy.cn` + `go.mod` 里锁定的伪版本号 → 走 zip 下载，**不触发 git**，否则本机报 `codehost lock file: Access is denied`
- `GOCACHE/GOMODCACHE/GOPATH` 指向 `tools/` 下 → 避免写 AppData 被沙箱拒绝
- Node 在 PATH + `node_modules/.bin` → Hugo 调 `css.TailwindCSS` 需要 `tailwindcss` 二进制

构建成功标志：输出 `Pages │ 45` 左右，末尾 `[OK] public/ 干净`。
若输出 `[WARN] ... localhost/livereload 残留` → `rm -rf public` 后重跑（残留来自 `hugo server`）。

---

## 5. 内容编辑地图（改哪里对应改什么）

| 想改什么 | 改哪个文件 | 说明 |
|---|---|---|
| 姓名 / 头衔 / 个人简介 / 研究兴趣 / 教育经历 / 技能 | `data/authors/me.yaml` | schema `hugoblox/author/v1` |
| 首页区块顺序、研究方向正文、笔记列表区块 | `content/_index.md` | `type: landing` + `sections`，区块含 `resume-biography-3`、`markdown(id=research)`、`collection(id=notes)` |
| 新增/修改一篇笔记 | `content/blog/<新slug>/index.md` | front matter：`title / date / summary / tags` |
| 导航栏 | `config/_default/menus.yaml` | 现为：主页 / 研究方向 / 笔记 / GitHub |
| 站点名、副标题、SEO 描述、深色模式、主题色 | `config/_default/params.yaml` → `hugoblox.identity` / `hugoblox.theme` | |
| 头像 | 覆盖 `assets/media/authors/me.jpg` | **必须是 JPG/PNG**，不能用 SVG |
| 数学公式开关 | `config/_default/params.yaml` → `hugoblox.content.math.enable: true` | 已开启 |

### 新增一篇文章（模板）

```markdown
---
title: "文章标题"
date: 2026-10-03
summary: "一两句话摘要。"
tags: ["投资组合优化", "鲁棒优化"]
---

正文，支持 KaTeX：

$$\min_{w}\ w^{\top}\Sigma w \quad \text{s.t.} \quad w^{\top}\mathbf{1}=1$$
```

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
```bash
bash tools/build.sh
```

### 步骤 2：提交两个 git 仓库
```bash
# 源码仓库（→ source 分支）
cd academic-homepage
git add -A && git commit -m "描述本次改动"

# 产物仓库（→ main 分支），独立 .git
cd public-gh
git add -A && git commit -m "描述本次改动"
```
若需要清理 public-gh 里的旧产物（比如删了大文件），**只能**：
```bash
cd public-gh && git rm -rfq . && git commit -m "clean"
```
**绝对不要 `rm -rf public-gh`** —— 里面有独立的 `.git`，删了要重建仓库和远端历史。

### 步骤 3：推送（用 API 脚本，git push 走代理基本必失败）
```bash
cd /c/Users/eiegant/WorkBuddy/2026-10-01-16-16-12
python tools/gh_api_push.py academic-homepage/public-gh main
python tools/gh_api_push.py academic-homepage source
```
- 脚本从 `git credential fill` 取 token，无需手动填
- 输出以 `PUSH_OK <commit-sha>` 结尾即成功
- **大推送放到后台跑**（`run_in_background`），否则可能超时
- 若提示 `ALREADY_UP_TO_DATE` 但你明明改了 → 一定是**忘了 commit**，回去做步骤 2

### 步骤 4：同步备用链接
调用部署工具（`workbuddy_sites_deploy`），参数：
- 目录：`academic-homepage/public`
- `domainPrefix`: `songyu-academic-home`
- `appName`: `个人学术主页`
- `userAskedToPublish`: `true`

### 步骤 5：验证
```bash
curl -s -o /dev/null -w "home:%{http_code}\n" "https://songyu0903.github.io/?v=$RANDOM"
curl -s -o /dev/null -w "blog:%{http_code}\n" "https://songyu0903.github.io/blog/?v=$RANDOM"
curl -s -o /dev/null -w "css:%{http_code}\n"  "https://songyu0903.github.io/css/_entry.*.css"   # 路径以实际产物为准
curl -s -o /dev/null -w "bak:%{http_code}\n"  "https://songyu-academic-home.app.workbuddy.host/?v=$RANDOM"
```
- GitHub Pages 有约 1 分钟缓存，用 `?v=$RANDOM` 绕过
- 必须确认 CSS 是 200。若 CSS 404 → 检查 `static/.nojekyll` 是否存在且已推上去（Jekyll 会忽略下划线开头的文件）

---

## 7. 坑清单（每一条都真实踩过）

| 坑 | 现象 | 解法 |
|---|---|---|
| 缺 Go | `hugo: binary with name go not found` | PATH 加 `tools/go/go/bin` |
| `hugo mod get` 触发 git | `Access is denied ... codehost lock file` | **不要**跑 `hugo mod get`；`go.mod` 已锁伪版本号，配 `GOPROXY=https://goproxy.cn` 走 zip |
| Tailwind 未授权 | `tailwindcss is not whitelisted in security.exec.allow` | `hugo.yaml` 的 `security.exec.allow` 已含 `^tailwindcss$`、`^npx$`、`^node$`；另需 `npm install` 过 |
| SVG 头像 | `resource ... does not support this method: Fill` | 头像用 JPG/PNG |
| GitHub Pages 样式全丢 | `css/_entry.*.css` 404 | `static/.nojekyll`（已存在，别删） |
| `public/` 被 hugo server 污染 | 线上地址指向 localhost、注入 livereload.js | 部署前 `rm -rf public` 重构建；脚本已自动检查 |
| 删了 public-gh 的 .git | 远端历史丢失、推送异常 | 永远用 `git rm -rfq .`，不要 `rm -rf public-gh` |
| git push 失败 | 代理超时/中断 | 用 `tools/gh_api_push.py` |
| 推送脚本报 up-to-date 但没生效 | 忘了 commit | 先 `git status` 确认干净再推 |

---

## 8. 常见任务 Playbook

**A. 新增一篇笔记**
新建 `content/blog/<slug>/index.md` → `bash tools/build.sh` → 两仓库 commit → API 推两个分支 → 部署备用链接 → curl 验证。

**B. 换头像**
覆盖 `assets/media/authors/me.jpg`（JPG/PNG）→ 构建 → 提交推送 → 验证 `media/authors/me_hu_*.jpg` 返回 200。

**C. 改个人简介 / 教育经历**
改 `data/authors/me.yaml` → 构建 → 提交推送 → 验证首页文案。

**D. 加 PDF 下载**
PDF 放 `static/uploads/` → 在 `_index.md` 或文章里加 `[PDF](/uploads/xxx.pdf)` → 构建 → 同步。

---

## 9. 当前状态快照（2026-10-03）

- **主题**：Hugo Blox Academic CV（HugoBlox Kit 0.12 + Tailwind CSS v4，单语言中文）
- **源码仓库最新提交**：`d762ddb Add handover document for site maintenance`（source 分支，本文件已在仓库内）
- **产物仓库最新提交**：`a101338 Update avatar`（main 分支）
- **头像**：`assets/media/authors/me.jpg`（用户提供的 logo.jpg，19059 字节）
- **已发布文章**（`content/blog/`）：`portfolio-optimization`、`thesis-proposal`、`vscode-setup`、`math-typesetting`、`writing-workflow`
- **两个线上地址均已同步且正常**（首页/博客/CSS/头像全部 200）
- 构建产物 45 页，工作区无未提交改动

---

## 10. 接手第一步建议

```bash
cd /c/Users/eiegant/WorkBuddy/2026-10-01-16-16-12
bash tools/build.sh                      # 确认环境正常
curl -s "https://songyu0903.github.io/" | grep -o "<title>.*</title>"
```
两分钟内能跑通这两条，说明环境完全就绪，可以直接开始改内容。
