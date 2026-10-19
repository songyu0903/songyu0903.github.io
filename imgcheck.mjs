import fs from "node:fs";
import path from "node:path";
const DIST = path.join(process.cwd(), "dist");
const missing = [];
const checked = new Set();
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (!e.name.endsWith(".html")) continue;
    const html = fs.readFileSync(p, "utf8");
    const rel = path.relative(DIST, path.dirname(p));
    for (const m of html.matchAll(/<img\b[^>]*?\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/gi)) {
      const raw = (m[1] || m[2] || m[3] || "").trim();
      if (!raw || /^https?:|^data:/.test(raw)) continue;
      let target;
      if (raw.startsWith("/")) target = path.join(DIST, decodeURIComponent(raw));
      else target = path.join(DIST, rel, decodeURIComponent(raw));
      if (checked.has(target)) continue;
      checked.add(target);
      if (!fs.existsSync(target)) missing.push(`${path.relative(DIST, p)} -> ${raw}`);
    }
  }
}
walk(DIST);
console.log("images checked:", checked.size, "missing:", missing.length);
missing.slice(0, 10).forEach((m) => console.log("  ", m));
