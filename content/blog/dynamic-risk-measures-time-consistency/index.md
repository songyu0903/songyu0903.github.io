---
weight: 12
title: "动态风险度量与时间一致性：多期分布鲁棒优化的结构性障碍"
date: 2026-10-04
summary: "阅读笔记：多期分布鲁棒优化的困难不在对偶而在动态相容性——时间不一致的三个独立来源、条件风险映射的递归骨架与 Bellman 原理失效的确切位置、矩形模糊集的代价，以及一条被检索证实的空白带。"
tags:
  - "阅读笔记"
  - "时间一致性"
  - "动态风险度量"
  - "分布鲁棒优化"
  - "文献调研"
---

**问题定位**：多期分布鲁棒优化（multistage DRO）的标准提法是

$$
\min_{\pi\in\Pi}\ \sup_{\mathbb{Q}\in\mathcal{P}}\ \mathbb{E}^{\mathbb{Q}}\Big[\sum_{t=0}^{T} c_t(x_t,\xi_{0:t})\Big],
$$

其中 $\mathcal{P}$ 为路径空间上的模糊集，$\pi=(x_0,\dots,x_{T-1})$ 取非预见策略。困难不在对偶，而在**动态相容性**：设 $(\mathcal F_t)_{t=0}^T$ 为信息滤流，$t=0$ 时针对 $\mathcal{P}$ 求得的最优策略，在 $t=1$ 依 $\mathcal F_1$ 更新模糊集后重新求解，一般**不再最优**——这就是 Strotz 意义上的时间不一致。

据现有可核验文献，该现象有三个独立来源。**(i) 风险泛函的定义域。** 谱风险度量

$$
\rho_\phi(X)=\int_0^1 \mathrm{VaR}_u(X)\,\phi(u)\,du,\qquad \phi\ge0\ \text{增},\ \int_0^1\phi(u)\,du=1,
$$

本质上是终期财富分布的泛函，其定义域是 $L^\infty(\mathcal F_T)$ 而非 $L^\infty(\mathcal F_t)$，因此**没有天然的 $\mathcal F_t$ 条件化版本**，要得到动态版本必须外部指定一个滚动算子。**(ii) 模糊集对信息的依赖。** $\mathcal P$ 通常是以参考测度为中心的球（Wasserstein、$\phi$-散度、nested distance 等），而参考测度本身随 $\mathcal F_t$ 更新，"今天的最坏情形"明天不再是最坏情形。**(iii) 非线性聚合。** $\sup_{\mathbb Q\in\mathcal P}$ 与 $\mathbb E^{\mathbb Q}[\cdot\mid\mathcal F_t]$ 一般不可交换，除非 $\mathcal P$ 具有矩形（rectangular / $m$-stable）结构。三者叠加，使"谱风险 + 多期 DRO + 组合选择"这一组合在数学上先天紧张。

## 一、必读锚点

- **Artzner, Delbaen, Eber & Heath（1999）**：以单调性、平移不变性、正齐次性与次可加性四条公理定义一致性风险度量，奠定此后一切讨论的语言。局限是完全静态。
- **Artzner, Delbaen, Eber, Heath & Ku（2007）**：把一致性公理推至多期，定义多期风险调整值并正面处理 Bellman 原理；要点是**Bellman 原理并非自动成立**，需要额外的相容性假设。以结构性否命题为主，未给出可计算的替代范式。
- **Cheridito, Delbaen & Kupper（2006）**：在有界离散时间过程上系统建立动态货币（凸）风险度量理论，为"时间一致"提供代数刻画（对 $t<s$ 的递推相容）。抽象表示与存在性为主，几乎不涉及统计估计与大规模计算。
- **Riedel（2004）**：动态相干风险度量及其稳健表示，"动态一致性"的早期来源之一，并显示递推相容需要额外稳定性条件；主要限于相干（正齐次）情形。
- **Ruszczyński & Shapiro（2006）**：公理化定义**条件凸风险映射**，给出以条件期望表达的对偶表示定理，并建立含条件风险映射的多阶段优化的**动态规划关系**——这是"时间一致 DRO 之 DP 骨架"最直接的出发点。局限是惩罚函数固定，未覆盖模糊集随 $\mathcal F_t$ 变化（尤其由散度球诱导）的情形。
- **Ruszczyński（2010）**：以风险转移映射与 Markov 风险度量为工具，为风险厌恶 MDP 建立动态规划框架；需要 Markov 结构与状态空间上的可测选择，可计算性依赖有限状态近似。
- **Shapiro（2012）**：系统澄清"时间一致"在多阶段风险厌恶规划中的用法与层次，指出它是一项**建模选择而非逻辑必然**。
- **Kupper & Schachermayer（2009）** 与 **Cohen（2010）**：律不变（law-invariant）与时间一致联合约束下的**表示刚性**。Cohen 的分类更彻底：对任意滤流都时间一致的相干风险度量只有四类，若严格单调则必为线性，若概率空间非原子则只能是线性或本质上确界。含义很直接——**律不变 + 时间一致会把可容许的聚合形式压缩到极窄的一类**，这正是"终期谱风险直接递归化"路线的根本障碍。
- **Ben-Tal, Goryashko, Guslitzer & Nemirovski（2004）**：可调鲁棒与仿射决策规则，是多阶段问题获得可处理性的标准入口。

