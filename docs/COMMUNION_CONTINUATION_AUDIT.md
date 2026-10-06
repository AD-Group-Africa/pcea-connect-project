# Communion Continuation Audit — PCEA Connect

**Date:** 2026-10-05
**Branch:** `release` · **HEAD:** `dd87d52` (unchanged, accumulated uncommitted session work preserved)
**Purpose:** Discovery audit before Communion Tracker implementation. **No code was changed during this audit.**
**Predecessor:** `docs/DEEP_AUDIT_2026-09-30.md` (deep audit + execution-gate addendum, all preserved).

---

## 1. What already exists (system baseline)

### Runtime & build
| Item | Status |
|---|---|
| Backend | Spring Boot (Kotlin), port 8090, `local` profile = H2 in-memory (`jdbc:h2:mem:pceaconnect`) |
| Frontend | Next.js dev server port 3000, `npm run dev` |
| Baseline tests | 51 tests, 0 failures, 1 skipped (`BUILD SUCCESSFUL`, gradle `test` task) |
| Frontend gates | `npx tsc --noEmit` PASS · `npx eslint src` PASS · `npx next build` PASS (per Sept 30 report) |
| Migrations | Flyway V015 → **V056** (36 SQL files in `db/migration/`, plus Postgres-only `db/migration-postgresql/`) |
| Seed | `frontend/scripts/seed-demo.mjs` — idempotent, API-only (no direct DB writes), 36 created / 1 skipped on fresh DB |

### Profile/schema mechanics (important implementation constraint)
- **`local` profile:** `--spring.flyway.enabled=false`, Hibernate `ddl-auto` creates schema from entities. Communion/eligibility **entity changes take effect immediately** in local dev.
- **`test` profile:** Flyway **enabled** on H2 (`MODE=PostgreSQL`), `ddl-auto: validate`. Any new entity **must** have a matching migration or the whole suite fails validation. Portable SQL only (runs on H2-in-Postgres-mode *and* PostgreSQL).
- **Production:** Flyway owns schema, `ddl-auto: validate`. Next free migration number is **V057**.

### Auth & security (verified during Sept 30 execution gate)
- JWT bearer in `Authorization` header; roles claim mapped to authorities by `JwtAuthFilter`; `Authentication.name` = userId.
- `SecurityConfig` (`config/SecurityConfig.kt`): stateless, CSRF off, `@EnableMethodSecurity`, `anyRequest().authenticated()`, permitAll only for `/api/auth/**`, `/api/locator/**`, `/api/health`, mpesa callback path.
- `Roles.kt`: role registry + SpEL constants — `STAFF_OR_CLERK_SPEL`, `STAFF_SPEL`, `PASTORAL_SPEL`, `FINANCE_SPEL`, `MEDIA_SPEL`; helpers `isStaff/isFinance/isPastoral/isMedia`; `CONGREGATION_OFFICES` = ADMIN, SUPER_ADMIN, ELDER, CLERK, PASTOR, MINISTER, SECRETARY.
- `TenantGuard.kt` (shared/security): `congregationOf`, `requireMember(userId, resourceCongregationId)`, `requireStaffOf(userId, resourceCongregationId)`, `requireCongregationContext(userId)`. Throws `TenantViolationException` → 403 via `GlobalExceptionHandler`.
- `RateLimitingFilter` already exists: 10 req/min per IP on `/api/auth/login` + `/api/auth/register`, `security.rate-limit.enabled` flag (false in tests). **It is a plain servlet `@Component` filter — path hard-coded, not yet applied to credential verification.** Extension point: add the verify path(s) to its guard condition.
- Bootstrap admin: only `app.bootstrap-admin-email` (env `APP_BOOTSTRAP_ADMIN_EMAIL`, set by `.freebuff/start-backend.ps1` to `pcea-admin@demo.local`) receives SUPER_ADMIN at registration. First-registrant rule removed.
- `AbstractIntegrationTest`: shared H2 context, `registerUser(emailPrefix)`, `admin()` (claims SUPER_ADMIN directly via `userRepo` then re-logins), `assertForbidden`, `postRaw/getRaw`. Test users get NO congregation and NO staff roles by default — congregation/roles must be assigned via admin API in tests.

### Membership / credential (the foundation to preserve)
- `MemberCredentialService` (membership/application): issues `MC1.<memberId>.<issuedAtEpochSec>.<hmac>` — HMAC-SHA256 over `MC1|memberId|issuedAt` with `app.credential-secret` (falls back to `jwt.secret`), unpadded base64url; max age `app.credential-max-age-days` (default 1095d). `verify()` checks format → HMAC (constant-time) → age → user exists → `user.enabled`. **QR rendering is in-backend ZXing** (`com.google.zxing:core:3.5.3` in build.gradle.kts), PNG data URI, EC level M. No PII in payload, no external services.
- `MembershipCardController` (`/api/membership-card`): GET returns card map incl. `credential` + `qrCode`; POST `/verify` gated `@PreAuthorize(Roles.STAFF_OR_CLERK_SPEL)` — reveals only directory-grade fields (memberId, fullName, congregationName). Tampered signature → 400; member scanning → 403 (verified live Sept 30).
- `MemberProfileBootstrap`: persists `MemberProfile` via `EntityManager` (NOT `repo.save()` — Spring Data `merge()` crashes on assigned `@MapsId` id, HHH000099). `updateProfile` is an upsert.
- `User` entity: `enabled` flag, `roles` ElementCollection, `congregation` ManyToOne (`users.congregation_id`), `accountType` ADULT/CHILD, `guardianApproved` gate for children. **No dedicated "membership status" column — "active" = `enabled == true`.**

