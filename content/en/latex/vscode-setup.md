+++
title = "LaTeX Setup: TeX Live + VS Code Workflow"
date = 2026-10-01
summary = "Ditch the bloated dedicated editors — a lightweight, efficient local writing environment with TeX Live + VS Code + LaTeX Workshop."
tags = ["LaTeX", "Toolchain", "VS Code"]
+++

Many tutorials still recommend TeXstudio or WinEdt, but **VS Code + LaTeX Workshop** is currently the best experience: one editor for code, notes, and papers.

## The Setup

1. **TeX Live** (distribution): cross-platform with complete packages
2. **VS Code + LaTeX Workshop extension**: compilation, preview, and navigation in one place

## Essential Settings

Add to VS Code `settings.json`:

```json
{
  "latex-workshop.latex.recipe.default": "latexmk (xelatex)",
  "latex-workshop.latex.autoBuild.run": "onSave",
  "latex-workshop.view.pdf.viewer": "tab",
  "latex-workshop.latex.clean.subfolder.enabled": true,
  "latex-workshop.latexindent.path": "latexindent"
}
```

## Three Tips

- **Chinese documents**: use `xelatex` + the `ctex` package; fighting CJK with pdflatex is a minefield
- **SyncTeX forward/backward search**: `Ctrl+Click` jumps between source and PDF — a lifesaver when editing long formulas
- **Auto-clean auxiliary files**: enable `clean.subfolder`, otherwise `.aux/.log/.out` files clutter your directory

## Overleaf or Local?

Overleaf for collaboration (real-time co-editing is unbeatable), local for solo writing (fast compilation, offline, Git version control). My approach: **local by default, push to Overleaf for final review with collaborators**.