## 二、关键数学结构

**结构 1：条件风险映射的递归定义（时间一致的代数形式）。** 设 $\rho_t:L^\infty(\mathcal F_T)\to L^\infty(\mathcal F_t)$，递归性写作

$$
\rho_t(X)=\rho_t\big(\rho_{t+1}(X)\big),\quad t=0,\dots,T-1,\qquad \rho_T(X)=-X .
$$

即把 $T$ 期风险分解为一系列单期条件风险的嵌套。经济含义是：今天对全期风险的评估，等于"今天对明天的风险评估再作评估"——不允许今天与明天的偏好发生反转，即不存在事后反悔动机。

**结构 2：时间一致的充分条件与 Bellman 递推。** 在标量、单调、平移不变的设定下，下列条件共同保证时间一致：

$$
\text{(i) 单调}\ X\le Y\Rightarrow\rho_t(X)\ge\rho_t(Y);\quad
\text{(ii) 平移不变}\ \rho_t(X+Z)=\rho_t(X)-Z,\ \forall Z\in L^\infty(\mathcal F_t);\quad
\text{(iii) 递归}\ \rho_t=\rho_t\circ\rho_{t+1}.
$$

此时多期问题满足 Bellman 递推 $V_T=c_T,\ V_t=\min_{x_t}\rho_t(c_t+V_{t+1})$。**(iii) 使算子族闭合，(i)(ii) 保证递推的不动点存在且单调。** 反之，**若把静态谱风险直接当作 $\rho_0$，则不存在与之相容的非平凡 $\rho_t$ 使递归成立**——这正是结构 1 与刚性定理的联合后果，也就是 **Bellman 原理失效的确切位置**。

**结构 3：多阶段 DRO 的对偶结构与矩形性。** 模糊集 $\mathcal P$ 可等价地由惩罚函数 $\alpha$ 描述：

$$
\rho(\ell)=\sup_{\mathbb Q\in\mathcal P}\mathbb E^{\mathbb Q}[\ell]=\sup_{\mathbb Q\ll\mathbb P}\big\{\mathbb E^{\mathbb Q}[\ell]-\alpha(\mathbb Q)\big\},\qquad
\alpha(\mathbb Q)=\sup_{\ell}\big\{\mathbb E^{\mathbb Q}[\ell]-\rho(\ell)\big\},
$$

其中 $\ell=\sum_{t=0}^T c_t$。要使条件最坏情形算子可复合，即 $\rho_t(\ell)=\operatorname*{ess\,sup}_{q_t\in\mathcal P_t}\mathbb E^{q_t}[\ell\mid\mathcal F_t]$ 能沿滤流嵌套给出与 $\rho_0$ 相同的值，须要求 $\mathcal P$ **递归可分解（矩形 / $m$-稳定）**：

$$
\mathcal P=\Big\{\mathbb Q:\ \mathbb Q(d\xi_{0:T})=q_0(d\xi_0)\prod_{t=1}^{T}q_t\big(d\xi_t\mid \xi_{0:t-1}\big),\ \ q_t(\cdot\mid\cdot)\in\mathcal P_t\Big\}.
$$

矩形性使条件测度集与历史解耦，从而 $\sup$ 与条件期望得以交换、算子族相容。经济含义是"模糊性的结构不随历史路径改变"，即模糊性本身可加分解；**代价是它排除了跨期相关性模糊——而这恰恰是分布鲁棒组合优化最想刻画的东西**。Shapiro（2017）关于最坏情形泛函律不变性及其对不确定集构造的约束，以及 Gao–Arora–Huang（2024）对 multistage-static（nested distance）与 multistage-dynamic（单期 Wasserstein）两个框架的调和，都围绕这一权衡展开。

