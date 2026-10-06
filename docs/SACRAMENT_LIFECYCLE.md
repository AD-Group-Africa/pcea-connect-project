# Sacrament Lifecycle — Design & Roadmap

**Scope of this phase:** Communion Tracker MVP only. This document defines the intended lifecycle and the configurable foundation — nothing theological is hard-coded into the application, and no large catechism/confirmation implementation was invented here.

## 1. Intended lifecycle

```
Membership (active, congregation-scoped)
   → Catechism enrolment (course per congregation/class)
   → Catechism completion (lessons + assessments)
   → Confirmation (pastoral rite, recorded once)
   → Communion eligibility (pastoral flag / future requirements engine)
   → Communion history (this milestone)
```

## 2. What already exists in PCEA Connect (reusable foundation)

The `catechism` module already provides (migrations through V048):

- `courses`, `modules`, `lessons` — teaching structure with `CATECHISM_TEACHER` role
- `enrollments`, `progress`, `assessments` — per-member learning records
- congregation scoping + authorization consistent with the rest of the system

**Decision:** do not rewrite or extend it in this milestone. Future work links catechism *completion events* to the eligibility/requirements layer below — not by auto-granting communion eligibility, but by surfacing completion as one (configurable) requirement.

## 3. What this milestone delivered

- `communion_eligibility` per member: `ELIGIBLE / PENDING / RESTRICTED / SUSPENDED`, note + set-by/set-at, audited changes (`COMMUNION_ELIGIBILITY_CHANGED`), defaults to PENDING, never persisted on read.
- Eligibility is deliberately **independent of QR validity** — identity ≠ communion standing.

## 4. Configurable sacrament requirements (next milestone design)

Per-congregation, admin-configurable requirement sets, e.g.:

```
sacrament_requirements
  id, congregation_id, sacrament ("COMMUNION"), requirement_key, required (bool), display_order
  requirement_key ∈ { ACTIVE_MEMBERSHIP, CONFIRMATION, CATECHISM_COMPLETION, AGE_MIN, BAPTISM, ... }
```

Semantics:
- Each congregation configures which requirements apply to `COMMUNION` (default template seeded per congregation, freely editable by authorized administrators).
- Requirement evaluation happens **in addition to** the pastoral `CommunionEligibility` flag — pastoral override always wins (a pastor may grant or restrict regardless of engine output).
- Every evaluation result and every configuration change is audited.
- The engine returns PENDING + missing-requirements list; the member-facing page shows what's outstanding (e.g. "Confirmation pending").

## 5. Confirmation records (next milestone design)

A small `confirmation_records` table (member, congregation, date, officiant, notes, audited) — enough to satisfy the CONFIRMATION requirement key. Intentionally minimal; full rites-of-passage module is out of scope.

## 6. Non-goals

- No theological workflow assumptions baked into code.
- No automatic eligibility changes from catechism progress.
- No new standalone app; everything remains inside `modules/` with the same auth/tenant/audit patterns.
