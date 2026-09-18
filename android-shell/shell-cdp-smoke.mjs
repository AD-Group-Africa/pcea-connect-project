// Android shell smoke test — raw CDP (no Playwright).
// Connects to the PCEA Connect WebView inside the emulator over the
// adb-forwarded DevTools port and drives the real app UI.
// Prereqs: emulator up, loopback debug APK installed+launched, adb forward tcp:9222,
//          local stack reachable from the emulator (adb reverse set).
// Run: SHELL_BASE=http://localhost:PORT node shell-cdp-smoke.mjs
const CDP_HTTP = process.env.SHELL_CDP_URL || "http://localhost:9222";
const BASE = process.env.SHELL_BASE || "http://localhost:3000";

let pass = 0, fail = 0;
function ok(name, cond, detail = "") {
  const mark = cond ? "PASS" : "FAIL";
  if (cond) pass++; else fail++;
  console.log(`[${mark}] ${name}${detail ? " — " + detail : ""}`);
}
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ---- discover the page target ----
let target = null;
for (let i = 0; i < 20 && !target; i++) {
  const list = await fetch(`${CDP_HTTP}/json`).then(r => r.json()).catch(() => []);
  target = list.find(t => t.type === "page" && t.url.startsWith("http"));
  if (!target) await sleep(2000);
}
if (!target) { console.error("No WebView page target found on", CDP_HTTP); process.exit(2); }

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

let msgId = 0;
const pending = new Map();
const events = [];
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  else if (msg.method) events.push(msg);
};
function send(method, params = {}) {
  const id = ++msgId;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res, rej) => {
    const timer = setTimeout(() => { pending.delete(id); rej(new Error("CDP timeout: " + method)); }, 45000);
    pending.set(id, (m) => { clearTimeout(timer); m.error ? rej(new Error(method + ": " + JSON.stringify(m.error))) : res(m.result); });
  });
}
await send("Page.enable");
await send("Runtime.enable");

async function evalJs(expression, awaitPromise = false) {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise });
  if (r.exceptionDetails) throw new Error("eval: " + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails.text));
  return r.result.value;
}
async function goto(url, timeoutMs = 60000) {
  await send("Page.navigate", { url });
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try {
      const st = await evalJs("document.readyState + '|' + location.href");
      if (st.startsWith("complete")) { await injectHelpers(); return st; }
    } catch { /* navigating between docs */ }
    await sleep(500);
  }
  throw new Error("goto timeout: " + url);
}
const bodyText = () => evalJs("document.body ? document.body.innerText : ''");
async function waitFor(predFn, timeoutMs = 45000, everyMs = 800) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try { if (await predFn()) return true; } catch { /* transient */ }
    await sleep(everyMs);
  }
  return false;
}
// Fill a React-controlled input: native setter + input event, found via label text.
// Must be re-injected after every navigation (new document = new window object).
const FILL_HELPER_SRC = `
(window.__fillLabel = (labelRe, value) => {
  const rx = new RegExp(labelRe, "i");
  const input = [...document.querySelectorAll("input")].find(inp => {
    const id = inp.id;
    const label = id ? document.querySelector('label[for="' + id + '"]') : null;
    return (label && rx.test(label.innerText)) || (inp.closest("label") && rx.test(inp.closest("label").innerText));
  });
  if (!input) return false;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  setter.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}, "ok")`;
async function injectHelpers() { await evalJs(FILL_HELPER_SRC); }

// 1. Home
await goto(`${BASE}/`);
ok("WebView loads PCEA Connect", (await evalJs("document.title")).includes("PCEA Connect"));
const home = await bodyText();
ok("Home renders content", home.length > 100, home.slice(0, 50).replace(/\n/g, " "));

// 2. Public locator
await goto(`${BASE}/locator`);
const locOk = await waitFor(async () => {
  const t = (await bodyText()).toLowerCase();
  return t.includes("church") || t.includes("locator") || t.includes("no ");
}, 20000);
const locTxt = (await bodyText()).toLowerCase();
ok("Public /locator renders", locOk, locTxt.slice(0, 50).replace(/\n/g, " "));

