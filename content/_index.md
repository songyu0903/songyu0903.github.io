---
title: "🏠 首页"
---

# Y.S

<div class="typing">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="/typing/typing-dark.svg" />
<source media="(prefers-color-scheme: light)" srcset="/typing/typing-light.svg" />
<img src="/typing/typing-light.svg" alt="M.Sc. in Mathematics · Portfolio Optimization · Robust &amp; Distributionally Robust · Convex Optimization &amp; Numerics" width="620" height="48" />
</picture>
</div>

数学专业硕士研究生，研究方向为**投资组合优化**（鲁棒优化与分布鲁棒优化）。

## 🛠 技术栈

{{< badges >}}

## 🔬 研究方向

我的核心研究方向是**投资组合优化**（Portfolio Optimization）。一切始于 Markowitz (1952) 的均值—方差框架：

$$\min_{w}\ w^{\top}\Sigma w \quad \text{s.t.}\quad w^{\top}\mu \geq r_{\text{target}},\ \mathbf{1}^{\top}w = 1,\ w \geq 0$$

经典框架在实际应用中面临估计误差敏感、协方差矩阵病态等问题，我的关注点包括：

- **鲁棒优化**：在最坏情形扰动集下保证解的稳健性
- **分布鲁棒优化（DRO）**：在模糊概率集合（如 Wasserstein 球）上优化期望目标
- **参数不确定性**下的组合选择与正则化方法

相关代码与实验笔记见 [GitHub](https://github.com/songyu0903)。

## 📄 论文

研究工作与可复现的数值实验，共 8 篇，见左侧「论文」或 [全部论文](/papers/)（按方向浏览见「笔记专题」）：

- **[从 Wasserstein 球到尾部风险](/papers/wasserstein-cvar-portfolio/)**：Wasserstein 对偶、半径校准与尾部风险的保守性代价
- **[高维投资组合为何放大估计误差](/papers/high-dimensional-shrinkage/)**：协方差误差经矩阵求逆的放大与线性收缩实验
- **[厚尾收益与鲁棒估计](/papers/heavy-tail-robust-estimation/)**：自然厚尾与污染下的估计，统计精度与组合效用的差异
- **[交易成本如何改变有效前沿](/papers/transaction-cost-regularization/)**：持仓锚定、二次冲击与净收益的合成实验
- **[从预测误差到决策遗憾](/papers/decision-focused-portfolio/)**：决策导向学习与可信区域内的受限校正
- **[共形预测如何进入组合约束](/papers/conformal-risk-calibration/)**：同时覆盖、选择效应与分布漂移下的损失界
- **[多期投资组合的时间一致性](/papers/time-consistent-dynamic-risk/)**：终端尾部风险、嵌套风险与再优化偏离
- **[矩信息下的鲁棒缺口风险](/papers/moment-shortfall-sos/)**：最坏分布、矩信息的价值与平方和证书

## 📝 阅读笔记

工具与写作类笔记共 4 篇，见左侧「笔记专题」或 [全部笔记](/blog/)：

- **[研究入门与写作工具](/topics/research-writing/)**：数学排版、R 图直出 LaTeX、VS Code 配置与论文写作工作流

## 📈 GitHub 活跃度

<a class="heatmap" href="https://github.com/songyu0903" target="_blank" rel="noopener"><img src="/heatmap/snake.svg" alt="近一年 GitHub 贡献热力图（贪吃蛇动效）" width="695" height="120" /></a>

<p class="heatmap-note">近一年 GitHub 贡献热力图：小蛇每跑一趟，会把有贡献的格子依次吃掉一遍。</p>

{{< visitors >}}