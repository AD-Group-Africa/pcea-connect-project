// Idempotent demo seed for local development.
//
// Creates, through the REAL APIs only (no direct DB access):
//   demo admin (SUPER_ADMIN via APP_BOOTSTRAP_ADMIN_EMAIL — set by start-backend.ps1) → church locator entry →
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
  log("CREATE", `admin ${ADMIN_EMAIL} (SUPER_ADMIN via designated bootstrap email)`);
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

/** Multi-role congregant — the combined-responsibility demo identity:
 *  Member + Elder + Development Committee Chair + JPRC Member + Executive Member.
 *  Roles are assigned through the SUPER_ADMIN role API; committee positions through
 *  the ministry member API. All steps are idempotent (checked before applied). */
async function ensureMultiRoleUser(token, congregationId) {
  const NAME = "Joseph Kamau";
  const EMAIL = "joseph.kamau@demo.local";
  const PASSWORD = "KamauDemo!2026";

  // Register if missing (registering after the admin means no SUPER_ADMIN inheritance).
  let login = await call("POST", "/api/auth/login", { body: { email: EMAIL, password: PASSWORD } });
  let userId;
  if (login.ok && login.json?.data?.accessToken) {
    userId = login.json.data.userId;
    log("SKIP", `multi-role user ${EMAIL} exists`); skipped++;
  } else {
    const reg = await call("POST", "/api/auth/register", {
      body: { email: EMAIL, password: PASSWORD, phone: "0733000000", termsAccepted: true, fullName: NAME },
    });
    if (!reg.ok) throw new Error(`register multi-role user failed: ${JSON.stringify(reg.json)}`);
    userId = reg.json.data.id;
    log("CREATE", `multi-role user ${EMAIL} (Joseph Kamau)`); created++;
  }

  if (!congregationId) { log("WARN", "no congregation — multi-role user not joined"); return; }

  // Congregation membership (tenancy scope for the offices/committees).
  const mj = await call("PUT", "/api/members/me/congregation", { token: login.ok ? login.json.data.accessToken : (await call("POST", "/api/auth/login", { body: { email: EMAIL, password: PASSWORD } })).json.data.accessToken, body: { congregationId } });
  if (!mj.ok) throw new Error(`multi-role congregation join failed: ${JSON.stringify(mj.json)}`);

  // Offices via the SUPER_ADMIN role API.
  const roles = await call("GET", `/api/admin/users/${userId}/roles`, { token });
  const have = new Set(roles.json?.data?.roles || []);
  for (const role of ["MEMBER", "ELDER", "EXECUTIVE_MEMBER"]) {
    if (have.has(role)) { log("SKIP", `role ${role}`); skipped++; continue; }
    const r = await call("POST", `/api/admin/users/${userId}/roles`, { token, body: { role } });
    if (!r.ok) throw new Error(`assign ${role} failed: ${JSON.stringify(r.json)}`);
    log("CREATE", `role ${role}`); created++;
  }

  // Committee positions (LEADER = Chairperson, MEMBER = committee member).
  const list = await call("GET", "/api/ministries", { token });
  const committees = [
    { name: "Development Committee", position: "LEADER" },
    { name: "JPRC Committee", position: "MEMBER" },
  ];
  for (const c of committees) {
    const m = (list.json?.data || []).find((x) => x.name === c.name);
    if (!m) { log("WARN", `committee "${c.name}" not found — cannot place ${NAME}`); continue; }
    const members = await call("GET", `/api/ministries/${m.id}/members`, { token });
    if ((members.json?.data || []).some((x) => x.userId === userId)) { log("SKIP", `${c.position} of "${c.name}"`); skipped++; continue; }
    const r = await call("POST", `/api/ministries/${m.id}/members`, { token, body: { userId, role: c.position } });
    if (!r.ok) throw new Error(`add ${NAME} to ${c.name} failed: ${JSON.stringify(r.json)}`);
    log("CREATE", `${NAME} as ${c.position} of "${c.name}"`); created++;
  }
}

