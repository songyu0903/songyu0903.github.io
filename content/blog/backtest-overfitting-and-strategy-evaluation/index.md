---
weight: 9
title: "回测过拟合与策略评估统计：从 Reality Check 到搜索感知的绩效推断"
date: 2026-10-04
summary: "阅读笔记：为什么样本外检验也会被选择效应污染——数据窥探的多重检验框架、紧缩夏普比率与回测过拟合概率的数学结构，以及一套可执行的组合策略评估协议。"
tags:
  - "阅读笔记"
  - "回测过拟合"
  - "多重检验"
  - "策略评估"
  - "文献调研"
---

**问题定位**：策略评估的统计难题不在于"是否做了样本外检验"，而在于**样本外检验本身也是被选择过程污染的观测**。设研究者依次评估了 $N$ 个候选策略，真实绩效泛函为 $\theta_i$，样本内统计量为 $\hat\theta_i=\theta_i+\varepsilon_i$，最终报告的是 $\hat i=\arg\max_i\hat\theta_i$。即使全部 $\theta_i\le0$，只要 $\varepsilon_i$ 有随机性，被选中的策略仍会显示正绩效。选择效应的量级随试验次数**对数增长**，因此"样本外表现好"并不自动等于"真实优势"——污染发生在策略选择环节，样本外测试只是继承了污染。

另有两个来源同样致命。其一是**试验次数的不可观测性**：多重检验校正的全部威力都依赖 $N$，而 $N$ 通常由研究者自行申报；搜索了上千种配置却只报告单一试验的回测，形式上满足校正公式，实质上绕过了它。其二是**非平稳性**：若反复切分样本以挑选最有利的切分方式，样本外段会退化为新的样本内段，数据生成过程的漂移同时破坏自助法所依赖的分布稳定性。因此核心问题可表述为：**在只知道被搜索过的候选族与有限样本的条件下，如何对"真实技能"做有效推断**。

## 一、必读锚点

- **White (2000), A Reality Check for Data Snooping**：把数据窥探形式化为对基准模型优越性的多重检验，用平稳自助法逼近检验统计量的零分布。局限是零分布在"全部候选与基准等劣"的最不利情形下计算，检验偏保守，功效高度依赖自助法对自相关结构的逼近质量。
- **Hansen (2005), A test for superior predictive ability**：对 Reality Check 做学生化并引入阈值剔除明显劣质模型，重构零分布，给出 $p$ 值的一致性，在同等渐近控制下通常功效更高。
- **Sullivan, Timmermann & White (1999)**：以道指百年日频数据与两万余条技术交易规则为搜索空间，量化了数据窥探偏差的经验量级。结论针对特定资产与规则族，不可直接外推到现代因子库或机器学习策略族。
- **Bailey & López de Prado (2014), The Deflated Sharpe Ratio**：把夏普比率的推断改写为对"试验多次后的最大值"的推断，同时校正选择偏差、样本长度与非正态性。
- **Bailey, Borwein, López de Prado & Zhu (2014)**：用最小回测长度论证"回测越长越容易产生虚假高夏普"，给出反过拟合的样本量下界——诊断性论证，不给出对具体策略的 $p$ 值。
- **Bailey 等, The Probability of Backtest Overfitting**：提出组合对称交叉验证（CSCV）与 PBO 指标，把过拟合概率定义为最优策略样本外排名落入中位数以下的频率。
- **Harvey, Liu & Zhu (2016)**：把因子动物园纳入多重检验框架，指出单因子 $t$ 阈值须由 2.0 提高到约 3.0。
- **Barras, Scaillet & Wermers (2010)** 与 **Fama & French (2010)**：在真实基金样本中估计技能、零 $\alpha$ 与运气的比例（前者报告约 75% 的基金扣费后 $\alpha$ 为零量级）。

## 二、关键数学结构

**（1）概率夏普比率。** 设偏度 $\gamma_3$、峰度 $\gamma_4$（正态为 3），夏普比率估计的标准误为 $\widehat{\mathrm{SE}}=\sqrt{(1-\gamma_3\widehat{SR}+\frac{\gamma_4-1}{4}\widehat{SR}^2)/(T-1)}$，则

$$
PSR(\widehat{SR}^{*})=\Phi\!\left(\frac{(\widehat{SR}-SR^{*})\sqrt{T-1}}{\sqrt{1-\gamma_3\widehat{SR}+\frac{\gamma_4-1}{4}\widehat{SR}^2}}\right),
$$

