/**
 * deploy.mjs —— 通过 GitHub REST API 把 dist/ 的文本文件提交到 GitHub Pages 仓库
 * 本机没有 git，因此走 Git Data API（blob → tree → commit → ref）。
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, "dist");
const OWNER = "songyu0903";
const REPO = "songyu0903.github.io";
const BRANCH = "main";
const API = "https://api.github.com";

function tokenFromGit() {
  try {
    const out = execFileSync("git", ["credential", "fill"], {
      input: "protocol=https\nhost=github.com\n\n",
      encoding: "utf8",
    });
    const m = out.match(/^password=(.+)$/m);
    return m ? m[1].trim() : null;
  } catch (_) {
    return null;
  }
}
const TOKEN = process.env.GH_TOKEN || tokenFromGit();
if (!TOKEN) throw new Error("没有可用凭据：设置 GH_TOKEN，或先让 git credential 能取到 GitHub 凭据");
if (process.argv.includes("--check")) {
  console.log(`凭据可用（来源：${process.env.GH_TOKEN ? "GH_TOKEN 环境变量" : "git credential"}）`);
  process.exit(0);
}

async function api(method, urlPath, body) {
  const res = await fetch(API + urlPath, {
    method,
    headers: {
      authorization: `Bearer ${TOKEN}`,
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
      "user-agent": "dsh-deploy",
      "content-type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${urlPath} → ${res.status} ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

/* 收集待推送的文本文件（跳过镜像的二进制与 KaTeX 预置资源） */
const SKIP_DIRS = new Set(["katex"]);
const files = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    const rel = path.relative(DIST, p).split(path.sep).join("/");
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(rel.split("/")[0])) continue;
      walk(p);
      continue;
    }
    if (!/\.(html|xml|css|js|json)$/i.test(e.name)) continue;
    files.push({ path: rel, abs: p });
  }
}
walk(DIST);
files.sort((a, b) => a.path.localeCompare(b.path));
console.log(`待提交文件: ${files.length}`);

const ref = await api("GET", `/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`);
const baseCommitSha = ref.object.sha;
const baseCommit = await api("GET", `/repos/${OWNER}/${REPO}/git/commits/${baseCommitSha}`);
const baseTreeSha = baseCommit.tree.sha;
console.log(`基线提交: ${baseCommitSha.slice(0, 7)}`);

/* 上传 blob */
const entries = [];
let done = 0;
const queue = [...files];
async function worker() {
  while (queue.length) {
    const f = queue.shift();
    const content = fs.readFileSync(f.abs);
    const blob = await api("POST", `/repos/${OWNER}/${REPO}/git/blobs`, {
      content: content.toString("base64"),
      encoding: "base64",
    });
    entries.push({ path: f.path, mode: "100644", type: "blob", sha: blob.sha });
    done++;
    if (done % 10 === 0) console.log(`  blob ${done}/${files.length}`);
  }
}
await Promise.all(Array.from({ length: 6 }, worker));

const tree = await api("POST", `/repos/${OWNER}/${REPO}/git/trees`, {
  base_tree: baseTreeSha,
  tree: entries,
});
console.log(`新 tree: ${tree.sha.slice(0, 7)} (${entries.length} 项)`);

const commit = await api("POST", `/repos/${OWNER}/${REPO}/git/commits`, {
  message: "Redesign: glass academic homepage — 51 pages, ⌘K search, BibTeX, update timeline",
  tree: tree.sha,
  parents: [baseCommitSha],
});
console.log(`新提交: ${commit.sha.slice(0, 7)} — ${commit.message}`);

await api("PATCH", `/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, {
  sha: commit.sha,
  force: false,
});
console.log(`已更新 ${BRANCH} → ${commit.sha.slice(0, 7)}`);
fs.writeFileSync(path.join(ROOT, "deploy-result.json"), JSON.stringify({ commit: commit.sha, files: files.length, at: new Date().toISOString() }, null, 2));




