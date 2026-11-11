-- Feed moderation + reporting (PCEA Church App hardening).
-- Portable SQL: runs on both H2 (MODE=PostgreSQL, tests) and PostgreSQL (production).

ALTER TABLE feed_posts ADD COLUMN status VARCHAR(50) DEFAULT 'ACTIVE' NOT NULL;
ALTER TABLE feed_posts ADD COLUMN visibility VARCHAR(50) DEFAULT 'CONGREGATION' NOT NULL;
ALTER TABLE feed_posts ADD COLUMN reported_at TIMESTAMP;
ALTER TABLE feed_posts ADD COLUMN moderated_by VARCHAR(255);
ALTER TABLE feed_posts ADD COLUMN moderated_at TIMESTAMP;

CREATE TABLE IF NOT EXISTS feed_post_reports (
    id VARCHAR(255) PRIMARY KEY,
    post_id VARCHAR(255) NOT NULL,
    reporter_id VARCHAR(255) NOT NULL,
    reason VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_feed_post_reports_post ON feed_post_reports(post_id);
