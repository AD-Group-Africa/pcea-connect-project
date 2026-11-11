-- Guardian-managed child accounts.
-- A child account is created BY a guardian (never self-registered), starts unapproved,
-- and cannot sign in until the guardian approves it. Existing users stay ADULT/approved.
-- Portable SQL: runs on both H2 (MODE=PostgreSQL, tests) and PostgreSQL (production).

ALTER TABLE users ADD COLUMN account_type VARCHAR(50) DEFAULT 'ADULT' NOT NULL;
ALTER TABLE users ADD COLUMN guardian_id VARCHAR(255);
ALTER TABLE users ADD COLUMN guardian_approved BOOLEAN DEFAULT TRUE NOT NULL;
