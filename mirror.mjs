/**
 * mirror.mjs —— 为本地预览镜像线上静态资源（字体、图片、KaTeX、简历等）
 * 部署时这些二进制文件已存在于仓库，无需重复上传。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, "dist");
const ORIGIN = "https://songyu0903.github.io";

const found = new Set();
const IMG_RE = /<img\b[^>]*?\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/gi;
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.name.endsWith(".html")) {
      const html = fs.readFileSync(p, "utf8");
      const pageDir = "/" + path.relative(OUT, path.dirname(p)).split(path.sep).join("/").replace(/^\.$/, "");
      const base = pageDir === "/" ? "" : pageDir.replace(/\/$/, "");
      for (const m of html.matchAll(/(?:src|href)="(\/[^"]+)"/g)) {
        const u = m[1].split("#")[0].split("?")[0];
        if (u.endsWith("/")) continue; // 页面链接，不是资源
        if (!/\.[a-z0-9]{2,5}$/i.test(u)) continue;
        if (/^\/(katex|badges|media|uploads|papers|blog|favicon|apple-touch-icon|heatmap)\b/.test(u)) found.add(u);
      }
      // 正文里的相对图片（源站使用无引号属性）
      for (const m of html.matchAll(IMG_RE)) {
        const raw = (m[1] || m[2] || m[3] || "").trim();
        if (!raw || raw.startsWith("data:") || /^https?:/i.test(raw)) continue;
        const u = raw.startsWith("/") ? raw : `${base}/${raw}`;
        found.add(u);
      }
    }
  }
}
walk(OUT);

const wanted = new Set([...found]);
// KaTeX 字体
const katexCss = "/katex/katex.min.css";
wanted.add(katexCss);
wanted.add("/katex/katex.min.js");
wanted.add("/katex/contrib/auto-render.min.js");
wanted.add("/favicon.ico");
wanted.add("/favicon.png");
wanted.add("/favicon.svg");

let ok = 0;
let skipped = 0;
let failed = [];

async function mirror(urlPath) {
  const dest = path.join(OUT, decodeURIComponent(urlPath).replace(/^\//, ""));
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
    skipped++;
    return false;
  }
  try {
    const res = await fetch(ORIGIN + encodeURI(urlPath));
    if (!res.ok) throw new Error("HTTP " + res.status);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, buf);
    ok++;
    return true;
  } catch (e) {
    failed.push(`${urlPath} :: ${e.message}`);
    return false;
  }
}

// 先跑一遍 HTML 里出现的资源
const queue = [...wanted];
const workers = Array.from({ length: 6 }, async () => {
  while (queue.length) await mirror(queue.shift());
});
await Promise.all(workers);

// 再用 CSS 里的字体引用补齐
const cssPath = path.join(OUT, "katex", "katex.min.css");
if (fs.existsSync(cssPath)) {
  const css = fs.readFileSync(cssPath, "utf8");
  const fontPaths = [...new Set([...css.matchAll(/url\(([^)]*fonts\/[^)]+)\)/g)].map((m) => m[1].replace(/["']/g, "").trim()))]
    .filter((p) => p.endsWith(".woff2"));
  const fq = fontPaths.filter((p) => !p.startsWith("data:")).map((p) => "/katex/" + p.replace(/^\.?\//, ""));
  const workers2 = Array.from({ length: 6 }, async () => {
    while (fq.length) await mirror(fq.shift());
  });
  await Promise.all(workers2);
}

console.log(`mirrored: ${ok}, cached: ${skipped}, failed: ${failed.length}`);
if (failed.length) console.log(failed.join("\n"));