// 3. Registration
const email = `shell-demo-${Date.now()}@pcea.local`;
const password = "ShellDemo!2026x";
await goto(`${BASE}/register`);
await sleep(4000); // allow client hydration before interacting
const FILL_ALL = `(() => {
  const r1 = window.__fillLabel("First Name", "Shell");
  const r2 = window.__fillLabel("Last Name", "Demo");
  const r3 = window.__fillLabel("^Email$", ${JSON.stringify(email)});
  const r4 = window.__fillLabel("^Password$", ${JSON.stringify(password)});
  const r5 = window.__fillLabel("Confirm Password", ${JSON.stringify(password)});
  const c = document.querySelector('input[type="checkbox"]');
  if (c && !c.checked) c.click();
  return [r1,r2,r3,r4,r5].join(",") + "|cb=" + (c ? c.checked : "nocb");
})()`;
let onLogin = false;
for (let attempt = 0; attempt < 5 && !onLogin; attempt++) {
  const fillRes = await evalJs(FILL_ALL);
  await evalJs(`(() => { const b = document.querySelector('button[type="submit"]'); if (b) b.click(); return !!b; })()`);
  onLogin = await waitFor(async () => (await evalJs("location.pathname")).includes("/login"), 12000);
  if (!onLogin) console.log(`  (attempt ${attempt + 1}: fill=${fillRes} still on ${await evalJs("location.pathname")})`);
}
ok("Registration redirects to /login", onLogin, await evalJs("location.pathname").catch(() => "?"));
if (!onLogin) {
  const errTxt = await bodyText();
  console.log("  [DIAG] register page text:", errTxt.slice(0, 300).replace(/\n/g, " "));
}

// 4. Login
if (onLogin) {
  await sleep(800);
  await evalJs(`window.__fillLabel("^Email$|Email", ${JSON.stringify(email)})`);
  await evalJs(`window.__fillLabel("^Password$", ${JSON.stringify(password)})`);
  await evalJs(`(() => { const b = document.querySelector('button[type="submit"]'); if (b) b.click(); return !!b; })()`);
  const onDash = await waitFor(async () => (await evalJs("location.pathname")).includes("/dashboard"), 60000);
  ok("Login reaches dashboard", onDash, await evalJs("location.pathname").catch(() => "?"));
  const dashOk = await waitFor(async () => {
    const t = await bodyText();
    return t.length > 100 && !/sign in to your pcea connect account/i.test(t) && !/^PCEA Connect [SU] Home Worship Ministries Give Works More\s*$/i.test(t.replace(/\s+/g, " "));
  }, 20000);
  ok("Dashboard renders authenticated UI", dashOk, (await bodyText()).slice(0, 60).replace(/\n/g, " "));

  // 5. Authenticated routes (empty-state text counts as a valid render)
  for (const [route, needle] of [["/events", "event"], ["/livestream", "live"], ["/ministries", "ministr"], ["/works", "works"]]) {
    await goto(`${BASE}${route}`);
    await sleep(1200);
    // wait for content beyond the nav shell (nav-only body ≈ 60 chars)
    await waitFor(async () => (await bodyText()).replace(/\s+/g, " ").length > 90, 20000).catch(() => {});
    const txt = (await bodyText()).toLowerCase();
    const renders = txt.length > 50 && (txt.includes(needle) || /\bno (upcoming )?(events?|services?|recordings?|announcements?)\b/.test(txt) || txt.includes("nothing here yet"));
    ok(`Route ${route} renders`, renders, txt.slice(0, 50).replace(/\n/g, " "));
    ok(`Route ${route} mentions "${needle}"`, txt.includes(needle) || /\bno (upcoming )?(events?|services?|recordings?)\b/.test(txt), txt.slice(0, 50).replace(/\n/g, " "));
  }

  // 6. Session persists across reload
  await goto(`${BASE}/dashboard`);
  await evalJs("location.reload()");
  await sleep(3000);
  const stillIn = await waitFor(async () => (await evalJs("location.pathname")).includes("/dashboard"), 20000);
  ok("Session persists after reload", stillIn, await evalJs("location.pathname").catch(() => "?"));

  // 7. Logout — Sign out lives behind the "Account menu" button
  const openedMenu = await evalJs(`(() => {
    const m = [...document.querySelectorAll("button")].find(x => /account menu/i.test(x.innerText || x.getAttribute("aria-label") || ""));
    if (m) { m.click(); return true; } return false; })()`);
  await sleep(800);
  const clickedOut = openedMenu && await evalJs(`(() => {
    const b = [...document.querySelectorAll("button")].find(x => /sign out|log ?out/i.test(x.innerText));
    if (b) { b.click(); return true; } return false; })()`);
  if (clickedOut) {
    await sleep(2500);
    const out = await waitFor(async () => !(await evalJs("location.pathname")).includes("/dashboard"), 20000);
    ok("Logout works", out, await evalJs("location.pathname").catch(() => "?"));
  } else {
    console.log("[SKIP] account menu / sign out not found");
  }
}

console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
ws.close();
process.exit(fail ? 1 : 0);
