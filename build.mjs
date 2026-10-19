/**
 * build.mjs —— 生成新站静态文件到 dist/
 * 运行：node build.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, "dist");
const ORIGIN = "https://songyu0903.github.io";
const SITE_NAME = "Y.S";
const SITE_TAG = "数学 · 投资组合优化";
const GH = "https://github.com/songyu0903";

const papers = JSON.parse(fs.readFileSync(path.join(ROOT, "content/papers.json"), "utf8"));
const posts = JSON.parse(fs.readFileSync(path.join(ROOT, "content/posts.json"), "utf8"));
const topics = JSON.parse(fs.readFileSync(path.join(ROOT, "content/topics.json"), "utf8"));

/* ------------------------------------------------------------------ 工具 */
const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const strip = (s = "") => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const firstSentence = (s = "", max = 62) => {
  const t = strip(s);
  const m = t.match(/^[^。！？!?]*[。！？!?]/);
  const out = m ? m[0] : t;
  return out.length > max ? out.slice(0, max) + "…" : out;
};
const excerpt = (s = "", max = 108) => {
  const t = strip(s);
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const stop = Math.max(cut.lastIndexOf("。"), cut.lastIndexOf("；"));
  return stop > max * 0.55 ? cut.slice(0, stop + 1) : cut.replace(/[，、]$/, "") + "…";
};
const tagSlug = (t) =>
  String(t).trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\u4e00-\u9fff-]/g, "");
const readingTime = (html) => {
  const text = strip(html);
  const cjk = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const latin = (text.match(/[A-Za-z0-9]+/g) || []).length;
  const minutes = Math.max(1, Math.round(cjk / 380 + latin / 220));
  return minutes;
};

const topicBySlug = new Map(topics.map((t) => [t.slug, t]));
const topicsOfPaper = new Map();
topics.forEach((t) => t.papers.forEach((href) => {
  const slug = href.replace(/\/$/, "").split("/").pop();
  if (!topicsOfPaper.has(slug)) topicsOfPaper.set(slug, []);
  topicsOfPaper.get(slug).push(t.slug);
}));
const topicsOfPost = new Map();
topics.forEach((t) => t.posts.forEach((href) => {
  const slug = href.replace(/\/$/, "").split("/").pop();
  if (!topicsOfPost.has(slug)) topicsOfPost.set(slug, []);
  topicsOfPost.get(slug).push(t.slug);
}));

