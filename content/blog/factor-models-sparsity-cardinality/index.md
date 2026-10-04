---
weight: 6
title: "因子结构与稀疏性：从 POET 到基数约束的可证最优"
date: 2026-10-04
summary: "阅读笔记：因子模型如何把 N 维协方差压回 K 维、ℓ1 罚为何等价于一个分布鲁棒问题、基数约束的大规模精确求解进展，以及「稀疏更好」在什么规模上会反转。"
tags:
  - "阅读笔记"
  - "因子模型"
  - "稀疏优化"
  - "基数约束"
  - "文献调研"
---

**问题定位**：本主题处在高维协方差估计、稀疏统计学习与混合整数优化的交叉点，可以拆成三层——**估计层**（当 $N$ 与 $T$ 可比时样本协方差被 Marchenko–Pastur 律扭曲，因子结构把 $N$ 维问题压回 $K\ll N$ 维）、**决策层**（$\ell_1$ 正则与基数约束让解变稳，而 2009 年以来的关键发现是：它们有效**常常不是因为统计上的真稀疏，而是因为等价于某个稳健化/DRO 问题**）、**计算层**（基数约束 NP-hard，但现代方法靠问题特定结构在真实规模上给出可证最优性）。

## 一、估计层：因子结构把 N 维压回 K 维

设收益 $r_t=\alpha+Bf_t+\varepsilon_t$，$\mathrm{Cov}(f_t)=\Sigma_f$、$\mathrm{Cov}(\varepsilon_t)=\Sigma_u$ 对角，则

$$
\Sigma=B\,\Sigma_f\,B^{\top}+\Sigma_u .
$$

Fan, Fan & Lv（2008）证明因子结构可把协方差估计的收敛率从 $N/T$ 型提升到接近参数率。Fan, Liao & Mincheva（2013）的 **POET** 进一步对残差矩阵施加阈值算子：因为残差项的收敛要差一个 $\sqrt{N}$ 因子，而

$$
\|\hat\Sigma_{\mathrm{POET}}-\Sigma\|_{\max}=O_P\!\Big(\sqrt{\tfrac{\log N}{T}}+\tfrac{1}{\sqrt N}\Big),
$$

所以**丢失的稀疏结构换来的是收敛率**——这是"因子 + 阈值"能work的核心。代价是前提：$\Sigma_u$ 需稀疏、因子需可估（宏观因子）或存在特征间隙（统计因子）。Ledoit & Wolf（2003）的单指标收缩是这条线最实用的起点。

## 二、决策层：$\ell_1$ 为什么"不只是稀疏"

Brodie 等（2009）首次指出，$\ell_1$ 罚把权重压向零只是表象，**其"稳定化"作用可能比"稀疏化"更本质**。DeMiguel 等（2009）把 $\ell_1/\ell_2$/Aitchison 范数约束统一为"以 $1/N$ 为收缩目标"的规范性框架。

Chu, Toh & Zhang（2022）给出了统一的理论解释：

$$
\min_{w}\ \tfrac12w^{\top}\hat\Sigma w-\lambda\hat\mu^{\top}w+\rho\|w\|_1
\quad\Longleftrightarrow\quad
\min_{w}\ \max_{P\in\mathcal{P}}\ \mathbb{E}_P[\text{loss}],
$$

即**任何"简单范数 + 半范数"之和的 square-root 正则模型都可解释为对应最小二乘问题的 DRO 形式，其最优传输代价恰为该罚函数的对偶形式**。直观地说，$\ell_1$ 球是 $\ell_\infty$ 型不确定集的支撑函数，于是罚参数 $\rho$ **直接就是稳健半径**——正则化系数从此有了概率语义，而不是只能交叉验证的数字。

**稀疏与稳健的定量对应**：Chen 等（2024）在椭圆不确定集叠加固定交易成本（即基数型均值—方差）下证明，**风险厌恶系数与稳健性水平一一对应**：只要选对风险厌恶系数，均值—方差优化本身就是一个稳健程序；并且交易资产数随参数不确定性与成本幅度的交互而变化。

