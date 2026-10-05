## 插图数据清单

两图均为脚本实际生成的 1440×810 PNG，数据全部来自同一合成高斯因子模型。

| 图片 | x | y | 分组 | 误差棒 | 样本量 | 数据文件 |
|---|---|---|---|---|---|---|
| fig1.png | n_train=60,90,180 | risk_ratio，真实方差/Oracle方差 | method：Sample、Shrink 0.2、Shrink 0.5、Equal weight | 各样本量100次均值的1.96×标准误 | 每个样本量100次，p=40 | replicates.csv、results.json |
| fig2.png | index=1,…,40，升序特征值序号 | eigenvalue，对数纵轴 | Population、Sample、Shrink 0.2、Shrink 0.5 | 无 | n=60 的第1次重复，p=40 | spectrum.csv |

fig1 中灰色虚线为 Oracle 风险比1。risk_ratio 是逐次方差比的均值，不是平均波动的平方比。Equal weight 在所有重复中的风险相同，是总体矩阵下的确定性评价结果。条件数与杠杆未单独绘图，完整数据保存在结果文件中。
