---
title: "Academic Writing Workflow: References, Templates & Version Control"
date: 2026-09-01
description: "Automated Zotero-to-BibTeX pipeline, Git-managed paper versions, and a pre-submission checklist."
categories: ["LaTeX Notes"]
tags: ["LaTeX", "Academic Writing", "Workflow"]
toc: true
math: false
draft: false
---

Losing your bibliography mid-paper and being unable to recover the last good version — I've hit both walls. This workflow prevents them.

## References: Zotero → BibTeX, Automated

1. **Zotero + Better BibTeX plugin**: generates citation entries as you collect papers
2. Export `.bib` with **Keep updated** checked — edits in Zotero sync automatically, no re-exporting
3. Cite in LaTeX:

```latex
\usepackage[backend=biber, style=authoryear]{biblatex}
\addbibresource{refs.bib}

% In text
\textcite{markowitz1952} introduced the mean-variance framework ...
\printbibliography
```

Use the `biber` backend instead of legacy `bibtex` — far better Unicode and multilingual support.

## Version Control: Papers in Git

- One commit per meaningful revision, with the section named in the message
- For revisions, generate a change-tracking PDF with **latexdiff**:

```bash
latexdiff old.tex new.tex > diff.tex
xelatex diff.tex   # PDF with strikethroughs and highlights
```

Attaching a diff PDF to your revision makes reviewers' lives easier — and acceptance more likely.

## Pre-Submission Checklist

- [ ] No broken `\cref` links (search the compile log for `undefined`)
- [ ] All figures vectorized (export PDF/SVG, never screenshots)
- [ ] Journal template fonts, spacing, and reference style double-checked against the guide for authors
- [ ] All comment macros and TODO markers removed
