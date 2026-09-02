CREATE TABLE IF NOT EXISTS livestreams (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255),
    description TEXT,
    preacher VARCHAR(255),
    scripture_ref VARCHAR(255),
    platform VARCHAR(50),
    embed_url VARCHAR(1000),
    thumbnail_url VARCHAR(1000),
    scheduled_at TIMESTAMP,
    status VARCHAR(50),
    ended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
