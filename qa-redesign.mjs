/**
 * Extended browser QA for the existing static site. No source or dist files are changed.
 *   node qa-redesign.mjs [--base http://127.0.0.1:4173] [--out work/qa-redesign] [--screenshots] [--skip-layout]
 * Reports, optional screenshots, and this run's Edge profile remain in a new output subfolder.
 * Requires Node's built-in fetch/WebSocket and the installed Edge; no packages or CDN are used.
 */
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
function option(name, fallback) {
  const index = argv.indexOf(name);
  if (index < 0) return fallback;
  if (!argv[index + 1] || argv[index + 1].startsWith("--")) throw new Error(`${name} requires a value`);
  return argv[index + 1];
}
const BASE = option("--base", "http://127.0.0.1:4173").replace(/\/$/, "");
const OUTPUT = path.resolve(option("--out", path.join(process.cwd(), "work", "qa-redesign")));
const RUN = path.join(OUTPUT, new Date().toISOString().replace(/[:.]/g, "-"));
const EDGE = option("--edge", "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe");
const screenshots = argv.includes("--screenshots");
const skipLayout = argv.includes("--skip-layout");
const WIDTHS = [375, 390, 430];
const results = [];
const contrasts = [];
const runtimeErrors = [];
const environmentErrors = [];
const expectedDisplayCounts = new Map();
const loadedLoaderIds = new Set();
const started = new Date();
let child;
let ws;
let send;
let evaluate;
let shotCount = 0;
fs.mkdirSync(RUN, { recursive: true });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const visibleFunction = `function visible(el) {
  if (!el || !el.getClientRects().length) return false;
  for (let node = el; node; node = node.parentElement) {
    const style = getComputedStyle(node);
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) < 0.01) return false;
  }
  return true;
}`;
async function screenshot(label) {
  if (!send || shotCount >= 16) return null;
  const filename = `${String(++shotCount).padStart(2, "0")}-${label.replace(/[^a-z0-9_-]/gi, "-").slice(0, 90)}.png`;
  try {
    const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    fs.writeFileSync(path.join(RUN, filename), Buffer.from(shot.data, "base64"));
    return filename;
  } catch { return null; }
}
async function check(phase, name, ok, detail = {}) {
  const result = { phase, name, ok: !!ok, detail };
  if (!ok) {
    result.screenshot = await screenshot(`failure-${phase}`);
    console.log(`FAIL [${phase}] ${name}: ${JSON.stringify(detail)}`);
  }
  results.push(result);
}
async function poll(expression, timeout = 12000) {
  const until = Date.now() + timeout;
  let last;
  while (Date.now() < until) {
    try { last = await evaluate(expression); if (last) return last; } catch { /* navigation can replace the context */ }
    await sleep(60);
  }
  throw new Error(`Timed out: ${expression.slice(0, 180)} (last=${JSON.stringify(last)})`);
}
async function viewport(width, height = 844) {
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 761 });
  // CDP/headless can suspend animation frame callbacks between navigations.
  await sleep(120);
}
async function navigate(urlPath, theme = "light", noJS = false) {
  const url = new URL(urlPath, `${BASE}/`);
  if (!noJS) url.searchParams.set("theme", theme);
  const navigation = await send("Page.navigate", { url: url.href });
  if (navigation.errorText) throw new Error(`Navigation failed: ${navigation.errorText} ${url.href}`);
  if (navigation.loaderId) {
    const deadline = Date.now() + 12000;
    while (!loadedLoaderIds.has(navigation.loaderId) && Date.now() < deadline) await sleep(40);
    if (!loadedLoaderIds.has(navigation.loaderId)) throw new Error(`The new document did not finish loading: ${url.href} loader=${navigation.loaderId}`);
  }
  await poll(`location.pathname === ${JSON.stringify(url.pathname)} && document.readyState === 'complete' && !!document.querySelector('#main')`);
  await evaluate(`(async () => { if (document.fonts) await Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,1500))]);
    await Promise.race([Promise.all([...document.images].map(img => img.complete ? Promise.resolve() : new Promise(r => {img.addEventListener('load',r,{once:true});img.addEventListener('error',r,{once:true});}))),new Promise(r=>setTimeout(r,2000))]); return true; })()`);
  if (!noJS) {
    // Some notes load KaTeX but contain only ignored code examples, not renderable math.
    await poll(`!document.querySelector('script[src="/katex/katex.min.js"]') || typeof window.renderMathInElement === 'function'`);
    if (await evaluate(`!!document.querySelector('script[src="/katex/katex.min.js"]')`)) await sleep(80);
    const expected = expectedDisplayCounts.get(url.pathname);
    if (expected) await poll(`document.querySelectorAll('.prose .katex-display').length >= ${expected}`);
    await evaluate(`document.fonts ? Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,1500))]).then(()=>true) : true`);
    await sleep(40);
  }
}
async function key(keyName, shift = false) {
  const codes = { Enter: [13, "Enter"], Escape: [27, "Escape"], Tab: [9, "Tab"], ArrowRight: [39, "ArrowRight"], " ": [32, "Space"] };
  const [code, physical] = codes[keyName];
  const params = { key: keyName, code: physical, windowsVirtualKeyCode: code, nativeVirtualKeyCode: code, modifiers: shift ? 8 : 0 };
  await send("Input.dispatchKeyEvent", { type: "keyDown", ...params, ...(keyName === "Enter" ? { text: "\r", unmodifiedText: "\r" } : {}) });
  await send("Input.dispatchKeyEvent", { type: "keyUp", ...params });
  await sleep(35);
}
function htmlPaths(directory, prefix = "") {
  const paths = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) paths.push(...htmlPaths(path.join(directory, entry.name), relative));
    else if (entry.name.endsWith(".html")) paths.push(relative === "index.html" ? "/" : relative === "404.html" ? "/404.html" : `/${relative.replace(/index\.html$/, "")}`);
  }
  return paths;
}