/* ------------------------------------------------------------------ 图标 */
const ICON = {
  arrow: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
  github: `<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .8a11.2 11.2 0 0 0-3.54 21.83c.56.1.77-.24.77-.54v-2.1c-3.12.68-3.78-1.32-3.78-1.32-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.68.08-.68 1.13.08 1.72 1.16 1.72 1.16 1 1.72 2.63 1.22 3.27.93.1-.72.39-1.22.71-1.5-2.49-.28-5.11-1.25-5.11-5.56 0-1.23.44-2.23 1.16-3.02-.12-.28-.5-1.43.11-2.98 0 0 .94-.3 3.08 1.15a10.6 10.6 0 0 1 5.6 0c2.14-1.45 3.08-1.15 3.08-1.15.61 1.55.23 2.7.11 2.98.72.79 1.16 1.79 1.16 3.02 0 4.32-2.62 5.28-5.12 5.55.4.35.76 1.03.76 2.08v3.08c0 .3.2.65.78.54A11.2 11.2 0 0 0 12 .8Z"/></svg>`,
  sun: `<svg class="sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`,
  moon: `<svg class="moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8Z"/></svg>`,
  chevron: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>`,
  file: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg>`,
  book: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></svg>`,
  search: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg>`,
  doc: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`,
};

/* ------------------------------------------------------------------ 外壳 */
const SEARCH_UI = `
<div class="search" id="search" hidden>
  <div class="search-backdrop" data-search-close></div>
  <div class="search-panel" role="dialog" aria-modal="true" aria-label="站内搜索">
    <div class="search-box">
      ${ICON.search}
      <input id="searchInput" type="search" placeholder="搜索论文、研究方向、笔记…" autocomplete="off" spellcheck="false" aria-label="搜索关键词">
      <kbd>Esc</kbd>
      <button class="search-close icon-btn" type="button" data-search-close aria-label="关闭搜索">×</button>
    </div>
    <div class="search-results" id="searchResults" aria-live="polite"></div>
    <div class="search-foot">
      <span>↑↓ 选择 · ↵ 打开 · Esc 关闭</span>
      <span id="searchCount"></span>
    </div>
  </div>
</div>`;

function nav(active) {
  const items = [
    ["home", "/", "首页"],
    ["topics", "/topics/", "研究方向"],
    ["papers", "/papers/", "论文"],
    ["blog", "/blog/", "笔记"],
    ["about", "/about/", "关于"],
  ];
  const links = items
    .map(([key, href, label]) =>
      `<a href="${href}"${key === active ? ' aria-current="page"' : ""}>${label}</a>`)
    .join("");
  return `
<header class="nav">
  <a class="brand" href="/">
    <span class="brand-mark">YS</span>
  </a>
  <nav class="nav-links" aria-label="主导航">${links}</nav>
  <div class="nav-tools">
    <button class="icon-btn" type="button" data-search-open aria-label="搜索（Ctrl 或 ⌘ + K）" title="搜索 ⌘K" hidden>${ICON.search}</button>
    <button class="icon-btn theme-toggle" type="button" aria-label="切换深浅色" aria-pressed="false" hidden>${ICON.moon}${ICON.sun}</button>
    <a class="icon-btn" href="${GH}" target="_blank" rel="noopener" aria-label="GitHub">${ICON.github}</a>
    <button class="nav-toggle icon-btn" type="button" aria-label="打开菜单" aria-expanded="false" aria-controls="mobile-menu" hidden>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
    </button>
  </div>
</header>
<div class="drawer" id="mobile-menu" hidden>
  <nav aria-label="移动端导航">${links}</nav>
</div>`;
}

function footer() {
  return `
<footer class="footer">
  <div class="container footer-inner">
    <div>
      <div style="font-weight:600;color:var(--ink)">${SITE_NAME} · ${SITE_TAG}</div>
      <div class="footer-note">纯静态站点，托管于 GitHub Pages；公式由 KaTeX 渲染。</div>
    </div>
    <div class="footer-links">
      <a href="/papers/">论文</a>
      <a href="/topics/">研究方向</a>
      <a href="/blog/">笔记</a>
      <a href="/about/">关于</a>
      <a href="/index.xml">RSS</a>
      <a href="${GH}" target="_blank" rel="noopener">GitHub</a>
    </div>
  </div>
</footer>`;
}

const THEME_INIT = `<script>(function(){try{var q=new URLSearchParams(location.search).get("theme");var s=localStorage.getItem("ys-theme");var m=window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.setAttribute("data-theme",q==="dark"||q==="light"?q:(s||(m?"dark":"light")));}catch(e){document.documentElement.setAttribute("data-theme","light");}})();</script>`;

function shell({ title, description, path: urlPath, body, active = "home", math = false, head = "" }) {
  const fullTitle = urlPath === "/" ? `${SITE_NAME} · ${SITE_TAG}` : `${title} · ${SITE_NAME}`;
  const canonical = `${ORIGIN}${urlPath}`;
  const katex = math
    ? `
<link rel="stylesheet" href="/katex/katex.min.css">
<script defer src="/katex/katex.min.js"></script>
<script defer src="/katex/contrib/auto-render.min.js"></script>`
    : "";
  const mathBoot = math
    ? `
<script>
(function () {
  var opts = {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "\\\\[", right: "\\\\]", display: true },
      { left: "$", right: "$", display: false },
      { left: "\\\\(", right: "\\\\)", display: false }
    ],
    throwOnError: false,
    ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code", "option"]
  };
  function go() {
    if (!window.renderMathInElement) return false;
    try { renderMathInElement(document.body, opts); } catch (e) {}
    return true;
  }
  if (!go()) {
    var n = 0;
    var timer = setInterval(function () {
      if (go() || ++n > 80) clearInterval(timer);
    }, 50);
  }
})();
</script>`
    : "";
  return `<!doctype html>
<html lang="zh-CN" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:locale" content="zh_CN">
<meta name="theme-color" content="#eef2f8">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.png" sizes="any">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="alternate" type="application/rss+xml" title="${SITE_NAME}" href="/index.xml">
<link rel="stylesheet" href="/assets/site.css">
${THEME_INIT}${katex}${head}
</head>
<body>
<div class="bg" aria-hidden="true">
  <span class="blob blob-1"></span><span class="blob blob-2"></span>
  <span class="blob blob-3"></span><span class="blob blob-4"></span>
  <span class="grid-overlay"></span>
</div>
<a class="skip-link" href="#main">跳到主要内容</a>
${nav(active)}
<main id="main" tabindex="-1">
${body}
</main>
${footer()}
${SEARCH_UI}
<script src="/assets/site.js" defer></script>${mathBoot}
</body>
</html>`;
}

/* ------------------------------------------------------------------ 组件 */
function paperItem(p, index) {
  const tSlugs = (topicsOfPaper.get(p.slug) || []).join(" ");
  const tags = p.tags
    .slice(0, 3)
    .map((t) => `<a class="chip" href="/tags/${encodeURIComponent(tagSlug(t))}/">${esc(t)}</a>`)
    .join("");
  return `
<article class="paper-item" data-reveal data-reveal-delay="${index * 45}" data-topics="${tSlugs}">
  <span class="paper-date">${esc(p.date)}</span>
  <div class="paper-main">
    <h3 class="paper-title"><a class="paper-link" href="/papers/${p.slug}/">${esc(p.title)}</a></h3>
    <p class="paper-abs">${esc(p.abstract)}</p>
    <div class="paper-tags">${tags}</div>
  </div>
  <span class="paper-go" aria-hidden="true">${ICON.arrow}</span>