## 三、2022–2026 进展

1. **多期 DRO 的时间一致化与动态规划重构。** Gao, Arora & Huang（2024）以场景树为中心、nested distance 为半径构造分布球，证明在温和条件下给定策略的鲁棒风险评估有等价**递归形式**；在阶段独立假设下导出等价的动态规划重构，使最优鲁棒策略**时间一致**且在未见样本路径上良定义。这是把"时间一致"与"数据驱动 DRO"接起来最完整的一条链。
2. **连续时间下的时间一致资产配置。** Fießinger & Stadje（2025，*EJOR* 321(2), 676–695）在 $\alpha$-稳定 Lévy 市场中，对律不变、现金不变、正齐次的一般风险度量，用**扩展 HJB 方程**刻画 Nash 子博弈完美均衡，并在适当假设下证明最优解是确定性的。
3. **多阶段谱风险的可计算求解。** Wu, Xu & Zheng（2024）提出多阶段稳健**平均随机化谱风险**优化（ARSRM），其建模前提是**不假设存在单一确定性的谱风险度量**（允许偏好状态依赖甚至不一致）；用 SDDP 生成上下界并证明有限次迭代收敛，并进一步提出 DR-ARSRM；在**带交易成本**的资产配置实验上与风险中性、风险厌恶多阶段线性随机规划对比。这是"谱风险 + 多阶段 + 交易成本"目前最接近可落地的结果。
4. **扭曲型动态风险度量的精确一致性强弱。** Bielecki, Cialenco & Liu（2023）证明由扭曲函数生成的动态风险度量是 **sub-martingale 时间一致**，但**不是** super-martingale 时间一致、也不是 weakly acceptance 时间一致——给出了"谱/扭曲型"路线能达到与不能达到的一致性边界。
5. **适应律不变性与刚性定理的推广。** Beiglböck, Pesenti & Sylvestre（2026）证明在时间一致 + Fatou 正则下，**适应律不变性等价于递归的一步条件律表示**，给出 adapted Kusuoka 表示并推广 Kupper–Schachermayer 定理；并明确指出 terminal-law invariance 无法区分"同分布但揭晓时点不同"的风险。

此外值得注意：Pesenti 等（2023）定义**动态风险贡献**（Euler 贡献的动态推广），对相干动态扭曲风险度量类把风险配置问题重铸为一系列**严格凸优化**；Fiechtner & Blanchet（2026）在 Gelbrich 球下对稳健 regret 最优 LQR 给出**精确 SDP 重构**，清仓实验显示 DRRO 相对 DRO 与名义控制器显著降低最坏情形 regret；Marzban, Delage & Li（2021）的数值结论是当风险在后续时点被评估时，时间一致的对冲策略实际上**优于**由静态风险度量得到的策略；Zhang & Godin（2026）则用谱风险度量的**条件可引出性**把时间一致 deep hedging 的目标写成可训练形式。

## 四、适用边界与失效条件

**公理选择的代价。** 最有力的可核验反例来自 Forsyth（2020，*SIAM J. Financial Mathematics* 11(2), 358–384）：在 30 年期、禁止卖空与杠杆、离散再平衡的 mean-CVaR 配置问题中，加入时间一致约束后**表现劣于**纯预先承诺策略；而由于 $t=0$ 的预先承诺策略等价于某个替代目标函数下的时间一致策略、从而在实践中可实施，"enforcing time consistency" 几乎无收益可图。**因此"时间一致是必须的"这一直觉至少在本类问题上不成立。**

**刚性导致的表示贫乏。** Kupper–Schachermayer 与 Cohen 的联合含义是：律不变 + 时间一致把可行的聚合形式压到极窄的一类。实践中这意味着**除 CVaR 与期望之外的谱风险几乎无法直接被递归化**；扭曲型度量也只享有 sub-martingale 一致性。VaR 的时间不一致性及其时间一致替代由 Cheridito & Stadje（2009）给出。

