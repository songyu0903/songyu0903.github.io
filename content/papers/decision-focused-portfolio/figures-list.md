## 图表字段清单

| 图 | 文件与数据来源 | x 字段 | y 字段 | 分组 | 误差棒 | 样本量 |
|---|---|---|---|---|---|---|
| 图 1 | fig1.png；合成 results.csv | method | monthly_regret_bps 的跨重复均值 | method | 重复标准差除以 sqrt(60) | 每组 60 次重复，每次 400 测试样本 |
| 图 2 | fig2.png；合成 results.csv | prediction_mse_times_1e4 | monthly_regret_bps | method | 无 | 每组 60 个散点，共 180 点 |

图片为 Matplotlib 本地生成，均为 1440×810 像素。mean_gross_exposure 是总敞口倍数；correction_norm 是共享系数的欧氏距离；两者仅用于表格而非散点坐标。
