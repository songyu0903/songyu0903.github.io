---
weight: 17
title: "学术写作工作流：文献管理、模板与版本控制"
date: 2026-09-01
summary: "Zotero + BibTeX 的自动化文献流，Git 管理论文版本，以及投稿前的检查清单。"
tags:
  - "LaTeX"
  - "学术写作"
  - "工作流"
  - "LaTeX 心得"
---

论文写到一半文献库乱掉、改崩了找不回上一版 —— 这两个坑我都踩过，现在的工作流专门防这两点。

## 文献管理：Zotero → BibTeX 自动化

1. **Zotero + Better BibTeX 插件**：收藏文献时自动生成引用条目
2. 导出 `.bib` 时勾选 **Keep updated** —— Zotero 里改的条目会自动同步到 bib 文件，不用反复导出
3. LaTeX 里引用：

```latex
\usepackage[backend=biber, style=authoryear]{biblatex}
\addbibresource{refs.bib}

% 正文
\textcite{markowitz1952} 提出了均值—方差框架……
\printbibliography
```

用 `biber` 后端而不是老 `bibtex`，对中文文献和 Unicode 支持好得多。

## 版本控制：论文进 Git

- 每次大的修改一个 commit，commit message 写清楚改了哪节
- 投稿返修时用 **latexdiff** 自动生成修改对照版：

```bash
latexdiff old.tex new.tex > diff.tex
xelatex diff.tex   # 输出带删除线/高亮的对照 PDF
```

期刊返修时附上一份 diff PDF，审稿人看着舒服，通过率高。

## 投稿前检查清单

- [ ] 全文 `\cref` 无 `??` 断链（编译 log 搜 `undefined`）
- [ ] 图表全部矢量（PDF/SVG 导出，别截图）
- [ ] 期刊模板的字体、行距、参考文献样式逐一核对投稿指南
- [ ] 删除所有批注命令和 TODO 标记
