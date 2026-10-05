## 插图数据清单

两图均为脚本实际生成的 1440×810 PNG，数据全部为合成数据。

| 图片 | x | y | 分组 | 误差棒 | 样本量 | 数据文件 |
|---|---|---|---|---|---|---|
| fig1.png | radius，Wasserstein 半径，日收益百分点 | clean_cvar、stress_cvar，CVaR90，日收益百分点 | 稳定分布 / 资产1波动乘3 | 每组24次均值的1.96×标准误 | 每次训练100、每个测试环境4000；重复24次 | replicates.csv、results.json |
| fig2.png | radius，离散类别 | weight，每次训练后组合权重的24次均值 | asset=1,…,5，堆叠 | 无 | 24次权重向量 | weights.csv |

fig1 不绘制等权基线；其数字完整保存于 results.json，radius=-1 表示等权，不是负 Wasserstein 半径。误差棒反映 Monte Carlo 均值误差，不是未来损失预测区间。各组使用相同训练与测试样本以降低比较噪声。