</article>`;
}

function topicCard(t, index) {
  const count = t.papers.length;
  const postCount = t.posts.length;
  const meta = [count ? `${count} 篇论文` : "", postCount ? `${postCount} 篇笔记` : ""].filter(Boolean).join(" · ");
  return `
<a class="card" href="/topics/${t.slug}/" data-reveal data-reveal-delay="${index * 55}">
  <span class="card-index">0${index + 1}</span>
  <div class="card-title">${esc(t.title)}</div>
  <p class="card-desc">${esc(excerpt(t.intro, 104))}</p>
  <div class="card-foot">
    <span>${meta}</span>
    <span class="card-arrow">进入方向 ${ICON.arrow}</span>
  </div>
</a>`;
}

function postCard(p, index) {
  return `
<a class="card" href="/blog/${p.slug}/" data-reveal data-reveal-delay="${index * 55}">
  <span class="card-index">${esc(p.date)}</span>
  <div class="card-title">${esc(p.title)}</div>
  <p class="card-desc">${esc(p.abstract)}</p>
  <div class="card-foot">
    <span>${p.tags.slice(0, 2).join(" · ")}</span>
    <span class="card-arrow">阅读 ${ICON.arrow}</span>
  </div>
</a>`;
}

function sectionHead({ eyebrow, title, desc, moreHref, moreLabel }) {
  return `
<div class="section-head">
  <div>
    <span class="eyebrow">${esc(eyebrow)}</span>
    <h2>${esc(title)}</h2>
    ${desc ? `<p>${esc(desc)}</p>` : ""}
  </div>
  ${moreHref ? `<a class="link-more" href="${moreHref}">${esc(moreLabel)} ${ICON.arrow}</a>` : ""}
</div>`;
}

/* ------------------------------------------------------------------ 文章页 */
function cleanBody(html) {
  return html
    .replace(/<h1[^>]*>[\s\S]*?<\/h1>/, "")
    .replace(/<p class=note-meta>[^<]*<\/p>/, "")
    .replace(/\s*<a class=anchor[^>]*><\/a>/g, "")
    .trim();
}

function buildToc(body) {
  const items = [...body.matchAll(/<h2[^>]*\bid=("([^"]*)"|([^\s>]+))[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => ({
    id: m[2] || m[3],
    text: strip(m[4]),
  }));
  if (!items.length) return { tocHtml: "", tocAside: "" };
  const tocAside = `
<aside class="toc" aria-label="本页目录">
  <div class="toc-title">目录</div>
  <ol>${items.map((i) => `<li><a href="#${encodeURIComponent(i.id)}">${esc(i.text)}</a></li>`).join("")}</ol>
</aside>`;
  return { tocHtml: items, tocAside };
}

function articlePage({ kind, item, list, related = [] }) {
  const body = cleanBody(item.html);
  const { tocAside } = buildToc(body);
  const minutes = readingTime(item.html);
  const base = kind === "post" ? "/blog/" : "/papers/";
  const idx = list.findIndex((x) => x.slug === item.slug);
  const prev = list[idx + 1];
  const next = list[idx - 1];
  const tags = item.tags.map((t) =>
    `<a class="chip" href="/tags/${encodeURIComponent(tagSlug(t))}/">${esc(t)}</a>`).join("");
  // Cite the page itself using known metadata; do not invent journal or DOI fields.
  const bibtex = `@misc{ys${item.date.slice(0, 4)}${item.slug.replace(/-/g, "")},
  author = {{Y.S}},
  title = {${item.title}},
  year = {${item.date.slice(0, 4)}},
  month = {${item.date.slice(5, 7)}},
  day = {${item.date.slice(8, 10)}},
  url = {${ORIGIN}${base}${item.slug}/},
  note = {研究笔记，${item.date}}
}`;
  const citation = kind === "paper" ? `
    <details class="citation">
      <summary>引用本文（BibTeX）</summary>
      <p>此条目引用本站研究笔记；文中参考文献请见原文链接。</p>
      <div class="citation-toolbar">
        <button class="btn btn-ghost" type="button" data-copy-citation data-target="citation-${item.slug}" hidden>复制 BibTeX</button>
        <span class="copy-status" role="status" aria-live="polite"></span>
      </div>
      <pre id="citation-${item.slug}" tabindex="0"><code>${esc(bibtex)}</code></pre>
    </details>` : "";
  const relatedHtml = related.length
    ? `
<div class="related">
  <h2>同一方向的其它论文</h2>
  <div class="paper-list">${related.map((r, i) => paperItem(r, i)).join("")}</div>
</div>`
    : "";
  const pager = `
<nav class="pager" aria-label="翻页">
  ${prev ? `<a class="prev" href="${base}${prev.slug}/"><span class="dir">← 较早</span><span class="t">${esc(prev.title)}</span></a>` : `<span></span>`}
  ${next ? `<a class="next" href="${base}${next.slug}/"><span class="dir">较新 →</span><span class="t">${esc(next.title)}</span></a>` : `<span></span>`}
