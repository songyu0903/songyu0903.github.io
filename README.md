# site-redesign — 学术主页源码

个人学术主页 <https://songyu0903.github.io/> 的生成器、内容与发布脚本。
站点是纯静态的：这里写内容 → `build.mjs` 生成 `dist/` → 推送到 GitHub Pages。

## 目录

| 路径 | 作用 |
|---|---|
| `content/*.json` | 论文、笔记、研究方向的元数据（标题、日期、标签、摘要、成员关系） |
| `content/html/*.html` | 12 篇文章 + 关于页的正文 HTML（公式保留 `$…$` / `$$…$$` 原文，由 KaTeX 在浏览器端渲染） |
| `assets/site.css` | 设计系统：玻璃质感、浅色/深色、全部组件样式 |
| `assets/site.js` | 主题切换、滚动入场、目录高亮、筛选、⌘K 搜索、图片放大 |
| `build.mjs` | 唯一渲染入口：生成 51 个页面 + `sitemap.xml` + `index.xml` + `search-index.json` |
| `extract.mjs` | 一次性工具：从旧线上站抽取正文与元数据到 `content/` |
| `mirror.mjs` | 为本地预览镜像二进制资源（KaTeX、插图、头像、简历、徽章） |
| `serve.mjs` | 本地预览服务器（默认 4173） |
| `crawl.mjs` / `imgcheck.mjs` / `cdp-test.mjs` / `qa-redesign.mjs` | 自检：坏链、缺图、交互、布局/对比度/无障碍 |
| `deploy.mjs` | 通过 GitHub API（blob → tree → commit → ref）发布 `dist/` 的文本文件 |
| `verify-live.mjs` | 等 Pages 构建完成后逐页复检线上 |
| `ARCHITECTURE.svg` | 架构与写作流程图 |

`dist/`、`preview/` 是生成物，已加入 `.gitignore`。

## 日常命令

```powershell
node build.mjs        # 生成 dist/
node mirror.mjs       # 拉取本地预览所需的二进制资源
node serve.mjs 4173   # 预览：http://127.0.0.1:4173/
node crawl.mjs        # 期望 broken: 0
node imgcheck.mjs     # 期望 missing: 0
node cdp-test.mjs     # 期望 15/15 passed
node deploy.mjs       # 需要 GH_TOKEN 环境变量（GitHub PAT）
node verify-live.mjs  # 需要 GH_TOKEN
```

`deploy.mjs` / `verify-live.mjs` 从环境变量读 token，不把凭据写进仓库。

## 版本管理

本仓库跟踪**源码**（内容、样式、脚本、文档），不跟踪构建产物。远端是
`songyu0903/songyu0903.github.io`。

| 分支 | 内容 |
|---|---|
| `main` | 线上站点（构建后的静态文件，由 GitHub Pages 直接托管） |
| `site-source` | 本仓库：新站生成器与内容源码 |
| `source` | 历史遗留：旧 Hugo 站点源码（Markdown + static/ + layouts），只读参考 |

推荐流程：

```powershell
git switch site-source
# 改内容 / 样式
node build.mjs && node mirror.mjs   # 构建并本地检查
node crawl.mjs && node imgcheck.mjs && node cdp-test.mjs
git add -A && git commit -m "content: ..."
git push
node deploy.mjs                     # 发布构建产物到 main
```

回滚源码：`git revert <sha>`；回滚线上：`node deploy.mjs` 重新发布即可（Pages 与 git 历史都保留旧版本）。

## 内容约定

- 公式必须原样保留 `$…$`、`$$…$$`，不要转义或替换成图片。
- 一篇文章的图片放在同一目录，正文用相对路径 `fig1.png`。
- 新论文需要：`content/html/paper-<slug>.html` + `content/papers.json` 里加一条；标签 slug 沿用旧站规则（小写、空格转 `-`、中文保留）。
- 站点不引入外部 CDN，KaTeX 与字体都在仓库内。
