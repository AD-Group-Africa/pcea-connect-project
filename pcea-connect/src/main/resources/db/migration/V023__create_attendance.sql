CREATE TABLE IF NOT EXISTS attendance_records (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    type VARCHAR(50),
    reference_id VARCHAR(255),
    date DATE NOT NULL,
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    status VARCHAR(50) DEFAULT 'PRESENT',
    congregation_id VARCHAR(255),
    notes TEXT
);
