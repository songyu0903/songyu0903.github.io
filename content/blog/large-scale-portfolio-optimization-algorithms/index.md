---
weight: 10
title: "大规模组合优化的一阶算法与可微优化：从 ADMM 到可微的求解层"
date: 2026-10-04
summary: "阅读笔记：组合优化为什么需要专用算法——非光滑约束、约束几何与滚动重解的三重困难，ADMM/近端算子的数学结构，CVaR 与基数约束的锥表述，以及把求解器变成可微层的代价与边界。"
tags:
  - "阅读笔记"
  - "一阶算法"
  - "可微优化"
  - "锥规划"
  - "文献调研"
---

**问题定位**：组合优化之所以需要一套专用算法，而不是"调用通用求解器"了事，源于三重结构性困难的叠加。

**约束的非光滑性。** 基数约束 $\|w\|_0\le k$、交易成本 $c|w-w_{\text{prev}}|$、CVaR 的分位点表示都不是可微函数。CVaR 作为凸风险度量虽可线性化，但由此引入的 $\max$ 结构使目标只在分片意义上光滑，梯度法必须改用次梯度或近端算子。

**维度与约束几何的双重放大。** 机构组合的资产池可达数千，而真实约束集远不止 $\mathbf 1^\top w=1$：换手率上限、单券敞口、行业暴露、杠杆与做空限制同时生效。约束集的几何复杂性使得**投影算子往往没有闭式解**，而投影恰恰是投影梯度法与 ADMM 的核心子步骤。

**必须重复求解。** 多期交易本质上是滚动时域过程：每期求解一次凸问题、只执行第一阶段决策。单次求解即使只快常数倍，在日频或日内频率下的累计价值也是显著的。可微优化的动机正来自这里——既然求解器嵌在决策链中，就应让上游预测模型**通过求解器反向传播梯度**，而不是在预测与决策之间人为截断。

## 一、必读锚点

- **Nesterov & Todd（1997）**：自尺度锥与障碍函数理论，据此构造长步与对称原始—对偶内点法，奠定锥规划（LP/SOCP/SDP）作为统一建模语言的理论基础。局限是复杂度保证为**最坏情形**多项式时间，对需要每秒重解的场景过于沉重。
- **Rockafellar & Uryasev（2000）**：把 CVaR 写成关于分位点的凸函数并给出联合最小化形式，从而将 CVaR 约束组合优化化为线性规划。贡献是消除 VaR 的非凸性；局限是情景数直接进入变量规模，尾部估计对情景质量高度敏感。
- **Bertsimas & Cory-Wright（2022）**：对稀疏组合选择引入岭正则，重述为凸二值优化并用外逼近（Benders 型割平面）求解，同时证明其连续松弛可表示为二阶锥并给出松弛紧的充分条件。把"选 $k$ 个资产"从启发式提升到**可认证最优**；局限是整数结构无法回避组合爆炸。
- **Boyd 等（2011）**：ADMM 的系统综述，梳理其与 Douglas–Rachford 分裂、邻近点算法、Bregman 迭代的等价关系。贡献是让分裂方法成为大规模问题的默认工具；局限是综述本身不给出优于 $O(1/k)$ 的通用收敛率。
- **Boyd 等（2017）**：多期交易凸优化框架，把收益预测、风险、交易成本与持有成本统一进单期问题并外推到多期，为实务建模提供可复用的凸范式；明确不处理预测环节本身，且方法依赖对成本与风险的参数化假设。
- **Amos & Kolter（2017，OptNet）**：将二次规划作为网络层，用灵敏度分析与隐式微分精确求导，并在原始–对偶内点法内实现 GPU 批量求解。首次把 QP 层做到与求解同阶代价的反向传播；局限是仅覆盖 QP 且强依赖 KKT 非退化。
- **Agrawal 等（2019）**："仿射–求解器–仿射"形式与规则参数化编程，使 disciplined convex program 可端到端解析求导，并在 CVXPY 1.1 中落地。把可微层从 QP 推广到整个 DCP 类；局限是链式求导的中间 Jacobian 计算仍可能是瓶颈。

## 二、关键数学结构

