# Communion Tracker — Security

All controls below were **verified** by the integration suite (`CommunionTrackerIntegrationTest`, full suite 62 tests / 0 failures / 1 skipped) and by live Journey-4 security probes (11 PASS / 0 FAIL — see `COMMUNION_E2E.md`).

## 1. Identity credential (preserved & extended)

- Format `MC1.<memberId>.<issuedAtEpochSec>.<hmac>` — HMAC-SHA256 over memberId + issuedAt, key = `app.credential-secret` (fallback `jwt.secret`), max age 1095 days. **No PII in the QR payload** — only opaque member id + timestamp + signature.
- Rendering stays in-backend via ZXing (no external QR services, no hand-rolled encoder).
- `verify()` rejects: tampered signature, expired, unknown member, disabled (revoked) account.
- NEW: `POST /api/membership-card/{memberId}/revoke` (SUPER_ADMIN) disables the account and audits `IDENTITY_CREDENTIAL_REVOKED`; the credential then fails verification (probe-verified: revoke → 200, subsequent verify → 400).

## 2. Authorization boundaries

| Boundary | Control | Evidence |
|---|---|---|
| Member vs staff | `STAFF_OR_CLERK_SPEL` on all verify/record/event/eligibility-staff endpoints; member-only endpoints are `/api/communion/me`, `/eligibility/self`, `/membership-card` | probes: member verify → 403, member event list → 403; tests: member RBAC 403s |
| Cross-congregation | `TenantGuard` (`requireStaffOf`/`requireCongregationContext`) on every event/record path; every event row carries `congregation_id` | probe: cross-congregation elder → 403; test: wrong-congregation + cross-tenant elder 403 |
| SUPER_ADMIN | Bypasses tenant scope for event administration only | tested |
| Roles never collapsed | Existing `Roles.kt` registry + SpEL unchanged | Sept 30 audit preserved |

## 3. Recording integrity

- **Verify ≠ record.** The verify endpoint is read-only and returns `requiresConfirmation`; recording is a separate, explicit call that re-runs *all* checks (never trusts the verify response).
- **One active record per member per event** enforced by unique `active_slot` (`E:<eventId>|U:<memberId>` while RECORDED). Works on H2 (no partial indexes) and PostgreSQL.
- **Idempotency:** unique index on `idempotency_key`; same-key retries replay the original record instead of double-recording (protects against retries, timeouts, refresh, multiple elder devices).
- **Race-safe duplicates:** concurrent duplicates hit the unique index; `DataIntegrityViolationException` is caught, surfaced as 400 and audited `COMMUNION_DUPLICATE_BLOCKED`.
- **Manual fallback cannot bypass checks:** method is forced to `MANUAL`, reason required, all eligibility/duplicate/scope checks still run (browser-verified: manual attempt on already-recorded member → duplicate rejection).
- **No hard deletes:** correction = soft void with mandatory reason; void frees the slot, keeps both rows, audits `COMMUNION_VOIDED`.
- **Lifecycle protection:** CLOSED/CANCELLED events reject verify and record (probe: closed event → 400).

## 4. Eligibility is not QR validity

A valid signature proves *identity only*. Recording additionally requires `CommunionEligibility = ELIGIBLE` (statuses ELIGIBLE/PENDING/RESTRICTED/SUSPENDED; default PENDING, never persisted on read). Every eligibility change is audited `COMMUNION_ELIGIBILITY_CHANGED`.

## 5. Rate limiting

`RateLimitingFilter` (extended, not replaced): auth bucket 10 req/min; **verify bucket 120 req/min** (`security.rate-limit.verify-per-minute`) covering both credential-verification surfaces (`/api/membership-card/verify`, `/api/communion/events/*/verify`). Test profile disables it.

## 6. Audit trail (append-only)

Shared `AuditLog` (append-only, REQUIRES_NEW transaction — audit failure never blocks the business action). Communion actions audited:

`COMMUNION_RECORD` · `COMMUNION_RECORD_MANUAL` · `COMMUNION_VOIDED` · `COMMUNION_ELIGIBILITY_CHANGED` · `COMMUNION_VERIFICATION_ATTEMPT` (including REJECTED outcomes) · `COMMUNION_DUPLICATE_BLOCKED` · `IDENTITY_CREDENTIAL_REVOKED`.

No secrets, tokens, or pastoral note contents are written to audit detail.

## 7. NFC — deliberately absent (YELLOW)

There is no NFC reader hardware in this environment and no native NFC stack wired into the web app. The `IdentityReaderRegistry` abstraction exists so a native reader can be added behind the same domain boundary, and requests with `method=NFC` get an explicit HTTP 400 "NFC verification is not available". **NFC functionality is never faked.** GREEN requires actual device validation (per `DEEP_AUDIT_2026-09-30.md` execution-gate policy).

## 8. Known limitations

- Offline recording (PENDING_SYNC/SYNCING/SYNCED/FAILED/CONFLICT) is not implemented; idempotency keys are the foundation for the future offline queue (next milestone).
- Multi-congregation administration UX is deferred; tenant scoping itself is enforced and tested.
- Rate limits are per-instance (in-memory) — horizontal deployments should move counters to a shared store before scale-out.