</nav>`;

  return shell({
    title: item.title,
    description: item.description || item.abstract,
    path: `${base}${item.slug}/`,
    active: kind === "post" ? "blog" : "papers",
    math: true,
    body: `
<div class="progress" aria-hidden="true"></div>
<div class="container container-article">
  <div class="article-head">
    <div class="breadcrumb">
      <a href="/">首页</a>${ICON.chevron}<a href="${base}">${kind === "post" ? "笔记" : "论文"}</a>${ICON.chevron}<span>${esc(item.title.slice(0, 18))}${item.title.length > 18 ? "…" : ""}</span>
    </div>
    <h1>${esc(item.title)}</h1>
    <div class="article-meta">
      <span>${esc(item.date)}</span>
      <span class="meta-dot"></span>
      <span>约 ${minutes} 分钟</span>
      ${tags}
    </div>
  </div>
  <div class="article-grid">
    <article class="prose" data-reveal>${body}${citation}</article>
    ${tocAside}
  </div>
  ${pager}
  ${relatedHtml}
</div>`,
    extra: "",
  });
}

/* ------------------------------------------------------------------ 页面 */
const pages = new Map(); // urlPath -> html

/* 首页 */
const featuredSlugs = [
  "wasserstein-cvar-portfolio", "high-dimensional-shrinkage", "moment-shortfall-sos",
  "time-consistent-dynamic-risk", "decision-focused-portfolio",
];
const featured = featuredSlugs.map((slug) => papers.find((p) => p.slug === slug));
const updates = new Map();
[
  ...papers.map((p) => ({ ...p, kind: "论文" })),
  ...posts.map((p) => ({ ...p, kind: "笔记" })),
].sort((a, b) => b.date.localeCompare(a.date)).forEach((item) => {
  if (!updates.has(item.date)) updates.set(item.date, []);
  updates.get(item.date).push(item);
});
const updatesHtml = [...updates].map(([date, items]) => {
  const counts = ["论文", "笔记"].map((kind) => {
    const count = items.filter((item) => item.kind === kind).length;
    return count ? `${count} 篇${kind}` : "";
  }).filter(Boolean).join(" · ");
  return `<li class="update-item">
    <time datetime="${date}">${date}</time>
    <div>${items.length > 1 ? `<details><summary>${counts}</summary><ul>${items.map((item) =>
      `<li><a href="${item.url}">${esc(item.title)}</a></li>`).join("")}</ul></details>` :
      `<a href="${items[0].url}">${esc(items[0].title)}</a><p>${items[0].kind}</p>`}</div>
  </li>`;
}).join("");
const homeHtml = shell({
  title: "首页",
  description:
    "Y.S 的个人学术主页：数学专业硕士研究生，研究投资组合优化中的鲁棒与分布鲁棒方法、估计误差与决策导向学习，附 8 篇可复现的研究笔记。",
  path: "/",
  active: "home",
  math: true,
  body: `
<div class="container">
  <section class="hero">
    <div class="hero-grid">
      <div class="hero-main">
        <div class="hero-eyebrow"><span class="dot"></span>${SITE_TAG}</div>
        <h1 class="hero-name">Y.S<span class="accent">.</span></h1>
        <p class="hero-sub">数学专业硕士研究生 · 数学学院</p>
        <p class="hero-lede">
          我在<strong>投资组合优化</strong>的框架下研究分布不确定性与参数估计误差：当收益分布只能从有限样本中估计，
          决策如何保持稳健？我的工作把 <strong>Wasserstein 模糊集</strong>、<strong>共形校准</strong>、
          <strong>矩约束</strong>与<strong>决策导向学习</strong>放进可复现的小型实验，
          用数值证据说明哪些稳健性是真实的，哪些只是保守。
        </p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="/papers/">浏览 8 篇论文 ${ICON.arrow}</a>
          <a class="btn btn-ghost" href="/topics/">研究方向</a>
          <a class="btn btn-ghost" href="/uploads/resume.pdf" target="_blank" rel="noopener">${ICON.file} 简历 PDF</a>
        </div>
        <div class="hero-stats">
          <div><b data-count="8">8</b><span>可复现论文</span></div>
          <div><b data-count="6">6</b><span>研究方向</span></div>
          <div><b data-count="4">4</b><span>工具类笔记</span></div>
        </div>
      </div>

      <aside class="hero-card glass" data-reveal>
        <div class="hero-card-label"><span>Markowitz · 1952</span><span class="tag">起点</span></div>
        <div class="hero-formula">$$\\min_{w}\\ w^{\\top}\\Sigma w \\quad \\text{s.t.}\\quad \\mathbf{1}^{\\top}w=1,\\ w\\geq 0$$</div>
        <div class="hero-card-note">
          均值—方差框架是全部讨论的起点。它的解对 $\\mu$ 与 $\\Sigma$ 的估计误差极其敏感——
          这正是鲁棒、分布鲁棒与决策导向方法试图回答的问题。
        </div>
      </aside>
    </div>
  </section>

  <section class="section" id="research">
    ${sectionHead({
      eyebrow: "Research",
      title: "六个研究方向",
      desc: "每个方向都对应一组论文与可复现实验，从估计误差到尾部风险逐层展开。",
      moreHref: "/topics/",
      moreLabel: "全部方向",
    })}
    <div class="grid grid-3">
      ${topics.map((t, i) => topicCard(t, i)).join("")}
    </div>
  </section>

  <section class="section" id="papers">
    ${sectionHead({
      eyebrow: "Papers",
      title: "精选五篇",
      desc: "每篇包含完整推导、真实数值表、插图、复现脚本与结果数据。",
      moreHref: "/papers/",
      moreLabel: "全部论文",
    })}
    <div class="paper-list">
      ${featured.map((p, i) => paperItem(p, i)).join("")}
    </div>
  </section>

  <section class="section" id="notes">
    ${sectionHead({
      eyebrow: "Updates",
      title: "最近更新",
      desc: "按文章原始发布日期汇总，同日内容合并显示。",
      moreHref: "/blog/",
      moreLabel: "全部笔记",
    })}
    <ol class="updates-list">${updatesHtml}</ol>
  </section>
