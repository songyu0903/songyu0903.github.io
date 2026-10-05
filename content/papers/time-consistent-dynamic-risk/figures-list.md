# 插图与数据字段清单

全部图为已执行 base R 脚本生成的合成数据图；尺寸 1600×1000 px，无误差棒。

| 图片 | 来源文件 | x | y | 分组 | 概率与规模 |
|:---|:---|:---|:---|:---|:---|
| fig1.png | results.csv | lambda | good、bad 风险资产权重 | method × node | 5 个混合系数，每个完整枚举 9261 个策略；确定性 |
| fig2.png | terminal-paths.csv | path | return × 100 | method | lambda=0.40，6 条路径概率 0.56、0.16、0.08、0.06、0.10、0.04；确定性 |

英文字段与正文对应：static=静态终端，nested=嵌套风险，good=有利节点，bad=不利节点。
fig2 的柱宽不代表路径概率；概率明确写在正文图注中。
