# Communion Tracker — E2E Evidence

**Environment:** backend :8090 (local profile, H2 in-mem, seeded), frontend :3000. Date: 2026-10-06. Branch `release`, HEAD `dd87d52`.

**Result: Journeys 1–4 all PASS.** Journey 4 via automated probe script (11 PASS / 0 FAIL); Journeys 1–3 executed in-browser with captured evidence below.

---

## Journey 4 — SECURITY (automated, `.freebuff/communion-e2e-probes.mjs`)

```
PASS  member card issues signed credential
PASS  member attempts staff verification -> 403
PASS  member attempts event list -> 403
PASS  tampered QR -> 400
PASS  valid QR -> 200
PASS  seed has one CLOSED and one OPEN event
PASS  closed event rejects verification -> 400
PASS  re-recording already-recorded member fails -> 400
PASS  cross-congregation elder -> 403 (tenant guard)
PASS  revoke credential -> 200
PASS  revoked credential verify -> 400

SECURITY PROBES: 11 passed, 0 failed
```

## Journey 5 — SPEC-GAP CLOSURE (automated, `.freebuff/spec-gap-probe.mjs`)

Re-run after the master-spec gap work (§19 records list, §33 report additions, STEP 12 codes) against the restarted, re-seeded backend:

```
PASS  admin login
PASS  events: OPEN + CLOSED present
PASS  GET /events/{id}/records -> 200 list
PASS  records carry resolved memberName
PASS  records newest-first
PASS  records endpoint requires auth -> 401/403
PASS  report -> 200
PASS  report rejectedAttempts present
PASS  report pendingEligibility present
PASS  report restrictedMembers present
PASS  report suspendedMembers present
PASS  report eligibility counts > 0 (demo members seeded)
PASS  report manual records counted
PASS  tampered QR -> 400 with TAMPERED_CREDENTIAL code
PASS  unauthenticated verify -> 401/403

SPEC-GAP PROBES: 15 passed, 0 failed
```

## Journey 1 — MEMBER (Grace Wanjiku, `grace.wanjiku@demo.local`)

| Step | Route/Action | Evidence |
|---|---|---|
| Login | /login → Sign In | redirect to /dashboard; `localStorage.token` set; user "Grace Wanjiku" |
| Church ID | /membership-card | "PCEA Church ID" badge, congregation "PCEA St. Andrews Nairobi", QR image, caption "Your Church ID — present this QR for membership and communion verification" |
| Sacraments / Communion history | /communion | Eligibility badge **ELIGIBLE** ("Confirmed communicant member in good standing (demo seed)"), counter "1 Communion services attended", "Most recent Oct 4, 2026", history entry "Sun, October 4, 2026 · MANUAL · Manual entry — Member presented her printed card…" |
| Giving | /giving | Renders (Confirmed 2026, Tithes/Offerings/Donations 0 KES, empty-state copy) |
| News | /communication | 5 seeded announcements render incl. em-dash content (empty-News defect fixed) |
| Logout | Account menu → Sign out | `localStorage.token` cleared, redirected to /login |

**PASS**

## Journey 2 — ELDER (Joseph Kamau, MEMBER+ELDER+EXECUTIVE_MEMBER)

| Step | Evidence |
|---|---|
| Login → /communion/admin | events list visible to elder; 3 leftover DRAFT probe events **cancelled via UI** (each transition DRAFT→CANCELLED verified live — extra lifecycle evidence) |
| Scanner /communion/scanner | event picker: only the OPEN event (Oct 11) clickable; CLOSED/CANCELLED disabled; OPEN auto-select → SCAN phase |
| Verify Grace's credential (paste) | **Member Verified** panel: Grace Wanjiku · PCEA St. Andrews Nairobi · Membership: ACTIVE · Communion: ELIGIBLE · Previous communion: 1 |
| Record Communion | **✓ Communion Recorded · Method: QR** |
| Scan same member again | **Cannot Record — "This member has already been recorded for this event"** (duplicate prevention in UI) |
| Tampered credential (signature byte flipped) | rejected: **"Credential signature is invalid"**, scanner stays usable |
| Manual fallback | Search Member → dialog; Grace selected + reason → **rejected as duplicate** (manual cannot bypass checks ✓); then Joseph Kamau + reason → **Communion Recorded · Method: MANUAL** |
| Report | /communion/admin → Oct 11 report: **2 Recorded · 0 Voided · 1 Duplicates blocked · 3 Congregation members · NFC 0 / QR 1 / MANUAL 1 / MEMBER_APP 0 · Verification attempts (audit log): 3** |
| Close event | Oct 11 → **CLOSED**; 0 OPEN events remain; scanner picker then offers no selectable event |

**PASS**

## Journey 3 — ADMIN (`pcea-admin@demo.local`, SUPER_ADMIN)

| Step | Evidence |
|---|---|
| Login → /members | member directory renders (6 members, statuses, congregation) |
| /communion/admin | sees both CLOSED events (Oct 11: 2 recorded · Oct 4: 2 recorded) + CANCELLED probe events |
| Report (Oct 11) | same counters as Journey 2 (2 recorded / 1 duplicates blocked / 3 attempts) |
| Audit | append-only audit trail has **no public UI by design** (protected write path via `AuditService`); audit evidence surfaced through report's "Verification attempts (audit log)" counter + integration tests asserting audit rows |

**PASS**

---

## Post-journey state (live, verified)

- Events: Oct 4 **CLOSED** (2 recorded), Oct 11 **CLOSED** (2 recorded: Grace QR + Kamau MANUAL), 3 CANCELLED probe events.
- Seed (`node frontend/scripts/seed-demo.mjs`) is idempotent (verified live post-journeys: "7 created, 25 skipped, 0 failed", exit 0 — skipped existing records and re-provisioned exactly one OPEN event after Journey 2 closed it). Fresh DB → backend restart → seed → all journeys reproducible.

## Re-run instructions

```bash
# backend (new terminal)  .freebuff/start-backend.ps1     # then wait for login probe 400
curl --noproxy '*' -X POST http://localhost:8090/api/auth/login   # 400 = up
node frontend/scripts/seed-demo.mjs
# frontend (new terminal) cd frontend && npm run dev
node .freebuff/communion-e2e-probes.mjs                  # expect 11 passed, 0 failed
```
