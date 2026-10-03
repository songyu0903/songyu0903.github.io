---
title: "数学公式排版心得：让公式既专业又好维护"
date: 2026-09-20
description: "amsmath 环境怎么选、编号与交叉引用的正确姿势、数学生必备的宏包清单。"
categories: ["LaTeX 心得"]
tags: ["LaTeX", "数学公式", "排版"]
toc: true
math: true
draft: false
---

写论文 80% 的时间在和公式打交道，这几条是我踩坑后沉淀下来的规则。

## 环境选择：别再用 `$$...$$`

`$$` 是 TeX 原语，LaTeX 里间距处理有缺陷。正确对应关系：

| 需求 | 环境 |
|---|---|
| 单行无编号 | `\[ ... \]` |
| 单行带编号 | `equation` |
| 多行对齐 | `align` |
| 多行但不都编号 | `align` + `\notag` |
| 一个主编号多个子式 | `subequations` + `align` |
| 公式太长拆行 | `split`（嵌在 equation 里）|

## 交叉引用：一劳永逸的组合

```latex
\usepackage{amsmath, amssymb, mathtools}
\usepackage[capitalise]{cleveref}  % 放在 hyperref 之后

% 正文中
如 \cref{eq:mv} 所示……   % 自动输出"式 (1)"，不用手写编号
```

`cleveref` 自动处理"式/图/表/定理"的前缀和编号，改结构时再也不用全文搜"(3)"。

## 自定义算子：金融学论文高频需求

```latex
\DeclareMathOperator{\E}{\mathbb{E}}      % 期望
\DeclareMathOperator{\Var}{Var}           % 方差
\DeclareMathOperator{\Cov}{Cov}           % 协方差
\DeclareMathOperator*{\argmin}{arg\,min}  % 带上下标位置的 argmin
```

效果对比：`\E[X]` 输出 $\mathbb{E}$ 直立样式，而不是斜体连乘 $E$ 的歧义。

## 细节规范

- 微分 $\mathrm{d}x$ 用直立 d：`\mathrm{d}`，不要直接打 `dx`
- 向量矩阵统一用 `\bm{}`（bm 宏包），别混用 `\mathbf` 和 `\boldsymbol`
- 大公式编号放不下时用 `\raisetag` 微调，别硬缩小字号
