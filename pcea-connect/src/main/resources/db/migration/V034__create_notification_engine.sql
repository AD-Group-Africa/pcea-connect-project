CREATE TABLE IF NOT EXISTS device_tokens (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    token VARCHAR(500),
    platform VARCHAR(50)
);
CREATE TABLE IF NOT EXISTS scheduled_notifications (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255),
    body TEXT,
    target_type VARCHAR(50),
    target_id VARCHAR(255),
    channel VARCHAR(50),
    scheduled_at TIMESTAMP,
    sent BOOLEAN DEFAULT FALSE
);
CREATE TABLE IF NOT EXISTS notification_logs (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255),
    body TEXT,
    recipient_id VARCHAR(255),
    channel VARCHAR(50),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'SENT'
);
