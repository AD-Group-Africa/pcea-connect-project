-- Event tenancy: events belong to the organizer's congregation.
-- Portable SQL: runs on both H2 (MODE=PostgreSQL, tests) and PostgreSQL (production).

ALTER TABLE events ADD COLUMN congregation_id VARCHAR(255) DEFAULT '' NOT NULL;

CREATE INDEX IF NOT EXISTS idx_events_congregation ON events(congregation_id);