**可计算性。** 多阶段 DRO 一般遭遇维数灾难；已知可解情形各有强假设：仿射决策规则（Ben-Tal 等 2004）、nested distance + 阶段独立（Gao–Arora–Huang 2024）、SDDP + 上下界（Wu–Xu–Zheng 2024）、SDP 重构（Fiechtner–Blanchet 2026）。这些假设与"时间一致"往往互相牵制：**越让 DP 可解，越要牺牲模糊集的跨期表达能力。**

**与交易成本的交互。** Feinstein & Rudloff 表明：在含比例或凸交易成本的市场中，**集值（多组合）时间一致性才是自然概念，而"递归式 $\Leftrightarrow$ 时间一致"这一标量等价在集值框架下失效**；其替代判据是最小惩罚函数的 cocycle 条件与接受集的可加性。这提示：一旦把交易成本写进模型，标量谱风险的递归化路线更难走通；Wu–Xu–Zheng 的交易成本实验也从数值上显示最优策略结构发生实质改变。

**对模型设定的敏感性。** 模糊集的"矩形化"本身是一项建模承诺：它容许各期边缘分布的任意组合，从而倾向于高估联合尾部风险，同时排除真实的跨期相依模糊。这是时间一致 DRO 与"保守但可信"之间的固有张力。

## 五、尚未解决的问题与选题启发

1. **空白已被检索证实。** 以 arXiv API 摘要字段组合检索：`abs:"time-consistent" AND abs:"distributionally robust"` 仅 2 条（库存控制；nested distance 线性优化），其中**无一篇是组合选择**；`abs:"distributionally robust" AND abs:"multistage" AND abs:"portfolio"` 仅 1 条，且为 LQR/清仓、不涉及风险度量的时间一致性；`abs:"spectral risk"` 与多阶段/动态规划组合亦仅 1 条（ARSRM）。**"时间一致 + 分布鲁棒 + 组合选择"三者的交集基本是空的**，而这一空白不是检索噪声，是由结构 2 与刚性定理共同造成的：律不变性与递归性互相排斥。
2. **空白的数学骨架。** 设 $\mathcal P_t(\omega)$ 为 $\mathcal F_t$ 可测的条件模糊集族（如条件 Wasserstein 球，半径 $\epsilon_t(\omega)$），嵌套最坏情形泛函为

$$
\rho_0(\ell)=\operatorname*{ess\,sup}_{q_0\in\mathcal P_0}\mathbb E^{q_0}\Big[\operatorname*{ess\,sup}_{q_1\in\mathcal P_1}\mathbb E^{q_1}\big[\cdots\operatorname*{ess\,sup}_{q_T\in\mathcal P_T}\mathbb E^{q_T}[\ell]\big]\Big].
$$

  难点是两层耦合：**(a)** 逐层 $\operatorname*{ess\,sup}$ 使算子非线性、非加性，值函数未必落在可积空间内；**(b)** 若允许 $\mathcal P_t$ 随历史收缩（数据驱动 DRO 的自然要求），矩形性与"条件集随信息收缩"互相竞争。要证成 $V_t=\min_{x_t}\operatorname*{ess\,sup}_{q_t\in\mathcal P_t}\mathbb E^{q_t}[c_t+V_{t+1}]$，至少需要：$\mathcal P$ 递归可分解；$\mathcal P_t$ 只依赖 $\mathcal F_t$ 而不依赖控制 $x_{t-1}$（否则属于决策依赖模糊）；以及值函数族在合适空间上的可测选择与紧性。
3. **起步定理建议。** 第一步取 Ruszczyński & Shapiro（2006）的条件凸风险映射表示定理与动态规划关系作为骨架，把惩罚函数 $\alpha$ 从固定改为 **$\mathcal F_t$ 可测、且由条件 Wasserstein / $\phi$-散度球诱导**，即可得到时间一致 DRO 的 DP 定理的正确命题形式；第二步以 Gao–Arora–Huang（2024）的"阶段独立 $\Rightarrow$ 等价 DP 重构"为可解性模板；第三步在引入交易成本时切换到 Feinstein–Rudloff 的集值/多组合时间一致框架。
4. **一个方向相反、值得系统解释的分歧。** Forsyth（2020）认为强制时间一致几乎无收益，而 Marzban–Delage–Li（2021）的数值结果认为时间一致策略在后续时点评估风险时更优。差异很可能取决于"风险是否在后续时点被实际评估"与"策略是否可承诺"；据现有文献，这一分歧尚未被系统解释——它本身就是一个规模可控、结论干净的小选题。
5. **明确的算法缺口。** "一般谱测度（非 CVaR）+ 矩形 Wasserstein 模糊集 + 交易成本"下的时间一致多期组合策略，目前没有公认算法。最接近的起点是 ARSRM + SDDP，但其建模前提恰恰是**不假设存在单一确定性的谱风险度量**；把这一前提收紧为"存在但需条件化"的谱风险，正是尚待填的缝。

