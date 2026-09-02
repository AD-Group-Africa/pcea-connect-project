CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    token VARCHAR(500),
    expiry_date TIMESTAMP,
    used BOOLEAN DEFAULT FALSE
);
