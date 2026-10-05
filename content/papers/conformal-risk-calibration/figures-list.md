## 图表字段清单

| 图 | 文件与数据来源 | x 字段 | y 字段 | 分组 | 误差棒 | 样本量 |
|---|---|---|---|---|---|---|
| 图 1 | fig1.png；合成 scores.csv | max_score | 排序后的经验分布累积概率 | scenario | 无；q_joint 为竖线 | 首次重复，每个情景 1000 测试向量、200 校准向量 |
| 图 2 左 | fig2.png；合成 results.csv | method | simultaneous_coverage 的跨重复均值 | scenario、method | 重复标准差除以 sqrt(60) | 每组 60 次重复，每次 1000 测试向量 |
| 图 2 右 | fig2.png；合成 results.csv | method | risky_exposure_pct 的跨重复均值 | method | 重复标准差除以 sqrt(60) | 每种方法 60 个校准划分 |

两幅图片使用 Matplotlib 本地生成，尺寸分别为 1440×810 和 1620×810 像素。校准规则和敞口在测试前固定，因此图 2 右图无需分别画两种测试情景。