## 参考文献

*核验标记：★ = 经 Crossref 完整记录逐字段核验；☆ = 经 arXiv Atom API 元数据核验；◇ = 经 ≥2 份 Crossref 沉积参考文献列表交叉核验；⚠️ = 未能核验。*

1. ★ Artzner, P., Delbaen, F., Eber, J.-M., & Heath, D. (1999). Coherent measures of risk. *Mathematical Finance*, 9(3), 203–228. [DOI](https://doi.org/10.1111/1467-9965.00068)
2. ★ Artzner, P., Delbaen, F., Eber, J.-M., Heath, D., & Ku, H. (2007). Coherent multiperiod risk adjusted values and Bellman's principle. *Annals of Operations Research*, 152(1), 5–22. [DOI](https://doi.org/10.1007/s10479-006-0132-6)
3. ★ Cheridito, P., Delbaen, F., & Kupper, M. (2006). Dynamic monetary risk measures for bounded discrete-time processes. *Electronic Journal of Probability*, 11, 57–106. [DOI](https://doi.org/10.1214/EJP.v11-302)
4. ★ Riedel, F. (2004). Dynamic coherent risk measures. *Stochastic Processes and their Applications*, 112(2), 185–200. [DOI](https://doi.org/10.1016/j.spa.2004.03.004)
5. ★ Ruszczyński, A., & Shapiro, A. (2006). Conditional risk mappings. *Mathematics of Operations Research*, 31(3), 544–561. [DOI](https://doi.org/10.1287/moor.1060.0204)
6. ★ Ruszczyński, A. (2010). Risk-averse dynamic programming for Markov decision processes. *Mathematical Programming*, 125(2), 235–261. [DOI](https://doi.org/10.1007/s10107-010-0393-3)（更正记录 [DOI](https://doi.org/10.1007/s10107-014-0783-z)）
7. ★ Shapiro, A. (2012). Time consistency of dynamic risk measures. *Operations Research Letters*, 40(6), 436–439. [DOI](https://doi.org/10.1016/j.orl.2012.08.007)
8. ★ Kupper, M., & Schachermayer, W. (2009). Representation results for law invariant time consistent functions. *Mathematics and Financial Economics*, 2(3), 189–210. [DOI](https://doi.org/10.1007/s11579-009-0019-9)
9. ★ Cheridito, P., & Stadje, M. (2009). Time-inconsistency of VaR and time-consistent alternatives. *Finance Research Letters*, 6(1), 40–46. [DOI](https://doi.org/10.1016/j.frl.2008.10.002)
10. ★ Ben-Tal, A., Goryashko, A., Guslitzer, E., & Nemirovski, A. (2004). Adjustable robust solutions of uncertain linear programs. *Mathematical Programming*, 99(2), 351–376. [DOI](https://doi.org/10.1007/s10107-003-0454-y)
11. ★ Shapiro, A. (2017). Distributionally robust stochastic programming. *SIAM Journal on Optimization*, 27(4), 2258–2275. [DOI](https://doi.org/10.1137/16M1058297)
12. ★ Forsyth, P. A. (2020). Multiperiod mean conditional value at risk asset allocation: Is it advantageous to be time consistent? *SIAM Journal on Financial Mathematics*, 11(2), 358–384. [DOI](https://doi.org/10.1137/19M124650X)
13. ★ Fießinger, F., & Stadje, M. (2025). Time-consistent asset allocation for risk measures in a Lévy market. *European Journal of Operational Research*, 321(2), 676–695. [DOI](https://doi.org/10.1016/j.ejor.2024.09.049)
14. ★ Cui, X., Gao, J., Shi, Y., & Zhu, S. (2019). Time-consistent and self-coordination strategies for multi-period mean-conditional value-at-risk portfolio selection. *European Journal of Operational Research*, 276(2), 781–789. [DOI](https://doi.org/10.1016/j.ejor.2019.01.045)
15. ◇ Detlefsen, K., & Scandolo, G. (2005). Conditional and dynamic convex risk measures. *Finance and Stochastics*, 9(4), 539–561. [DOI](https://doi.org/10.1007/s00780-005-0159-6)
16. ◇ Shapiro, A. (2009). On a time consistency concept in risk averse multistage stochastic programming. *Operations Research Letters*, 37(3), 143–147. [DOI](https://doi.org/10.1016/j.orl.2009.02.005)
17. ◇ Boda, K., & Filar, J. A. (2006). Time consistent dynamic risk measures. *Mathematical Methods of Operations Research*, 63(1), 169–186. [DOI](https://doi.org/10.1007/s00186-005-0045-1)
18. ◇ Weber, S. (2006). Distribution-invariant risk measures, information, and dynamic consistency. *Mathematical Finance*, 16(2), 419–442. [DOI](https://doi.org/10.1111/j.1467-9965.2006.00277.x)
19. ☆ Feinstein, Z., & Rudloff, B. (2013). Time consistency of dynamic risk measures in markets with transaction costs. [arXiv:1201.1483](https://arxiv.org/abs/1201.1483)；期刊版 *Quantitative Finance*, 13(9), 1473–1489
20. ☆ Feinstein, Z., & Rudloff, B. (2015). Multiportfolio time consistency for set-valued convex and coherent risk measures. [arXiv:1212.5563](https://arxiv.org/abs/1212.5563)；期刊版 *Finance and Stochastics*, 19(1), 67–107
21. ☆ Kováčová, G., & Rudloff, B. (2018/2020). Time consistency of the mean-risk problem. [arXiv:1806.10981](https://arxiv.org/abs/1806.10981)
22. ☆ Pichler, A., & Shapiro, A. (2018/2019). Risk averse stochastic programming: Time consistency and optimal stopping. [arXiv:1808.10807](https://arxiv.org/abs/1808.10807)
23. ☆ Cohen, S. N. (2010). What risk measures are time consistent for all filtrations? [arXiv:1007.0610](https://arxiv.org/abs/1007.0610)
24. ☆ Xin, L., & Goldberg, D. A. (2015/2018). Distributionally robust inventory control when demand is a martingale. [arXiv:1511.09437](https://arxiv.org/abs/1511.09437)
25. ☆ Gao, R., Arora, R., & Huang, Y. (2024). Data-driven multistage distributionally robust linear optimization with nested distance. [arXiv:2407.16346](https://arxiv.org/abs/2407.16346)
26. ☆ Wu, Q., Xu, H., & Zheng, H. (2024). Multistage robust average randomized spectral risk optimization. [arXiv:2409.00892](https://arxiv.org/abs/2409.00892)
27. ☆ Bielecki, T. R., Cialenco, I., & Liu, H. (2023). Time consistency of dynamic risk measures and dynamic performance measures generated by distortion functions. [arXiv:2309.02570](https://arxiv.org/abs/2309.02570)
28. ☆ Beiglböck, M., Pesenti, S. M., & Sylvestre, M. (2026). Adapted law invariance and time-consistent dynamic risk measures. [arXiv:2607.04392](https://arxiv.org/abs/2607.04392)
29. ☆ Pesenti, S. M., Jaimungal, S., Saporito, Y. F., & Targino, R. S. (2023). Risk budgeting allocation for dynamic risk measures. [arXiv:2305.11319](https://arxiv.org/abs/2305.11319)
30. ☆ Fiechtner, L.-B., & Blanchet, J. (2026). Distributionally robust regret optimal LQR with common stage-law ambiguity. [arXiv:2604.06158](https://arxiv.org/abs/2604.06158)
31. ☆ Marzban, S., Delage, E., & Li, J. Y. (2021). Deep reinforcement learning for equal risk pricing and hedging under dynamic expectile risk measures. [arXiv:2109.04001](https://arxiv.org/abs/2109.04001)
32. ☆ Zhang, S., & Godin, F. (2026). Insights on time-consistent deep hedging under elicitable dynamic risk measures. [arXiv:2609.02014](https://arxiv.org/abs/2609.02014)

*⚠️ 未能核验的条目：本轮调研中「Kozmík–Morton 半鞅时间一致风险度量」一条经 Crossref 作者检索（唯一命中为无关的医学会议摘要）、Crossref 题名检索与 arXiv 检索均无匹配记录，故本笔记不予引用，也不代之以任何推测性卷期页或 DOI。过程级时间一致度量的可核验锚点以上列第 3、8 条及 Bion-Nadal 的连续时间工作为准。*
