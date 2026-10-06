# Communion Tracker — API Reference

All endpoints are JSON over `/api` (ApiResponse envelope: `success/message/data`, plus an optional machine-readable `code` on business-rule rejections — see the failure-codes table below). Auth = JWT bearer. Staff endpoints are gated `STAFF_OR_CLERK` and tenant-scoped by `TenantGuard` unless noted. 403 = cross-tenant or insufficient role; 400 = validation/lifecycle/business-rule rejection.

Base paths: staff/event endpoints under `/api/communion/**`; membership-card endpoints under `/api/membership-card/**`.

## Event lifecycle (staff)

| Method | Path | Notes |
|---|---|---|
| POST | `/api/communion/events` | Create event `{ serviceDate, serviceStartTime, serviceEndTime?, location? }` → status `DRAFT` |
| GET | `/api/communion/events` | List events for actor's congregation (with `recordedCount`) |
| GET | `/api/communion/events/{id}` | Single event |
| POST | `/api/communion/events/{id}/open` | `DRAFT → OPEN` (400 otherwise) |
| POST | `/api/communion/events/{id}/close` | `OPEN → CLOSED` (sets closedBy/closedAt) |
| POST | `/api/communion/events/{id}/cancel` | `DRAFT/OPEN → CANCELLED` |

CLOSED/CANCELLED events reject verify/record with **400**.

## Verification (read-only) and recording (explicit)

| Method | Path | Notes |
|---|---|---|
| POST | `/api/communion/events/{id}/verify` | Body `{ identityToken, method: "QR"\|"MEMBER_APP", idempotencyKey? }`. Read-only pipeline (12 steps, see architecture doc). Returns member identity + eligibility + previous-communion count and `requiresConfirmation: true`. **Does not record.** |
| POST | `/api/communion/events/{id}/records` | Explicit confirm `{ identityToken, method, idempotencyKey }`. Re-runs every check; idempotent on `idempotencyKey` (replay returns original record); duplicate → 400; race-safe via unique `active_slot`. Audits `COMMUNION_RECORD`. |
| GET | `/api/communion/events/{id}/records` | **Spec §19** — all records for one event (RECORDED + VOIDED), newest first, each with the resolved `memberName`. Staff of the event's congregation or SUPER_ADMIN; 403 otherwise. |
| POST | `/api/communion/events/{id}/records/manual` | Manual fallback `{ memberId, reason, note? }`. `reason` required; method = `MANUAL`; **all security checks still apply** (duplicate/eligibility/scope). Audited. |
| POST | `/api/communion/records/{recordId}/void` | Soft-void `{ reason }` (required). Frees the `active_slot` (member may be re-recorded). Both rows kept forever; audited `COMMUNION_VOIDED`. |
| GET | `/api/communion/events/{id}/report` | Recorded/voided/duplicates-blocked/attempt counts + method breakdown + congregation member count + **spec §33 additions**: `rejectedAttempts` (audit-derived), `pendingEligibility`, `restrictedMembers`, `suspendedMembers` |

## Eligibility (pastoral, independent of QR)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/communion/eligibility/self` | Any authenticated member. Defaults to `PENDING`; read never persists. |
| GET | `/api/communion/eligibility/{memberId}` | Staff |
| PUT | `/api/communion/eligibility/{memberId}` | Staff. Body `{ status, reason }`. Statuses: `ELIGIBLE / PENDING / RESTRICTED / SUSPENDED`. Audited `COMMUNION_ELIGIBILITY_CHANGED`. |

## Legacy + member routes (preserved from baseline)

| Method | Path | Notes |
|---|---|---|
| POST | `/api/communion/record` | Original congregation-wide record (staff) — **unchanged** |
| GET | `/api/communion/me` | Member's own communion history — **unchanged** |
| GET | `/api/communion/congregation` | Staff view — **unchanged** |

## Membership card / credential (extended, not replaced)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/membership-card` | Card payload; now includes `productName: "PCEA Church ID"` + `productNote`. Credential format unchanged: `MC1.<memberId>.<issuedAtEpochSec>.<hmac>` |
| POST | `/api/membership-card/{memberId}/revoke` | **NEW**, SUPER_ADMIN only. Disables the member account; credential stops verifying. Audits `IDENTITY_CREDENTIAL_REVOKED`. |

## Error semantics

| Condition | Result |
|---|---|
| Member calls staff endpoints (verify/record/events/eligibility PUT) | 403 |
| Elder of another congregation touches event/records | 403 (tenant guard) |
| Tampered/expired/unknown credential | 400 `Credential signature is invalid` / not found |
| Revoked (disabled account) credential | 400 |
| Event not OPEN | 400 |
| Already recorded for event | 400 (duplicate) |
| Eligibility ≠ ELIGIBLE (e.g. PENDING/SUSPENDED) | 400 |
| MANUAL via credential pipeline (method=MANUAL on verify/records) | 400 (MANUAL requires reason → manual endpoint) |
| Missing manual reason | 400 / UI-enforced |

## Machine-readable failure codes (spec §31 / STEP 12)

Business-rule rejections carry a stable `code` in the envelope (`{ success:false, message, data:null, code }`). The scanner UI keys off these so every failure state renders its distinct §31 message — never a generic error. Pastoral states (duplicate/pending/restricted/closed) show amber; security states (invalid/tampered/inactive/wrong congregation/unauthorized) show red.

| Code | Meaning | HTTP |
|---|---|---|
| `INVALID_CREDENTIAL` | Unknown/expired/malformed credential | 400 |
| `TAMPERED_CREDENTIAL` | Credential HMAC signature check failed | 400 |
| `INACTIVE_MEMBER` | Credential holder's account is disabled | 400 |
| `WRONG_CONGREGATION` | Member does not belong to the event's congregation | 400 |
| `PENDING_ELIGIBILITY` | Eligibility ≠ ELIGIBLE (pending or undecided) | 400 |
| `RESTRICTED_MEMBER` | RESTRICTED or SUSPENDED eligibility | 400 |
| `DUPLICATE_RECORD` | Already recorded for this event (pre-check or unique-slot race) | 400 |
| `EVENT_CLOSED` | Verify/record against a non-OPEN event | 400 |
| `REASON_REQUIRED` | Manual record without a reason | 400 |
| `UNAUTHORIZED` | Account disabled at credential verification | 400 |

Legacy string-only violations keep `code = null` — existing consumers see no shape change.

## Rate limits

`RateLimitingFilter` buckets: auth endpoints 10 req/min; **verify bucket 120 req/min** covering `/api/membership-card/verify` and `/api/communion/events/*/verify` (`security.rate-limit.verify-per-minute`). Test profile disables rate limiting.
