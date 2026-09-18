// Idempotent demo seed for local development.
//
// Creates, through the REAL APIs only (no direct DB access):
//   demo admin (SUPER_ADMIN as first user) → church locator entry →
//   three ministries (PCMF, YPCMF, Youth Fellowship) + membership →
//   ministry events → congregation events (published) →
//   livestream: one SCHEDULED (next Sunday) + one ENDED (past, with embed).
//
// Re-running is safe: each step checks whether the entity already exists and
// skips it. A fresh (empty) backend is fully seeded; a partially seeded one
// is topped up.
//
// Usage:  node scripts/seed-demo.mjs
// Env:    SEED_API_URL (default http://localhost:8090)
//         SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD (local demo only — these
//         credentials exist only in the local in-memory database)

const API = (process.env.SEED_API_URL || "http://localhost:8090").replace(/\/+$/, "");
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "pcea-admin@demo.local";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "PceaDemo!2026";
const ADMIN_NAME = "Demo Admin";

let created = 0, skipped = 0, failed = 0;
function log(kind, msg) { console.log(`[${kind}] ${msg}`); }

async function call(method, path, { token, body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* non-JSON */ }
  return { status: res.status, ok: res.ok && json?.success !== false, json };
}

function nextSunday(hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7)); // upcoming Sunday
  d.setHours(hour, 0, 0, 0);
  return d;
}
function lastSunday(hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() - (d.getDay() % 7 || 7));
  d.setHours(hour, 0, 0, 0);
  return d;
}
const ldt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:00`;

async function ensureAdmin() {
  const login = await call("POST", "/api/auth/login", { body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
  if (login.ok && login.json?.data?.accessToken) {
    log("SKIP", `admin ${ADMIN_EMAIL} already exists`);
    skipped++;
    return { userId: login.json.data.userId, token: login.json.data.accessToken };
  }
  const reg = await call("POST", "/api/auth/register", {
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, phone: "0712000000", termsAccepted: true, fullName: ADMIN_NAME },
  });
  if (!reg.ok) throw new Error(`register admin failed: ${JSON.stringify(reg.json)}`);
  log("CREATE", `admin ${ADMIN_EMAIL} (first user → SUPER_ADMIN)`);
  created++;
  const login2 = await call("POST", "/api/auth/login", { body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
  if (!login2.ok) throw new Error("login after register failed");
  return { userId: login2.json.data.userId, token: login2.json.data.accessToken };
}

const MEMBER_EMAIL = process.env.SEED_MEMBER_EMAIL || "grace.wanjiku@demo.local";
const MEMBER_PASSWORD = process.env.SEED_MEMBER_PASSWORD || "MemberDemo!2026";

/** Ordinary MEMBER account — the primary demo identity. Registered (not first user),
 *  so the backend assigns MEMBER; no admin rights are ever granted here. */
async function ensureMember() {
  const login = await call("POST", "/api/auth/login", { body: { email: MEMBER_EMAIL, password: MEMBER_PASSWORD } });
  if (login.ok && login.json?.data?.accessToken) { log("SKIP", `member ${MEMBER_EMAIL} already exists`); skipped++; return; }
  const reg = await call("POST", "/api/auth/register", {
    body: { email: MEMBER_EMAIL, password: MEMBER_PASSWORD, phone: "0722000000", termsAccepted: true, fullName: "Grace Wanjiku" },
  });
  if (!reg.ok) throw new Error(`register member failed: ${JSON.stringify(reg.json)}`);
  log("CREATE", `member ${MEMBER_EMAIL} (MEMBER role — primary demo identity)`);
  created++;
}

async function ensureChurch(token) {
  const list = await call("GET", "/api/locator");
  const existing = (list.json?.data || []).find((c) => c.name === "PCEA St. Andrews Nairobi");
  if (existing) { log("SKIP", `church "${existing.name}" (${existing.id})`); skipped++; return existing.id; }
  const r = await call("POST", "/api/locator", {
    token,
    body: {
      congregationId: "",
      name: "PCEA St. Andrews Nairobi",
      address: "Ambassadeur Hotel, Nairobi CBD",
      latitude: -1.2864, longitude: 36.8172,
      serviceTimes: "Sunday 8:00 AM & 10:30 AM, Midweek Wednesday 6:00 PM",
      livestreamUrl: "https://youtube.com/@pceastandrews",
      website: "https://pcea-connect.com",
    },
  });
  if (!r.ok) throw new Error(`create church failed: ${JSON.stringify(r.json)}`);
  log("CREATE", `church "${r.json.data.name}" (${r.json.data.id})`);
  created++;
  return r.json.data.id;
}

async function ensureMinistries(token, userId) {
  const list = await call("GET", "/api/ministries", { token });
  const have = new Set((list.json?.data || []).map((m) => m.name));
  const wanted = [
    { name: "PCMF", type: "PCMF", description: "Presbyterian Church Men's Fellowship — men serving God and community." },
    { name: "YPCMF", type: "YPCMF", description: "Young Presbyterians' Fellowship — young adults growing together in faith." },
    { name: "Youth Fellowship", type: "YOUTH_FELLOWSHIP", description: "Youth ministry — worship, service and fellowship for teens and young adults." },
  ];
  const ids = {};
  for (const m of wanted) {
    if (have.has(m.name)) {
      const found = (list.json.data || []).find((x) => x.name === m.name);
      log("SKIP", `ministry "${m.name}" (${found.id})`);
      skipped++; ids[m.name] = found.id; continue;
    }
    const r = await call("POST", "/api/ministries", { token, body: { ...m, congregationId: "" } });
    if (!r.ok) throw new Error(`create ministry ${m.name} failed: ${JSON.stringify(r.json)}`);
    log("CREATE", `ministry "${m.name}" (${r.json.data.id})`);
    created++; ids[m.name] = r.json.data.id;
    const mem = await call("POST", `/api/ministries/${ids[m.name]}/members`, { token, body: { userId, role: "LEADER" } });
    if (!mem.ok) log("WARN", `add admin as ${m.name} leader failed: ${JSON.stringify(mem.json)}`);
    else log("CREATE", `admin as LEADER of "${m.name}"`), created++;
  }
  return ids;
}

async function ensureMinistryEvents(token, ministryIds) {
  const plan = [
    { ministry: "PCMF", title: "PCMF Monthly Meeting", description: "Fellowship, planning and the study of the Word.", startTime: nextSunday(14), location: "Church Hall" },
    { ministry: "Youth Fellowship", title: "Youth Bible Study", description: "Weekly Bible study and open discussion.", startTime: nextSunday(16), location: "Youth Room" },
    { ministry: "YPCMF", title: "YPCMF Planning Session", description: "Quarterly programme planning.", startTime: lastSunday(15), location: "Library" },
  ];
  for (const e of plan) {
    const id = ministryIds[e.ministry];
    const list = await call("GET", `/api/ministries/${id}/events`, { token });
    if ((list.json?.data || []).some((x) => x.title === e.title)) { log("SKIP", `ministry event "${e.title}"`); skipped++; continue; }
    const r = await call("POST", `/api/ministries/${id}/events`, {
      token, body: { title: e.title, description: e.description, startTime: ldt(e.startTime), location: e.location },
    });
    if (!r.ok) log("WARN", `ministry event "${e.title}" failed: ${JSON.stringify(r.json)}`);
    else { log("CREATE", `ministry event "${e.title}"`); created++; }
  }
}

async function ensureCongregationEvents(token, organizerId) {
  const list = await call("GET", "/api/events", { token });
  const have = new Set((list.json?.data || []).map((e) => e.title));
  const wanted = [
    { title: "Sunday Worship Service", description: "Weekly congregational worship with Holy Communion on first Sundays.", type: "SUNDAY_SERVICE", location: "Main Sanctuary", startTime: nextSunday(9), requiresRegistration: false },
    { title: "Youth Concert & Praise Night", description: "An evening of praise, worship and talent from our youth.", type: "FELLOWSHIP", location: "Main Sanctuary", startTime: nextSunday(18), requiresRegistration: true, maxAttendees: 200 },
    { title: "Community Outreach — Nairobi CBD", description: "Evangelism and community service in the city centre.", type: "OTHER", location: "Nairobi CBD", startTime: lastSunday(9), requiresRegistration: false },
  ];
  for (const e of wanted) {
    if (have.has(e.title)) { log("SKIP", `event "${e.title}"`); skipped++; continue; }
    const r = await call("POST", "/api/events", {
      token,
      body: {
        title: e.title, description: e.description, type: e.type, location: e.location,
        organizerId, startTime: ldt(e.startTime), maxAttendees: e.maxAttendees || 0,
        requiresRegistration: !!e.requiresRegistration,
      },
    });
    if (!r.ok) { log("WARN", `event "${e.title}" failed: ${JSON.stringify(r.json)}`); continue; }
    log("CREATE", `event "${e.title}" (${r.json.data.id})`);
    created++;
    const p = await call("PUT", `/api/events/${r.json.data.id}/publish`, { token });
    if (!p.ok) log("WARN", `publish "${e.title}" failed: ${JSON.stringify(p.json)}`);
    else log("CREATE", `published "${e.title}"`), created++;
  }
}

async function ensureLivestreams(token) {
  const list = await call("GET", "/api/livestream", { token });
  const have = new Set((list.json?.data || []).map((s) => s.title));
  const embed = "https://www.youtube.com/embed/live_stream?channel=UCjXfkj5ip4z9O4tox0Zm5wA";

  if (!have.has("Sunday Service — Live Broadcast")) {
    const r = await call("POST", "/api/livestream", {
      token,
      body: {
        title: "Sunday Service — Live Broadcast",
        description: "Join the 10:30 AM service live, wherever you are.",
        preacher: "Rev. Moderators Desk",
        platform: "YOUTUBE", embedUrl: embed, scheduledAt: ldt(nextSunday(10)),
      },
    });
    if (!r.ok) log("WARN", `scheduled stream failed: ${JSON.stringify(r.json)}`);
    else { log("CREATE", "livestream SCHEDULED (next Sunday 10:00)"); created++; }
  } else { log("SKIP", "livestream SCHEDULED"); skipped++; }

  if (!have.has("Previous Service — Last Sunday")) {
    const r = await call("POST", "/api/livestream", {
      token,
      body: {
        title: "Previous Service — Last Sunday",
        description: "Missed last Sunday? Watch the recording.",
        preacher: "Rev. Moderators Desk",
        platform: "YOUTUBE", embedUrl: embed, scheduledAt: ldt(lastSunday(10)),
      },
    });
    if (!r.ok) { log("WARN", `past stream schedule failed: ${JSON.stringify(r.json)}`); }
    else {
      log("CREATE", "livestream (past) scheduled");
      created++;
      const id = r.json.data.id;
      const g = await call("PUT", `/api/livestream/${id}/go-live`, { token });
      if (!g.ok) log("WARN", `go-live failed: ${JSON.stringify(g.json)}`);
      const e = await call("PUT", `/api/livestream/${id}/end`, { token });
      if (!e.ok) log("WARN", `end failed: ${JSON.stringify(e.json)}`);
      else log("CREATE", "livestream ENDED (appears under Previous Services)"), created++;
    }
  } else { log("SKIP", "livestream past"); skipped++; }
}

// ── main ──
try {
  const health = await call("GET", "/api/locator");
  if (!health.ok) throw new Error(`backend not reachable at ${API}`);
  log("OK", `backend ${API}`);

  const { userId, token } = await ensureAdmin();
  await ensureMember();
  await ensureChurch(token);
  const ministryIds = await ensureMinistries(token, userId);
  await ensureMinistryEvents(token, ministryIds);
  await ensureCongregationEvents(token, userId);
  await ensureLivestreams(token);
  console.log(`\nSEED COMPLETE: ${created} created, ${skipped} skipped, 0 failed`);
  process.exit(0);
} catch (err) {
  console.error(`\nSEED FAILED: ${err.message}`);
  process.exit(1);
}
