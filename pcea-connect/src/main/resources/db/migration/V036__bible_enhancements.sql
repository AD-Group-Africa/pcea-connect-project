CREATE TABLE IF NOT EXISTS bible_reading_streaks (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    date DATE
);
ALTER TABLE bible_verses ADD COLUMN IF NOT EXISTS audio_url VARCHAR(1000);
