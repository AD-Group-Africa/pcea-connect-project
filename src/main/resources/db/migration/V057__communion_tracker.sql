-- V057: Communion Tracker — event lifecycle, eligibility, record verification.
-- Portable SQL: runs on H2 (MODE=PostgreSQL, tests) and PostgreSQL (production).
-- Existing communion_records rows keep working: legacy rows have NULL event_id and
-- the extension columns are defaulted or nullable.

CREATE TABLE IF NOT EXISTS communion_events (
    id VARCHAR(255) PRIMARY KEY,
    congregation_id VARCHAR(255) NOT NULL,
    service_date DATE NOT NULL,
    service_start_time TIME,
    service_end_time TIME,
    location VARCHAR(200),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_by VARCHAR(255) NOT NULL,
    closed_by VARCHAR(255),
    closed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_communion_events_congregation ON communion_events(congregation_id);

-- Separate communion eligibility: deliberately NOT derived from QR credential
-- validity. Unknown members default to PENDING (conservative).
CREATE TABLE IF NOT EXISTS communion_eligibility (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    reason VARCHAR(500),
    updated_by VARCHAR(255),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_communion_eligibility_user ON communion_eligibility(user_id);

ALTER TABLE communion_records ADD COLUMN IF NOT EXISTS event_id VARCHAR(255);
ALTER TABLE communion_records ADD COLUMN IF NOT EXISTS verification_method VARCHAR(20) NOT NULL DEFAULT 'MANUAL';
ALTER TABLE communion_records ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'RECORDED';
ALTER TABLE communion_records ADD COLUMN IF NOT EXISTS verified_by VARCHAR(255);
ALTER TABLE communion_records ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;
ALTER TABLE communion_records ADD COLUMN IF NOT EXISTS device_id VARCHAR(120);
ALTER TABLE communion_records ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100);
ALTER TABLE communion_records ADD COLUMN IF NOT EXISTS void_reason VARCHAR(300);
ALTER TABLE communion_records ADD COLUMN IF NOT EXISTS voided_by VARCHAR(255);
ALTER TABLE communion_records ADD COLUMN IF NOT EXISTS voided_at TIMESTAMP;
-- Portable "one ACTIVE record per member per event" enforcement (H2 has no partial
-- indexes): application sets active_slot = 'E:<eventId>|U:<userId>' while the record
-- is RECORDED and back to its own id when VOIDED, so voiding frees the slot.
ALTER TABLE communion_records ADD COLUMN IF NOT EXISTS active_slot VARCHAR(600);
UPDATE communion_records SET active_slot = id WHERE active_slot IS NULL;

CREATE INDEX IF NOT EXISTS idx_communion_records_event ON communion_records(event_id);
-- Idempotency: one record per client-supplied key. NULL keys (legacy/manual rows)
-- do not participate in the constraint (NULLs are distinct in unique indexes).
CREATE UNIQUE INDEX IF NOT EXISTS uq_communion_records_idempotency ON communion_records(idempotency_key);
CREATE UNIQUE INDEX IF NOT EXISTS uq_communion_records_active_slot ON communion_records(active_slot);
