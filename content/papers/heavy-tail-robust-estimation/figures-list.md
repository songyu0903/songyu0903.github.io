## 插图数据清单

两图均为脚本实际生成的 1440×810 PNG，数据为合成多元 Student(3) 收益。

| 图片 | x | y | 分组 | 误差棒 | 样本量 | 数据文件 |
|---|---|---|---|---|---|---|
| fig1.png | method：Sample、MOM mean、Winsorized | mean_l2_error，日收益百分点 | contamination 名义目标0或0.03；后者实际修改5/180 | 无均值误差棒；箱体为四分位范围，线为中位数，须线为1.5×IQR范围内点，不显示离群点 | 每组120次，每次训练180 | replicates.csv |
| fig2.png | method：同上 | oracle_regret，日收益百分点 | 同上 | 120次均值的1.96×标准误 | 每组120次；效用由总体均值和协方差计算 | replicates.csv、results.json |

测试集每次4000个观测，用于CVaR95，不用于训练、调参或真实效用计算。Oracle使用真实均值和协方差，服从与其他方法相同的多头、预算、0.6持仓上限，未在两图中绘制。contamination=0.03 是实验设计标签，实际污染比例为 round(180×0.03)/180=5/180。
