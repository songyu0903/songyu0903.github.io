## 图表字段清单

| 图 | 文件与数据来源 | x 字段 | y 字段 | 分组 | 误差棒 | 样本量 |
|---|---|---|---|---|---|---|
| 图 1 | fig1.png；合成 wealth.csv | month | wealth 的跨路径均值 | multiplier | 无 | 每组 30 路径、121 个财富时点 |
| 图 2 左 | fig2.png；合成 results.csv | multiplier | monthly_turnover_pct | multiplier | 路径标准差除以 sqrt(30) | 每组 30 路径、每路径 120 月 |
| 图 2 右 | fig2.png；合成 results.csv | multiplier | monthly_fee_bps | multiplier | 路径标准差除以 sqrt(30) | 每组 30 路径、每路径 120 月 |

图片采用 Matplotlib 本地生成，输出尺寸分别为 1440×810 和 1620×810 像素。图内英文标签与正文中文图注一一对应。
