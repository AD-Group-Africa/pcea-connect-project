-- Ministry join requests: members ask to join a ministry; ministry leaders approve.
-- Portable SQL: runs on both H2 (MODE=PostgreSQL, tests) and PostgreSQL (production).

CREATE TABLE IF NOT EXISTS ministry_join_requests (
    id VARCHAR(255) PRIMARY KEY,
    ministry_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING' NOT NULL,
    message VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    decided_by VARCHAR(255),
    decided_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mjr_ministry ON ministry_join_requests(ministry_id);
CREATE INDEX IF NOT EXISTS idx_mjr_user ON ministry_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_mjr_status ON ministry_join_requests(status);
