-- Ministry-scoped announcements — allows each ministry to communicate with its members
-- without polluting the main congregation feed. Uses the shared Ministry framework.
CREATE TABLE IF NOT EXISTS ministry_announcements (
    id VARCHAR(255) PRIMARY KEY,
    ministry_id VARCHAR(255),
    title VARCHAR(500) NOT NULL,
    content TEXT,
    author_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    pinned BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (ministry_id) REFERENCES ministries(id)
);
CREATE INDEX IF NOT EXISTS idx_ministry_announcements_ministry_id ON ministry_announcements(ministry_id);
