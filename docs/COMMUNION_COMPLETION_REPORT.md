# Communion Tracker — Completion Report

**Date:** 2026-10-06 · **Branch:** `release` · **HEAD:** `dd87d52` (unchanged — all work preserved as uncommitted session work; nothing reset, cleaned or rewritten)
**Nature:** integration & completion of the existing PCEA Connect system (module inside the app), NOT a rewrite. September 30 baseline preserved: member/elder/admin journeys, QR credential, member directory fix, audit log, RBAC, first-registrant SUPER_ADMIN removal.

---

## 1. CURRENT BASELINE (post-milestone, verified live)

| Area | Status |
|---|---|
| Backend :8090 (`local` profile, H2 in-mem) | UP — login probe behaves as expected (400 on empty POST) |
| Frontend :3000 | UP — `/communion`, `/communion/scanner`, `/communion/admin`, `/membership-card`, `/communication` all 200 |
| Backend tests | **62 tests, 0 failures, 1 skipped** (13 suites; was 51/0/1) |
| TypeScript `npx tsc --noEmit` | PASS (exit 0) |
| ESLint `npx eslint src` | PASS (exit 0) |
| Next build `npx next build` | PASS (exit 0; routes incl. `/communion`, `/communion/scanner`, `/communion/admin`, `/membership-card`) |
| Migrations | Flyway **V057** applied (`V057__communion_tracker.sql`, portable H2/PostgreSQL); test suite runs Flyway + `ddl-auto: validate` on H2 MODE=PostgreSQL → schema/entity parity proven |
| E2E Journeys 1–4 | **PASS** (see `COMMUNION_E2E.md` for captured evidence) |

## 2. CHANGES MADE (summary)

- **Event lifecycle:** `communion_events` + `DRAFT→OPEN→CLOSED / →CANCELLED` transitions, service-enforced; CLOSED/CANCELLED reject verification & recording.
- **Records:** `communion_records` extended (event_id, verification_method, status, verified_by/at, device_id, idempotency_key, void fields, `active_slot`); unique-per-event-member enforced portable across H2/PostgreSQL; soft-void with reason (never deleted).
- **Eligibility:** separate pastoral concept (ELIGIBLE/PENDING/RESTRICTED/SUSPENDED), independent of QR validity, audited changes, PENDING default, read-never-persists.
- **Verification pipeline:** read-only 12-step verify (identity→credential→member→scope→eligibility→duplicate) + **explicit record confirmation** (never auto-record), manual fallback (reason required, all checks apply), idempotency-key replay, race-safe duplicate rejection.
- **Identity-reader abstraction:** `IdentityReaderRegistry` with QR + MEMBER_APP readers delegating to the existing credential service; NFC returns explicit 400 (never faked).
- **Credential extension:** card payload "PCEA Church ID"; SUPER_ADMIN `POST /api/membership-card/{memberId}/revoke` (disables account, audited).
- **Rate limiting:** new verify bucket 120 req/min covering both credential-verify surfaces.
- **Frontend:** member communion page (history + eligibility), elder scanner (scan→verify→record→scan-next loop, manual dialog, NFC shown-but-disabled), communion admin (lifecycle, report, eligibility admin), nav entry, Church ID language.
- **Seed:** announcements (fixes empty News) + communion demo (CLOSED event w/ 2 manual records, OPEN event, eligibility for demo members); idempotent (fresh run historically "5 created, 26 skipped, 0 failed"; re-run post-journeys verified "7 created, 25 skipped, 0 failed", exit 0).

## 3. DATABASE CHANGES

- `V057__communion_tracker.sql`: `communion_events`, `communion_eligibility`, 11 ALTER columns on `communion_records`, 3 indexes (incl. unique `active_slot` + `uq_communion_records_idempotency`). Portable (H2 no partial indexes → slot-pattern instead of partial unique index).
- Migration verified by the Flyway-enabled test profile (`PostgresMigrationTest` suite green).

## 4. API CHANGES

See `COMMUNION_API.md` for full reference. New: events CRUD/lifecycle, `/verify`, `/records`, `/records/manual`, `/records/{id}/void`, `/report`, `/eligibility/self|{memberId}`, card `revoke`. Preserved verbatim: original `/api/communion/record|me|congregation` and all membership-card behavior.

