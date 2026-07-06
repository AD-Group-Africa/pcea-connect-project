ALTER TABLE sermons ADD COLUMN IF NOT EXISTS audio_url VARCHAR(1000);
ALTER TABLE sermons ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'SERMON';

CREATE TABLE IF NOT EXISTS media_playlists (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    description TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS media_playlist_items (
    id VARCHAR(255) PRIMARY KEY,
    playlist_id VARCHAR(255),
    sermon_id VARCHAR(255),
    position INT DEFAULT 0
);
