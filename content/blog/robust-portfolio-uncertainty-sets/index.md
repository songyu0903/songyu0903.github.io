---
weight: 3
title: "鲁棒投资组合的不确定集设计：从预算参数 Γ 到数据驱动校准"
date: 2026-10-04
summary: "阅读笔记：不确定集的构造如何决定鲁棒组合的保守性——Bertsimas–Sim 预算不确定集的概率保证、可调鲁棒与决策依赖不确定性，以及半径/置信水平的统计校准路线。"
tags:
  - "阅读笔记"
  - "鲁棒优化"
  - "不确定集"
  - "可调鲁棒"
  - "文献调研"
---

**问题定位**：鲁棒组合解的保守性完全由不确定集决定，而「集从哪来」长期是一个建模判断而非统计结论。本文记录这条线索上被反复引用的结果：预算参数 $\Gamma$ 的可解释性、仿射决策规则带来的结构性保守，以及把 $\Gamma$（或模糊集大小）当作统计量校准的近期工作。

## 一、预算不确定集：$\Gamma$ 的语义与代价

设名义问题含约束 $\sum_j \tilde a_{ij}w_j\le b_i$，其中系数独立地在区间 $[\bar a_{ij}-\hat a_{ij},\ \bar a_{ij}+\hat a_{ij}]$ 内扰动。Bertsimas & Sim（*Operations Research* 52(1):35–53, 2004）引入**至多 $\Gamma_i$ 个系数同时取到最坏值**的预算不确定集，其鲁棒对应式为线性规划：

$$
\sum_j \bar a_{ij}w_j+\Gamma_i z_i+\sum_j p_{ij}\le b_i,\qquad
z_i+p_{ij}\ge \hat a_{ij}\,y_j,\quad p_{ij}\ge 0,\quad y_j\ge |w_j| .
$$

$\Gamma=0$ 退化为名义问题，$\Gamma=|J_i|$ 退化为 Soyster 盒式鲁棒；中间取值在两者之间**连续调节保守度**。更重要的是它给出显式的**违反概率界**：

$$
\Pr\Big[\textstyle\sum_j \tilde a_{ij}w_j> b_i\Big]\ \le\ \exp\Big(-\frac{\Gamma_i^{2}}{2|J_i|}\Big),
$$

即 $\Gamma$ 可以直接翻译成置信水平——这是该模型被高频引用的真正原因。后续 Bertsimas, den Hertog & Pauphilet（*SIAM Journal on Optimization* 31:2893–2920, 2021）把「$\Gamma$ ↔ 违反概率」做成可用的概率保证与校准工具。

> **引用核对提醒**：本方向常有文献引用「Bertsimas & Sim (2009), *Theory and Practice of Robust Optimization*, *Operations Research* 57:1485–1506」，该条目在 Crossref 中查无记录（DOI `10.1287/opre.1080.0628` 实为 Guide & Van Wassenhove 的闭环供应链论文）。引用预算不确定集时请核对 DOI `10.1287/opre.1030.0065`。

## 二、结构性保守：可调鲁棒与决策规则

单阶段鲁棒把全部决策压成「事前」变量，必然保守。Ben-Tal, Goryashko, Guslitzer & Nemirovski（*Mathematical Programming* 99(2):351–376, 2004）区分事前决策（here-and-now）与追索决策（wait-and-see），用**仿射决策规则**（ADR）近似后者，把两阶段问题压成多项式规模凸规划，并给出近似最优性界。

对多期组合而言，这一框架的意义在于：**再平衡本身就是一个可调变量**。多期情形下「先预测后优化」的偏差，一部分来自预测误差，另一部分来自决策规则的限制——把二者分开需要 ADR 这样的显式函数类。

## 三、数据驱动校准：从 $\Gamma$ 到模糊集大小

不确定集的大小既是保守性旋钮，也是统计量。三条近期路线：