## 5. UI CHANGES

Member: `/communion` page + nav entry ("Grow in Faith" section) + Church ID QR caption. Elder: `/communion/scanner` optimized for repeated use (auto-select OPEN event, verify→record→scan-next loop, big primary actions). Admin: `/communion/admin` (create/open/close/cancel, report panel, eligibility admin). `/membership-card` shows "PCEA Church ID".

## 6. SECURITY CHANGES

See `COMMUNION_SECURITY.md`. Member/staff 403 boundaries, cross-tenant 403s, tamper/revocation rejection, closed-event rejection, duplicate safety, rate limits, append-only audit (`COMMUNION_RECORD`, `COMMUNION_RECORD_MANUAL`, `COMMUNION_VOIDED`, `COMMUNION_ELIGIBILITY_CHANGED`, `COMMUNION_VERIFICATION_ATTEMPT`, `COMMUNION_DUPLICATE_BLOCKED`, `IDENTITY_CREDENTIAL_REVOKED`).

## 7. TEST RESULTS (exact)

| Suite | Result |
|---|---|
| Backend (Gradle `test`, 13 XML suites incl. new `CommunionTrackerIntegrationTest` with 11 tests) | **62 tests · 62 passed · 0 failed · 1 skipped** |
| TypeScript | PASS |
| ESLint | PASS |
| Next build | PASS |
| Migrations (Flyway test profile) | PASS |

New tests cover: lifecycle guards, verify→record→duplicate→idempotent replay, tampered/invalid credential, revoked credential, wrong congregation + cross-tenant elder 403, ineligible (PENDING) + suspended member, manual (reason required, MANUAL blocked on credential pipeline, duplicate, idempotent), void (frees slot, both rows kept), member RBAC 403s + own-record visibility. No existing tests removed or weakened.

## 8. E2E RESULTS (exact)

| Journey | Result |
|---|---|
| 1 — MEMBER (Grace) | **PASS** (login→Church ID→communion history→giving→news→logout) |
| 2 — ELDER (Kamau) | **PASS** (admin→scanner→verify→record QR→duplicate blocked→tamper rejected→manual MANUAL record→report→close event) |
| 3 — ADMIN | **PASS** (directory→events→report) |
| 4 — SECURITY (scripted) | **11 passed / 0 failed** (incl. revoke→verify 400) |
| 5 — SPEC-GAP (scripted) | **15 passed / 0 failed** (records list, §33 report fields, `TAMPERED_CREDENTIAL` envelope code) |

## 8b. SPEC-GAP CLOSURE (master-spec acceptance checklist)

Post-MVP audit against the master product/architecture/security specification closed the remaining gaps. Existing journeys and tests re-verified afterwards — nothing regressed.

| Spec ref | Gap | Resolution | Evidence |
|---|---|---|---|
| §34 | Lifecycle audit actions | Already present (CREATED / OPENED / CLOSED / CANCELLED, VERIFICATION_ATTEMPT, RECORDED, DUPLICATE_BLOCKED, VOIDED, ELIGIBILITY_CHANGED) | code audit — no change required |
| §31 / STEP 12 | Machine-readable failure codes | `CommunionErrorCodes` (10 codes) threaded through CommunionService + MemberCredentialService; `ApiResponse` gained optional `code`; scanner renders a distinct §31 message per code (amber = pastoral state, red = security state; network errors explicit) | spec-gap probes 15/0 incl. `TAMPERED_CREDENTIAL` asserted on the live envelope; tsc/eslint/build PASS |
| §19 | `GET /api/communion/events/{id}/records` | Implemented — newest-first list of RECORDED + VOIDED rows with batched `memberName` resolution (names shown, raw ids never), staff/tenant-gated | probes 15/0 incl. 401-when-unauthenticated and newest-first ordering |
| §33 | Report additions | `rejectedAttempts` (audit-derived REJECTED attempts), `pendingEligibility`, `restrictedMembers`, `suspendedMembers`; admin report grid displays all four + manual-record count | probes 15/0; live values > 0 against seeded demo states |
| §44 | Eligibility demo members | Seed adds Peter Otieno (`PENDING`) and Mary Achieng (`RESTRICTED`) idempotently, congregation-joined, staff-set eligibility | seed fresh-boot run: **51 created, 2 skipped, 0 failed** |
| §29 | Scanner Recent panel | Server-authorized Recent list on the scanner screen (member names, voided entries marked, refreshed after every successful record) | scanner page passes tsc/eslint; served by the new §19 endpoint |