## 三、计算层：基数约束从"启发式"到"可证最优"

原始问题是混合整数规划：

$$
\min_{w,x}\ w^{\top}\Sigma w-\mu^{\top}w
\quad\text{s.t.}\quad
\textstyle\sum_i x_i\le k,\ |w_i|\le u_ix_i,\ x\in\{0,1\}^N,\ \mathbf 1^{\top}w=1 .
$$

直接做 SOCP 松弛很松；引入辅助变量后 **perspective 重构** $w_i^2/x_i\le y_i$ 给出更紧的凸包近似，是当前分支定界（B&B）主流的下界来源。近三年的进展在于把这一松弛的求解成本压到可忽略：

- Liu, Shafiee & Lodi（2025，ICML）在 B&B 中用一阶近端梯度解 perspective 松弛，非光滑成分的近端算子可在 **log-linear 时间精确计算**，无需调用通用锥求解器；其后继工作（2026）用对偶间隙 restart 把次线性近端法升级为**可证线性收敛**，迭代以矩阵—向量乘为主、可 GPU 加速，对偶界计算快数个数量级。
- Wada 等（2026）把**安全筛选**引入基数约束组合：用 L2 正则的 perspective 松弛 + Fenchel 对偶导出资产级 screening score，在不排除任何全局最优解的前提下把二元选股变量固定为 0 或 1，S&P 500 与 Russell 2000 上中等/强正则化时提升显著。
- 精确求解的可行规模：Bertsimas & Cory-Wright（2022）用割平面 + 子模不等式把大规模稀疏组合推到实用规模；Tillmann 等的综述更直接地给出判断——**现代 MIP 在利用问题特定结构时能在真实规模上产出可证高质量甚至最优解**。

反面参照同样重要：Nikiporenko（2023）报告在 1 秒时间预算下，模拟退火、禁忌搜索与遗传算法**全部**找不到有竞争力的解（5 秒时退火才接近最优）——启发式在强约束+紧时限下的表现并不可靠。

## 四、2022–2026 的其他关键进展

1. **稀疏指数追踪的算法化**：Yamagata & Ono（2024）用 $\ell_0$ 约束 + 邻近算法同时完成选股与资金分配；Jo & Cho（arXiv:2412.17175，AAAI 2025）的 DCC 给出**多项式时间的可微基数约束**并证明其基数计算精确；Roxanas（arXiv:2512.22109）把"构建"与"维护"分离，在自融资变化变量 $\Delta w$ 中做低换手再平衡，把换手率压到独立的低换手工作区间。
2. **稀疏性收益的规模反转**：Arvanitis, Scaillet & Topaloglou（2024）用二阶随机占优检验稀疏机会集：**扩张到 45 个资产以上没有收益**，最优稀疏组合投 10 个行业板块并降低尾部风险，滚动窗口下危机期资产数收缩到 25——而且**标准因子模型无法解释**稀疏组合的表现。Afsharhajari & Li（2026）则用列生成 + GPU 把候选因子扩到 4.32 亿，发现规模足够大时出现反转：低复杂度下稀疏组合落后于稠密 ridgeless 基准，但在最大候选集上 Sharpe 更高、定价误差更低——**容量扩张与因子稀疏是互补品，而非替代品**。
3. **DRO 稀疏组合的期刊化落地**：Sheng 等（2025）给出分布鲁棒稀疏组合选择；理论上更完整的是 Bian & Chen（2024）：定义**强局部鞍点**以保证变量选择稳定性，并给出基于卷积的连续松弛框架，应用含稀疏稳健债券组合。

## 五、适用边界