// Foreground alpha + ancestor backgroundColor composition over the body's base color.
// This deliberately reports a baseline sample, not a full WCAG audit: the fixed gradient
// layer, backdrop-filter, anti-aliasing, and actual pixel mixtures are outside this model.
async function contrastSamples(page, theme) {
  const samples = await evaluate(`(() => {
    const canvas = document.createElement('canvas'); canvas.width=canvas.height=1;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    const rgba = color => {ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);const p=ctx.getImageData(0,0,1,1).data;return [p[0],p[1],p[2],p[3]/255];};
    const over = (fg,bg) => [0,1,2].map(i => fg[i]*fg[3]+bg[i]*(1-fg[3])).concat(1);
    const lum = color => color.slice(0,3).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0);
    const selectors = ['.prose > p','.hero-lede','.paper-date','.article-meta > span','.prose a','.paper-title a','.footer-note'];
    return selectors.map(selector => {
      const el=document.querySelector(selector);if(!el)return null;
      let bg=rgba(getComputedStyle(document.body).backgroundColor), chain=[];
      for(let n=el;n;n=n.parentElement)chain.unshift(n);
      const ignoredBackgroundImages=[];
      for(const node of chain){const s=getComputedStyle(node);bg=over(rgba(s.backgroundColor),bg);if(s.backgroundImage!=='none')ignoredBackgroundImages.push(s.backgroundImage);}
      const style=getComputedStyle(el), fg=rgba(style.color);let opacity=1;
      for(const node of chain)opacity*=Number(getComputedStyle(node).opacity);
      fg[3]*=opacity;const ink=over(fg,bg),a=lum(ink),b=lum(bg);
      return {selector,color:style.color,baseBackground: getComputedStyle(document.body).backgroundColor,composedForeground:ink.slice(0,3),composedBackground:bg.slice(0,3),ratio:Number(((Math.max(a,b)+.05)/(Math.min(a,b)+.05)).toFixed(3)),referenceThreshold:4.5,fontSize:style.fontSize,ignoredBackgroundImages};
    }).filter(Boolean);
  })()`);
  contrasts.push({ page, theme, method: "base-and-ancestor-backgroundColor-composition; gradients/backdrop excluded; not a full AA certification", samples });
  await check("contrast", `${page} ${theme} 基色复合对比度采样 ≥ 4.5（非全站 AA 认证）`, samples.length > 0 && samples.every((sample) => sample.ratio >= 4.5), { samples });
}