把"夏普比率是否真实存在"转化为正态近似下的单侧检验，同时把负偏与尖峰计入标准误。

**（2）期望最大统计量与紧缩夏普比率。** 在 $N$ 个独立试验、真实 $SR=0$、收益率正态的设定下，

$$
\mathbb E\!\left[\max_i\widehat{SR}_i\right]\approx\sqrt{\mathrm{Var}(\widehat{SR})}\left[(1-\gamma)\Phi^{-1}\!\left(1-\frac1N\right)+\gamma\,\Phi^{-1}\!\left(1-\frac{1}{Ne}\right)\right],
$$

其中 $\gamma\approx0.5772$ 为 Euler–Mascheroni 常数。这是最大值泛函的渐近展开（首项 $\sqrt{2\log N}$，次项含 $\log\log N$）：$N$ 由 $10$ 增至 $10^6$ 时 $\sqrt{2\log N}$ 由约 $2.15$ 升到约 $5.25$。把该基准代入 $SR^{*}$ 即得紧缩夏普比率 $DSR=PSR(\mathbb E[\max_i\widehat{SR}_i])$——**它回答的不是"这个策略有多好"，而是"纯噪声搜索这么多次后能显得多好"**。

**（3）回测过拟合概率。** 把绩效序列切成 $S$（偶数）块，对每个由 $S/2$ 块构成的组合 $c$ 构造训练集与互补测试集：

$$
PBO=\frac{1}{|\mathcal C|}\sum_{c\in\mathcal C}\mathbf 1\!\left[\log\frac{\tilde n_c}{N-\tilde n_c}\le0\right],
$$

$\tilde n_c$ 为训练集最优策略在测试集中的排名。它度量"样本内最优在样本外丧失优势"的概率，**$PBO>0.5$ 意味着样本内择优的期望信息为负**。

**（4）SPA 的自助法统计量。** 令 $d_{i,t}$ 为相对基准的超额收益、$t_i=\bar d_i/\hat\omega_i$，

$$
T^{SPA}=\max\left[\max_i\frac{\bar d_i}{\hat\omega_i},\,0\right],\qquad
\bar Z_i=\max(0,\bar d_i-A_i),\quad A_i=\frac14\hat\omega_i\sqrt{\frac{2\log\log T}{T}} .
$$

阈值 $A_i$ 把明显劣于基准的候选从最大值中剔除，降低劣质候选对零分布的向上污染，从而在同名义水平下提高功效。

## 三、2022–2026 最新进展

1. **搜索感知推断的统一化**：López de Prado & Porcu（2026）把散落的校正工具整合为框架；此前 López de Prado（2022）已系统刻画多重检验下夏普比率的第一类与第二类错误。
2. **发表偏差的元研究**：Chen & Zimmermann（2022）用经验贝叶斯估计发现多数已发表发现的样本外可持续，校正后平均收缩约为样本内平均收益的 **10–15%**，错误方向推断风险低于 10%；但多重检验下 $t$ 门槛超过 3.0，替代组合检验使收益减弱约 **30–50%**。
3. **过拟合检测作为假设检验**：Gort 等（2022）在加密货币 2022 年两次崩盘期间，低过拟合的深度强化学习代理收益高于高过拟合代理、等权组合与指数基准——样本期极短，宜作流程示范而非绩效证据。
4. **扩大截面与样本长度即可推翻结论**：Li, Kim, Cucuringu & Ma（2025，FINSABER）在 20 年、100 余个标的的系统回测中，原先报告的 LLM 策略优势显著衰减，并呈现牛市过度保守、熊市过度激进的模式。
5. **稳健性评分与其现实检验**：Santoni 等（2026）把 DSR、PBO、SPA 与最小回测长度加 regime 稳定性合成 0–100 评分，以 359,062 条生产回测记录校准，合成市场中 AUROC 约 0.989，但**预注册的真实市场前瞻检验未显示显著关系**（Spearman $\rho=0.013$，单侧置换 $p=0.40$）。
6. **把试验次数变成可审计对象**：Muavia（2026）针对"$N$ 由被约束者自报"这一结构性弱点，把试验集预先承诺到 Merkle 树、以叶子数定义 $N$，并用零知识证明在电路内计算 PBO，其自带策略被该流程判为不显著（DSR $0.68<0.95$）。