</div>`,
});
pages.set("/", homeHtml);

/* 论文列表 */
const papersIndex = shell({
  title: "论文",
  description: "8 篇投资组合优化方向的研究笔记，含公式推导、数值实验与复现脚本，按研究方向可筛选。",
  path: "/papers/",
  active: "papers",
  body: `
<div class="container">
  <header class="page-head">
    <span class="eyebrow">Papers</span>
    <h1>论文与研究笔记</h1>
    <p>共 <strong>${papers.length}</strong> 篇。每篇都是可独立阅读的完整文档：数学模型、近期文献、真实数值表、插图，以及可直接运行的复现脚本与结果数据。</p>
  </header>

  <div class="filter-bar" data-filter-bar role="group" aria-label="按研究方向筛选">
    <button class="chip is-active" type="button" data-filter="all" aria-pressed="true">全部 ${papers.length}</button>
    ${topics.filter((t) => t.papers.length).map((t) =>
      `<button class="chip" type="button" data-filter="${t.slug}" aria-pressed="false">${esc(t.title)} ${t.papers.length}</button>`).join("")}
  </div>

  <div class="paper-list">
    ${papers.map((p, i) => paperItem(p, i)).join("")}
  </div>
  <p data-filter-empty hidden style="padding:32px 0;color:var(--ink-3)">该方向下暂时没有论文。</p>
</div>`,
});
pages.set("/papers/", papersIndex);

/* 各篇论文 */
papers.forEach((p) => {
  const tSlugs = topicsOfPaper.get(p.slug) || [];
  const related = papers.filter((q) => q.slug !== p.slug && tSlugs.some((t) => (topicsOfPaper.get(q.slug) || []).includes(t)));
  pages.set(`/papers/${p.slug}/`, articlePage({ kind: "paper", item: p, list: papers, related }));
});

/* 研究方向总览 */
const topicsIndex = shell({
  title: "研究方向",
  description: "投资组合优化的六个研究方向：分布鲁棒与鲁棒优化、估计误差与高维统计、风险度量与组合结构、动态与计算、策略评估与决策聚焦学习、研究入门与写作工具。",
  path: "/topics/",
  active: "topics",
  body: `
<div class="container">
  <header class="page-head">
    <span class="eyebrow">Research</span>
    <h1>研究方向</h1>
    <p>六个方向构成一条从估计到决策的链条：先问参数估得准不准，再问分布不确定时最坏情形有多坏，最后问决策本身该如何被评估。</p>
  </header>
  <div class="section" style="padding-top:16px">
    <div class="grid grid-3">${topics.map((t, i) => topicCard(t, i)).join("")}</div>
  </div>