### Communion domain today (all of it)
- `V055__communion_records.sql`: table `communion_records(id, user_id, congregation_id, service_date, note(500), recorded_by, recorded_at)` + 2 indexes. Deliberately minimal.
- `CommunionRecord` entity matches 1:1.
- `CommunionService.record(recorderId, memberId, serviceDate, note)`: resolves the member, **congregation is always the member's own** (client cannot choose), `tenantGuard.requireMember(recorderId, congregationId)`, saves, audits `COMMUNION_RECORD`. Note content deliberately NOT logged.
- `CommunionService.myRecords` / `congregationRecords(callerId)` (scoped via `requireCongregationContext`).
- `CommunionController` (`/api/communion`): POST `/records` (`PASTORAL_SPEL`), GET `/me` (any auth), GET `/records` (`PASTORAL_SPEL`, congregation-scoped).
- Repository: 3 finder methods.
- **There is NO frontend communion page/route** (`grep -ri communion frontend/src` → 0 matches). Members have no Communion history UI yet.

### Audit
- `AuditLog.kt`: entity `audit_log` (V056), `AuditLogRepository`, `AuditService.record(actorId, action, entityType, entityId, detail, actorRoles)` — REQUIRES_NEW, swallow-failure, 500-char caps. Wired into: payment finalize, role assign/revoke, communion record.
- Audit probe script: `.freebuff/audit-probes.mjs`.

### Catechism (relevant to sacrament lifecycle)
- `V048__create_catechism.sql`: courses/modules/lessons/enrollments/progress/assessments — a **reusable learning structure already exists**, explicitly non-prescriptive about confirmation criteria. `CATECHISM_TEACHER` role exists. Frontend has a `/catechism` page (modified in working tree).

### Communication / News
- `Announcement` entity (`announcements` table): title, content(3000), type CIRCULAR/EVENT/EMERGENCY/GENERAL, senderId, targetScope, publishedAt, expiresAt.
- `CommunicationController`: POST `/api/communication/announcements` (`STAFF_SPEL`), GET `/api/communication/announcements` (public-to-auth, optional `scopes` CSV filter). **Seed script creates zero announcements → News page shows empty states** (known gap).

### Working tree
~95 modified + ~30 untracked files of accumulated uncommitted session work on `release` @ `dd87d52`. **Must be preserved; no wholesale staging/cleaning.** CRLF warnings are benign.

---

## 2. What the previous phase implemented (must remain intact)
1. Member directory populated (V040 profiles + `ensureProfilesForAll()` on `GET /api/members`).
2. Self-hosted ZXing QR on the membership card (browser-verified rendering).
3. HMAC credential verify: valid → 200, tampered → 400, member → 403.
4. Bootstrap-admin env gating; first-registrant SUPER_ADMIN removed.
5. Append-only audit log wired into giving, roles, communion.
6. All 13 existing test suites green; 3 browser journeys (member Grace, elder Kamau incl. committee roster + leadership tools, admin incl. members directory) PASS.

## 3. What Communion functionality already exists
- Record-only flow: pastoral role records participation for a member with a service date; member can list own records; congregation-scoped read for pastoral roles; audit row per record. Nothing else — no events, eligibility, verification, duplicate prevention, reports, or UI.

## 4. What is missing (Communion MVP gap list)
1. **`communion_events`** — no entity/table/service/controller; no DRAFT→OPEN→CLOSED/CANCELLED lifecycle; no "no recording against CLOSED/CANCELLED" rule.
2. **Records extension** — no `event_id`, no `verification_method` (NFC/QR/MANUAL/MEMBER_APP), no `status` (RECORDED/VOIDED), no `verified_by/at`, no `device_id`, no `UNIQUE(event_id, member_id)`, no soft-void with reason, no idempotency key.
3. **Eligibility entity** — nothing; statuses ELIGIBLE/PENDING/RESTRICTED/SUSPENDED absent; no audited administrative changes.
4. **Verification pipeline** — no 2-step verify→confirm flow; no actor/event/credential/member/scope/eligibility/duplicate ordering; no auto-record guard (current `POST /records` is a direct record, acceptable as the MANUAL path but needs event integration + reason).
5. **IdentityReader abstraction** — none; QR path goes through `MemberCredentialService` directly. NFC not supported (no hardware) — must be abstraction + documentation, never faked.
6. **Elder scanner UX** — no frontend communion screens at all (member history, elder scanner, admin events/reports all missing).
7. **Audit actions** — only `COMMUNION_RECORD` exists. Missing: `COMMUNION_VERIFICATION_ATTEMPT`, `COMMUNION_RECORDED`, `COMMUNION_DUPLICATE_BLOCKED`, `COMMUNION_VOIDED`, `COMMUNION_ELIGIBILITY_CHANGED`, `COMMUNION_EVENT_OPENED/CLOSED/CANCELLED`, `IDENTITY_CREDENTIAL_REVOKED`.
8. **Reporting** — no event-level report; no export.
9. **Offline** — nothing; must be idempotency-foundation + honest documentation (no fake sync states).
10. **Rate limiting** on credential verification — filter exists but doesn't cover the verify paths.
11. **Seed** — no announcements, no communion demo history.
12. **Docs** — none of the 7 target documents exist yet.
13. **Tests** — no communion-specific integration suites.
14. **Sacrament requirements config** — nothing configurable; catechism tables exist but are not connected to communion.

