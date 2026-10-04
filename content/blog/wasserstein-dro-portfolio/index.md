---
title: "Wasserstein 分布鲁棒投资组合：对偶结构、半径校准与有限样本保证"
date: 2026-10-04
summary: "阅读笔记：Wasserstein 球下分布鲁棒组合优化的三件套——对偶重构、半径的统计校准、有限样本性能界，并梳理 2019–2026 年从均值—方差推广到高维、多源与条件信息的主要进展。"
tags:
  - "阅读笔记"
  - "分布鲁棒优化"
  - "Wasserstein 距离"
  - "投资组合优化"
  - "文献调研"
---

**问题定位**：分布鲁棒优化（DRO）处理的是「分布本身不可信」这一比参数不确定更弱的先验。本文记录该方向上以 Wasserstein 球为模糊集的主线文献：对偶如何把无穷维问题压成有限维、半径 $\varepsilon$ 如何被统计地校准、以及有限样本保证在什么条件下失效。

## 一、模型与对偶结构

沿用统一记号：$N$ 个资产，权重 $\mathbf{w}\in\mathcal{W}=\{\mathbf{w}:\mathbf{1}^\top\mathbf{w}=1,\ \mathbf{w}\ge 0\}$，随机参数 $\boldsymbol{\xi}$（收益向量），损失 $L(\mathbf{w},\boldsymbol{\xi})$。样本 $\{\boldsymbol{\xi}_t\}_{t=1}^T$ 给出经验测度 $\hat P_T$。

样本平均近似（SAA）求解 $\min_{\mathbf{w}\in\mathcal{W}}\frac{1}{T}\sum_{t}L(\mathbf{w},\boldsymbol{\xi}_t)$；DRO 则把经验测度放大为一个集合：

$$
\min_{\mathbf{w}\in\mathcal{W}}\ \sup_{P\in\mathcal{B}_\varepsilon(\hat P_T)}\ \mathbb{E}_P\big[L(\mathbf{w},\boldsymbol{\xi})\big],
\qquad
\mathcal{B}_\varepsilon(\hat P_T)=\big\{P:\ W_p(P,\hat P_T)\le\varepsilon\big\}.
$$

$p$ 阶 Wasserstein 球上的最坏期望有对偶表示（Mohajerin Esfahani & Kuhn, 2019）：

$$
\sup_{P\in\mathcal{B}_\varepsilon(\hat P_T)}\mathbb{E}_P[L]
=
\inf_{\lambda\ge 0}\Big\{\lambda\varepsilon^{p}
+\frac{1}{T}\sum_{t=1}^{T}\sup_{\boldsymbol{\xi}}\big[L(\mathbf{w},\boldsymbol{\xi})-\lambda\, d(\boldsymbol{\xi},\boldsymbol{\xi}_t)^{p}\big]\Big\}.
$$

**这条对偶是整个方向的引擎**：左侧是无穷维测度优化，右侧是有限维凸规划。当 $L$ 关于 $\boldsymbol{\xi}$ 分段线性、ground metric 取 $\|\cdot\|_1$ 时，内层 $\sup$ 可解析求出，整体退化为线性规划——可解性因此不是主要障碍。

## 二、半径 $\varepsilon$ 是统计量，不是超参数

半径决定模型的保守程度，其选取是该方向最核心的方法学问题。用测度集中不等式可得：在轻尾假设下取

$$
\varepsilon_T(\beta)\ \asymp\ \Big(\frac{\log(1/\beta)}{T}\Big)^{1/\max\{p,2\}},
$$

则 $P\big\{W_p(P,\hat P_T)\le\varepsilon\big\}\ge 1-\beta$，于是稳健最优值是真实性能的一个 $1-\beta$ 置信上界。需要注意两点边界：

- 经验测度以 Wasserstein 距离逼近真实分布的收敛率同时依赖维数（Fournier–Guillin 型结果）。高维下同一半径会迅速变得过度保守，这是「数据自适应半径」的直接动因。
- 该保证要求样本独立同分布；序列相依与分布漂移需要另行处理。

## 三、2019–2026：三条推进主线

**（1）对偶 ⇒ 正则化。** Gao, Chen & Kleywegt（*Operations Research* 72(3):1177–1191, 2024）证明 Wasserstein DRO 等价于**变差正则化**（variation regularization），推广了全变差、Lipschitz 与梯度正则，并且不要求凸性、光滑性与欧氏空间假设。这把「稳健化即正则化」这一直观在 Wasserstein 情形下完全一般化，并由正则化理论导出新的泛化界。

**（2）均值—方差的直接推广。** Blanchet, Chen & Zhou（*Management Science* 68(9), 2022）把分布鲁棒均值—方差**归约为「经验方差最小化 + 一个额外正则项」**，不引入半无穷或整数结构；半径与稳健目标收益由 **RWPI**（robust Wasserstein profile inference，其方法源头见 Blanchet, Kang & Murthy, *J. Appl. Probab.* 56(3):830–857, 2019——该文同时说明 $\sqrt{\text{LASSO}}$、正则化 logistic 回归可精确表示为 Wasserstein DRO）数据驱动地确定，从而避免交叉验证。S&P 500 回测优于 Fama–French 与 Black–Litterman 基准。