- **广义经验似然视角**：Duchi, Glynn & Namkoong（*Mathematics of Operations Research* 46(3), 2021）把 DRO 半径与置信水平的对应关系系统化，为「半径 = 由数据校准的量」提供理论基石。
- **中心与半径的联合学习**：Guo（[arXiv:2608.18123](https://arxiv.org/abs/2608.18123), 2026）让预测模型确定名义分布、另一个模型估计数据依赖的半径，对**任意学习得到的中心**给出有限样本保证，并用 split-conformal 做有限样本边际校准。其结论值得原文引用：学习加校准提升的是**可靠性**，并不自动导致更小的半径或更好的决策。
- **乐观—悲观的连续插值**：Tsang & Shehadeh（[arXiv:2410.19234](https://arxiv.org/abs/2410.19234)）用「size 参数 = 乐观程度、shape 参数 = 模糊度」的模糊集族连接乐观与悲观极端；证明星形 shape、以经验分布为星中心是层级结构的**充要条件**，并给出最优值与解集的几乎必然收敛性。
- **综述入口**：Ghahtarani, Saif & Ghasemi（*Operational Research* 22(4):3203–3264, 2022）按「金融问题 × 不确定集类型（盒/椭球/预算 $\Gamma$/多面体/数据驱动）× 方法（静态/可调/分布鲁棒）」四维分类，并列出不确定集校准、情景内生化等开放问题。

## 四、前沿：决策依赖的不确定性与 ESG 约束

更具张力的一类设定是**不确定性本身依赖于决策**（内生不确定性）。Liu & Zhao（*Mathematics* 14(15):2793, 2026）在 ESG 感知组合中构造收益与 ESG 得分的联合多面体不确定集，其中收益边界依赖第一阶段权重（通过 ESG 相关持仓），并采用两阶段可调鲁棒 + 追索再平衡 + 比例交易成本，CVaR 约束经 Rockafellar–Uryasev 线性化后嵌入 column-and-constraint generation 求解。该文为 2026 年新刊文、引用量极低，出版商站点直连受限，实验细节尚未核对，引用时应保持审慎。

另一条路径是把鲁棒程度交给学习：Costa & Iyengar（[arXiv:2206.05134](https://arxiv.org/abs/2206.05134)）把预测层与鲁棒决策层**联合训练**，用凸对偶把 minimax 结构化为可反向传播的形式，风险容忍度与鲁棒程度直接从数据学习而非人工设定。

## 五、适用边界

- $\Gamma$ 的概率界建立在**系数独立、对称分布**的假设上；相关性、厚尾或结构性漂移会显著改变实际的违反概率。
- 椭球不确定集下的稳健组合等价于在均值—方差目标上加 $\ell_2$ 惩罚（「稳健化即正则化」）；这一等价说明**保守性可以直接定价**，但也意味着鲁棒模型的能力上限受限于该惩罚的形式。
- ADR 是近似：它把追索限制在参数的仿射函数类内，其保守性来源与预测误差不同，二者需分别度量。
- 由数据校准半径的方法（RWPI、共形预测）给出的保证多为**边际**或渐近保证；条件性的有限样本保证在组合问题上仍稀缺。

## 六、对本人研究方向的启发

1. **把 $\Gamma$ 的语义从约束层面转到决策层面**：现有概率界刻画的是「约束被违反的概率」，而组合优化关心的是「决策质量的损失」。把违反概率界改造成**决策质量的下界**，是一个表述自然、工具成熟（概率界 + 对偶）的切口。
2. **内生不确定性 + 组合约束**：ESG、流动性、容量约束都会让不确定性依赖持仓；这类问题的可调鲁棒重构与求解仍不成熟。
3. **校准与保守性的联合度量**：把「校准后半径」与「组合层面的决策损失」放进同一评价框架，可以比较不同模糊集构造（矩约束 / $\phi$-散度 / Wasserstein / 预算 $\Gamma$）的真实代价，而不依赖个案的样本外胜负。

## 参考文献

- Bertsimas, D., & Sim, M. (2004). The price of robustness. *Operations Research*, 52(1), 35–53. [DOI](https://doi.org/10.1287/opre.1030.0065)
- Ben-Tal, A., Goryashko, A., Guslitzer, E., & Nemirovski, A. (2004). Adjustable robust solutions of uncertain linear programs. *Mathematical Programming*, 99(2), 351–376. [DOI](https://doi.org/10.1007/s10107-003-0454-y)
- Bertsimas, D., den Hertog, D., & Pauphilet, J. (2021). Probabilistic guarantees in robust optimization. *SIAM Journal on Optimization*, 31, 2893–2920. [DOI](https://doi.org/10.1137/21M1390967)
- Duchi, J., Glynn, P., & Namkoong, H. (2021). Statistics of robust optimization: A generalized empirical likelihood approach. *Mathematics of Operations Research*, 46(3). [DOI](https://doi.org/10.1287/moor.2020.1085)
- Ghahtarani, A., Saif, A., & Ghasemi, A. (2022). Robust portfolio selection problems: A comprehensive review. *Operational Research*, 22(4), 3203–3264. [DOI](https://doi.org/10.1007/s12351-022-00690-5)
- Liu, Y., & Zhao, L. (2026). An adjustable robust approach for ESG-aware portfolio optimization under decision-dependent return uncertainty. *Mathematics*, 14(15), 2793. [DOI](https://doi.org/10.3390/math14152793)
- Tsang, M. Y., & Shehadeh, K. S. (2024/2025). [arXiv:2410.19234](https://arxiv.org/abs/2410.19234)（预印本）
- Guo, Z. (2026). [arXiv:2608.18123](https://arxiv.org/abs/2608.18123)（预印本）
- Costa, G., & Iyengar, G. N. (2022). [arXiv:2206.05134](https://arxiv.org/abs/2206.05134)（预印本）