## 四、适用边界与失效条件

- **试验次数的口径是最大不确定源**：真实 $N$ 混合了预处理、特征筛选、超参数、再平衡频率、约束设定与人为反复修改，且常含未记录的隐性试验。低估 $N$ 会低估选择偏差；把 $N$ 定义得过宽又会让检验丧失功效。
- **非正态与自相关**：PSR/DSR 依赖独立同分布的正态近似（经偏度、峰度修正），日频及以上存在波动聚集与序列相关时会低估标准误；SPA 与 Reality Check 依赖平稳自助法对依赖结构的逼近，在强长记忆或结构断裂下失效。
- **候选之间高度相关**：DSR 的期望最大值近似假设试验独立，在高度相关时会**高估**选择偏差；Bonferroni 类校正过于保守，FDR 在强相关与弱相关下的控制差异明显。
- **样本长度不足**：夏普比率的估计误差约为 $\sqrt{(1+SR^2/2)/T}$ 量级，最小回测长度只是必要条件而非充分条件，且建立在平稳性假设之上。
- **PBO 对切分方案的敏感性**：块数 $S$ 与切分方式是研究者自由度的一部分，报告 PBO 时应同时报告切分方案及其稳定性。

## 五、尚未解决的问题与可执行的评估协议

**未解决问题**：①如何把"搜索过的候选族"操作化为可审计的对象；②策略高度相关时如何构造既有效又稳健的检验，并同时给出"相对 $1/N$ 与收缩基准的改进"与"相对无效前沿的改进"；③非平稳下的检验如何构造，块自助法在何种漂移速度下失效尚无统一结论；④DSR 期望最大值近似的精确性与相关性修正仍未完整刻画；⑤综合稳健性评分的真实前瞻预测能力目前未见显著证据。

**可执行协议（可直接用于本方向实证）**：

1. **把"能否击败 $1/N$ 与收缩协方差基准"写成带多重检验校正的检验**：固定基准族（等权、Ledoit–Wolf 收缩最小方差组合、风险平价），计算相对基准的超额收益 $d_{i,t}$，用平稳自助法得到 $\max_i t_i$ 的零分布并报告 SPA $p$ 值；同时报告 Benjamini–Hochberg 或 Romano–Wolf 逐步拒绝集，而不是逐个 $t$ 检验。
2. **披露搜索预算并计数全部评估过的配置**：把"预处理 → 协方差估计 → 期望收益估计 → 约束与权重上限 → 再平衡频率 → 调参"的笛卡尔积写成计数表，$N$ 取其中实际被评估过的配置数。
3. **嵌套交叉验证与 CSCV 双重报告**：除 DSR 外报告 PBO（含切分方案）以及"训练窗长度变化下策略排序的稳定性"。
4. **数据泄漏审计**：对任何使用机器学习或大语言模型的策略，检查特征构造、标准化、缺失值填补与超参数选择是否使用了未来信息——Oracle 式泄漏策略也可能在样本外显示很高的夏普比率，而现有校正未必识别得出来。
5. **报告规范**：同时给出样本内与样本外夏普、收缩后 DSR、最小回测长度与 PBO，并在样本外显著低于期望时如实报告；检验统计量用以时间为单位的块自助法，以吸收横截面与序列相关。

## 参考文献