## 5. What can be reused as-is
- `MemberCredentialService.issue/verify/qrDataUri` — the credential core. The communion verify step will call `credentials.verify(token)` unchanged.
- `TenantGuard` — event scope + elder scoping use `requireStaffOf` / `requireMember` / `requireCongregationContext`.
- `AuditService.record` — all new communion events go through it (REQUIRES_NEW + swallow already correct).
- `Roles.STAFF_OR_CLERK_SPEL` / `CONGREGATION_OFFICES` / `isStaff` — event management and scanner authorization.
- `RateLimitingFilter` pattern — extend the path guard for verify endpoints.
- `AbstractIntegrationTest` harness — new suites slot in beside the 13 existing ones.
- `seed-demo.mjs` architecture (API-only, idempotent ensure* steps) — add announcements + communion steps in the same style.
- `GlobalExceptionHandler` mappings — BusinessRule→400, TenantViolation→403, AccessDenied→403 already correct for the new pipeline.
- ZXing dependency + QR rendering (never hand-rolled, never external).

## 6. What must be extended (not rewritten)
- `communion_records` (V055 table + entity): ADD columns `event_id, verification_method, status, verified_by, verified_at, device_id, idempotency_key` (+ UNIQUE(event_id, member_id)). Keep `user_id, congregation_id, service_date, note, recorded_by, recorded_at` — the existing pastoral record flow remains the MANUAL method's data path.
- `CommunionService`: add event lifecycle, verification pipeline, duplicate/eligibility checks, voiding; keep `record()` semantics for MANUAL (gained: event linkage + reason + method=MANUAL).
- `CommunionController`: add event + verify + void + report routes; keep existing 3 routes untouched (frontend/API compatibility).
- `MembershipCardController` / membership card UI: add "PCEA Church ID" product language; do not alter credential format or verification.
- `RateLimitingFilter`: add credential-verify paths to the rate-limited set.
- `seed-demo.mjs`: add announcements + communion event/history steps.
- `AuditService` call sites: new action constants only.

## 7. What should NOT be rewritten
- The signed credential format (`MC1.…`) and HMAC verification — verified secure and live.
- ZXing-based QR rendering.
- `TenantGuard`, `Roles`, `JwtAuthFilter`, `SecurityConfig` authorization stack.
- `AuditService` (append-only, REQUIRES_NEW).
- The existing `/api/communion` routes and their response shapes (used by existing tests; additive evolution only).
- `MemberProfileBootstrap` persistence mechanics (EntityManager pattern).
- The 13 existing test suites and 3 browser journeys.
- The overall modular structure (`modules/<domain>/{api,application,domain,infrastructure}`) — Communion additions follow the same layout.

## 8. Design decisions locked in by this audit
- **DB evolution:** every entity change ships with a Flyway migration (V057+) because the test profile runs `ddl-auto: validate` against Flyway-built schema. Portable SQL (H2 PostgreSQL-mode compatible, no PL/pgSQL).
- **Pipeline:** verify (read-only, returns verification result) and record (mutating, requires explicit confirmation + idempotency key) are separate endpoints — a scan never auto-records.
- **Eligibility:** separate entity, never derived from QR validity; every admin change audited with reason.
- **NFC:** `IdentityReader` abstraction with QR functional and NFC a documented interface stub — status YELLOW until hardware validation.
- **Offline:** implement idempotency keys + duplicate-safe recording now; full offline sync states documented as the next milestone unless trivially supported.
- **Multi-congregation:** every event carries `congregation_id`; all access TenantGuard-scoped; remaining multi-congregation work documented, not faked.

## 9. Verification status of this audit
- Baseline `gradlew test`: **BUILD SUCCESSFUL** (up-to-date; recorded 51/0/1 from the last full execution).
- Backend re-started on :8090 (login probe 400 = up), seed re-run (36 created, 1 skipped), frontend :3000 responding (200).
- All claims above read directly from source files on HEAD `dd87d52` working tree.