**（1）增广拉格朗日与 ADMM 迭代。** 对 $\min_x f(x)+g(z)\ \text{s.t.}\ Ax+Bz=c$，增广拉格朗日为

$$
L_\rho(x,z,y)=f(x)+g(z)+y^\top(Ax+Bz-c)+\frac{\rho}{2}\|Ax+Bz-c\|_2^2,
$$

ADMM 交替执行

$$
x^{k+1}=\arg\min_x L_\rho(x,z^k,y^k),\quad
z^{k+1}=\arg\min_z L_\rho(x^{k+1},z,y^k),\quad
y^{k+1}=y^k+\rho\big(Ax^{k+1}+Bz^{k+1}-c\big).
$$

$y$ 的对偶更新等价于对偶上升；$x$ 子问题在 $A=I$ 时恰为近端算子 $\mathrm{prox}_{f/\rho}$。若两个子问题联合求解，则退化为乘子法（收敛更快但不可分裂）——这正是 ADMM 的取舍。标准假设下收敛率为 $O(1/k)$（残差意义），而 $\rho$ 的取值显著影响实际速度，鲁棒实现需配合自适应惩罚与过松弛。

**（2）近端算子。**

$$
\mathrm{prox}_{\gamma f}(v)=\arg\min_x\left(f(x)+\frac{1}{2\gamma}\|x-v\|_2^2\right).
$$

它把"梯度步"替换为"隐式步"，在 $\gamma\in(0,1/L]$ 下保证非扩张，因而前向–后向分裂收敛。**计算代价随 $f$ 而变**：$f=\lambda\|\cdot\|_1$ 时是软阈值，$O(n)$；$f$ 为单纯形约束的指示函数时是投影，排序后 $O(n\log n)$。投影与近端算子的可计算性，直接决定一阶方法能否用于该约束集。

**（3）CVaR 的 LP/SOCP 表述。** 对损失 $L(w,\xi)$ 与置信水平 $\beta$，

$$
\mathrm{CVaR}_\beta(L)=\min_{\alpha\in\mathbb R}\left\{\alpha+\frac{1}{1-\beta}\,\mathbb E\big[(L(w,\xi)-\alpha)_+\big]\right\}.
$$

当 $L$ 关于 $w$ 线性或凸时，该式关于 $(w,\alpha)$ 联合凸：情景离散化后每个情景贡献一个辅助变量与两条线性不等式，得 LP，规模 $O(S+|\text{变量}|)$；若收益–风险项含二次型，则升级为 SOCP。**要点是 CVaR 的非凸 VaR 被一个可联合优化的标量 $\alpha$ 吸收，代价是情景维度。**

**（4）基数约束的 perspective 松弛。** 集合 $\{(w,z): w_i=0\ \text{若}\ z_i=0,\ \mathbf 1^\top z\le k\}$ 非凸，其凸包为 perspective 形式

$$
\left\{(w,z):\ \sum_i \frac{w_i^2}{z_i}\le \mathbf 1^\top z\le k,\ z\in[0,1]^n\right\},
$$

即 $\sum_i w_i^2/z_i$ 为二阶锥可表示。把 $0$-$1$ 决策放松为 $z\in[0,1]^n$ 后得到紧的锥松弛，可用作外逼近或分支定界的**根节点界**；$z_i\to 0$ 时的数值病态需用 $\varepsilon$-正则或收缩处理。

## 三、2022–2026 进展

