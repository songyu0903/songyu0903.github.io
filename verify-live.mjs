/**
 * verify-live.mjs —— 等待 GitHub Pages 构建完成，然后对线上页面做逐页复检
 */
const TOKEN = process.env.GH_TOKEN;
const OWNER = "songyu0903";
const REPO = "songyu0903.github.io";
const ORIGIN = "https://songyu0903.github.io";
const EXPECTED_COMMIT = process.env.EXPECTED_COMMIT || "";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const H = { authorization: `Bearer ${TOKEN}`, accept: "application/vnd.github+json", "user-agent": "dsh-verify" };

async function gh(path) {
  const r = await fetch(`https://api.github.com${path}`, { headers: H });
  if (!r.ok) throw new Error(`${path} → ${r.status}`);
  return r.json();
}

console.log("等待 Pages 构建…");
let build = null;
for (let i = 0; i < 40; i++) {
  try {
    build = await gh(`/repos/${OWNER}/${REPO}/pages/builds/latest`);
    const sha = build.commit || "";
    if (build.status === "built" && (!EXPECTED_COMMIT || sha.startsWith(EXPECTED_COMMIT.slice(0, 7)))) break;
    if (build.status === "errored") throw new Error("Pages 构建失败: " + build.error?.message);
  } catch (e) {
    if (String(e.message).includes("404")) { /* Pages 尚未生成构建记录 */ }
    else console.log("  轮询:", e.message);
  }
  await sleep(10000);
}
console.log("构建状态:", build?.status, "commit:", build?.commit?.slice(0, 7), "用时:", build?.duration);

const bust = `?v=${Date.now()}`;
const checks = [
  ["/", "精选五篇"],
  ["/papers/", "论文与研究笔记"],
  ["/papers/wasserstein-cvar-portfolio/", "引用本文（BibTeX）"],
  ["/papers/moment-shortfall-sos/", "复现说明"],
  ["/topics/", "研究方向"],
  ["/topics/estimation-highdim/", "核心问题"],
  ["/blog/", "工具与写作"],
  ["/blog/r-tikz-figures/", "tikzDevice"],
  ["/about/", "把稳健性写成可检验的命题"],
  ["/tags/", "标签"],
  ["/tags/latex/", "LaTeX"],
  ["/assets/site.css", "search-panel"],
  ["/assets/site.js", "search-index.json"],
  ["/search-index.json", '"kind"'],
  ["/sitemap.xml", "<urlset"],
  ["/index.xml", "<rss"],
];

let pass = 0;
const failures = [];
for (const [p, marker] of checks) {
  try {
    const r = await fetch(ORIGIN + p + bust, { headers: { "user-agent": "dsh-verify" } });
    const text = await r.text();
    const ok = r.status === 200 && text.includes(marker);
    if (ok) pass++;
    else failures.push(`${p} → ${r.status}${text.includes(marker) ? "" : " 缺少标记"}`);
    console.log(`${ok ? "PASS" : "FAIL"}  ${r.status}  ${p}${ok ? "" : "  缺少 " + marker}`);
  } catch (e) {
    failures.push(`${p} → ${e.message}`);
    console.log(`FAIL  ERR  ${p} ${e.message}`);
  }
}

/* 404 页面 */
try {
  const r = await fetch(`${ORIGIN}/no-such-page-${Date.now()}/`, { headers: { "user-agent": "dsh-verify" } });
  const ok = r.status === 404;
  if (ok) pass++;
  else failures.push(`404 行为异常: ${r.status}`);
  console.log(`${ok ? "PASS" : "FAIL"}  ${r.status}  /<不存在的页面>/`);
} catch (e) {
  failures.push("404 检查失败: " + e.message);
}

/* sitemap URL 数 */
try {
  const xml = await (await fetch(`${ORIGIN}/sitemap.xml${bust}`, { headers: { "user-agent": "dsh-verify" } })).text();
  const n = (xml.match(/<loc>/g) || []).length;
  console.log(`sitemap URL 数: ${n}`);
} catch {}

console.log(`\n线上复检: ${pass}/${checks.length + 1} 通过`);
if (failures.length) {
  console.log("失败项:");
  failures.forEach((f) => console.log("  -", f));
  process.exit(1);
}
