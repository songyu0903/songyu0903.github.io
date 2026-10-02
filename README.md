# Hugo Academic Homepage — 源码说明

个人学术主页的 Hugo 源码。线上地址：https://songyu0903.github.io/

## 目录结构

```
.
├── config/_default/     # 站点配置（hugo / languages / menus / params / markup）
├── content/zh-CN/       # 中文内容（首页 + research + latex 栏目）
├── content/en/          # 英文内容（与中文一一对应）
├── layouts/partials/    # 站点级模板覆盖（extend-head.html：粒子背景 + 打字机 + 毛玻璃卡片）
├── assets/css/schemes/  # 自定义配色方案（azureblue 浅蓝）
├── static/js/           # 自托管 particles.js（不依赖外部 CDN）
└── themes/blowfish/     # 主题（需自行获取，见下）
```

## 获取主题

主题目录**不在版本控制里**（2500 个文件，会让仓库臃肿且推送极慢）。
首次使用请先执行：

```bash
git clone --depth 1 https://github.com/nunocoracao/blowfish themes/blowfish
```

或使用国内加速镜像：

```bash
git clone --depth 1 https://ghfast.top/https://github.com/nunocoracao/blowfish themes/blowfish
```

## 本地构建

需要 Hugo **extended** 版本（SCSS 需要）：

```bash
hugo server            # 本地预览 http://localhost:1313/
hugo --minify          # 构建到 public/
hugo --baseURL "https://songyu0903.github.io/" -d public-gh   # 构建 GitHub Pages 产物
```

## 部署方式

`main` 分支存放**构建产物**（GitHub Pages 直接托管，不需要 Actions），
`source` 分支存放本源码作为备份。

```bash
hugo --baseURL "https://songyu0903.github.io/" -d public-gh
cd public-gh && git add -A && git commit -m "update" && git push
```

## 自定义点

| 想改什么 | 改哪里 |
|---|---|
| 配色方案 | `assets/css/schemes/azureblue.css` + `config/_default/params.toml` 的 `colorScheme` |
| 首页内容 | `content/zh-CN/_index.md` / `content/en/_index.md` |
| 导航菜单 | `config/_default/menus.*.toml` |
| 粒子/卡片动效 | `layouts/partials/extend-head.html` |
| 公式渲染定界符 | `config/_default/markup.toml` |
