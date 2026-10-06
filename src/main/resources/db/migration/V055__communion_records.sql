-- Holy Communion participation records.
-- Deliberately minimal and pastoral-gated: date + congregation + recorder only.
-- Members can read their OWN record; recording is for authorized pastoral roles.
-- Portable SQL: runs on both H2 (MODE=PostgreSQL, tests) and PostgreSQL (production).

CREATE TABLE IF NOT EXISTS communion_records (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    congregation_id VARCHAR(255) NOT NULL,
    service_date DATE NOT NULL,
    note VARCHAR(500),
    recorded_by VARCHAR(255) NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_communion_user ON communion_records(user_id);
CREATE INDEX IF NOT EXISTS idx_communion_congregation ON communion_records(congregation_id);