1. **稀疏组合的可认证最优。** Bertsimas & Cory-Wright 的外逼近方法在合成与真实数据（含数千证券）上验证，配合岭正则带来显著加速，并给出连续松弛的二阶锥表示与紧性充分条件。其稀疏 PCA 方向的姊妹工作在 $p=300,k=5$ 规模下得到可认证最优，$p$ 达千级时数分钟内得到 $1\%$–$2\%$ 界隙。
2. **反向传播的一阶化。** BPQP 将反向过程重述为解耦的二次规划，利用 KKT 矩阵的结构性质改由一阶算法计算梯度，不再需要对 Jacobian 做昂贵隐式求逆；据其自报结果，总执行时间相较其他可微优化层通常快约一个数量级（NeurIPS 2024 Spotlight，无期刊版本）。
3. **GPU 上的二阶求解。** 有综述指出，成熟的 GPU 稀疏直接求解器（如 cuDSS）是前提条件，并报告大规模实例求解至**中等精度**时相对 CPU 实现常获 10 倍以上加速，同时明确了当前方法的适用边界。
4. **DRO 的专用算法。** Zhou & Liu 针对 Wasserstein 分布鲁棒均值–下半绝对偏差模型，提出稳健 Wasserstein profile inference（RWPI）选取半径，并设计近端点对偶半光滑 Newton（PpdSsn）算法；在真实市场数据上多数情形样本外表现优于交叉验证半径、SAA 与 $1/N$ 策略，且在随机数据上优于一阶算法与商业求解器。
5. **建模侧的收敛趋势。** 上述工作共同指向一个方向：把"求解"从黑箱调用转为**可微、可并行、可认证**的计算模块。但据现有可核验文献，尚无同时覆盖锥约束、整数结构与 GPU 批量求解的统一框架。

## 四、适用边界与失效条件

- **收敛率依赖强假设。** ADMM 的 $O(1/k)$ 是残差意义下的次线性结论；强凸性、Lipschitz 梯度或度量次正则等条件下才有线性率。剥离这些假设后实际收敛可能极慢。
- **调参不可回避。** 惩罚参数 $\rho$、近端步长 $\gamma$、增广项尺度均无通用最优取值；自适应策略只在特定结构下被证明有效，工程上仍需大量试算。
- **非凸与整数约束只有局部解。** 基数约束、整数持仓、非凸成本一旦引入，凸分析框架失效；即便某些非凸问题在实践中"似乎收敛"，也缺乏理论保证，且解对初值敏感。
- **数值稳定性。** 高维锥规划中，大 $M$ 约束、量纲悬殊的资产收益、近奇异协方差矩阵都会导致内点法病态；perspective 形式在 $z_i\to0$ 附近尤为敏感。
- **可微层是近似而非等价。** 隐式微分以 KKT 系统可微且解非退化为前提；当活跃集退化或解不唯一时 Jacobian 不存在或不连续，此时反传的是正则化/光滑化子问题的梯度，与真实最优解的梯度存在系统性偏差。此外，保存 KKT 系统用于反向传播的内存开销随规模增长，是大规模端到端训练的硬约束。

## 五、尚未解决的问题与可做的实验

1. **收敛率与结构的关系尚未细化到可指导实现。** 对"CVaR 约束 + 基数松弛"这类具体组合问题，尚缺"在何种正则条件下 ADMM 达到线性率"的精确刻画。**可做的实验**：在合成协方差（固定条件数、扫描 $n$）与真实数据上比较 ADMM、投影梯度与近端梯度在相同容差下的迭代数与墙钟时间，检验是否可观测到与 $\rho$ 及 $n$ 的近似线性关系。
2. **隐式微分与一阶反传的精度–速度前沿缺乏统一基准。** 一阶反传报告了一个数量级的加速，但精度损失（尤其活跃集近乎退化时）未在组合优化任务上系统量化。**可做的实验**：在 CVaR 约束的均值–方差问题上，对比 OptNet/cvxpylayers 与 BPQP 风格梯度在参数扰动下的方向一致性，并测量训练至收敛的轮数差异。
3. **超参数与模糊半径的耦合仍是薄弱环节。** $\rho$、Wasserstein 半径 $\varepsilon$、基数 $k$ 三者相互影响：$\varepsilon$ 增大往往使问题更易求解但降低样本外收益。RWPI 型选择是方向性进展，但是否可推广到"锥约束 + 基数约束"的联合模型尚不清楚。**可做的实验**：对 $(\rho,\varepsilon,k)$ 做网格或贝叶斯搜索，报告样本外 Sharpe 与求解时间的联合分布，而非单点最优。

## 六、算法选择的决策分界（据现有可核验文献）

