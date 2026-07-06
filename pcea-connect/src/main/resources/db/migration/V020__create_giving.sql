CREATE TABLE IF NOT EXISTS contributions (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    type VARCHAR(50),
    amount DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'KES',
    method VARCHAR(50),
    transaction_ref VARCHAR(255),
    phone_number VARCHAR(20),
    description VARCHAR(255),
    congregation_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contribution_statements (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    year INT,
    total_amount DECIMAL(12,2),
    tithe_amount DECIMAL(12,2),
    offering_amount DECIMAL(12,2),
    donation_amount DECIMAL(12,2),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