async function layoutMatrix(paths) {
  console.log(`Layout: ${paths.length} pages × ${WIDTHS.length} widths × 2 themes; one navigation per page.`);
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  let finished = 0;
  for (const page of paths) {
    await viewport(390);
    await navigate(page);
    for (const theme of ["light", "dark"]) {
      if (theme === "dark") {
        await evaluate(`document.querySelector('.theme-toggle').click()`);
        await poll(`document.documentElement.dataset.theme === 'dark'`);
      }
      for (const width of WIDTHS) {
        await viewport(width);
        const detail = await evaluate(`(() => {
          const w=document.documentElement.clientWidth;
          const selectors=['html','body','#main','#main > .container','.prose'];
          const boxes=selectors.flatMap(selector=>[...document.querySelectorAll(selector)].map(el=>{const r=el.getBoundingClientRect();return {selector,clientWidth:el.clientWidth,scrollWidth:el.scrollWidth,left:r.left,right:r.right,ok:el.scrollWidth<=el.clientWidth+1&&r.right<=w+1&&r.left>=-1};}));
          const offenders=[...document.querySelectorAll('#main *')].filter(el=>{
            if(!el.getClientRects().length||el.closest('.katex-mathml,[aria-hidden="true"]'))return false;const r=el.getBoundingClientRect();if(r.right<=w+1&&r.left>=-1)return false;
            for(let n=el.parentElement;n&&n.id!=='main';n=n.parentElement){const s=getComputedStyle(n);if(/auto|scroll/.test(s.overflowX)&&n.scrollWidth>n.clientWidth+1)return false;}
            return true;
          }).slice(0,12).map(el=>({tag:el.tagName,class:el.className?.baseVal??el.className,text:el.textContent.trim().slice(0,85),left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right}));
          return {viewport:w,theme:document.documentElement.dataset.theme,boxes,offenders};
        })()`);
        await check("layout", `${page} ${theme} ${width}px 无页面/主内容横向溢出`, detail.theme === theme && detail.boxes.every((box) => box.ok), detail);
      }
      if (page === "/" || page === "/papers/wasserstein-cvar-portfolio/") await contrastSamples(page, theme);
      if (screenshots && page === "/") await screenshot(`home-${theme}-430`);
    }
    if (++finished % 10 === 0) console.log(`Layout progress: ${finished}/${paths.length} pages.`);
  }
}

async function homeChecks(papers, posts) {
  await viewport(390);
  await navigate("/");
  const detail = await evaluate(`(() => ({featured:document.querySelectorAll('#papers .paper-item').length,links:[...document.querySelectorAll('.updates-list a')].map(a=>a.getAttribute('href')),dates:[...document.querySelectorAll('.updates-list time')].map(t=>t.getAttribute('datetime'))}))()`);
  const expected = [...papers, ...posts].map((item) => item.url).sort();
  const expectedDates = [...new Set([...papers, ...posts].map((item) => item.date))].sort().reverse();
  await check("information", "首页 5 篇精选、12 篇原始日期更新链接", detail.featured === 5 && JSON.stringify(detail.links.slice().sort()) === JSON.stringify(expected) && JSON.stringify(detail.dates) === JSON.stringify(expectedDates), detail);
}

