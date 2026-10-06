# Communion Tracker — Architecture

**Status:** implemented (MVP). Companion docs: `COMMUNION_API.md`, `COMMUNION_SECURITY.md`, `SACRAMENT_LIFECYCLE.md`, `COMMUNION_E2E.md`, `COMMUNION_COMPLETION_REPORT.md`.
**Baseline preserved:** branch `release`, HEAD `dd87d52`. Communion is a **module inside PCEA Connect** (`modules/communion/`), not a separate application. The September 30 membership-card / QR credential implementation is preserved and extended, never replaced.

---

## 1. Position in the stack

```
PCEA Connect
└── modules/communion/            ← this milestone
    ├── domain/                   CommunionEvent, CommunionEligibility, CommunionRecord
    ├── application/              CommunionService (record + lifecycle + eligibility + verify)
    ├── api/controller/           CommunionController
    ├── verification/             IdentityReaderRegistry (QR / MEMBER_APP; NFC absent by design)
    └── infrastructure/           repositories
        extends → modules/membership/ (credential, card payload)
        writes  → shared/audit/   (append-only AuditLog)
        schema  → V057__communion_tracker.sql
        UI      → frontend /communion, /communion/scanner, /communion/admin
```

Reused, unchanged: `MemberCredentialService` (HMAC-signed `MC1.<memberId>.<issuedAtEpochSec>.<hmac>`), ZXing QR rendering in backend, `TenantGuard`, `Roles`/`SecurityConfig`, `RateLimitingFilter` (extended, not replaced), `AuditService`.

---

## 2. Data model

### `communion_events` (entity `CommunionEvent`)
| Column | Notes |
|---|---|
| id, congregation_id, service_date, service_start_time, service_end_time, location, status, created_by, closed_by, closed_at, created_at, updated_at | lifecycle `DRAFT → OPEN → CLOSED`, or `DRAFT → CANCELLED` (open events may also be cancelled) |

### `communion_records` (entity `CommunionRecord`, V055 + V057 extension)
| Column | Notes |
|---|---|
| event_id, verification_method (NFC/QR/MANUAL/MEMBER_APP), status (RECORDED/VOIDED), verified_by, verified_at, device_id, idempotency_key, void_reason, voided_by, voided_at | historical rows are never deleted; corrections are voids |
| **active_slot** | H2 has no partial indexes, so instead of `UNIQUE(event_id, member_id) WHERE status='RECORDED'`, the active slot key `E:<eventId>|U:<memberId>` is written while a record is RECORDED and reset to the row id on void. Unique index on `active_slot` enforces one active record per member per event on both H2 and PostgreSQL. Voiding frees the slot and is fully audited. |
| **uq_communion_records_idempotency** | unique index on `idempotency_key` (NULL keys exempt) → safe retries |

### `communion_eligibility` (entity `CommunionEligibility`)
One row per user (`unique user_id`), status `ELIGIBLE / PENDING / RESTRICTED / SUSPENDED`, plus note, set-by/set-at. **Eligibility is deliberately independent of QR validity** — a valid credential proves identity, not communion standing. Reads default to `PENDING` and never persist on read.

---

## 3. Verification pipeline (read-only) + explicit confirmation

`POST /api/communion/events/{id}/verify` runs steps 1–12 **without writing a record**:

1. Authenticate actor (JWT)
2. Authorize actor (`STAFF_OR_CLERK` + tenant scope)
3. Resolve event · 4. Event must be `OPEN`
5. Resolve identity via `IdentityReaderRegistry` (method-tagged)
6. Verify credential HMAC signature + max-age
7. Resolve member · 8. Member must be active
9. Congregation scope match (member ↔ event congregation; elder tenant guard)
10. Eligibility must be `ELIGIBLE`
11. Duplicate check (active slot / RECORDED row for event+member)
12. Return verification result (member name, congregation, membership status, eligibility, previous-communion count) + explicit "requires confirmation" flag

Recording happens **only** on `POST /api/communion/events/{id}/records` (explicit confirm) or the manual endpoint. Recording re-runs all checks and never trusts the verify response. Duplicate inserts also race-safe: a `DataIntegrityViolationException` on the unique index is caught and audited as `COMMUNION_DUPLICATE_BLOCKED`. Retries with the same `idempotency_key` return the original record instead of creating a second row.

---

## 4. Identity-reader abstraction (NFC)

`IdentityReaderRegistry` exposes `IdentityReader` (resolve credential string → member identity, tagged with verification method). Implementations: `QrIdentityReader` and `MemberAppIdentityReader` (both delegate to the existing credential service). **NFC is intentionally absent** — `verifyForEvent` returns HTTP 400 "NFC verification is not available" rather than faking it. Hardware integration is a future milestone; see `COMMUNION_SECURITY.md` §NFC.

---

## 5. Event lifecycle & tenant scoping

- Lifecycle transitions are service-enforced (`openEvent/closeEvent/cancelEvent`): OPEN requires DRAFT→OPEN, CLOSE requires OPEN→CLOSED, CANCEL allowed from DRAFT/OPEN. CLOSED/CANCELLED events reject verify and record with 400.
- Every event carries `congregation_id`. All staff operations resolve the actor's congregation via `TenantGuard`; cross-congregation access yields 403 `TenantViolationException`. SUPER_ADMIN bypasses tenant scoping for administration.
- Reporting (`eventReport`) = live record counts + audit-derived counters (`COMMUNION_DUPLICATE_BLOCKED`, `COMMUNION_VERIFICATION_ATTEMPT`) + method breakdown.

---

## 6. Not claimed complete (honest statuses)

| Area | Status | Detail |
|---|---|---|
| NFC | **YELLOW** | Abstraction + documented 400 path only; no hardware in this environment. GREEN only after device validation. |
| Offline sync | **YELLOW (foundation only)** | Idempotency keys + duplicate-safe recording are in place; the PENDING_SYNC/SYNCING/SYNCED/FAILED/CONFLICT queue is the **next milestone**. No offline recording is claimed. |
| Multi-congregation | **YELLOW** | Every event is congregation-scoped and tenant-guarded (verified by tests + E2E probe), but full multi-congregation workflow (per-congregation admins managing many congregations, cross-site reporting) is deferred and documented in `COMMUNION_COMPLETION_REPORT.md`. |
| Sacrament requirements engine | **YELLOW** | Eligibility is a per-member pastoral flag, not yet a configurable requirements engine (see `SACRAMENT_LIFECYCLE.md`). |

Implementation details, wire formats and security controls: see `COMMUNION_API.md` and `COMMUNION_SECURITY.md`.