Post-change regression gate: backend **62 tests / 0 failures / 1 skipped** · tsc PASS · eslint PASS · `next build` PASS · security probes **11/0** · spec-gap probes **15/0**.

## 9–11. STATUS SUMMARY

| Area | Status | Evidence / Why |
|---|---|---|
| Core Communion MVP (events, QR verify/record, eligibility, duplicates, manual, void, report, audit, boundaries) | **GREEN** | 62/0/1 backend tests; tsc/eslint/build PASS; V057; Journeys 1–4 PASS; live report counters observed |
| Seed & demo data | **GREEN** | Idempotent seed; fresh-boot run: 51 created, 2 skipped, 0 failed, exit 0 — now includes the §44 eligibility demo states (Peter Otieno PENDING, Mary Achieng RESTRICTED) alongside eligible Grace/Kamau, announcements, events and the CLOSED/OPEN communion pair |
| NFC | **YELLOW** | Abstraction + explicit 400 path implemented & documented; no NFC hardware in this environment — GREEN only after real device validation. Never faked. |
| Offline recording | **YELLOW (foundation only)** | Idempotency keys + duplicate-safe recording implemented & tested; PENDING_SYNC/SYNCING/SYNCED/FAILED/CONFLICT queue = next milestone. No offline claim. |
| Multi-congregation | **YELLOW** | Event congregation scoping + tenant guard enforced & tested; full multi-congregation administration workflow deferred (see below). |
| Sacrament requirements engine / confirmation records | **YELLOW** | Designed in `SACRAMENT_LIFECYCLE.md`; not implemented this milestone. |
| M-Pesa Daraja credentials, Bible translations licensing, DNS/TLS | **YELLOW (external, user-owned)** | Outside codebase; documented in deployment requirements. |
| RED items | **none** | No required MVP capability is missing/unimplemented. |

## 12. KNOWN LIMITATIONS

1. H2 in-memory on `local` → **every backend restart needs `node frontend/scripts/seed-demo.mjs`**.
2. Rate-limit counters are per-instance (in-memory); move to a shared store before horizontal scale-out.
3. Report "previous communion" counts and audit-derived counters are eventual (audit is best-effort by design — business action never blocked by audit failure).
4. Leftover demo artifacts: 3 CANCELLED "Probe Hall" events from security probes remain in the event list (harmless, lifecycle-terminated; fresh DB clears them).
5. NFC/Bluetooth hardware paths untested (no hardware).

## 13. DEPLOYMENT REQUIREMENTS

1. Apply Flyway migrations through **V057** on PostgreSQL (Flyway owns schema; `ddl-auto: validate`).
2. Set `APP_CREDENTIAL_SECRET` (secret for the credential HMAC) — distinct from `jwt.secret` in production.
3. Bootstrap admin remains **environment-gated** (`APP_BOOTSTRAP_ADMIN_EMAIL` etc.).
4. External/user-owned: M-Pesa Daraja keys, Bible translation licensing compliance, DNS + TLS termination.
5. Run seed only against demo environments.

## 14. NEXT ACTIONS

1. **Offline queue milestone:** PENDING_SYNC/SYNCING/SYNCED/FAILED/CONFLICT client store + conflict resolution on reconnect (idempotency foundation already live).
2. **NFC hardware milestone:** native reader behind `IdentityReaderRegistry`, device validation, then flip NFC status.
3. **Sacrament requirements engine** + confirmation records per `SACRAMENT_LIFECYCLE.md`.
4. **Multi-congregation administration** workflow + cross-site reporting.
5. Optional: dedicated audit-viewer UI for SUPER_ADMIN (append-only API + data exist).
