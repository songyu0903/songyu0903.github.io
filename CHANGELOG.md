# CHANGELOG

日期：2026-10-19。本轮在指定的 site-redesign 工作目录完成，保留自建 Node 生成器与现有苹果玻璃风格。

## 改了什么

- 视觉：调整首屏段落宽度、字重、段落节奏和卡片密度；提高浅色正文及双主题日期、说明、卡片编号的对比度；加强按钮和键盘焦点的辨识度。
- 首页：由全部8篇展开改为跨五个研究方向的5篇精选，保留「全部论文」入口；原工具笔记卡片区改为「最近更新」，按原发布日期分4组，同日8篇论文与1篇笔记可用原生details展开。所有12篇文章都可从时间线访问。
- 方向页：六页均新增「核心问题 / 先读哪篇」及阅读理由。原介绍、标题与正文未改。
- 论文页：8篇新增本站研究笔记的BibTeX，可展开、选择或复制；未填入不存在的期刊、DOI等字段。图片与图注支持键盘放大、关闭和焦点返回；没有独立图注的图片也有可见放大按钮。
- 移动端：处理长行内/行间公式与宽表格的局部滚动；修复decision-focused-portfolio与moment-shortfall-sos在375/390px的长向量溢出。仅溢出区域加入键盘焦点，宽屏恢复行内公式布局。
- 无障碍与打印：搜索、菜单、灯箱支持焦点圈定、背景inert、Escape和焦点恢复；搜索补齐combobox/listbox语义与可见关闭按钮；无JS时隐藏交互控件并提供移动导航。动效响应prefers-reduced-motion；打印隐藏导航等界面，展开引用，强制代码块使用可读的黑字白底并允许换行。
- 搜索：每篇正文截取从4000改为2500字符；完整标题、标签、摘要保留，索引从91,034降到62,292字节（减少31.6%），按需加载方式保持不变。正文后段独有关键词的召回范围随之缩小。
- 新增本地扩展验收脚本qa-redesign.mjs。完整变更文件清单见HANDOFF.json；共54个dist文本文件有变化。

新增站点二进制资源路径：[]。删除路径：[]。原有图片、字体、简历等资源与改动前哈希一致。验收截图仅作交付附件，不需要上传为站点资源。

## 为什么

让读者在首屏更清楚地看到研究主题和论文入口，用五篇代表作与发布日期时间线降低首页重复信息；方向页直接回答研究什么、先读什么；阅读时可复制引用、看清图表，并在窄屏和键盘操作下保持内容可达。所有导读都基于本地已有介绍，时间线没有把构建日期当作文章更新时间。继续使用系统字体、本地/katex/与原生静态HTML，没有引入CDN、框架或跟踪服务。

## 怎么验证

构建顺序为node build.mjs → node mirror.mjs。node serve.mjs 4173在本机已运行，沿用同一实例读取最新dist；没有停止原有预览进程。

以下是最终构建与必需自检的实际输出：

```text
> node build.mjs
pages: 51 tags: 26

> node mirror.mjs
mirrored: 62, cached: 0, failed: 0

> node crawl.mjs
pages: 51 resources/links: 78
broken: 0

> node imgcheck.mjs
images checked: 34 missing: 0

> node cdp-test.mjs
PASS  主题切换  (light → dark, stored=dark)
PASS  主题切回
PASS  首页公式渲染  (katex nodes=3)
PASS  滚动入场  (12/12 已进入)
PASS  论文筛选  (全部=8, 筛选=2, url=?topic=estimation-highdim)
PASS  文章公式渲染  (katex=61)
PASS  目录生成  (toc=6)
PASS  目录锚点可解析
PASS  目录高亮/进度条  (active=1, progress=26.46%)
PASS  搜索面板打开  (open=true, index=true)
PASS  搜索命中  (results=9, first=/papers/heavy-tail-robust-estimation/)
PASS  回车跳转结果  (/papers/heavy-tail-robust-estimation/ vs /papers/heavy-tail-robust-estimation/)
PASS  论文卡片整卡可点  (/papers/ → /papers/wasserstein-cvar-portfolio/)
PASS  移动端抽屉  (before=true, after=false, links=5)
PASS  移动端无横向溢出  (溢出=0px)

15/15 passed
```

扩展验收命令：node qa-redesign.mjs（可选--out输出目录、--screenshots）。最终完整结果：

```text
manifest: 1/1 passed
layout: 306/306 passed
contrast: 4/4 passed
information: 1/1 passed
modals: 4/4 passed
math: 8/8 passed
images: 40/40 passed
citation: 8/8 passed
local-scroll: 37/37 passed
no-js: 16/16 passed
print: 12/12 passed
reduced-motion: 2/2 passed
runtime: 1/1 passed
440/440 passed
```

其中布局覆盖全部51页、375/390/430三档和浅深两主题，共306组；其余包含8篇论文公式渲染、全部图片/图注键盘操作、8篇BibTeX复制、12篇文章局部滚动与不可断行压力样本、搜索/菜单焦点、16个无JS页面、12篇打印媒体与减少动效。站点运行时异常为0。复制测试捕获剪贴板写入的文本并与完整条目比对，不修改用户的系统剪贴板。

对比度基色复合采样最低：浅色5.640:1、深色9.567:1。该采样计算文字透明度和祖先backgroundColor，未模拟弥散渐变、backdrop-filter及文字抗锯齿，不构成全站WCAG AA认证；桌面浅深色、390px首页及方向、引用、图表截图另已目视复核。

补充契约核验：17/17内容文件SHA-256一致，12/12文章在移除原页标题、日期重复行和空锚点后的正文逐字完整保留；51/51页面路径与26/26标签路径一致。另检查含无引号属性的全部本地链接、资源和锚点，broken: 0。dist文件集合无新增/删除，二进制文件无变更。

HANDOFF.json与CHANGELOG.md已写入指定工作目录，并在本次聊天outputs中保留同内容副本。未执行git push，未调用GitHub API，未改动线上仓库；上线仍由你负责。