async function modalChecks() {
  await viewport(390);
  await navigate("/");
  await evaluate(`window.__qaSearchOpener=document.querySelector('[data-search-open]');__qaSearchOpener.focus();__qaSearchOpener.click()`);
  await poll(`!document.querySelector('#search').hidden && document.activeElement === document.querySelector('#searchInput')`);
  const selector = `a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])`;
  const initial = await evaluate(`(() => {const root=document.querySelector('#search');const items=[...root.querySelectorAll(${JSON.stringify(selector)})].filter(el=>!el.closest('[hidden],[inert]')&&el.getClientRects().length);window.__qaSearchFirst=items[0];window.__qaSearchLast=items.at(-1);__qaSearchFirst.focus();return {count:items.length,inside:root.contains(document.activeElement)};})()`);
  await key("Tab", true);
  const backwards = await evaluate(`document.activeElement === __qaSearchLast`);
  await key("Tab");
  const forwards = await evaluate(`document.activeElement === __qaSearchFirst`);
  await evaluate(`document.querySelector('main').focus()`);
  const forcedInside = await evaluate(`document.querySelector('#search').contains(document.activeElement)`);
  await check("modals", "搜索初始焦点与正反 Tab 圈定、背景焦点隔离", initial.count >= 2 && initial.inside && backwards && forwards && forcedInside, { initial, backwards, forwards, forcedInside });
  await key("Escape");
  await poll(`document.querySelector('#search').hidden`);
  await check("modals", "搜索 Escape 关闭并恢复触发按钮焦点", await evaluate(`document.activeElement === __qaSearchOpener`));

  await evaluate(`window.__qaMenuOpener=document.querySelector('.nav-toggle');__qaMenuOpener.focus();__qaMenuOpener.click()`);
  await poll(`!document.querySelector('.drawer').hidden`);
  const menuFocus = await evaluate(`document.querySelector('.drawer').contains(document.activeElement)`);
  await key("Escape");
  const escaped = await evaluate(`document.querySelector('.drawer').hidden && __qaMenuOpener.getAttribute('aria-expanded') === 'false' && document.activeElement === __qaMenuOpener`);
  await check("modals", "移动菜单键盘焦点、Escape 与焦点恢复", menuFocus && escaped, { menuFocus, escaped });
  await evaluate(`__qaMenuOpener.click()`);
  await viewport(1024);
  try { await poll(`document.querySelector('.drawer').hidden`, 1500); } catch { /* report a real resize failure below */ }
  await check("modals", "移动菜单切到桌面宽度自动关闭", await evaluate(`document.querySelector('.drawer').hidden && __qaMenuOpener.getAttribute('aria-expanded') === 'false' && !document.querySelector('main').inert`));
}

async function articleChecks(papers) {
  await viewport(390);
  for (const paper of papers) {
    await navigate(paper.url);
    const math = await evaluate(`({display:document.querySelectorAll('.prose .katex-display').length,rendered:document.querySelectorAll('.prose .katex').length,errors:[...document.querySelectorAll('.prose .katex-error')].map(el=>({text:el.textContent,title:el.title}))})`);
    await check("math", `${paper.slug} 所有原始独立公式渲染且无 KaTeX 错误`, math.display >= expectedDisplayCounts.get(paper.url) && math.errors.length === 0, { ...math, expectedDisplay: expectedDisplayCounts.get(paper.url) });
    const targets = await evaluate(`(() => {
      const targets=[];
      [...document.querySelectorAll('.prose img')].forEach((img,index)=>{
        const trigger=img.closest('button,[role="button"]')||img;
        trigger.dataset.qaZoom='image-'+index;targets.push({id:trigger.dataset.qaZoom,kind:'image',tabindex:trigger.tabIndex,loaded:img.complete&&img.naturalWidth>0});
        const inside=img.closest('p')?.querySelector('.image-zoom-trigger');
        const block=img.closest('figure')?.querySelector('figcaption')||img.closest('p')?.nextElementSibling;
        const caption=inside||(block?.matches('button,[role="button"],[tabindex]')?block:block?.querySelector('button,[role="button"],[tabindex]'));
        if(caption){caption.dataset.qaZoom='caption-'+index;targets.push({id:caption.dataset.qaZoom,kind:'caption',tabindex:caption.tabIndex,loaded:true});}
      });return targets;
    })()`);
    await check("images", `${paper.slug} 图与图注具备键盘入口`, targets.filter((x) => x.kind === "image").length > 0 && targets.filter((x) => x.kind === "caption").length === targets.filter((x) => x.kind === "image").length && targets.every((x) => x.tabindex >= 0 && x.loaded), { targets });
    for (const target of targets) {
      if (target.tabindex < 0) continue;
      await evaluate(`window.__qaZoomOpener=document.querySelector('[data-qa-zoom="${target.id}"]');__qaZoomOpener.scrollIntoView({block:'center',behavior:'instant'});__qaZoomOpener.focus()`);
      await key("Enter");
      let opened = false;
      try { await poll(`!!document.querySelector('.lightbox,[role="dialog"][aria-label*="图片"]')`, 1800); opened = true; } catch { /* record the failed behavior below */ }
      const focused = opened && await evaluate(`(() => {const box=document.querySelector('.lightbox,[role="dialog"][aria-label*="图片"]');return box.contains(document.activeElement);})()`);
      await key("Escape");
      await sleep(100);
      const closedRestored = await evaluate(`!document.querySelector('.lightbox,[role="dialog"][aria-label*="图片"]') && document.activeElement === __qaZoomOpener`);
      await check("images", `${paper.slug} ${target.id} Enter 放大 / Escape / 焦点恢复`, opened && focused && closedRestored, { opened, focused, closedRestored });
    }
    await evaluate(`(() => {window.__qaCopied=null;Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__qaCopied=text;}}});const details=document.querySelector('.citation');if(details)details.open=true;const button=document.querySelector('[data-copy-citation]');if(button){button.scrollIntoView({block:'center',behavior:'instant'});button.focus();}})()`);
    await key("Enter");
    await sleep(80);
    const citation = await evaluate(`(() => {const button=document.querySelector('[data-copy-citation]');const pre=button&&document.getElementById(button.dataset.target);return {copied:window.__qaCopied,displayed:pre?.textContent,status:document.querySelector('.copy-status')?.textContent,buttonVisible:!!button&&!button.hidden};})()`);
    const text = citation.copied || "";
    await check("citation", `${paper.slug} BibTeX 复制与本地元数据一致`, citation.buttonVisible && text.trim() === citation.displayed?.trim() && text.includes(paper.title) && text.includes(paper.url) && /year\s*=\s*\{2026\}/.test(text) && !/^\s*(doi|journal|volume|pages)\s*=/mi.test(text), citation);
  }
}

