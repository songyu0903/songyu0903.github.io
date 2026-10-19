/**
 * cdp-shot.mjs —— 用 DevTools 协议精确设置视口并截整页图
 * 用法：node cdp-shot.mjs <url> <out.png> <width> [dark] [full]
 */
import fs from "node:fs";
import { spawn } from "node:child_process";

const [url, outFile, widthArg = "1440", ...flags] = process.argv.slice(2);
const width = Number(widthArg);
const dark = flags.includes("dark");
const full = flags.includes("full");
const PORT = 9333 + Math.floor(Math.random() * 200);

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const profile = `C:\\Users\\eiegant\\Desktop\\投资组合优化\\site-redesign\\_shot\\cdp_${Date.now()}`;

const child = spawn(
  EDGE,
  [
    "--headless=new", "--no-sandbox", "--disable-gpu", "--no-first-run",
    "--disable-crashpad", "--hide-scrollbars", "--mute-audio",
    `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
    "about:blank",
  ],
  { stdio: "ignore", detached: false }
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getTarget() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const list = await res.json();
      const page = list.find((t) => t.type === "page");
      if (page) return page.webSocketDebuggerUrl;
    } catch (_) {}
    await sleep(150);
  }
  throw new Error("DevTools 未就绪");
}

const wsUrl = await getTarget();
const ws = new WebSocket(wsUrl);
let id = 0;
const pending = new Map();
const events = [];

ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
  } else if (msg.method) {
    events.push(msg);
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
await send("Emulation.setDeviceMetricsOverride", {
  width,
  height: 900,
  deviceScaleFactor: 1,
  mobile: width < 600,
});
await send("Page.navigate", { url });
await sleep(3500); // 等 KaTeX 与字体

if (dark) {
  await send("Runtime.evaluate", {
    expression: `document.documentElement.setAttribute("data-theme","dark")`,
  });
  await sleep(400);
}

const metrics = await send("Runtime.evaluate", {
  expression: `JSON.stringify({h: document.documentElement.scrollHeight, w: document.documentElement.clientWidth})`,
  returnByValue: true,
});
const { h, w } = JSON.parse(metrics.result.value);

const shot = await send("Page.captureScreenshot", {
  format: "png",
  captureBeyondViewport: true,
  clip: { x: 0, y: 0, width: w, height: full ? Math.min(h, 12000) : 1100, scale: 1 },
});
fs.writeFileSync(outFile, Buffer.from(shot.data, "base64"));
console.log("saved", outFile, `${w}x${full ? h : 1100}`);

ws.close();
child.kill();
process.exit(0);
