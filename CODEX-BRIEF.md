# 学术主页改版 · Codex 交接说明

> 你（Codex）的任务是**完善现有改版**，不要从零重做，也不要把站点推到 GitHub。
> 推送由 DeepSeek Harness 侧的助手在验收后完成。

---

## 1. 背景与现状

- 这是一个个人学术主页：作者 `Y.S`，数学专业硕士研究生，方向投资组合优化（鲁棒 / 分布鲁棒、估计误差、尾部风险、决策导向学习）。
- 线上老站：<https://songyu0903.github.io/>，用 Hugo + Book 主题生成，仓库 `songyu0903/songyu0903.github.io` 里**只有构建产物**（没有 Hugo 源项目，本机也没有 Hugo 与 git）。
- 本机已有一套**新的自建静态生成器**，放在工作区：

```
C:\Users\eiegant\Desktop\投资组合优化\site-redesign\
├─ extract.mjs        从线上老站抽取正文与元数据 → content/
├─ build.mjs          生成整站到 dist/（唯一的内容渲染入口）
├─ mirror.mjs         为本地预览镜像二进制资源（KaTeX 字体、插图、头像、简历、徽章）
├─ serve.mjs          本地预览服务器：node serve.mjs 4173
├─ crawl.mjs          站内链接/资源爬检（应 0 broken）
├─ imgcheck.mjs       检查正文图片是否都在本地
├─ cdp-test.mjs       Chrome DevTools 协议交互自检（15 项，应全 PASS）
├─ shot.mjs / cdp-shot.mjs  无头浏览器截图
├─ assets/site.css    设计系统（光/暗两套，玻璃质感）
├─ assets/site.js     主题切换、滚动入场、目录高亮、筛选、搜索、图片放大
├─ content/*.json     8 篇论文 / 4 篇笔记 / 6 个方向 / 关于页 的结构化数据
├─ content/html/*.html 各页正文 HTML（已由老站渲染好，公式以 $...$ / $$...$$ 原文保存，前端 KaTeX 渲染）
├─ dist/              当前构建结果（含镜像资源）
└─ preview/           截图，仅作参考
```

**当前进度**：整站重构已完成并通过自检，但**尚未发布**——线上仍是老的 Hugo 版。

---

## 2. 你必须遵守的硬约束

1. **URL 结构不得改变**：`/`、`/about/`、`/papers/`、`/papers/<slug>/`、`/topics/`、`/topics/<slug>/`、`/blog/`、`/blog/<slug>/`、`/tags/`、`/tags/<slug>/`、`/404.html`、`/sitemap.xml`、`/index.xml`。
   - 标签 slug 必须与旧站一致（Hugo urlize 规则：小写、空格转 `-`，中文保留）。现有 26 个标签已经对齐，不要改名。
2. **内容事实不得改动**：论文标题、日期（2026-10-05）、数值、结论、文献链接、作者信息一律保持原样。正文 HTML 里的公式请**逐字保留**（含 `$`、`$$`、反斜杠）。
3. **不引入外部 CDN 依赖**（Google Fonts / jsDelivr / unpkg 等在国内不可靠）：字体用系统字体栈，KaTeX 用仓库里的 `/katex/`。
4. **无 JavaScript 时正文必须可读**：动效只能是渐进增强。
5. 不新增跟踪、不接第三方评论、不接统计服务（现有访问量徽章已移除，不要加回）。
6. 不修改 `dist/` 以外的线上文件；**不要执行 git push / 不要调用 GitHub API**。

---

## 3. 设计系统（已确定，请在其上打磨而不是推翻）

- 风格：苹果玻璃质感（磨砂半透明面板 + 弥散渐变背景 + 大圆角 + 克制强调色），浅色/深色双主题。
- 设计变量都在 `assets/site.css` 顶部 `:root` / `[data-theme="dark"]`，改色改圆角请走变量。
- 字体：`ui-sans-serif / -apple-system / PingFang SC / Microsoft YaHei`；等宽 `ui-monospace / JetBrains Mono / Consolas`。
- 动效已有：首屏逐项淡入、滚动入场（`data-reveal`）、卡片跟随光标光斑、首屏公式卡 3D 微倾斜、数字滚动、主题切换过渡、文章阅读进度条、目录高亮、图片放大。
- 所有动效必须尊重 `prefers-reduced-motion`。
- 组件清单：`.nav`、`.hero`、`.card`（方向卡）、`.paper-item`（论文行）、`.filter-bar`、`.article-grid` + `.prose` + `.toc`、`.profile-card`（关于页）、`.search`（⌘K 搜索浮层）。

### 站内搜索

