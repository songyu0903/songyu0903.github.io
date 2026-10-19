/**
 * extract.mjs —— 从现有线上站点抽取正文与元数据，作为新站的唯一内容源。
 * 运行：node extract.mjs
 * 产物：content/*.json + content/html/*.html + content/assets.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ORIGIN = "https://songyu0903.github.io";
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const CONTENT = path.join(ROOT, "content");
const HTMLDIR = path.join(CONTENT, "html");
fs.mkdirSync(HTMLDIR, { recursive: true });

const decode = (s = "") =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

function meta(html, re) {
  const m = html.match(re);
  return m ? decode(m[1]) : "";
}
const all = (html, re) => [...html.matchAll(re)].map((m) => decode(m[1]));

function articleInner(html) {
  const s = html.indexOf('<article class="markdown book-article">');
  if (s < 0) return "";
  const bodyStart = html.indexOf(">", s) + 1;
  // 找到与之配对的 </article>：正文内可能嵌套 <article class="book-post ..."> 列表项
  let depth = 1;
  const re = /<article\b|<\/article>/g;
  re.lastIndex = bodyStart;
  let m;
  while ((m = re.exec(html))) {
    if (m[0] === "</article>") depth--;
    else depth++;
    if (depth === 0) return html.slice(bodyStart, m.index);
  }
  return html.slice(bodyStart);
}

const slugOf = (href) => href.replace(/\/$/, "").split("/").pop();

const papersIdx = await (await fetch(`${ORIGIN}/papers/`)).text();
const paperLinks = [...new Set(all(papersIdx, /href=(\/papers\/[a-z0-9-]+\/)/g))];
const topicsIdx = await (await fetch(`${ORIGIN}/topics/`)).text();
const topicLinks = [...new Set(all(topicsIdx, /href=(\/topics\/[a-z0-9-]+\/)/g))].filter(
  (h) => h !== "/topics/"
);
const blogIdx = await (await fetch(`${ORIGIN}/blog/`)).text();
const blogLinks = [...new Set(all(blogIdx, /href=(\/blog\/[a-z0-9-]+\/)/g))].filter((h) => h !== "/blog/");

const pageMeta = (html) => ({
  title: meta(html, /<h1[^>]*>([\s\S]*?)<\/h1>/),
  description: meta(html, /<meta name=description content="([^"]*)"/),
  ogTitle: meta(html, /property="og:title" content="([^"]*)"/),
  published: meta(html, /property="article:published_time" content="([^"]*)"/),
  tags: all(html, /property="article:tag" content="([^"]*)"/g),
});

const stripTags = (s) => decode(s.replace(/<[^>]+>/g, ""));
const dateOnly = (p) => (p ? p.slice(0, 10) : "");

// ---- 论文
const papers = [];
for (const link of paperLinks) {
  const slug = slugOf(link);
  const html = await (await fetch(ORIGIN + link)).text();
  const m = pageMeta(html);
  const body = articleInner(html);
  // 摘要：papers 索引里的 p
  const idxCard = papersIdx.match(new RegExp(`href=${link}[\\s\\S]{0,600}?<p>([\\s\\S]*?)</p>`));
  const abstract = idxCard ? stripTags(idxCard[1]).trim() : m.description;
  const firstDate = body.match(/class=note-meta>([^<]+)</);
  papers.push({
    slug,
    url: link,
    title: m.title,
    description: m.description,
    date: firstDate ? firstDate[1].trim() : dateOnly(m.published),
    published: m.published,
    tags: m.tags,
    abstract,
    html: body,
  });
  fs.writeFileSync(path.join(HTMLDIR, `paper-${slug}.html`), body);
  console.log("paper", slug, body.length, "bytes");
}

// ---- 笔记
const posts = [];
for (const link of blogLinks) {
  const slug = slugOf(link);
  const html = await (await fetch(ORIGIN + link)).text();
  const m = pageMeta(html);
  const body = articleInner(html);
  const idxCard = blogIdx.match(new RegExp(`href=${link}[\\s\\S]{0,900}?<p>([\\s\\S]*?)</p>`));
  const firstDate = body.match(/class=note-meta>([^<]+)</);
  posts.push({
    slug,
    url: link,
    title: m.title,
    description: m.description,
    date: firstDate ? firstDate[1].trim() : dateOnly(m.published),
    published: m.published,
    tags: m.tags,
    abstract: idxCard ? stripTags(idxCard[1]).trim() : m.description,
    html: body,
  });
  fs.writeFileSync(path.join(HTMLDIR, `post-${slug}.html`), body);
  console.log("post", slug, body.length, "bytes");
}

// ---- 专题
const topics = [];
for (const link of topicLinks) {
  const slug = slugOf(link);
  const html = await (await fetch(ORIGIN + link)).text();
  const m = meta(html, /<h1[^>]*>([\s\S]*?)<\/h1>/);
  const body = articleInner(html);
  const introMatch = body.match(/^<h1[\s\S]*?<\/h1>\s*((?:<p>[\s\S]*?<\/p>\s*)+)/);
  const intro = introMatch ? introMatch[1] : "";
  const members = [...new Set(all(body, /href=(\/papers\/[a-z0-9-]+\/)/g))];
  const postMembers = [...new Set(all(body, /href=(\/blog\/[a-z0-9-]+\/)/g))];
  topics.push({
    slug,
    url: link,
    title: stripTags(m),
    description: meta(html, /<meta name=description content="([^"]*)"/),
    intro,
    papers: members,
    posts: postMembers,
  });
  console.log("topic", slug, "papers:", members.length, "posts:", postMembers.length);
}

// ---- 关于
const aboutHtml = await (await fetch(`${ORIGIN}/about/`)).text();
const aboutBody = articleInner(aboutHtml);
fs.writeFileSync(path.join(HTMLDIR, "about.html"), aboutBody);

// ---- 首页上的信息（研究方向段落）
const homeHtml = await (await fetch(`${ORIGIN}/`)).text();

fs.writeFileSync(path.join(CONTENT, "papers.json"), JSON.stringify(papers, null, 2));
fs.writeFileSync(path.join(CONTENT, "posts.json"), JSON.stringify(posts, null, 2));
fs.writeFileSync(path.join(CONTENT, "topics.json"), JSON.stringify(topics, null, 2));
fs.writeFileSync(
  path.join(CONTENT, "site.json"),
  JSON.stringify(
    {
      origin: ORIGIN,
      generatedAt: new Date().toISOString(),
      papers: papers.length,
      posts: posts.length,
      topics: topics.length,
      aboutHtmlLength: aboutBody.length,
      homeHtmlLength: homeHtml.length,
    },
    null,
    2
  )
);
console.log("\nDONE", {
  papers: papers.length,
  posts: posts.length,
  topics: topics.length,
  about: aboutBody.length,
});
