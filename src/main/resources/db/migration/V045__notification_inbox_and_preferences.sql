-- Notification inbox, preferences and congregation/ministry fan-out
CREATE TABLE IF NOT EXISTS user_notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body VARCHAR(1000) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    reference_type VARCHAR(50),
    reference_id VARCHAR(36),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL
);
CREATE INDEX idx_user_notifications_user ON user_notifications(user_id, created_at);

CREATE TABLE IF NOT EXISTS notification_preferences (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    channel VARCHAR(20) NOT NULL DEFAULT 'IN_APP',   -- IN_APP, PUSH, EMAIL, SMS
    category VARCHAR(50) NOT NULL,                   -- WORSHIP, EVENTS, MINISTRY, GIVING, PASTORAL, CHILDREN, NEWS, GENERAL
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL
);
CREATE UNIQUE INDEX idx_notif_prefs_user_channel_cat ON notification_preferences(user_id, channel, category);

CREATE TABLE IF NOT EXISTS notification_targets (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body VARCHAR(1000) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    created_at TIMESTAMP NOT NULL
);