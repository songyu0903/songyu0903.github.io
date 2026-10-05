# 插图与数据字段清单

全部图为已执行 base R 脚本生成的合成数据图；尺寸 1600×1000 px，无误差棒。

| 图片 | 来源文件 | x | y | 分组 | 规模与定义 |
|:---|:---|:---|:---|:---|:---|
| fig1.png | shortfall-curves.csv | weight | nominal、moments_2、moments_3、moments_4 × 100 | 信息集合 | 501 个权重点；九点因子支撑；29、24、23 个去重极点 |
| fig2.png | worst-distributions.csv、support.csv | factor | nominal_prob、worst_prob | 名义、moments_2、moments_4 | 九点因子支撑；最坏概率分别在各自最优权重 0 与 1 上计算 |

图 2 不是固定同一权重的最坏分布比较。脚本输出的 loss 和 dual_majorant 字段可逐点验证有限支撑对偶证书。
本实验没有执行 SOS 半正定松弛；图中多项式证书只在九点支撑上有效。
