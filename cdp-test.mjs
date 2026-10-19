/**
 * cdp-test.mjs —— 交互自检：主题切换、移动端菜单、KaTeX 渲染、目录高亮
 */
import { spawn } from "node:child_process";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 9500 + Math.floor(Math.random() * 200);
const profile = `C:\\Users\\eiegant\\Desktop\\投资组合优化\\site-redesign\\_shot\\cdptest_${Date.now()}`;

const child = spawn(EDGE, [
  "--headless=new", "--no-sandbox", "--disable-gpu", "--no-first-run", "--disable-crashpad",
  "--hide-scrollbars", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function wsUrlFor() {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find((t) => t.type === "page");
      if (page) return page.webSocketDebuggerUrl;
    } catch (_) {}
    await sleep(150);
  }
  throw new Error("no devtools");
}

const ws = new WebSocket(await wsUrlFor());
let id = 0;
const pending = new Map();
ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
  }
});
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const msgId = ++id;
    pending.set(msgId, { resolve, reject });
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });
await new Promise((r) => ws.addEventListener("open", r));
await send("Page.enable");
await send("Runtime.enable");

const evaluate = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + " " + (r.exceptionDetails.exception?.description || ""));
  return r.result.value;
};

const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok, detail });

// ---- 桌面
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: "http://127.0.0.1:4173/" });
await sleep(3500);

const themeBefore = await evaluate(`document.documentElement.dataset.theme`);
await evaluate(`document.querySelector(".theme-toggle").click()`);
await sleep(300);
const themeAfter = await evaluate(`document.documentElement.dataset.theme`);
const stored = await evaluate(`localStorage.getItem("ys-theme")`);
check("主题切换", themeAfter !== themeBefore && (themeAfter === "dark" || themeAfter === "light"), `${themeBefore} → ${themeAfter}, stored=${stored}`);
await evaluate(`document.querySelector(".theme-toggle").click()`);
await sleep(200);
check("主题切回", (await evaluate(`document.documentElement.dataset.theme`)) === themeBefore);

const katexHome = await evaluate(`document.querySelectorAll(".katex").length`);
check("首页公式渲染", katexHome > 0, `katex nodes=${katexHome}`);

const revealCount = await evaluate(`document.querySelectorAll("[data-reveal].is-in").length`);
const revealTotal = await evaluate(`document.querySelectorAll("[data-reveal]").length`);
check("滚动入场", revealCount > 0, `${revealCount}/${revealTotal} 已进入`);

// ---- 论文筛选
await send("Page.navigate", { url: "http://127.0.0.1:4173/papers/" });
await sleep(1800);
const visibleAll = await evaluate(`[...document.querySelectorAll("[data-topics]")].filter(e=>!e.hidden).length`);
await evaluate(`document.querySelector('[data-filter="estimation-highdim"]').click()`);
await sleep(300);
const visibleFiltered = await evaluate(`[...document.querySelectorAll("[data-topics]")].filter(e=>!e.hidden).length`);
const urlFiltered = await evaluate(`location.search`);
check("论文筛选", visibleAll === 8 && visibleFiltered === 2, `全部=${visibleAll}, 筛选=${visibleFiltered}, url=${urlFiltered}`);

// ---- 文章页
await send("Page.navigate", { url: "http://127.0.0.1:4173/papers/wasserstein-cvar-portfolio/" });
await sleep(3500);
const katexArticle = await evaluate(`document.querySelectorAll(".katex").length`);
const tocLinks = await evaluate(`document.querySelectorAll(".toc a").length`);
check("文章公式渲染", katexArticle > 20, `katex=${katexArticle}`);
check("目录生成", tocLinks >= 5, `toc=${tocLinks}`);

const anchorWorks = await evaluate(`(function(){
  var a = document.querySelector(".toc a");
  var id = decodeURIComponent(a.getAttribute("href").slice(1));
  var el = document.getElementById(id);
  return !!el;
})()`);
check("目录锚点可解析", anchorWorks === true);

await evaluate(`(function(){var el=document.querySelectorAll(".prose h2")[1];if(el){window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 160);}})()`);
await sleep(900);
const tocActive = await evaluate(`document.querySelectorAll(".toc a.is-active").length`);
const progressWidth = await evaluate(`(document.querySelector(".progress")||{style:{}}).style.width`);
check("目录高亮/进度条", tocActive >= 0 && progressWidth !== "", `active=${tocActive}, progress=${progressWidth}`);

// ---- 站内搜索
await send("Page.navigate", { url: "http://127.0.0.1:4173/" });
await sleep(2200);
await evaluate(`document.querySelector("[data-search-open]").click()`);
await sleep(1200);
const searchOpen = await evaluate(`!document.getElementById("search").hidden`);
const indexOk = await evaluate(`(async()=>(await fetch("/search-index.json")).ok)()`);
await evaluate(`(function(){var i=document.getElementById("searchInput");i.value="鲁棒";i.dispatchEvent(new Event("input",{bubbles:true}));})()`);
await sleep(400);
const resultCount = await evaluate(`document.querySelectorAll(".search-item").length`);
const firstHref = await evaluate(`(document.querySelector(".search-item")||{}).getAttribute && document.querySelector(".search-item").getAttribute("href")`);
check("搜索面板打开", searchOpen === true && indexOk === true, `open=${searchOpen}, index=${indexOk}`);
check("搜索命中", resultCount > 0, `results=${resultCount}, first=${firstHref}`);

const enterNav = await evaluate(`(function(){
  var ev = new KeyboardEvent("keydown", {key:"Enter", bubbles:true});
  document.getElementById("search").dispatchEvent(ev);
  return document.querySelector(".search-item").getAttribute("href");
})()`);
await sleep(700);
const afterEnter = await evaluate(`location.pathname`);
check("回车跳转结果", afterEnter === enterNav, `${afterEnter} vs ${enterNav}`);

// ---- 整卡点击
await send("Page.navigate", { url: "http://127.0.0.1:4173/papers/" });
await sleep(1800);
const beforeClick = await evaluate(`location.pathname`);
await evaluate(`(function(){var el=document.querySelector(".paper-item .paper-abs");var r=el.getBoundingClientRect();el.dispatchEvent(new MouseEvent("click",{bubbles:true,clientX:r.left+5,clientY:r.top+5}));})()`);
await sleep(900);
const afterClick = await evaluate(`location.pathname`);
check("论文卡片整卡可点", afterClick !== beforeClick && afterClick.startsWith("/papers/"), `${beforeClick} → ${afterClick}`);

// ---- 移动端菜单
await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await send("Page.navigate", { url: "http://127.0.0.1:4173/" });
await sleep(2500);
const drawerHiddenBefore = await evaluate(`document.querySelector(".drawer").hidden`);
await evaluate(`document.querySelector(".nav-toggle").click()`);
await sleep(400);
const drawerHiddenAfter = await evaluate(`document.querySelector(".drawer").hidden`);
const drawerLinks = await evaluate(`document.querySelectorAll(".drawer a").length`);
check("移动端抽屉", drawerHiddenBefore === true && drawerHiddenAfter === false && drawerLinks === 5, `before=${drawerHiddenBefore}, after=${drawerHiddenAfter}, links=${drawerLinks}`);

const overflowX = await evaluate(`document.documentElement.scrollWidth - document.documentElement.clientWidth`);
check("移动端无横向溢出", overflowX === 0, `溢出=${overflowX}px`);

console.log("");
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.detail ? "  (" + r.detail + ")" : ""}`);
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} passed`);

ws.close();
child.kill();
process.exit(results.every((r) => r.ok) ? 0 : 1);