</div>`,
});
pages.set("/topics/", topicsIndex);

/* 各方向 */
// Editorial reading guidance, derived from each direction's existing introduction.
const topicGuides = {
  "dro-robust": {
    question: "模糊半径如何影响尾部风险与风险效率？",
    first: "/papers/wasserstein-cvar-portfolio/",
    reason: "从 Wasserstein 对偶重构、半径校准与保守性的代价入手。",
  },
  "estimation-highdim": {
    question: "估计误差如何经过矩阵求逆放大成决策误差？",
    first: "/papers/high-dimensional-shrinkage/",
    reason: "先看协方差扰动与线性收缩，再读厚尾与污染下的鲁棒估计。",
  },
  "risk-structure": {
    question: "高阶矩信息的经济价值与统计代价如何共同评价？",
    first: "/papers/moment-shortfall-sos/",
    reason: "从矩约束下的最坏缺口问题，进入多项式因子与矩—平方和方法。",
  },
  "dynamic-compute": {
    question: "交易成本与风险递推如何改变最优配置？",
    first: "/papers/transaction-cost-regularization/",
    reason: "先理解交易前持仓与成本感知模型，再读多期时间一致性。",
  },
  "evaluation-learning": {
    question: "预测精度、决策遗憾与风险覆盖之间是什么关系？",
    first: "/papers/decision-focused-portfolio/",
    reason: "从预算约束下的精确决策度量入手，再读同时覆盖与分布漂移。",
  },
  "research-writing": {
    question: "怎样让公式、插图与论文版本更易维护和复现？",
    first: "/blog/vscode-setup/",
    reason: "先配置本地写作环境，再读公式排版、R 图与文献版本管理。",
  },
};
topics.forEach((t) => {
  const inTopic = t.papers.map((href) => href.replace(/\/$/, "").split("/").pop());
  const topicPapers = papers.filter((p) => inTopic.includes(p.slug));
  const postSlugs = t.posts.map((href) => href.replace(/\/$/, "").split("/").pop());
  const topicPosts = posts.filter((p) => postSlugs.includes(p.slug));
  const intro = t.intro.replace(/^<h1[\s\S]*?<\/h1>/, "").trim();
  const guide = topicGuides[t.slug];
  const firstRead = [...papers, ...posts].find((item) => item.url === guide.first);
  pages.set(`/topics/${t.slug}/`, shell({
    title: t.title,
    description: strip(t.intro).slice(0, 150),
    path: `/topics/${t.slug}/`,
    active: "topics",
    body: `
<div class="container">
  <header class="page-head">
    <div class="breadcrumb"><a href="/">首页</a>${ICON.chevron}<a href="/topics/">研究方向</a>${ICON.chevron}<span>${esc(t.title)}</span></div>
    <h1>${esc(t.title)}</h1>
  </header>
  <div class="topic-intro glass" data-reveal>${intro}</div>
  <div class="topic-guide-grid">
    <section class="topic-guide glass" aria-labelledby="core-question">
      <h2 id="core-question">核心问题</h2>
      <p>${esc(guide.question)}</p>
    </section>
    <section class="topic-guide glass" aria-labelledby="first-read">
      <h2 id="first-read">先读哪篇</h2>
      <p>${esc(guide.reason)}</p>
      <a href="${guide.first}">${esc(firstRead.title)} ${ICON.arrow}</a>
    </section>
  </div>
  ${topicPapers.length ? `
  <section style="margin-bottom:48px">
    ${sectionHead({ eyebrow: "Papers", title: "这个方向的论文", desc: `${topicPapers.length} 篇` })}
    <div class="paper-list">${topicPapers.map((p, i) => paperItem(p, i)).join("")}</div>
  </section>` : ""}
  ${topicPosts.length ? `
  <section>
    ${sectionHead({ eyebrow: "Notes", title: "相关笔记", desc: `${topicPosts.length} 篇` })}
    <div class="grid grid-2">${topicPosts.map((p, i) => postCard(p, i)).join("")}</div>
  </section>` : ""}
  <p style="margin-top:40px"><a class="link-more" href="/topics/">← 返回全部方向</a></p>
</div>`,
  }));
});

/* 笔记列表 */
const blogIndex = shell({
  title: "笔记",
  description: "研究与写作过程中沉淀的工具类笔记：数学排版、R 图直出 LaTeX、TeX Live + VS Code 工作流、文献管理与版本控制。",
  path: "/blog/",
  active: "blog",
  body: `
<div class="container">
  <header class="page-head">
    <span class="eyebrow">Notes</span>
    <h1>工具与写作</h1>
    <p>共 <strong>${posts.length}</strong> 篇。它们不直接讨论投资组合，但决定了论文里的公式、图和版本能不能被稳稳地复现。</p>
  </header>
  <div class="section" style="padding-top:16px">
    <div class="grid grid-2">${posts.map((p, i) => postCard(p, i)).join("")}</div>
  </div>
</div>`,
});
pages.set("/blog/", blogIndex);

/* 各篇笔记 */
posts.forEach((p) => {
  pages.set(`/blog/${p.slug}/`, articlePage({ kind: "post", item: p, list: posts }));
});

/* 关于 */
const aboutHtml = shell({
  title: "关于",
  description: "Y.S — 数学专业硕士研究生，研究方向为投资组合优化，聚焦鲁棒与分布鲁棒组合选择的理论与数值方法。",
  path: "/about/",
  active: "about",
  body: `
