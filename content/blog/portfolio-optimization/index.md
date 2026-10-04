---
weight: 13
title: "投资组合优化"
date: 2026-10-01
summary: "从经典均值—方差框架出发，关注鲁棒优化与分布鲁棒优化在现代组合选择中的应用。"
tags:
  - "凸优化"
  - "鲁棒优化"
  - "量化金融"
  - "研究方向"
---

我的核心研究方向是**投资组合优化**（Portfolio Optimization）。

一切始于 Markowitz (1952) 的均值—方差框架：在给定预期收益下最小化组合风险，

$$\min_{w}\ w^{\top}\Sigma w \quad \text{s.t.}\quad w^{\top}\mu \geq r_{\text{target}},\ \mathbf{1}^{\top}w = 1,\ w \geq 0$$

经典框架在实际应用中面临估计误差敏感、协方差矩阵病态等问题，我的关注点包括：

- **鲁棒优化**（Robust Optimization）：在最坏情形扰动集下保证解的稳健性
- **分布鲁棒优化**（DRO）：在模糊概率集合（如 Wasserstein 球）上优化期望目标
- **参数不确定性**下的组合选择与正则化方法

相关代码与实验笔记会陆续整理到 [GitHub](https://github.com/songyu0903)。