高维推广见 Wu, Yang, Shang & Zhu（[arXiv:2405.16989](https://arxiv.org/abs/2405.16989), 2024）：借助因子结构降维 + 数据自适应估计半径，Monte-Carlo 显示所估半径与目标收益接近 oracle；同类工作还有均值—下半绝对偏差（DR-MLSAD）版本（[arXiv:2403.00244](https://arxiv.org/abs/2403.00244)），用 RWPI 选半径并以邻近点对偶半光滑牛顿法求解。两者均为预印本，定理条件的细节尚未逐条复核。

**（3）多源数据与条件信息。** Rychener 等（[arXiv:2407.13582](https://arxiv.org/abs/2407.13582)）用 **$K$ 个最优传输邻域之交**刻画多个（可能系统性有偏的）数据源，结论是：当决策者对偏差方向有先验时，样本外性能随数据源数 $K$ 提升，且**与偏差幅度无关**；计算上只需 $K$ 或风险因子维数之一为常数。Nguyen 等（[arXiv:2103.16451](https://arxiv.org/abs/2103.16451)）则把球建在**协变量与收益的联合分布**上，把条件信息纳入模糊集：均值—方差情形化为二阶锥规划，均值—CVaR 情形化为半定规划。

## 四、适用边界

- **保守性—效率张力**：$\varepsilon$ 过大时解退化——Hsieh & Yu（[arXiv:2410.23536](https://arxiv.org/abs/2410.23536)）在对数最优组合中发现，无交易成本时最优解趋于等权，含凸交易成本时仓位向无风险资产偏移；$\varepsilon\to 0$ 则退回 SAA。
- **对偶的解析性依赖损失结构**：分段线性/Lipschitz 损失可直接得到 LP/SOCP；一般非线性效用需重新推导重构（Hsieh & Gan, [arXiv:2608.07032](https://arxiv.org/abs/2608.07032) 在 long-only、box 支撑与 $\ell_1$ ground metric 下给出样本特定顶点重构，将问题压成多项式规模 LP，实测 476 个资产）。
- **可解性 ≠ 统计效率**：以近年进展看，计算规模已不是瓶颈；瓶颈在半径的相合性、维数效应与漂移下的有效性。
- **非 i.i.d. 场景**：Long（[arXiv:2512.16748](https://arxiv.org/abs/2512.16748), NeurIPS 2025 Workshop）针对 CVaR 约束与分布漂移，用 block multiplier bootstrap 标定同时置信带、在候选解中选「最不保守的可行解」，并在有效样本量崩溃时弃权——属探索性工作，尚未经正式评审。

## 五、对本人研究方向的启发

1. **半径校准是可落地的切口**：RWPI、共形预测与数据自适应估计各有理论工具，但 Guo（[arXiv:2608.18123](https://arxiv.org/abs/2608.18123)）的结论相当克制——学习中心与半径能提升可靠性，**并不自动给出更小的半径或更好的决策**。这一空白可以由「校准后的保守性界 + 组合层面的决策质量」联合刻画。
2. **「DRO ≡ 正则化」提供了统一语言**：可把已有的 $\ell_1/\ell_2$ 惩罚、因子惩罚重新解释为某个模糊集下的稳健化，从而给出跨模型的保守性度量，而不必逐一做样本外比拼。
3. **条件信息 + 多期 + 交易成本几乎是空白**：目前条件最优传输球的工作多为单期；把条件模糊集与多期可调鲁棒结合，是结构上自然、文献上稀薄的方向。

## 参考文献

- Mohajerin Esfahani, P., & Kuhn, D. (2019). Data-driven distributionally robust optimization using the Wasserstein metric. *Mathematical Programming*, 171(1–2), 115–166. [DOI](https://doi.org/10.1007/s10107-017-1172-1) · [arXiv:1505.05116](https://arxiv.org/abs/1505.05116)
- Kuhn, D., Shafiee, S., & Wiesemann, W. (2025). Distributionally robust optimization. *Acta Numerica*, 34, 579–804. [DOI](https://doi.org/10.1017/S0962492924000084) · [arXiv:2411.02549](https://arxiv.org/abs/2411.02549)
- Gao, R., Chen, X., & Kleywegt, A. J. (2024). Wasserstein distributionally robust optimization and variation regularization. *Operations Research*, 72(3), 1177–1191. [DOI](https://doi.org/10.1287/opre.2022.2383)
- Blanchet, J., Chen, L., & Zhou, X. Y. (2022). Distributionally robust mean-variance portfolio selection with Wasserstein distances. *Management Science*, 68(9). [DOI](https://doi.org/10.1287/mnsc.2021.4155) · [arXiv:1802.04885](https://arxiv.org/abs/1802.04885)
- Blanchet, J., Kang, Y., & Murthy, K. (2019). Robust Wasserstein profile inference and applications to machine learning. *Journal of Applied Probability*, 56(3), 830–857. [DOI](https://doi.org/10.1017/jpr.2019.49)
- Rychener, Y., Esteban-Perez, A., Morales, J. M., & Kuhn, D. (2024/2026). [arXiv:2407.13582](https://arxiv.org/abs/2407.13582)（预印本）
- Nguyen, V. A., Zhang, F., Wang, S., Blanchet, J., Delage, E., & Ye, Y. (2024). [arXiv:2103.16451](https://arxiv.org/abs/2103.16451)（预印本）
- Wu, Q., Yang, Y., Shang, Z., & Zhu, Z. (2024). [arXiv:2405.16989](https://arxiv.org/abs/2405.16989)（预印本）
- Hsieh, Y.-G., & Yu, X. (2024). [arXiv:2410.23536](https://arxiv.org/abs/2410.23536)（预印本）
- Hsieh, Y.-G., & Gan, R. (2026). [arXiv:2608.07032](https://arxiv.org/abs/2608.07032)（预印本）
