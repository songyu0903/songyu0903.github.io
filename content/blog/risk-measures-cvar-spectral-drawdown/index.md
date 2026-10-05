---
weight: 6
title: "风险度量与凸化：从 VaR 的非次可加性到 CVaR、谱风险与回撤"
date: 2026-10-04
summary: "阅读笔记：风险度量的公理化—凸性—可计算性—可估性推理链，Rockafellar–Uryasev 凸化技巧为何把分位数优化变成线性规划，以及 CVaR 作为 Wasserstein 球上最坏情形风险的统一视角。"
tags:
  - "阅读笔记"
  - "风险度量"
  - "CVaR"
  - "谱风险"
  - "文献调研"
---

**问题定位**：风险度量这条线的价值不在于给出一个新指标，而在于它是一条从**公理化**（什么才是风险度量）经**凸性**（能否优化）到**可计算性**（能否变成 LP）再到**统计可实现性**（有限样本能否估准）的推理链。四环中任何一环断裂，度量在组合优化里就不可用。

## 一、一致性与凸性：VaR 的问题不是"不准"，而是"非凸"

Artzner 等（1999）用单调性、平移不变性、正齐次性与**次可加性**四条公理定义一致性风险度量，并证明分位数型风险度量 VaR 在离散分布下违反次可加性——分散化反而可能提高 VaR。设损失 $L(x,\xi)$，则

$$
\mathrm{VaR}_\alpha(L)=\inf\{t:\ \mathbb{P}(L\le t)\ge\alpha\},
\qquad
\mathrm{CVaR}_\alpha(L)=\frac{1}{1-\alpha}\int_\alpha^1 \mathrm{VaR}_u(L)\,du .
$$

VaR 是分位数泛函，**一般非凸**，因此 $\min_x \mathrm{VaR}_\alpha(L(x))$ 一般是非凸规划；CVaR 是分位数的上平均，凸且一致。Basak & Shapiro（2001）进一步给出 VaR 约束的经济学代价：它把组合推向低波动资产并**放大尾部风险**——约束被"满足"的同时风险被搬到了看不见的地方。

## 二、凸化技巧：为什么分位数优化可以变成 LP

Rockafellar–Uryasev 泛函是这条线最重要的技术贡献：

$$
F_\alpha(x,t)=t+\frac{1}{1-\alpha}\,\mathbb{E}\big[(L(x,\xi)-t)^{+}\big].
$$

$F_\alpha$ 关于 $(x,t)$ **联合凸**，且 $\min_t F_\alpha(x,t)=\mathrm{CVaR}_\alpha(L(x))$，最优的 $t^\star$ 可取为 $\mathrm{VaR}_\alpha$。当损失线性 $L(x,\xi)=-x^\top\xi$、用场景 $s=1,\dots,S$ 离散化时，引入辅助变量 $u_s\ge -x^\top\xi_s-t,\ u_s\ge 0$ 便得到纯线性规划

$$
\min_{x,t,u}\ t+\frac{1}{S(1-\alpha)}\sum_{s=1}^S u_s .
$$

关键在于：**优化与分位数计算被同时完成**，阈值 $t$ 不必事先估计。这正是"把非凸的分位数优化变成 LP"的确切含义，也是 CVaR 在工程上压倒 VaR 的根本原因。

**谱风险与回撤都落在同一模板里。** 谱度量取分位数的加权平均

$$
\rho_\phi(L)=\int_0^1\phi(u)\,\mathrm{VaR}_u(L)\,du,
\qquad \phi\ge0,\ \phi\ \text{非降},\ \int_0^1\phi(u)du=1,
$$

取 $\phi\equiv 1/(1-\alpha)$（$u\ge\alpha$）即退化为 CVaR，故 CVaR 是谱族的端点特例。回撤类则靠**状态辅助变量**凸化：令 $y_k$ 为累积收益、$d_k\ge\max_{j\le k}y_j-y_k$，则

$$
\mathrm{CDaR}_\alpha=\min_t\Big\{t+\frac{1}{(1-\alpha)K}\sum_{k=1}^K(d_k-t)^+\Big\}
$$

仍为凸、可 LP 求解，最大回撤与平均回撤分别是 $\alpha\to1$ 与 $\alpha\to0$ 的两端（Chekhlov 等，2005）。

**可引出性：一致性的代价。** Gneiting（2011）与 Fissler & Ziegel（2016）刻画了"可引出性"：ES（即 CVaR）**不能被单一评分函数严格引出**，但 $(\mathrm{VaR},\mathrm{ES})$ 作为二维泛函联合可引出。这解释了为什么 ES 的统计估计必须依附一个分位数辅助模型，也解释了 2022–2026 年大量工作采用"两阶段分位数 + ES"范式——以及为什么 ES 预测的严格比较在方法论上比点预测脆弱。