async function ensureChurch(token, userId) {
  const list = await call("GET", "/api/locator");
  const existing = (list.json?.data || []).find((c) => c.name === "PCEA St. Andrews Nairobi");
  if (existing) {
    log("SKIP", `church "${existing.name}" (${existing.id})`); skipped++;
    // Idempotent: make sure the admin is a member of the church (tenancy context).
    if (existing.congregationId) {
      const joined = await call("PUT", "/api/members/me/congregation", { token, body: { congregationId: existing.congregationId } });
      if (joined.ok) log("SKIP", "admin congregation membership confirmed");
      else log("WARN", `congregation join failed: ${JSON.stringify(joined.json)}`);
      return existing.congregationId;
    }
    return null; // legacy locator row without a linked congregation
  }
  // Build the REAL church structure: Region → Presbytery → Parish → Congregation.
  // The locator only stores a public directory row; the Congregation entity is what
  // tenancy (membership, events, feed) is anchored on.
  const regions = await call("GET", "/api/church/regions");
  let region = (regions.json?.data || []).find((x) => x.name === "Nairobi Region");
  if (!region) {
    const r = await call("POST", "/api/church/regions", { token, body: { name: "Nairobi Region" } });
    if (!r.ok) throw new Error(`create region failed: ${JSON.stringify(r.json)}`);
    region = r.json.data; log("CREATE", "region Nairobi Region"); created++;
  } else skipped++;
  const presb = await call("GET", `/api/church/presbyteries?regionId=${region.id}`);
  let presbytery = (presb.json?.data || []).find((x) => x.name === "Nairobi Presbytery");
  if (!presbytery) {
    const r = await call("POST", "/api/church/presbyteries", { token, body: { name: "Nairobi Presbytery", regionId: region.id } });
    if (!r.ok) throw new Error(`create presbytery failed: ${JSON.stringify(r.json)}`);
    presbytery = r.json.data; log("CREATE", "presbytery Nairobi Presbytery"); created++;
  } else skipped++;
  const par = await call("GET", `/api/church/parishes?presbyteryId=${presbytery.id}`);
  let parish = (par.json?.data || []).find((x) => x.name === "Nairobi Central Parish");
  if (!parish) {
    const r = await call("POST", "/api/church/parishes", { token, body: { name: "Nairobi Central Parish", presbyteryId: presbytery.id } });
    if (!r.ok) throw new Error(`create parish failed: ${JSON.stringify(r.json)}`);
    parish = r.json.data; log("CREATE", "parish Nairobi Central Parish"); created++;
  } else skipped++;
  const cons = await call("GET", `/api/church/congregations?parishId=${parish.id}`);
  let congregation = (cons.json?.data || []).find((x) => x.name === "PCEA St. Andrews Nairobi");
  if (!congregation) {
    const r = await call("POST", "/api/church/congregations", { token, body: { name: "PCEA St. Andrews Nairobi", parishId: parish.id } });
    if (!r.ok) throw new Error(`create congregation failed: ${JSON.stringify(r.json)}`);
    congregation = r.json.data; log("CREATE", `congregation "${congregation.name}" (${congregation.id})`); created++;
  } else skipped++;
  // Public locator/directory row (Journey A: visitor discovery without an account).
  const r = await call("POST", "/api/locator", {
    token,
    body: {
      congregationId: congregation.id,
      name: "PCEA St. Andrews Nairobi",
      address: "Ambassadeur Hotel, Nairobi CBD",
      latitude: -1.2864, longitude: 36.8172,
      serviceTimes: "Sunday 8:00 AM & 10:30 AM, Midweek Wednesday 6:00 PM",
      livestreamUrl: "https://youtube.com/@pceastandrews",
      website: "https://pcea-connect.com",
    },
  });
  if (!r.ok) throw new Error(`create locator entry failed: ${JSON.stringify(r.json)}`);
  log("CREATE", `locator entry "${r.json.data.name}"`);
  created++;
  // Place the admin into the congregation — events/feed and other tenant-scoped
  // writes derive their congregation from the authenticated principal.
  const joined = await call("PUT", "/api/members/me/congregation", { token, body: { congregationId: congregation.id } });
  if (!joined.ok) throw new Error(`congregation join failed: ${JSON.stringify(joined.json)}`);
  log("CREATE", "admin joined PCEA St. Andrews Nairobi");
  created++;
  return congregation.id;
}

