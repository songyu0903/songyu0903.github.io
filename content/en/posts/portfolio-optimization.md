---
title: "Portfolio Optimization"
date: 2026-10-01
description: "From the classical mean-variance framework to robust and distributionally robust portfolio selection."
categories: ["Research"]
tags: ["Convex Optimization", "Robust Optimization", "Quantitative Finance"]
toc: true
math: true
draft: false
---

My core research direction is **portfolio optimization**.

It all starts with the mean-variance framework of Markowitz (1952) — minimizing portfolio risk subject to a target expected return:

$$\min_{w}\ w^{\top}\Sigma w \quad \text{s.t.}\quad w^{\top}\mu \geq r_{\text{target}},\ \mathbf{1}^{\top}w = 1,\ w \geq 0$$

The classical framework suffers from estimation-error sensitivity and ill-conditioned covariance matrices in practice. My focus includes:

- **Robust optimization**: guaranteeing solution stability under worst-case uncertainty sets
- **Distributionally robust optimization (DRO)**: optimizing expectations over ambiguity sets such as Wasserstein balls
- Portfolio selection and regularization under **parameter uncertainty**

Code and experiment notes will be published on [GitHub](https://github.com/songyu0903) as the project progresses.
