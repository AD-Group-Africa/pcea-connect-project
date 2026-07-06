CREATE TABLE IF NOT EXISTS bible_books (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    testament VARCHAR(50),
    order_index INT
);
CREATE TABLE IF NOT EXISTS bible_verses (
    id VARCHAR(255) PRIMARY KEY,
    book_id VARCHAR(255),
    chapter INT,
    verse INT,
    text TEXT,
    translation VARCHAR(50)
);
CREATE TABLE IF NOT EXISTS bible_bookmarks (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    book_id VARCHAR(255),
    chapter INT,
    verse INT,
    label VARCHAR(255)
);
CREATE TABLE IF NOT EXISTS bible_highlights (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    verse_id VARCHAR(255),
    color VARCHAR(10)
);
CREATE TABLE IF NOT EXISTS bible_notes (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    verse_id VARCHAR(255),
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS bible_reading_plans (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    description TEXT,
    days INT
);
CREATE TABLE IF NOT EXISTS bible_reading_plan_days (
    id VARCHAR(255) PRIMARY KEY,
    plan_id VARCHAR(255),
    day_number INT,
    book_id VARCHAR(255),
    start_chapter INT,
    end_chapter INT
);
CREATE TABLE IF NOT EXISTS bible_user_reading_progress (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    plan_id VARCHAR(255),
    current_day INT,
    completed BOOLEAN DEFAULT FALSE
);
CREATE TABLE IF NOT EXISTS bible_devotionals (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255),
    verse_ref VARCHAR(255),
    content TEXT,
    author VARCHAR(255),
    date DATE
);