async function localScrollChecks(papers, posts) {
  for (const article of [...papers, ...posts]) {
    await navigate(article.url);
    for (const width of WIDTHS) {
      await viewport(width);
      try { await poll(`[...document.querySelectorAll('.prose .katex-display,.prose table,.prose [data-inline-formula]')].every(el=>el.scrollWidth<=el.clientWidth+1||el.tabIndex>=0)`, 1500); } catch { /* report the actual final region state */ }
      const regions = await evaluate(`(() => [...document.querySelectorAll('.prose .katex-display,.prose table,.prose [data-inline-formula]')].map((el,index)=>{
        let region=el;for(let n=el;n&&n.closest('.prose');n=n.parentElement){if(/auto|scroll/.test(getComputedStyle(n).overflowX)){region=n;break;}}
        const overflowing=region.scrollWidth>region.clientWidth+1;const before=region.scrollLeft;region.scrollLeft=1;const canScroll=region.scrollLeft>0;region.scrollLeft=before;
        return {type:el.tagName==='TABLE'?'table':el.hasAttribute('data-inline-formula')?'inline-formula':'formula',index,clientWidth:region.clientWidth,scrollWidth:region.scrollWidth,overflowX:getComputedStyle(region).overflowX,overflowing,canScroll,tabindex:region.tabIndex};
      }))()`);
      await check("local-scroll", `${article.slug} ${width}px 长公式/表格局部滚动`, regions.every((region) => !region.overflowing || (region.canScroll && region.tabindex >= 0)), { regions });
    }
  }
  // Stress the existing production containers, preserving and restoring the original DOM.
  await navigate(papers[0].url);
  await viewport(375);
  const stress = await evaluate(`(async () => {
    const formula=document.querySelector('.prose .katex-display'),table=document.querySelector('.prose table');
    if(!formula||!table||!window.katex)return {error:'missing rendered formula/table'};
    const original=formula.innerHTML,cell=table.querySelector('td,th'),cellHTML=cell?.innerHTML,cellStyle=cell?.getAttribute('style');
    formula.innerHTML=katex.renderToString(Array.from({length:35},(_,i)=>'r_{'+i+'}').join('+'),{throwOnError:false});
    if(cell){cell.textContent='20261005'.repeat(60);cell.style.whiteSpace='nowrap';}
    await Promise.race([new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))),new Promise(r=>setTimeout(r,200))]);
    const inspect=el=>{let r=el;for(let n=el;n&&n.closest('.prose');n=n.parentElement){if(/auto|scroll/.test(getComputedStyle(n).overflowX)){r=n;break;}}const before=r.scrollLeft;r.scrollLeft=60;const moved=r.scrollLeft;r.scrollLeft=before;return {scrollWidth:r.scrollWidth,clientWidth:r.clientWidth,moved,tabindex:r.tabIndex};};
    const result={formula:inspect(formula),table:inspect(table),pageWidth:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth};
    formula.innerHTML=original;if(cell){cell.innerHTML=cellHTML;if(cellStyle===null)cell.removeAttribute('style');else cell.setAttribute('style',cellStyle);}return result;
  })()`);
  await check("local-scroll", "375px 超长公式及不可断行表格压力样本局部滚动（DOM 已还原）", !stress.error && [stress.formula, stress.table].every((region) => region.scrollWidth > region.clientWidth && region.moved > 0 && region.tabindex >= 0) && stress.pageWidth <= stress.viewport + 1, stress);
}

