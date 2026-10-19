/**
 * serve.mjs —— 本地预览服务器（仅用于查看，不对外）
 * 用法：node serve.mjs [port]
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, "dist");
const PORT = Number(process.argv[2] || 4173);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
};

const server = http.createServer((req, res) => {
  try {
    let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    if (urlPath.endsWith("/")) urlPath += "index.html";
    const file = path.join(DIST, urlPath.replace(/^\//, ""));
    const resolved = path.resolve(file);
    if (!resolved.startsWith(path.resolve(DIST))) {
      res.writeHead(403).end("forbidden");
      return;
    }
    if (!fs.existsSync(resolved) || fs.statSync(resolved).isDirectory()) {
      const notFound = path.join(DIST, "404.html");
      res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
      res.end(fs.existsSync(notFound) ? fs.readFileSync(notFound) : "404");
      return;
    }
    const ext = path.extname(resolved).toLowerCase();
    res.writeHead(200, {
      "content-type": TYPES[ext] || "application/octet-stream",
      "cache-control": "no-store",
    });
    fs.createReadStream(resolved).pipe(res);
  } catch (e) {
    res.writeHead(500).end(String(e));
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`preview: http://127.0.0.1:${PORT}/`);
});
