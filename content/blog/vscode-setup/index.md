---
weight: 16
title: "LaTeX 环境配置：TeX Live + VS Code 工作流"
date: 2026-10-01
summary: "抛弃臃肿的专用编辑器，用 TeX Live + VS Code + LaTeX Workshop 搭一套轻量高效的本地写作环境。"
tags:
  - "LaTeX"
  - "工具链"
  - "VS Code"
  - "LaTeX 心得"
---

网上很多教程还在推荐 TeXstudio、WinEdt 这类专用编辑器，其实 **VS Code + LaTeX Workshop** 才是目前体验最好的方案：一个编辑器搞定代码、笔记、论文三件事。

## 安装组合

1. **TeX Live**（发行版）：跨平台、宏包全。国内建议用清华镜像安装：`https://mirrors.tuna.tsinghua.edu.cn/CTAN/systems/texlive/Images/`
2. **VS Code + LaTeX Workshop 插件**：编译、预览、跳转全包

## 必调配置

在 VS Code `settings.json` 中加入：

```json
{
  "latex-workshop.latex.recipe.default": "latexmk (xelatex)",
  "latex-workshop.latex.autoBuild.run": "onSave",
  "latex-workshop.view.pdf.viewer": "tab",
  "latex-workshop.latex.clean.subfolder.enabled": true,
  "latex-workshop.latexindent.path": "latexindent"
}
```

## 三条心得

- **中文论文用 `xelatex` + `ctex` 宏包**，不要用 pdflatex 硬刚 CJK，坑太多
- **正反向跳转**（SyncTeX）：`Ctrl+点击` 源码 ↔ PDF 互跳，改长公式时救命
- **自动清理中间文件**：开 `clean.subfolder`，否则 `.aux/.log/.out` 会把目录弄得很脏

## Overleaf 还是本地？

协作写作用 Overleaf（实时共同编辑无敌），自己写作用本地（编译快、可离线、能进 Git 版本管理）。我的做法是**本地为主，投稿前传 Overleaf 与合作者过 final**。