<div class="container">
  <div class="about-grid">
    <aside class="profile-card glass" data-reveal>
      <img class="avatar" src="/media/authors/me.jpg" alt="Y.S 的头像" width="124" height="124">
      <div class="profile-name">Y.S</div>
      <div class="profile-role">数学专业硕士研究生<br>数学学院</div>
      <div class="profile-links">
        <a href="${GH}" target="_blank" rel="noopener">${ICON.github} GitHub</a>
        <a href="/uploads/resume.pdf" target="_blank" rel="noopener">${ICON.file} 简历（PDF）</a>
        <a href="/papers/">${ICON.book} 论文列表</a>
        <a href="/blog/">${ICON.doc} 阅读笔记</a>
      </div>
    </aside>

    <div>
      <header style="padding-block:8px 28px">
        <span class="eyebrow">About</span>
        <h1 style="font-size:clamp(1.8rem,3.4vw,2.4rem);margin:10px 0 14px">把稳健性写成可检验的命题</h1>
        <p style="color:var(--ink-2);font-size:15.5px;line-height:1.85;max-width:60ch">
          我是数学专业硕士研究生，研究方向为<strong>投资组合优化</strong>，聚焦鲁棒与分布鲁棒组合选择的理论与数值方法。
          比起宣称某种方法“更稳健”，我更关心它能给出什么可验证的保证：覆盖概率、决策误差界，或者在最坏情形下的可计算证书。
        </p>
      </header>

      <div class="about-block">
        <h2>教育经历</h2>
        <div class="timeline">
          <div class="timeline-item">
            <span class="when">硕士</span>
            <div class="what"><b>数学 · 硕士研究生</b>数学学院 · 研究方向：投资组合优化</div>
          </div>
        </div>
      </div>

      <div class="about-block">
        <h2>研究兴趣</h2>
        <div class="chip-row">
          ${["投资组合优化", "鲁棒优化", "分布鲁棒优化（DRO）", "凸优化 / 随机优化", "量化金融"]
            .map((t) => `<span class="chip">${esc(t)}</span>`).join("")}
        </div>
      </div>

      <div class="about-block">
        <h2>技能</h2>
        <div class="skill-group">
          <h3>编程与数值计算</h3>
          <div class="badge-wall">
            ${["python", "r", "matlab", "cvxpy", "powershell"].map((b) => `<img src="/badges/${b}.svg" alt="${b}" loading="lazy">`).join("")}
          </div>
        </div>
        <div class="skill-group">
          <h3>写作与科研工作流</h3>
          <div class="badge-wall">
            ${["latex", "texlive", "overleaf", "zotero", "obsidian", "markdown"].map((b) => `<img src="/badges/${b}.svg" alt="${b}" loading="lazy">`).join("")}
          </div>
        </div>
        <div class="skill-group">
          <h3>开发与站点工具</h3>
          <div class="badge-wall">
            ${["git", "github", "vscode", "windows", "hugo"].map((b) => `<img src="/badges/${b}.svg" alt="${b}" loading="lazy">`).join("")}
          </div>
        </div>
      </div>

      <div class="about-block">
        <h2>语言</h2>
        <div class="timeline">
          <div class="timeline-item"><span class="when">母语</span><div class="what"><b>中文</b></div></div>
          <div class="timeline-item"><span class="when">熟练</span><div class="what"><b>English</b>学术阅读与写作</div></div>
        </div>
      </div>
    </div>
  </div>
</div>`,
});
pages.set("/about/", aboutHtml);

/* 标签 */
const tagMap = new Map(); // slug -> { name, papers: [], posts: [] }
const addTag = (tag, kind, item) => {
  const slug = tagSlug(tag);
  if (!tagMap.has(slug)) tagMap.set(slug, { name: tag, papers: [], posts: [] });
  tagMap.get(slug)[kind].push(item);
};
papers.forEach((p) => p.tags.forEach((t) => addTag(t, "papers", p)));
posts.forEach((p) => p.tags.forEach((t) => addTag(t, "posts", p)));

const tagsIndex = shell({
  title: "标签",
  description: "按关键词浏览论文与笔记。",
  path: "/tags/",
  active: "papers",
  body: `
<div class="container">
  <header class="page-head">
    <span class="eyebrow">Tags</span>
    <h1>标签</h1>
    <p>共 ${tagMap.size} 个关键词，覆盖论文与笔记。</p>
  </header>
  <div class="section" style="padding-top:16px">
    <div class="chip-row">
      ${[...tagMap.entries()]
        .sort((a, b) => b[1].papers.length + b[1].posts.length - (a[1].papers.length + a[1].posts.length))
        .map(([slug, v]) => `<a class="chip" href="/tags/${encodeURIComponent(slug)}/">${esc(v.name)} <span class="tag-count">${v.papers.length + v.posts.length}</span></a>`)
        .join("")}
    </div>
  </div>
</div>`,
});
pages.set("/tags/", tagsIndex);

tagMap.forEach((v, slug) => {
  pages.set(`/tags/${slug}/`, shell({
    title: `标签：${v.name}`,
    description: `标签「${v.name}」下的论文与笔记。`,
    path: `/tags/${slug}/`,
    active: "papers",
    body: `