- **因子结构的前提是可近似性**：宏观因子要求载荷可估、统计因子要求特征间隙；若真实协方差无低秩结构，因子模型退化为噪声放大器。POET 的近参数率**依赖 $\Sigma_u$ 的稀疏度**——残差相关一旦稠密（行业/风格残余），阈值化会引入系统性偏差。
- **$\ell_1$ 的失效情形**：罚参数本质是偏差—方差权衡，$\ell_1$ 会系统性低估大权重、把真非零的小权重压成零，在信号弱、资产高度相关时支撑集不稳定（Seregina 对此有专门分析）。
- **"稀疏更好"是相对的**：它依赖候选集规模与基准的选取（ridgeless 稠密解改变了结论方向）；而"因子模型解释不了稀疏组合"直接威胁"因子结构 + 稀疏"可以无缝拼接的隐含假设。
- **基数约束的计算边界**：perspective 松弛与安全筛选都要求正则化强度或收益要求"足够温和"；强约束、$k$ 极小、协方差病态时界会变松而分支树爆炸。
- **DRO 等价性的边界**：Chu–Toh–Zhang 的等价要求损失为 square-root 型、罚为简单范数与半范数之和；经典 Markowitz 的二次目标不在此列，需要显式重构，不能当作自动成立。

## 六、尚未解决的问题与对本方向的启发

1. **"稀疏性 ↔ 稳健性"目前只是参数级对应，不是统计级等价**。已知的是风险厌恶系数与稳健水平的对应；未知的是 $\ell_1$ 罚参数 $\rho$ 与 Wasserstein 半径 $\epsilon$ 在何种样本量/维度下**最优匹配**。可做的问题：在 $N/T\to c>0$ 的渐近框架下推导 $\rho^\star(\epsilon,T,N)$，并检验由 DRO 半径反解出的稀疏度是否优于交叉验证选出的稀疏度。
2. **因子结构与基数约束的联合建模缺乏理论**：现有文献要么固定因子降维后选股、要么在基数约束下估协方差，几乎无人刻画"因子估计误差如何传导到 $\ell_0$ 支撑集的稳定性"——这是与强局部鞍点、变量选择稳定性语言直接接口的干净切口。
3. **大规模可证最优仍被正则化强度绑架**：安全筛选与一阶 perspective 法都在温和正则化区间高效，强约束情形的下界质量是公开缺口。
4. **稀疏性的经济学解释缺失**：如果稀疏组合的超额表现不能由标准风险因子解释，它承担了什么风险？对 DRO 研究而言，这提示应把稀疏度当作**决策变量**而非超参数，让不确定集半径与支撑集规模联合优化。
5. **研究启发**：最短路径似乎是"$\ell_1$/Wasserstein 双参数对应 + 大规模可证求解"——用一个可解释的 DRO 半径替换 $\ell_1$ 罚参数，同时用 perspective 松弛 + 安全筛选保证 $N\sim10^3$ 规模下的可解性。理论抓手（对偶等价、收敛率）与计算抓手（B&B 下界、GPU 一阶法）都已具备，且尚未被现有文献占满。

## 参考文献