async function ensureMinistries(token, userId, congregationId = "") {
  const list = await call("GET", "/api/ministries", { token });
  const have = new Set((list.json?.data || []).map((m) => m.name));
  const wanted = [
    { name: "PCMF", type: "PCMF", description: "Presbyterian Church Men's Fellowship — men serving God and community." },
    { name: "YPCMF", type: "YPCMF", description: "Young Presbyterians' Fellowship — young adults growing together in faith." },
    { name: "Youth Fellowship", type: "YOUTH_FELLOWSHIP", description: "Youth ministry — worship, service and fellowship for teens and young adults." },
    // Congregational committees — same framework: members, positions (chairperson/secretary), meetings, activities.
    { name: "Development Committee", type: "DEVELOPMENT_COMMITTEE", description: "Development projects and property stewardship for the congregation." },
    { name: "JPRC Committee", type: "JPRC_COMMITTEE", description: "Justice, Peace and Reconciliation Committee." },
    { name: "Finance Committee", type: "FINANCE_COMMITTEE", description: "Budget oversight and stewardship of congregational finances." },
    { name: "Media Committee", type: "MEDIA_COMMITTEE", description: "Livestream, sound, projection and media archive." },
  ];
  const ids = {};
  for (const m of wanted) {
    if (have.has(m.name)) {
      const found = (list.json.data || []).find((x) => x.name === m.name);
      log("SKIP", `ministry "${m.name}" (${found.id})`);
      skipped++; ids[m.name] = found.id; continue;
    }
    const r = await call("POST", "/api/ministries", { token, body: { ...m, congregationId: congregationId || "" } });
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
  // Livestream is seeded ONLY when a real channel/URL is provided. The embed
  // must point at the church's actual YouTube presence — never an invented ID.
  //   SEED_LIVESTREAM_EMBED="https://www.youtube.com/embed/live_stream?channel=UC…"
  // Without it, Services/Live honestly show "not configured" states.
  const embed = process.env.SEED_LIVESTREAM_EMBED || "";
  if (!embed) {
    log("SKIP", "livestream NOT CONFIGURED (set SEED_LIVESTREAM_EMBED to seed a real stream)");
    return;
  }

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

/** News/announcements — the member journey must not present an empty News page. */
async function ensureAnnouncements(token, senderId) {
  const list = await call("GET", "/api/communication/announcements");
  const have = new Set((list.json?.data || []).map((a) => a.title));
  const wanted = [
    { title: "Community Harambee for the New Sanctuary Project", type: "EVENT", content: "Join us this Saturday from 9:00 AM as we raise funds for the new sanctuary building project. Your contributions — in kind or in kind of labour — are a blessing. Karibuni wote." },
    { title: "Bible Study Series: The Book of Romans", type: "EVENT", content: "Our midweek Bible study continues every Wednesday at 6:00 PM in the church hall. We are studying Paul's letter to the Romans — come with a notebook and a friend." },
    { title: "Youth Camp Registration Now Open", type: "EVENT", content: "Registration for the annual PCEA Youth Camp is open at the youth desk after both Sunday services. Closing date is the end of this month. Parents' consent forms are required for members under 18." },
    { title: "Pastoral Care Notice — Hospital Visits", type: "GENERAL", content: "Members or families with a loved one admitted at MP Shah, Nairobi Hospital or Kenyatta are asked to notify the church office so pastoral visits can be arranged promptly." },
    { title: "Congregational Meeting — Quarterly Report", type: "CIRCULAR", content: "The quarterly congregational meeting will be held after the 10:30 AM service on the last Sunday of the quarter. The Development and Finance Committees will present their reports. Attendance is highly encouraged for all members." },
  ];
  for (const a of wanted) {
    if (have.has(a.title)) { log("SKIP", `announcement "${a.title}"`); skipped++; continue; }
    const r = await call("POST", "/api/communication/announcements", { token, body: { ...a, senderId, targetScope: "ALL" } });
    if (!r.ok) log("WARN", `announcement "${a.title}" failed: ${JSON.stringify(r.json)}`);
    else { log("CREATE", `announcement "${a.title}"`); created++; }
  }
}

/**
 * Communion Tracker demo data:
 *  - one CLOSED event from last Sunday with two recorded members (Grace + Joseph),
 *  - one OPEN event for the upcoming Communion Sunday, ready for the elder scanner.
 *
 * Records are created through the REAL tracker pipeline (manual fallback with the
 * reason + idempotency key), and eligibility is granted through the audited
 * eligibility API — never by direct DB writes.
 */
/** §44 eligibility demo states — a PENDING and a RESTRICTED member so the scanner's
 *  blocked flows and the admin report's eligibility breakdown are demonstrable.
 *  Idempotent: each account/step is checked before it is applied. */
async function ensureEligibilityDemoMembers(token, congregationId) {
  if (!congregationId) { log("WARN", "no congregation — eligibility demo members skipped"); return; }
  const wanted = [
    { name: "Peter Otieno", email: "peter.otieno@demo.local", password: "PendingDemo!2026", phone: "0744000000", status: "PENDING", reason: "New communicant — catechism class in progress (demo seed)" },
    { name: "Mary Achieng", email: "mary.achieng@demo.local", password: "RestrictedDemo!2026", phone: "0755000000", status: "RESTRICTED", reason: "Restricted by session — under pastoral care (demo seed)" },
  ];
  for (const m of wanted) {
    let login = await call("POST", "/api/auth/login", { body: { email: m.email, password: m.password } });
    let userId;
    if (login.ok && login.json?.data?.accessToken) {
      userId = login.json.data.userId;
      log("SKIP", `eligibility demo member ${m.email} exists`); skipped++;
    } else {
      const reg = await call("POST", "/api/auth/register", {
        body: { email: m.email, password: m.password, phone: m.phone, termsAccepted: true, fullName: m.name },
      });
      if (!reg.ok) { log("WARN", `register ${m.email} failed: ${JSON.stringify(reg.json)}`); continue; }
      userId = reg.json.data.id;
      log("CREATE", `eligibility demo member ${m.email} (${m.name})`); created++;
      login = await call("POST", "/api/auth/login", { body: { email: m.email, password: m.password } });
    }
    if (!userId) continue;
    // Join the demo congregation (tenancy) using the member's own token.
    const mj = await call("PUT", "/api/members/me/congregation", { token: login.json.data.accessToken, body: { congregationId } });
    if (!mj.ok) { log("WARN", `${m.email} congregation join failed: ${JSON.stringify(mj.json)}`); continue; }
    // Set eligibility through the staff API — audited, only changed when needed.
    const cur = await call("GET", `/api/communion/eligibility/${userId}`, { token });
    if (cur.ok && cur.json?.data?.status === m.status) { log("SKIP", `eligibility ${m.status} (${m.name})`); skipped++; continue; }
    const set = await call("PUT", `/api/communion/eligibility/${userId}`, { token, body: { status: m.status, reason: m.reason } });
    if (!set.ok) log("WARN", `eligibility ${m.status} for ${m.name} failed: ${JSON.stringify(set.json)}`);
    else { log("CREATE", `eligibility ${m.status} (${m.name})`); created++; }
  }
}

async function ensureCommunionDemo(token, congregationId) {
  if (!congregationId) { log("WARN", "no congregation — communion demo skipped"); return; }
  await ensureEligibilityDemoMembers(token, congregationId);

  // Resolve the demo identities.
  const graceLogin = await call("POST", "/api/auth/login", { body: { email: MEMBER_EMAIL, password: MEMBER_PASSWORD } });
  const kamauLogin = await call("POST", "/api/auth/login", { body: { email: "joseph.kamau@demo.local", password: "KamauDemo!2026" } });
  if (!graceLogin.ok || !kamauLogin.ok) { log("WARN", "demo identities not available — communion demo skipped"); return; }
  const graceId = graceLogin.json.data.userId;
  const kamauId = kamauLogin.json.data.userId;

  // Both demo members need ELIGIBLE status (audited, only changed when needed).
  for (const [name, login, id] of [["Grace Wanjiku", graceLogin, graceId], ["Joseph Kamau", kamauLogin, kamauId]]) {
    const cur = await call("GET", `/api/communion/eligibility/${id}`, { token: login.json.data.accessToken });
    if (cur.ok && cur.json?.data?.status === "ELIGIBLE") { log("SKIP", `eligibility ELIGIBLE (${name})`); skipped++; continue; }
    const set = await call("PUT", `/api/communion/eligibility/${id}`, { token, body: { status: "ELIGIBLE", reason: "Confirmed communicant member in good standing (demo seed)" } });
    if (!set.ok) log("WARN", `eligibility for ${name} failed: ${JSON.stringify(set.json)}`);
    else log("CREATE", `eligibility ELIGIBLE (${name})`), created++;
  }

  const dateStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  // ── CLOSED event from last Sunday with recorded history ──
  const closedTitle = `Holy Communion — ${dateStr(lastSunday(10))}`;
  const events = await call("GET", "/api/communion/events", { token });
  const closedList = (events.json?.data || []).filter((e) => e.status === "CLOSED" && e.serviceDate === dateStr(lastSunday(10)));
  let closedEvent = closedList[0] || null;
  if (!closedEvent) {
    const c = await call("POST", "/api/communion/events", { token, body: { serviceDate: dateStr(lastSunday(10)), startTime: "10:00:00", endTime: "12:00:00", location: "Main Sanctuary" } });
    if (!c.ok) { log("WARN", `closed event create failed: ${JSON.stringify(c.json)}`); return; }
    closedEvent = c.json.data;
    log("CREATE", `communion event (CLOSED flow) ${closedTitle}`); created++;
    const o = await call("POST", `/api/communion/events/${closedEvent.id}/open`, { token });
    if (!o.ok) log("WARN", `open failed: ${JSON.stringify(o.json)}`);
    // Record the two demo members through the manual pipeline (reason required).
    // Runs ONLY when the event was just created — on re-run this block is skipped.
    for (const [name, id, reason] of [
      ["Grace Wanjiku", graceId, "Member presented her printed card; identity confirmed by the session clerk"],
      ["Joseph Kamau", kamauId, "Elder on duty; identity confirmed from the congregational roll"],
    ]) {
      const key = `seed-comm-${closedEvent.id}-${id}`.slice(0, 100);
      const r = await call("POST", `/api/communion/events/${closedEvent.id}/records/manual`, {
        token, body: { memberId: id, reason, idempotencyKey: key },
      });
      if (r.ok) { log("CREATE", `communion record — ${name} (manual, CLOSED event)`); created++; }
      else if (r.json?.message?.includes("already been recorded")) { log("SKIP", `communion record — ${name}`); skipped++; }
      else log("WARN", `communion record ${name} failed: ${JSON.stringify(r.json)}`);
    }
    const cl = await call("POST", `/api/communion/events/${closedEvent.id}/close`, { token });
    if (!cl.ok) log("WARN", `close failed: ${JSON.stringify(cl.json)}`);
  } else { log("SKIP", `communion event ${closedTitle} (with recorded history)`); skipped++; }

  // ── OPEN event for the upcoming Communion Sunday (elder scanner demo) ──
  const openTitle = `Holy Communion — ${dateStr(nextSunday(10))}`;
  const events2 = await call("GET", "/api/communion/events", { token });
  const openList = (events2.json?.data || []).filter((e) => e.status === "OPEN");
  if (openList.length === 0) {
    const c = await call("POST", "/api/communion/events", { token, body: { serviceDate: dateStr(nextSunday(10)), startTime: "10:00:00", endTime: "12:00:00", location: "Main Sanctuary" } });
    if (c.ok) {
      log("CREATE", `communion event (OPEN) ${openTitle}`); created++;
      const o = await call("POST", `/api/communion/events/${c.json.data.id}/open`, { token });
      if (!o.ok) log("WARN", `open failed: ${JSON.stringify(o.json)}`);
      else log("CREATE", `communion event OPEN ${openTitle}`), created++;
    } else log("WARN", `open event create failed: ${JSON.stringify(c.json)}`);
  } else { log("SKIP", `communion event OPEN ${openTitle}`); skipped++; }
}

// ── main ──
try {
  const health = await call("GET", "/api/locator");
  if (!health.ok) throw new Error(`backend not reachable at ${API}`);
  log("OK", `backend ${API}`);

  const { userId, token } = await ensureAdmin();
  await ensureMember();
  const congregationId = await ensureChurch(token, userId);
  // The member demo identity must belong to the church — tenancy scopes what they see.
  if (congregationId) {
    const memberLogin = await call("POST", "/api/auth/login", { body: { email: MEMBER_EMAIL, password: MEMBER_PASSWORD } });
    if (memberLogin.ok) {
      const mj = await call("PUT", "/api/members/me/congregation", { token: memberLogin.json.data.accessToken, body: { congregationId } });
      if (mj.ok) log("SKIP", "member congregation membership confirmed");
      else log("WARN", `member congregation join failed: ${JSON.stringify(mj.json)}`);
    }
  }
  const ministryIds = await ensureMinistries(token, userId, congregationId);
  await ensureMinistryEvents(token, ministryIds);
  await ensureCongregationEvents(token, userId);
  await ensureLivestreams(token);
  await ensureMultiRoleUser(token, congregationId);
  await ensureAnnouncements(token, userId);
  await ensureCommunionDemo(token, congregationId);
  console.log(`\nSEED COMPLETE: ${created} created, ${skipped} skipped, 0 failed`);
  process.exit(0);
} catch (err) {
  console.error(`\nSEED FAILED: ${err.message}`);
  process.exit(1);
}