<div class="container">
  <header class="page-head">
    <div class="breadcrumb"><a href="/">首页</a>${ICON.chevron}<a href="/tags/">标签</a>${ICON.chevron}<span>${esc(v.name)}</span></div>
    <h1>${esc(v.name)}</h1>
    <p>${v.papers.length} 篇论文 · ${v.posts.length} 篇笔记</p>
  </header>
  <div class="section" style="padding-top:16px">
    ${v.papers.length ? `<div class="paper-list" style="margin-bottom:32px">${v.papers.map((p, i) => paperItem(p, i)).join("")}</div>` : ""}
    ${v.posts.length ? `<div class="grid grid-2">${v.posts.map((p, i) => postCard(p, i)).join("")}</div>` : ""}
  </div>
</div>`,
  }));
});

/* 404 */
pages.set("/404.html", shell({
  title: "页面不存在",
  description: "找不到这个页面。",
  path: "/404.html",
  active: "",
  body: `
<div class="container" style="padding-block:120px;text-align:center">
  <div style="font-size:clamp(3rem,12vw,6rem);font-weight:700;letter-spacing:-.05em;background:linear-gradient(120deg,#0a6cff,#7b5cff);-webkit-background-clip:text;background-clip:text;color:transparent">404</div>
  <p style="color:var(--ink-2);margin:16px 0 28px">这个地址没有内容，可能已经移动或从未存在。</p>
  <a class="btn btn-primary" href="/">回到首页 ${ICON.arrow}</a>
</div>`,
}));

/* ------------------------------------------------------------------ 写入 */
fs.rmSync(OUT, { recursive: true, force: true });
for (const [urlPath, html] of pages) {
  const file = urlPath === "/" ? path.join(OUT, "index.html") : path.join(OUT, urlPath.replace(/^\//, "").replace(/\/$/, ""), "index.html");
  if (urlPath === "/404.html") {
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(path.join(OUT, "404.html"), html);
    continue;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

/* sitemap + RSS */
const urls = [...pages.keys()].filter((u) => u !== "/404.html");
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${ORIGIN}${encodeURI(u)}</loc><lastmod>2026-10-05</lastmod></url>`).join("\n")}
</urlset>
`;
fs.writeFileSync(path.join(OUT, "sitemap.xml"), sitemap);

const rssItems = [...papers.map((p) => ({ ...p, kind: "paper" })), ...posts.map((p) => ({ ...p, kind: "post" }))]
  .sort((a, b) => (a.published < b.published ? 1 : -1));
const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>${SITE_NAME} · ${SITE_TAG}</title>
  <link>${ORIGIN}/</link>
  <description>投资组合优化方向的研究笔记与论文</description>
  <language>zh-CN</language>
${rssItems.map((i) => `  <item>
    <title>${esc(i.title)}</title>
    <link>${ORIGIN}/${i.kind === "paper" ? "papers" : "blog"}/${i.slug}/</link>
    <guid>${ORIGIN}/${i.kind === "paper" ? "papers" : "blog"}/${i.slug}/</guid>
    <description>${esc(i.abstract)}</description>
  </item>`).join("\n")}
</channel></rss>
`;
fs.writeFileSync(path.join(OUT, "index.xml"), rss);

/* 搜索索引 */
const stripText = (html) => strip(html.replace(/<[^>]+>/g, " "));
const searchIndex = [
  ...papers.map((p) => ({
    kind: "论文", title: p.title, url: `/papers/${p.slug}/`, date: p.date,
    tags: p.tags, desc: p.abstract, text: stripText(p.html).slice(0, 2500),
  })),
  ...posts.map((p) => ({
    kind: "笔记", title: p.title, url: `/blog/${p.slug}/`, date: p.date,
    tags: p.tags, desc: p.abstract, text: stripText(p.html).slice(0, 2500),
  })),
  ...topics.map((t) => ({
    kind: "研究方向", title: t.title, url: `/topics/${t.slug}/`, date: "",
    tags: [], desc: strip(t.intro).slice(0, 120), text: strip(t.intro),
  })),
  {
    kind: "页面", title: "关于 Y.S", url: "/about/", date: "",
    tags: ["关于", "简历", "技能"],
    desc: "数学专业硕士研究生，研究方向为投资组合优化。",
    text: "教育经历 研究兴趣 投资组合优化 鲁棒优化 分布鲁棒优化 凸优化 随机优化 量化金融 技能 语言 简历",
  },
  {
    kind: "页面", title: "全部论文", url: "/papers/", date: "",
    tags: ["论文", "目录"], desc: "8 篇可复现的研究笔记。",
    text: "论文 目录 投资组合优化 分布鲁棒 高维统计 厚尾 交易成本 决策导向 共形预测 动态风险 矩信息",
  },
];
fs.writeFileSync(path.join(OUT, "search-index.json"), JSON.stringify(searchIndex));

/* 静态资源拷贝 */
const assetsDir = path.join(ROOT, "assets");
fs.mkdirSync(path.join(OUT, "assets"), { recursive: true });
for (const f of fs.readdirSync(assetsDir)) {
  fs.copyFileSync(path.join(assetsDir, f), path.join(OUT, "assets", f));
}

console.log("pages:", pages.size, "tags:", tagMap.size);