- Fama, E. F., & French, K. R. (1993). Common risk factors in the returns on stocks and bonds. *Journal of Financial Economics*, 33(1), 3–56. [DOI](https://doi.org/10.1016/0304-405X(93)90023-5)
- Fan, J., Fan, Y., & Lv, J. (2008). High dimensional covariance matrix estimation using a factor model. *Journal of Econometrics*, 147(1), 186–197. [DOI](https://doi.org/10.1016/j.jeconom.2008.09.017)
- Fan, J., Liao, Y., & Mincheva, M. (2013). Large covariance estimation by thresholding principal orthogonal complements. *Journal of the Royal Statistical Society: Series B*, 75(4), 603–680. [DOI](https://doi.org/10.1111/rssb.12016)
- Ledoit, O., & Wolf, M. (2003). Improved estimation of the covariance matrix of stock returns with an application to portfolio selection. *Journal of Empirical Finance*, 10(5), 603–621. [DOI](https://doi.org/10.1016/S0927-5398(03)00007-0)
- Brodie, J., Daubechies, I., De Mol, C., Giannone, D., & Loris, I. (2009). Sparse and stable Markowitz portfolios. *PNAS*, 106(30), 12267–12272. [DOI](https://doi.org/10.1073/pnas.0904287106)
- DeMiguel, V., Garlappi, L., Nogales, F. J., & Uppal, R. (2009). A generalized approach to portfolio optimization: Improving performance by constraining portfolio norms. *Management Science*, 55(5), 798–812. [DOI](https://doi.org/10.1287/mnsc.1080.0986)
- Chang, T.-J., Meade, N., Beasley, J. E., & Sharaiha, Y. M. (2000). Heuristics for cardinality constrained portfolio optimisation. *Computers & Operations Research*, 27(13), 1271–1302. [DOI](https://doi.org/10.1016/S0305-0548(99)00074-X)
- Bertsimas, D., & Cory-Wright, R. (2022). A scalable algorithm for sparse portfolio selection. *INFORMS Journal on Computing*, 34(3), 1489–1511. [DOI](https://doi.org/10.1287/ijoc.2021.1127)
- Chu, H. T. M., Toh, K.-C., & Zhang, Y. (2022). On regularized square-root regression problems: Distributionally robust interpretation and fast computations. *Journal of Machine Learning Research*, 23, 1–39. [arXiv:2109.03632](https://arxiv.org/abs/2109.03632)
- Chen, J., Ahipaşaoğlu, S. D., Zhang, N., & Yang, Y. (2024). Robust and sparse portfolio selection: Quantitative insights and efficient algorithms. [arXiv:2412.19462](https://arxiv.org/abs/2412.19462)
- Liu, J., Shafiee, S., & Lodi, A. (2025). Scalable first-order method for certifying optimal k-sparse GLMs. [arXiv:2502.09502](https://arxiv.org/abs/2502.09502)（ICML 2025）
- Liu, J., Lodi, A., & Shafiee, S. (2026). GPU-friendly and linearly convergent first-order methods for certifying optimal k-sparse GLMs. [arXiv:2603.01306](https://arxiv.org/abs/2603.01306)
- Wada, T., Ikeda, S., Takano, Y., & Gotoh, J. (2026). Safe screening rules for portfolio optimization with linear and cardinality constraints. [arXiv:2608.01871](https://arxiv.org/abs/2608.01871)
- Tillmann, A. M., Bienstock, D., Lodi, A., & Schwartz, A. (2022). Cardinality minimization, constraints, and regularization: A survey. [arXiv:2106.09606](https://arxiv.org/abs/2106.09606)
- Yamagata, T., & Ono, S. (2024). Sparse index tracking: Simultaneous asset selection and capital allocation via ℓ₀-constrained portfolio. *IEEE Open Journal of Signal Processing*, 5, 810–819. [DOI](https://doi.org/10.1109/OJSP.2024.3389810)
- Jo, W., & Cho, H. (2024). DCC: Differentiable cardinality constraints for partial index tracking. [arXiv:2412.17175](https://arxiv.org/abs/2412.17175)（AAAI 2025）
- Roxanas, D. (2026). Low-turnover rebalancing for sparse index tracking. [arXiv:2512.22109](https://arxiv.org/abs/2512.22109)
- Arvanitis, S., Scaillet, O., & Topaloglou, N. (2024). Sparse spanning portfolios and under-diversification with second-order stochastic dominance. [arXiv:2402.01951](https://arxiv.org/abs/2402.01951)
- Afsharhajari, N., & Li, J. Y.-M. (2026). The virtue of sparsity in complexity. [arXiv:2604.17166](https://arxiv.org/abs/2604.17166)
- Seregina, E. (2021). A basket half full: Sparse portfolios. [arXiv:2011.04278](https://arxiv.org/abs/2011.04278)
- Bian, X., & Chen, X. (2024). Nonsmooth convex-concave saddle point problems with cardinality penalties. [arXiv:2403.17535](https://arxiv.org/abs/2403.17535)
- Nikiporenko, A. (2023). Time-limited metaheuristics for cardinality-constrained portfolio optimisation. [arXiv:2307.04045](https://arxiv.org/abs/2307.04045)
- Sheng, Y., Zhang, X., Cheng, X., Luan, X., & Ji, T. (2025). Distributionally robust sparse portfolio selection. *Mathematical Foundations of Computing*, 8(3), 397–418. [DOI](https://doi.org/10.3934/mfc.2023052)
