/**
 * shot.mjs —— 通用截图：node shot.mjs <url> <out.png> <width> [scrollY] [dark] [full]
 */
import fs from "node:fs";
import { spawn } from "node:child_process";

const [url, outFile, widthArg = "1440", scrollArg = "0", ...flags] = process.argv.slice(2);
const width = Number(widthArg);
const scrollY = Number(scrollArg);
const dark = flags.includes("dark");
const full = flags.includes("full");
const PORT = 9800 + Math.floor(Math.random() * 150);
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const userDir = `C:\\Users\\eiegant\\AppData\\Local\\Temp\\dsh-shot-${Date.now()}`;

const child = spawn(EDGE, [
  "--headless=new", "--no-sandbox", "--disable-gpu", "--no-first-run", "--disable-crashpad",
  "--hide-scrollbars", `--remote-debugging-port=${PORT}`, `--user-data-dir=${userDir}`, "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let wsUrl;
for (let i = 0; i < 60; i++) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    const page = list.find((t) => t.type === "page");
    if (page) { wsUrl = page.webSocketDebuggerUrl; break; }
  } catch (_) {}
  await sleep(150);
}
const ws = new WebSocket(wsUrl);
let id = 0;
const pending = new Map();
ws.addEventListener("message", (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
  }
});
const send = (method, params = {}) =>
  new Promise((res, rej) => {
    const i = ++id;
    pending.set(i, { resolve: res, reject: rej });
    ws.send(JSON.stringify({ id: i, method, params }));
  });

await new Promise((r) => ws.addEventListener("open", r));
await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width, height: 900, deviceScaleFactor: 1, mobile: width < 600,
});
await send("Page.navigate", { url });
await sleep(3200);

if (dark) {
  await send("Runtime.evaluate", { expression: `document.documentElement.setAttribute("data-theme","dark")` });
  await sleep(500);
}
if (scrollY > 0) {
  await send("Runtime.evaluate", { expression: `window.scrollTo(0, ${scrollY})` });
  await sleep(1200);
}

const info = await send("Runtime.evaluate", {
  expression: `JSON.stringify({h: document.documentElement.scrollHeight, w: document.documentElement.clientWidth})`,
  returnByValue: true,
});
const { h, w } = JSON.parse(info.result.value);

const params = { format: "png" };
if (full) {
  params.captureBeyondViewport = true;
  params.clip = { x: 0, y: 0, width: w, height: Math.min(h, 14000), scale: 1 };
}
const shot = await send("Page.captureScreenshot", params);
fs.writeFileSync(outFile, Buffer.from(shot.data, "base64"));
console.log("saved", outFile, `${w}x${full ? Math.min(h, 14000) : 900}`);

ws.close();
child.kill();
fs.rmSync(userDir, { recursive: true, force: true });
process.exit(0);