## 三、与分布鲁棒优化的统一

CVaR 不是孤立指标：它是 Wasserstein 型不确定集下的**最坏情形风险**。在球 $\mathcal{P}_\delta(\hat P_N)$ 上，

$$
\sup_{P\in\mathcal{P}_\delta(\hat P_N)}\mathbb{E}_P[L(x,\xi)]
\ \Longleftrightarrow\
\text{有限场景下的 CVaR 型尾部平均}+\delta\cdot(\text{Lipschitz 常数})\cdot\|x\|_*,
$$

即半径 $\delta$ 扮演"尾部水平"的角色，且最坏情形等价于一个有限维凸问题（Mohajerin Esfahani & Kuhn 2018 给出精确重构；Blanchet & Murthy 2019 把该思想推广到一般最优传输距离）。于是"DRO 与谱风险度量在同一凸框架内"成为一条可复用的结论：**尾部风险与模型风险在数学上是同一族约束的两种参数化**。

## 四、2022–2026 进展

1. **谱风险估计的渐近效率理论**（[arXiv:2609.31994](https://arxiv.org/abs/2609.31994)，2026-09，预印本）：在正态尺度混合椭圆收益下，所有谱风险度量识别**同一个**总体有效组合，但经验解的渐近协方差分解为"公共部分 + 由谱测度泛函缩放的正半定部分"，故效率问题化归为概率测度上的优化；结论是**单层 CVaR 一般非有效**，并构造出与不可行 oracle 一阶同分布的数据自适应谱测度。
2. **重尾下 ES 的稳健可估计性**（[arXiv:2511.08772](https://arxiv.org/abs/2511.08772)，2025-11，预印本）：用"条件分位数作 nuisance + 深度网络"回归 ES，并引入 Huber 损失，得到非渐近抗重尾、且对第一阶段分位数误差**一阶不敏感**的估计量——正面回应"重尾下 ES 不可估"的论断。
3. **动态 CVaR 约束的对偶与策略非对称性**（[arXiv:2608.20179](https://arxiv.org/abs/2608.20179)，2026-08，预印本）：在不完备市场下用辅助阈值表示证明最优策略存在与强对偶；数值显示约束绑定时策略**状态依赖**——不利结果后减仓，有利结果后保持、临近到期甚至加仓，即终期 CVaR 约束产生的是**非均匀去风险化**而非整体降杠杆。
4. **重尾尾部比率的生成式匹配**（[arXiv:2609.27785](https://arxiv.org/abs/2609.27785)，2026-08，预印本）：Lipschitz 映射把高斯映为次高斯，故流模型无法精确匹配重尾；半离散最优传输在 Merton 跳扩散（峰度 94–1679）下把尾部比率维持在 0.85–0.94、跨种子标准差 <0.025；21 年回测中 CVaR 优化市场中性策略 Sharpe 0.70、最大回撤 −2.60%，而最佳生成器仅 0.40。
5. **Wasserstein-DRO CVaR 的半径校准**（[arXiv:2512.16748](https://arxiv.org/abs/2512.16748)，2025-12，NeurIPS 2025 Workshop 预印本）：给出"网格精确重构 + 密度比加权验证折 + block multiplier bootstrap 置信带"的两阶段验证框架，并指出 Wasserstein 项贡献确定性边际 $(\delta/\alpha)\|x\|_*$——**鲁棒性以尾部水平放大的方式被定价**。
6. **高维尾部风险的可计算性**（[arXiv:2608.17481](https://arxiv.org/abs/2608.17481)，2026-08；*Journal of Risk* 28(4):1–31）：非参数 VaR/CVaR 算法在 49 个期货、500 个随机组合上取得 99% 日 VaR 超出率 $1.0\pm0.1\%$，显示高维尾部估计可在不操纵历史数据的前提下保持校准。

## 五、适用边界

- **凸性以"损失对权重凸"为前提**：整数/基数约束、非线性交易成本或非凸收益结构会立刻破坏 LP 化（可用 DC 规划处理有限场景 VaR 约束，[arXiv:2608.13748](https://arxiv.org/abs/2608.13748)）。
- **重尾下 ES 的估计风险**：$\alpha\to1$ 时样本落入尾部的观测数约为 $N(1-\alpha)$，ES 的方差随尾部指数减小而爆炸；VaR 只需局部密度信息，反而更稳健。**凸性/一致性 与 可估性 之间存在真实取舍**——这是本方向最容易被忽略的一条。
- **一致性不蕴含稳健性**：ES 缺乏可引出性意味着单一评分函数无法严格比较其预测；联合可引出提供了比较基础，但依赖辅助分位数模型，误设会沿 nuisance 渠道传导。
- **时间一致性会破裂**：CVaR 作为静态度量不满足动态时间一致性，"逐期 CVaR 约束"不等价于"终期 CVaR 约束"，随意逐期施加会过度保守（第 4 节第 3 条的状态依赖结论即此现象）。
- **DRO 的半径依赖**：最坏情形值对 $\delta$ 高度敏感——过小退化为样本 CVaR，过大趋向 min–max 解并丧失区分度；Wasserstein-1 下的等价性还依赖 Lipschitz 型结构假设。

## 六、尚未解决的问题与对本方向的启发

1. **重尾下 ES/CVaR 的最小样本量与相变点**尚无闭式刻画；现有反向检验下界只在"VaR 正确、ES 低估固定倍数"的特设情景下给出。
2. **高维谱风险估计的效率最优谱测度**：当协方差本身有噪、约束被 $\hat\Sigma$ 替代时，如何保持"oracle 一阶等价"，以及效率损失如何量化，仍开放。
3. **路径依赖风险的动态一致化**：CDaR/Max Drawdown 的凸化只给出单期静态问题的 LP 可解性，多期下的时间一致性与 Bellman 型刻画并不完整。
4. **CVaR 与 Wasserstein DRO 等价关系的可检验推断**：点估计层面的等价已清楚，但半径 $\delta$ 的数据驱动选择的置信区间与检验功效缺少统一理论。
5. **研究启发**：既然 $\sup_{P\in\mathcal{P}_\delta}\mathbb{E}_P[L]$ 与 CVaR 共享辅助阈值结构，可以把 $(\delta,t)$ **一并列入决策变量**，用同一个 RU 泛函同时得到"最坏情形尾部水平"与"最优组合"，把半径选择从外生调参变成内生化优化——这与本系列其他笔记中的半径校准路线正好在这一点汇合。其次，谱风险族"同总体最优组合、不同渐近协方差"的结论意味着 DRO 的比较实验必须区分**总体等价**与**有限样本效率**，否则容易把估计噪声读成模型差异。

## 参考文献

- Artzner, P., Delbaen, F., Eber, J.-M., & Heath, D. (1999). Coherent measures of risk. *Mathematical Finance*, 9(3), 203–228. [DOI](https://doi.org/10.1111/1467-9965.00068)
- Rockafellar, R. T., & Uryasev, S. (2000). Optimization of conditional value-at-risk. *The Journal of Risk*, 2(3), 21–41. [DOI](https://doi.org/10.21314/JOR.2000.038)
- Rockafellar, R. T., & Uryasev, S. (2002). Conditional value-at-risk for general loss distributions. *Journal of Banking & Finance*, 26(7), 1443–1471. [DOI](https://doi.org/10.1016/S0378-4266(02)00271-6)
- Acerbi, C., & Tasche, D. (2002). On the coherence of expected shortfall. *Journal of Banking & Finance*, 26(7), 1487–1503. [DOI](https://doi.org/10.1016/S0378-4266(02)00283-2)
- Acerbi, C. (2002). Spectral measures of risk: A coherent representation of subjective risk aversion. *Journal of Banking & Finance*, 26(7), 1505–1518. [DOI](https://doi.org/10.1016/S0378-4266(02)00281-9)
- Chekhlov, A., Uryasev, S., & Zabarankin, M. (2005). Drawdown measure in portfolio optimization. *International Journal of Theoretical and Applied Finance*, 8(1), 13–58. [DOI](https://doi.org/10.1142/S0219024905002767)
- Basak, S., & Shapiro, A. (2001). Value-at-risk-based risk management: Optimal policies and asset prices. *Review of Financial Studies*, 14(2), 371–405. [DOI](https://doi.org/10.1093/rfs/14.2.371)
- Krokhmal, P., Uryasev, S., & Palmquist, J. (2002). Portfolio optimization with conditional value-at-risk objective and constraints. *The Journal of Risk*, 4(2), 43–68. [DOI](https://doi.org/10.21314/JOR.2002.057)
- Gneiting, T. (2011). Making and evaluating point forecasts. *Journal of the American Statistical Association*, 106(494), 746–762. [DOI](https://doi.org/10.1198/jasa.2011.r10138)
- Fissler, T., & Ziegel, J. F. (2016). Higher order elicitability and Osband's principle. *The Annals of Statistics*, 44(4), 1680–1707. [DOI](https://doi.org/10.1214/16-AOS1439)
- Blanchet, J., & Murthy, K. (2019). Quantifying distributional model risk via optimal transport. *Mathematics of Operations Research*, 44(2), 565–600. [DOI](https://doi.org/10.1287/moor.2018.0936)
- Mohajerin Esfahani, P., & Kuhn, D. (2018). Data-driven distributionally robust optimization using the Wasserstein metric. *Mathematical Programming*, 171(1–2), 115–166. [DOI](https://doi.org/10.1007/s10107-017-1172-1)