- 约束集存在闭式投影且目标光滑 → 优先投影/近端梯度（FISTA 型加速给出 $O(1/k^2)$ 型目标收敛）。
- 约束可自然分为"数据项 + 结构项"两块且其中一块有闭式近端解 → 优先 ADMM，并配合自适应 $\rho$。
- 需要可认证最优且 $k$ 很小 → 采用外逼近等割平面方法。
- 上游预测模型需要联合训练 → 优先带隐式微分的可微层；规模大时评估一阶反传。
- 需要批量并行且可接受中等精度 → 考虑 GPU 二阶求解。

**决策分界点是"精度要求"与"是否需要端到端梯度"这两个维度**——它们比"哪个算法最快"更能决定实际选择。

## 参考文献

- Nesterov, Yu. E., & Todd, M. J. (1997). Self-scaled barriers and interior-point methods for convex programming. *Mathematics of Operations Research*, 22(1), 1–42. [DOI](https://doi.org/10.1287/moor.22.1.1)
- Rockafellar, R. T., & Uryasev, S. (2000). Optimization of conditional value-at-risk. *The Journal of Risk*, 2(3), 21–41. [DOI](https://doi.org/10.21314/JOR.2000.038)
- Bertsimas, D., & Cory-Wright, R. (2022). A scalable algorithm for sparse portfolio selection. *INFORMS Journal on Computing*, 34(3), 1489–1511. [DOI](https://doi.org/10.1287/ijoc.2021.1127) · [arXiv:1811.00138](https://arxiv.org/abs/1811.00138)
- Boyd, S., Parikh, N., Chu, E., Peleato, B., & Eckstein, J. (2011). Distributed optimization and statistical learning via the alternating direction method of multipliers. *Foundations and Trends in Machine Learning*, 3(1), 1–122. [DOI](https://doi.org/10.1561/2200000016)
- Boyd, S., Busseti, E., Diamond, S., Kahn, R. N., Koh, K., Nystrup, P., & Speth, J. (2017). Multi-period trading via convex optimization. *Foundations and Trends in Optimization*, 3(1), 1–76. [DOI](https://doi.org/10.1561/2400000023)
- Amos, B., & Kolter, J. Z. (2017). OptNet: Differentiable optimization as a layer in neural networks. *ICML 2017*. [arXiv:1703.00443](https://arxiv.org/abs/1703.00443)
- Agrawal, A., Amos, B., Barratt, S., Boyd, S., Diamond, S., & Kolter, Z. (2019). Differentiable convex optimization layers. *NeurIPS 2019*. [arXiv:1910.12430](https://arxiv.org/abs/1910.12430)
- Bertsimas, D., Cory-Wright, R., & Pauphilet, J. (2022). Solving large-scale sparse PCA to certifiable (near) optimality. *Journal of Machine Learning Research*, 23(13), 1–35. [arXiv:2005.05195](https://arxiv.org/abs/2005.05195)
- Pan, J., Ye, Z., Yang, X., Yang, X., Liu, W., Wang, L., & Bian, J. (2024). BPQP: A differentiable convex optimization framework for efficient end-to-end learning. *NeurIPS 2024 (Spotlight)*. [arXiv:2411.19285](https://arxiv.org/abs/2411.19285)
- Montoison, A., Pacaud, F., Shin, S., & Anitescu, M. (2025). GPU implementation of second-order linear and nonlinear programming solvers. [arXiv:2508.16094](https://arxiv.org/abs/2508.16094)
- Zhou, W., & Liu, Y.-J. (2024). On Wasserstein distributionally robust mean semi-absolute deviation portfolio model: Robust selection and efficient computation. [arXiv:2403.00244](https://arxiv.org/abs/2403.00244)

*核验说明：以上条目的作者、年份、期刊、卷(期)、页码、DOI 均逐字段取自 arXiv API（`export.arxiv.org/api/query`）返回的 Atom 记录或 Crossref（`api.crossref.org/works/{DOI}`）完整记录。对无 journal_ref、无 DOI 的预印本与会议论文条目（BPQP、OptNet、cvxpylayers、GPU 求解器、RWPI）未标注卷期页，以避免臆造；文中"快一个数量级""10 倍以上"均为所引文献自报的数值结论，未在本机复算。*
