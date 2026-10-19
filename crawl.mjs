const BASE = "http://127.0.0.1:4173";
const seen = new Set();
const bad = [];
const pagesChecked = [];

async function check(href, from) {
  if (seen.has(href)) return null;
  seen.add(href);
  try {
    const r = await fetch(BASE + href);
    if (!r.ok) bad.push(`${r.status} ${href}  (from ${from})`);
    return r;
  } catch (e) {
    bad.push(`ERR ${href} ${e.cause?.code || e.message}`);
    return null;
  }
}

const queue = ["/", "/papers/", "/topics/", "/blog/", "/about/", "/tags/", "/404.html"];
const visited = new Set();
while (queue.length) {
  const p = queue.shift();
  if (visited.has(p)) continue;
  visited.add(p);
  const r = await check(p, "seed");
  if (!r) continue;
  const type = r.headers.get("content-type") || "";
  if (!type.includes("text/html")) continue;
  pagesChecked.push(p);
  const html = await r.text();
  for (const m of html.matchAll(/(?:href|src)="([^"#?]+)[^"]*"/g)) {
    const href = m[1];
    if (!href.startsWith("/")) continue;
    if (/\.[a-z0-9]{2,5}$/i.test(href)) { await check(href, p); continue; }
    if (!visited.has(href)) queue.push(href);
  }
}
console.log("pages:", pagesChecked.length, "resources/links:", seen.size);
console.log("broken:", bad.length);
for (const b of bad.slice(0, 40)) console.log("  ", b);
