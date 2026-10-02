+++
title = "Math Typesetting: Professional and Maintainable Formulas"
date = 2026-09-20
summary = "How to choose amsmath environments, proper numbering and cross-referencing, and the essential package list for math students."
tags = ["LaTeX", "Math", "Typesetting"]
math = true
+++

{{< katex >}}

Eighty percent of paper writing is wrestling with formulas. These are the rules I settled on after stepping on every rake.

## Environment Choice: Stop Using `$$...$$`

`$$` is a TeX primitive with spacing defects in LaTeX. The correct mapping:

| Need | Environment |
|---|---|
| Single line, unnumbered | `\[ ... \]` |
| Single line, numbered | `equation` |
| Multi-line aligned | `align` |
| Multi-line, not all numbered | `align` + `\notag` |
| One number, sub-equations | `subequations` + `align` |
| Long formula, line breaks | `split` (inside `equation`) |

## Cross-References: A Set-and-Forget Combo

```latex
\usepackage{amsmath, amssymb, mathtools}
\usepackage[capitalise]{cleveref}  % load AFTER hyperref

% In text
As shown in \cref{eq:mv}, ...   % outputs "Eq. (1)" automatically
```

`cleveref` handles the eq./fig./table/theorem prefixes automatically — no more hunting down hard-coded "(3)" after restructuring.

## Custom Operators: High-Frequency in Finance Papers

```latex
\DeclareMathOperator{\E}{\mathbb{E}}      % expectation
\DeclareMathOperator{\Var}{Var}           % variance
\DeclareMathOperator{\Cov}{Cov}           % covariance
\DeclareMathOperator*{\argmin}{arg\,min}  % argmin with limits below
```

Compare: `\E[X]` gives the upright $\mathbb{E}$ style, not the ambiguous italic product $E$.

## Details That Matter

- Differential $\mathrm{d}x$: use upright `\mathrm{d}`, never plain `dx`
- Vectors/matrices: stick to `\bm{}` (bm package); don't mix `\mathbf` and `\boldsymbol`
- Long equation numbers: nudge with `\raisetag` instead of shrinking font size
