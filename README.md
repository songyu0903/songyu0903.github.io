# 个人学术主页 — 源码说明（Hugo Book）

个人学术主页的 **Hugo 源码**。线上地址：<https://songyu0903.github.io/>

主题：**[Hugo Book](https://github.com/alex-shpak/hugo-book)**（经典主题：不需要 Go 模块，不需要 Node/Tailwind）。
主题目录不入库，获取方式与构建细节见 [`HANDOVER.md`](HANDOVER.md) §4。

## 目录结构

```
academic-homepage/
├── hugo.toml                        # 站点配置（菜单 / Book 参数 / goldmark / KaTeX passthrough）
├── content/
│   ├── _index.md                    # 首页（研究方向 + 六个专题导览）
│   ├── about.md                     # 关于页
│   ├── blog/<slug>/index.md         # 笔记正文（17 篇；front matter 的 weight 定列表顺序）
│   ├── blog/_index.md               # 全部笔记页（bookHidden）
│   └── topics/<topic>/_index.md     # 6 个专题页 = 侧栏大目录（front matter notes: 列出收录的笔记）
├── layouts/
│   ├── index.html                   # 首页版式（标准 Book 版式，保留左侧目录）
│   ├── single.html / list.html      # 笔记页 / 列表与专题页
│   ├── term.html / taxonomy.html    # 标签页
│   └── _partials/docs/inject/head.html   # 注入 KaTeX 前端 auto-render
├── assets/styles/custom.css         # 自定义样式（主题最后加载）
├── static/
│   ├── .nojekyll                    # 必留（GitHub Pages 下划线资源）
│   ├── katex/                       # 前端 KaTeX（JS 由本仓库提供）
│   ├── media/authors/me.jpg         # 头像
│   └── uploads/resume.pdf
├── themes/hugo-book/                # 主题（不入库）
├── public/                          # 构建产物 → 备用链接（WorkBuddy）
└── public-gh/                       # 构建产物 → GitHub main 分支（独立 git 仓库）
```

## 构建

```powershell
$site = "C:\Users\eiegant\WorkBuddy\2026-10-01-16-16-12\academic-homepage"
$hugo = "C:\Users\eiegant\WorkBuddy\2026-10-01-16-16-12\tools\hugo\hugo.exe"   # 不在 PATH
Get-ChildItem "$site\public" -Force | Remove-Item -Recurse -Force
Get-ChildItem "$site\public-gh" -Force | Where-Object { $_.Name -ne '.git' } | Remove-Item -Recurse -Force
Set-Location $site
& $hugo --minify                 # → public/
& $hugo --minify -d public-gh    # → public-gh/
```

成功标志：`exit=0`，摘要 `Pages │ 139`、`Static files │ 31`。

## 发布

源码仓库（本目录）→ `source` 分支；产物仓库（`public-gh/`）→ `main` 分支。推送用 API 脚本：

```powershell
$env:PYTHONUTF8 = "1"
$env:PATH = "C:\Users\eiegant\.workbuddy\binaries\PortableGit\versions\1.2.0\cmd;" + $env:PATH
$py = "C:\Users\eiegant\AppData\Local\Programs\Python\Python314\python.exe"
Set-Location "C:\Users\eiegant\WorkBuddy\2026-10-01-16-16-12"
& $py tools\gh_api_push.py "$site\public-gh" main
& $py tools\gh_api_push.py $site source
```

输出以 `PUSH_OK <sha>` 结尾即成功。

## 内容编辑速查

| 想改什么 | 改哪里 |
|---|---|
| 站点名 / 菜单 / 深浅色 / 搜索 / 侧栏根 | `hugo.toml`（`BookSection = "*"`） |
| 首页文案、研究方向 | `content/_index.md` |
| 个人简介、教育、技能、链接 | `content/about.md` |
| 新增笔记 | `content/blog/<slug>/index.md`，再把 slug 加进 `content/topics/<topic>/_index.md` 的 `notes:` |
| 侧栏专题分组 / 顺序 | `content/topics/<topic>/_index.md`（`weight` + `notes:`） |
| 头像 | 覆盖 `static/media/authors/me.jpg` |
| 公式渲染 | `layouts/_partials/docs/inject/head.html` |
| 版式微调 | `assets/styles/custom.css` |

更多细节（坑清单、Playbook、状态快照）见 [`HANDOVER.md`](HANDOVER.md)。
