CREATE TABLE IF NOT EXISTS sermons (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255),
    description TEXT,
    preacher VARCHAR(255),
    scripture_ref VARCHAR(255),
    type VARCHAR(50),
    video_url VARCHAR(1000),
    thumbnail_url VARCHAR(1000),
    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_live BOOLEAN DEFAULT FALSE,
    views BIGINT DEFAULT 0,
    duration VARCHAR(50)
);