- 索引由 `build.mjs` 生成 `dist/search-index.json`（论文/笔记/方向/页面），前端在 `assets/site.js` 里做加权子串匹配（标题 > 标签 > 摘要 > 正文），支持 ⌘/Ctrl+K、↑↓、Enter、Esc。
- 修改索引结构时，前端打分逻辑要同步改。

---

## 4. 环境注意事项（踩过的坑）

- 本机 **没有 git**，也**没有 Hugo**；网络请求请用 Node（`fetch` 正常）。PowerShell 的 `Invoke-WebRequest` / `curl.exe` 因 SChannel 故障会报 `SEC_E_NO_CREDENTIALS`，别用它联网。
- 无头 Edge 需要 `--headless=new --no-sandbox --disable-gpu`，并通过 CDP 控制才稳定；直接用 `--screenshot` 会被沙箱的命名管道限制挡住。
- `build.mjs` 每次会清空 `dist/`，**构建后必须再跑 `node mirror.mjs`**，否则预览里 KaTeX 与图片会 404。
- 正文 HTML 使用无引号的属性（`src=fig1.png`、`class=anchor`），解析时别假设有引号。

---

## 5. 可以做的改进（按优先级自选，不必全做）

1. **视觉打磨**：首屏排版节奏、卡片密度、字体层级、深浅色对比度（正文 `--ink-2` 在浅色下仍偏灰，可提到 0.74~0.78）。
2. **信息架构**：首页是否只放 4~5 篇精选并加「全部论文」；是否加「最近更新」时间线；方向页是否补上「这个方向的核心问题 / 入门读哪篇」。
3. **论文页体验**：图注可点击放大已有；可加「复制引用（BibTeX）」、公式编号跳转、打印样式检查。
4. **移动端**：375/390/430 三档；导航抽屉、表格横向滚动、公式溢出。
5. **性能**：`search-index.json` 现在 89 KB，可截断正文到 2500 字或按需分片。
6. **无障碍**：焦点顺序、`aria-*`、对比度（WCAG AA）、键盘可达。
7. **SEO**：`og:image`、`twitter:card`、结构化数据（ScholarlyArticle）、`sitemap` 的 `lastmod` 真实化。

不要做的：换掉整体玻璃风格、改成暗黑科技风、引入 React/Vue 框架、加自动播放视频或粒子背景。

---

## 6. 自检（改完必须全部通过，并把输出贴进交付说明）

```powershell
cd C:\Users\eiegant\Desktop\投资组合优化\site-redesign
node build.mjs            # 期望：pages: 51 tags: 26
node mirror.mjs           # 期望：failed: 0
node crawl.mjs            # 期望：broken: 0
node imgcheck.mjs         # 期望：missing: 0
node serve.mjs 4173       # 另开一个进程，供截图/自检
node cdp-test.mjs         # 期望：15/15 passed
```

截图（可选，用于说明改动）：

```powershell
node shot.mjs "http://127.0.0.1:4173/" "preview/home.png" 1440 0 full
node shot.mjs "http://127.0.0.1:4173/" "preview/home-dark.png" 1440 0 dark
node shot.mjs "http://127.0.0.1:4173/" "preview/home-mobile.png" 390 0
```

---

## 7. 交付格式（重要，决定我怎么推送）

改完后，在 `site-redesign/` 下生成 `HANDOFF.json`：

```json
{
  "summary": "一句话说明这轮改了什么",
  "changedFiles": ["assets/site.css", "build.mjs", "..."],
  "newBinaryAssets": ["dist/papers/xxx/fig3.png"],
  "deletedPaths": [],
  "qa": {
    "build": "pages: 51 tags: 26",
    "mirror": "failed: 0",
    "crawl": "broken: 0",
    "imgcheck": "missing: 0",
    "cdpTest": "15/15 passed"
  },
  "notes": "需要我特别注意的地方，例如新增了哪些页面、哪些 URL 变了"
}
```

同时写一份 `CHANGELOG.md`（中文，按「改了什么 / 为什么 / 怎么验证」三段）。

> 注意：我推送时只会推送**文本文件**（`.html/.xml/.css/.js/.json/.svg`）与你列在 `newBinaryAssets` 里的二进制文件。
> 已有图片、KaTeX 字体、简历等二进制资源线上已存在，不需要重复上传；如果你新增了图片/字体，必须写进 `newBinaryAssets`，否则线上会 404。

---

## 8. 交付后的流程（由 Harness 侧执行）

1. 我读取 `HANDOFF.json` + `dist/`，逐项核对 URL 与文件清单。
2. 我用 GitHub API（无 git 环境）把页面与资源提交到 `songyu0903/songyu0903.github.io` 的 `main`。
3. 等 Pages 构建完成，用线上地址逐页复检（HTTP 200、KaTeX 渲染、图片、深色模式、搜索索引）。
4. 把结果回报给你；如需回滚，整站可以从改动前的 `dist/` 快照恢复。