async function noScriptAndPrint(papers, posts) {
  await viewport(390);
  await send("Emulation.setScriptExecutionDisabled", { value: true });
  try {
    for (const url of ["/", "/papers/", "/topics/", "/about/", ...papers.map((p) => p.url), ...posts.map((p) => p.url)]) {
      await navigate(url, "light", true);
      const detail = await evaluate(`(() => {${visibleFunction};const content=document.querySelector('.prose')||document.querySelector('#main');const p=content?.querySelector('p');return {contentVisible:visible(content),paragraphVisible:visible(p),characters:content?.textContent.trim().length,hiddenEnhancements:[...document.querySelectorAll('[data-search-open],.theme-toggle,.nav-toggle')].every(el=>!visible(el))};})()`);
      await check("no-js", `${url} 无 JavaScript 主文可见`, detail.contentVisible && detail.paragraphVisible && detail.characters > 100 && detail.hiddenEnhancements, detail);
    }
  } finally {
    await send("Emulation.setScriptExecutionDisabled", { value: false });
  }
  for (const article of [...papers, ...posts]) {
    await navigate(article.url);
    await send("Emulation.setEmulatedMedia", { media: "print", features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    const detail = await evaluate(`(() => {${visibleFunction};const prose=document.querySelector('.prose');
      const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d',{willReadFrequently:true});
      const rgb=color=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].slice(0,3);};
      const lum=color=>rgb(color).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0);
      const code=[...document.querySelectorAll('.prose .highlight pre')].map(pre=>{const token=pre.querySelector('code span')||pre.querySelector('code')||pre;const foreground=getComputedStyle(token).color,background=getComputedStyle(pre).backgroundColor,a=lum(foreground),b=lum(background);return {foreground,background,ratio:Number(((Math.max(a,b)+.05)/(Math.min(a,b)+.05)).toFixed(3)),visible:visible(token)};});
      return {proseVisible:visible(prose),paragraphVisible:visible(prose?.querySelector('p')),characters:prose?.textContent.trim().length,navHidden:!visible(document.querySelector('.nav')),footerHidden:!visible(document.querySelector('.footer')),tocHidden:!visible(document.querySelector('.toc')),code};})()`);
    await check("print", `${article.slug} 打印正文/代码可见、导航隐藏`, detail.proseVisible && detail.paragraphVisible && detail.characters > 100 && detail.navHidden && detail.footerHidden && detail.tocHidden && detail.code.every((code) => code.visible && code.ratio >= 7), detail);
    await send("Emulation.setEmulatedMedia", { media: "", features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  }
}

async function reducedMotionChecks(papers) {
  for (const url of ["/", papers[0].url]) {
    await navigate(url);
    await evaluate(`document.querySelector('.theme-toggle').click();const card=document.querySelector('.hero-card');if(card){const r=card.getBoundingClientRect();card.dispatchEvent(new PointerEvent('pointermove',{clientX:r.right-3,clientY:r.top+3,bubbles:true}));}`);
    const detail = await evaluate(`(() => ({reduce:matchMedia('(prefers-reduced-motion: reduce)').matches,running:document.getAnimations().filter(a=>a.playState==='running'||a.pending).map(a=>({type:a.constructor.name,state:a.playState})),scrollBehavior:getComputedStyle(document.documentElement).scrollBehavior,tilt:getComputedStyle(document.querySelector('.hero-card')||document.body).transform,counters:[...document.querySelectorAll('[data-count]')].map(el=>({actual:el.textContent,target:el.dataset.count}))}))()`);
    await check("reduced-motion", `${url} reduce 无活动动画、倾斜或数字滚动`, detail.reduce && detail.running.length === 0 && detail.scrollBehavior === "auto" && detail.tilt === "none" && detail.counters.every((counter) => counter.actual === counter.target), detail);
  }
}

async function componentScreenshots(papers) {
  if (!screenshots) return;
  await viewport(390);
  await navigate("/");
  await evaluate(`document.querySelector('.updates-list').scrollIntoView({block:'start',behavior:'instant'})`);
  await screenshot("timeline-light-390");
  await viewport(1440, 1000);
  for (const theme of ["light", "dark"]) {
    await navigate("/topics/estimation-highdim/", theme);
    await evaluate(`document.querySelector('.topic-guide-grid').scrollIntoView({block:'center',behavior:'instant'})`);
    await screenshot(`topic-reading-guide-${theme}-1440`);
  }
  await viewport(390);
  await navigate(papers[0].url);
  await evaluate(`const citation=document.querySelector('.citation');citation.open=true;citation.scrollIntoView({block:'center',behavior:'instant'})`);
  await screenshot("article-citation-light-390");
  await evaluate(`document.querySelector('.prose img').scrollIntoView({block:'center',behavior:'instant'})`);
  await screenshot("article-figure-light-390");
}

try {
  const paths = htmlPaths(path.join(ROOT, "dist")).sort((a, b) => a === "/" ? -1 : b === "/" ? 1 : a.localeCompare(b));
  const papers = JSON.parse(fs.readFileSync(path.join(ROOT, "content/papers.json"), "utf8"));
  const posts = JSON.parse(fs.readFileSync(path.join(ROOT, "content/posts.json"), "utf8"));
  papers.forEach((paper) => expectedDisplayCounts.set(paper.url, (paper.html.match(/\$\$/g) || []).length / 2));
  await check("manifest", "构建包含原有 51 个 HTML 页面、8 篇论文与 4 篇笔记", paths.length === 51 && papers.length === 8 && posts.length === 4, { pages: paths.length, papers: papers.length, posts: posts.length });
  const response = await fetch(`${BASE}/`);
  if (!response.ok) throw new Error(`Preview server returned ${response.status}`);
  const port = 9800 + Math.floor(Math.random() * 500);
  child = spawn(EDGE, ["--headless=new", "--no-sandbox", "--disable-gpu", "--no-first-run", "--disable-crashpad", "--disable-extensions", "--hide-scrollbars", `--remote-debugging-port=${port}`, `--user-data-dir=${path.join(RUN, "edge-profile")}`, "about:blank"], { stdio: "ignore", windowsHide: true });
  let spawnError;
  child.on("error", (error) => { spawnError = error; });
  let websocketURL;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (spawnError) throw spawnError;
    try { const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); websocketURL = tabs.find((tab) => tab.type === "page")?.webSocketDebuggerUrl; if (websocketURL) break; } catch { /* Edge is starting */ }
    await sleep(150);
  }
  if (!websocketURL) throw new Error("Edge DevTools did not become available");
  ws = new WebSocket(websocketURL);
  await new Promise((resolve, reject) => { ws.addEventListener("open", resolve, { once: true }); ws.addEventListener("error", reject, { once: true }); });
  let sequence = 0;
  const pending = new Map();
  ws.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (message.method === "Page.lifecycleEvent" && message.params.name === "load") loadedLoaderIds.add(message.params.loaderId);
    if (message.method === "Runtime.exceptionThrown") {
      const details = message.params.exceptionDetails;
      const frames = details.stackTrace?.callFrames || [];
      const urls = [details.url, ...frames.map((frame) => frame.url)].filter(Boolean);
      if (!urls.some((url) => url.startsWith("qa-redesign://"))) {
        const error = { text: details.text, description: details.exception?.description, url: details.url, lineNumber: details.lineNumber, columnNumber: details.columnNumber, stack: frames };
        (urls.length && urls.every((url) => /^(chrome|edge)-extension:/.test(url)) ? environmentErrors : runtimeErrors).push(error);
      }
    }
    if (!message.id || !pending.has(message.id)) return;
    const task = pending.get(message.id); pending.delete(message.id); clearTimeout(task.timeout);
    message.error ? task.reject(new Error(JSON.stringify(message.error))) : task.resolve(message.result);
  });
  send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method} ${String(params.expression || '').slice(0,250)}`)); }, 15000);
    pending.set(id, { resolve, reject, timeout });
    ws.send(JSON.stringify({ id, method, params }));
  });
  evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", { expression: expression + "\n//# sourceURL=qa-redesign://evaluation", awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  await send("Page.enable");
  await send("Page.setLifecycleEventsEnabled", { enabled: true });
  await send("Runtime.enable");
  if (!skipLayout) await layoutMatrix(paths);
  else {
    console.log("Skipping the layout matrix; running behavioral checks only.");
    await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  }
  await homeChecks(papers, posts);
  await modalChecks();
  await articleChecks(papers);
  await localScrollChecks(papers, posts);
  await noScriptAndPrint(papers, posts);
  await reducedMotionChecks(papers);
  await componentScreenshots(papers);
  await check("runtime", "页面无未捕获 JavaScript 运行时异常（排除 QA 注入）", runtimeErrors.length === 0, { runtimeErrors });
} catch (error) {
  await check("fatal", "QA 脚本完整运行", false, { message: error.message, stack: error.stack });
} finally {
  try { ws?.close(); } catch { /* close only this run's connection */ }
  try { child?.kill(); } catch { /* stop only the Edge instance spawned above */ }
  const phases = [...new Set(results.map((result) => result.phase))].map((phase) => {
    const matches = results.filter((result) => result.phase === phase);
    return { phase, passed: matches.filter((result) => result.ok).length, total: matches.length };
  });
  const passed = results.filter((result) => result.ok).length;
  const summary = `${passed}/${results.length} passed`;
  const report = { startedAt: started.toISOString(), finishedAt: new Date().toISOString(), durationSeconds: Number(((Date.now() - started.getTime()) / 1000).toFixed(2)), base: BASE, outputDirectory: RUN, widths: WIDTHS, skippedLayout: skipLayout, summary, phases, contrastLimitations: "基色及祖先 backgroundColor 的 alpha 复合采样；不模拟固定渐变背景、backdrop-filter、文字抗锯齿，不构成全站 WCAG AA 认证。", contrasts, runtimeErrors, environmentErrors, results };
  fs.writeFileSync(path.join(RUN, "report.json"), JSON.stringify(report, null, 2));
  const text = [`Extended redesign QA: ${summary}`, `Base: ${BASE}`, `Duration: ${report.durationSeconds}s`, `Output: ${RUN}`, report.contrastLimitations, "", ...phases.map((phase) => `${phase.phase}: ${phase.passed}/${phase.total} passed`), "", ...results.map((result) => `${result.ok ? "PASS" : "FAIL"} [${result.phase}] ${result.name}${result.ok ? "" : ` ${JSON.stringify(result.detail)}`}`)].join("\n");
  fs.writeFileSync(path.join(RUN, "summary.txt"), text);
  console.log("\n" + phases.map((phase) => `${phase.phase}: ${phase.passed}/${phase.total} passed`).join("\n"));
  console.log(`\n${summary}\nJSON: ${path.join(RUN, "report.json")}\nText: ${path.join(RUN, "summary.txt")}`);
  process.exitCode = passed === results.length ? 0 : 1;
}