- White, H. (2000). A Reality Check for Data Snooping. *Econometrica*, 68(5), 1097–1128. [DOI](https://doi.org/10.1111/1468-0262.00152) ⚠️DOI 为间接核验（经两篇独立 Crossref 记录的参考文献交叉比对）
- Hansen, P. R. (2005). A test for superior predictive ability. *Journal of Business & Economic Statistics*, 23(3), 365–380. [DOI](https://doi.org/10.1198/073500105000000063) ⚠️间接核验
- Sullivan, R., Timmermann, A., & White, H. (1999). Data-snooping, technical trading rule performance, and the bootstrap. *The Journal of Finance*, 54(5), 1647–1691. [DOI](https://doi.org/10.1111/0022-1082.00163)
- Bailey, D. H., & López de Prado, M. (2014). The deflated Sharpe ratio: Correcting for selection bias, backtest overfitting, and non-normality. *The Journal of Portfolio Management*, 40(5), 94–107. [DOI](https://doi.org/10.3905/jpm.2014.40.5.094)
- Bailey, D. H., Borwein, J. M., López de Prado, M., & Zhu, Q. J. (2014). Pseudo-mathematics and financial charlatanism. *Notices of the AMS*, 61(5), 458–464. [DOI](https://doi.org/10.1090/noti1105)
- Bailey, D. H., Borwein, J. M., López de Prado, M., & Zhu, Q. J. The probability of backtest overfitting. *Journal of Computational Finance*. [DOI](https://doi.org/10.21314/JCF.2016.322) ⚠️卷(期)与页码 unverified
- Harvey, C. R., Liu, Y., & Zhu, H. (2016). … and the cross-section of expected returns. *The Review of Financial Studies*, 29(1), 5–68. [DOI](https://doi.org/10.1093/rfs/hhv059)
- Harvey, C. R., & Liu, Y. (2015). Backtesting. *The Journal of Portfolio Management*, 42(1), 13–28. [DOI](https://doi.org/10.3905/jpm.2015.42.1.013)
- Barras, L., Scaillet, O., & Wermers, R. (2010). False discoveries in mutual fund performance. *The Journal of Finance*, 65(1), 179–216. [DOI](https://doi.org/10.1111/j.1540-6261.2009.01527.x)
- Fama, E. F., & French, K. R. (2010). Luck versus skill in the cross-section of mutual fund returns. *The Journal of Finance*, 65(5), 1915–1947. [DOI](https://doi.org/10.1111/j.1540-6261.2010.01598.x)
- DeMiguel, V., Garlappi, L., & Uppal, R. (2009). Optimal versus naive diversification. *The Review of Financial Studies*, 22(5), 1915–1953. [DOI](https://doi.org/10.1093/rfs/hhm075)
- Ledoit, O., & Wolf, M. Honey, I shrunk the sample covariance matrix. *The Journal of Portfolio Management*. [DOI](https://doi.org/10.3905/jpm.2004.110) ⚠️卷(期)页码 unverified
- López de Prado, M., & Porcu, E. (2026). The deflated Sharpe ratio: A unified framework for search-adjusted performance inference. *The Journal of Portfolio Management*. [DOI](https://doi.org/10.3905/jpm.2026.070) ⚠️在线先发
- López de Prado, M. (2022). Type I and type II errors of the Sharpe ratio under multiple testing. *The Journal of Portfolio Management*, 49(1), 39–46. [DOI](https://doi.org/10.3905/jpm.2022.1.403)
- Chen, A. Y., & Zimmermann, T. (2022). Publication bias in asset pricing research. [arXiv:2209.13623](https://arxiv.org/abs/2209.13623) ⚠️预印本
- Gort, B. J. D., Liu, X.-Y., Sun, X., Gao, J., Chen, S., & Wang, C. D. (2022). Deep reinforcement learning for cryptocurrency trading: Practical approach to address backtest overfitting. [arXiv:2209.05559](https://arxiv.org/abs/2209.05559) ⚠️预印本
- Li, W. W., Kim, H., Cucuringu, M., & Ma, T. (2025). Can LLM-based financial investing strategies outperform the market in long run? [arXiv:2505.07078](https://arxiv.org/abs/2505.07078)
- Sheppert, A. (2026). The GT-Score: A robust objective function for reducing overfitting in data-driven trading strategies. [arXiv:2602.00080](https://arxiv.org/abs/2602.00080) ⚠️期刊侧未核验
- Santoni, M. L., Jouanne, V., & Scullin, M. L. (2026). Equity strategy backtesting: Luck or edge? The MinervaScore as a statistical robustness grade. [arXiv:2608.23808](https://arxiv.org/abs/2608.23808) ⚠️预印本
- Muavia, M. (2026). Who counts the trials? A committed trial ledger for enforcing the deflated Sharpe ratio in zero-knowledge. [SSRN 7187319](https://doi.org/10.2139/ssrn.7187319) ⚠️预印本
- Gençay, E. (2026). What survives honest evaluation? Leakage-safe, search-aware assessment of LLM-driven trading strategy discovery. [arXiv:2608.27734](https://arxiv.org/abs/2608.27734) ⚠️预印本（数据泄漏审计的直接参考）

*核验说明：以上条目的作者/年份/期刊/卷(期)/页码均经 Crossref 完整记录或 arXiv 官方 API 逐字段比对；标注 ⚠️ 者为间接核验、卷期页缺失或仅有预印本版本。DSR/PBO/SPA 三类指标的具体数值均取自所引文献自报结果，未在本机复算。*
