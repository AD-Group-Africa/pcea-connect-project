DROP TABLE IF EXISTS contribution_statements;
CREATE TABLE contribution_statements (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    statement_year INT,
    total_amount DECIMAL(12,2),
    tithe_amount DECIMAL(12,2),
    offering_amount DECIMAL(12,2),
    donation_amount DECIMAL(12,2),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
