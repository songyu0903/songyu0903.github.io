# 个人学术主页 — 源码说明（Hugo Blox Academic CV）

个人学术主页的 Hugo 源码。线上地址：https://songyu0903.github.io/

主题：**[Hugo Blox / Academic CV](https://github.com/HugoBlox/hugo-theme-academic-cv)**（基于 Hugo Blox Kit 0.12，Tailwind CSS v4，原生 KaTeX 数学渲染）。

## 目录结构

```
.
├── config/_default/    # 站点配置（hugo / languages / menus / params / module）
├── content/            # 内容：_index.md（首页区块）+ blog/（笔记文章）+ authors/
├── data/authors/       # 作者档案（me.yaml）
├── assets/media/       # 头像、媒体资源
├── layouts/            # 站点级模板覆盖（少量）
├── static/uploads/     # 可下载文件（如简历 PDF）
├── go.mod / go.sum     # Hugo 模块依赖（HugoBlox Kit）
└── package.json        # Tailwind CSS 构建依赖
```

## 构建环境要求

1. **Hugo extended**（0.162+，本项目用 0.167.0，位于 `../tools/hugo/hugo.exe`）
2. **Go**（Hugo 模块解析需要，本项目用 `../tools/go/go/bin/go.exe`）
3. **Node.js**（Tailwind CSS v4 需要，`npm install` 安装依赖）

## 本地构建

```bash
# 1. 安装 npm 依赖（首次）
npm install --registry=https://registry.npmmirror.com

# 2. 下载 Hugo 模块（首次；需 go 在 PATH，且设置好 GOPROXY）
export GOPROXY=https://goproxy.cn
hugo mod tidy

# 3. 构建到 public/
hugo --minify

# 4. 本地预览
hugo server
```

> 首次构建前需完成 1、2 两步；之后只需第 3 步。

## 部署方式

`main` 分支存放**构建产物**（GitHub Pages 直接托管），`source` 分支存放本源码作为备份。

```bash
hugo --minify -d public-gh
cd public-gh && git add -A && git commit -m "update" && git push
```

> 本机 git push 走代理常失败，实际推送用 `../tools/gh_api_push.py`（走 GitHub REST API）。

## 自定义点

| 想改什么 | 改哪里 |
|---|---|
| 姓名 / 身份 / 经历 / 技能 | `data/authors/me.yaml` |
| 首页区块（个人简介、研究方向、笔记） | `content/_index.md` |
| 站点名称 / 简介 | `config/_default/params.yaml`（`hugoblox.identity`） |
| 导航菜单 | `config/_default/menus.yaml` |
| 文章（笔记） | `content/blog/<slug>/index.md` |
| 主题配色 / 深色模式 | `config/_default/params.yaml`（`hugoblox.theme`） |
| 头像 | `assets/media/authors/me.png` |
