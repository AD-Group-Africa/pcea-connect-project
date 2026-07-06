CREATE TABLE IF NOT EXISTS feed_posts (
    id VARCHAR(255) PRIMARY KEY,
    author_id VARCHAR(255),
    content TEXT,
    media_url VARCHAR(1000),
    type VARCHAR(50),
    congregation_id VARCHAR(255),
    ministry_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    likes INT DEFAULT 0,
    loves INT DEFAULT 0,
    prays INT DEFAULT 0,
    amens INT DEFAULT 0
);
CREATE TABLE IF NOT EXISTS feed_reactions (
    id VARCHAR(255) PRIMARY KEY,
    post_id VARCHAR(255),
    user_id VARCHAR(255),
    type VARCHAR(50)
);
CREATE TABLE IF NOT EXISTS feed_comments (
    id VARCHAR(255) PRIMARY KEY,
    post_id VARCHAR(255),
    user_id VARCHAR(255),
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
