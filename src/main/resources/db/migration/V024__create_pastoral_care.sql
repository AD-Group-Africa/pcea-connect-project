CREATE TABLE IF NOT EXISTS prayer_requests (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    request TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'SUBMITTED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    prayed_by VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS pastoral_visits (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    type VARCHAR(50),
    visitor_id VARCHAR(255),
    scheduled_at TIMESTAMP,
    completed_at TIMESTAMP,
    notes TEXT,
    follow_up_needed BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS pastoral_tasks (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255),
    description TEXT,
    assigned_to VARCHAR(255),
    priority VARCHAR(50) DEFAULT 'MEDIUM',
    status VARCHAR(50) DEFAULT 'PENDING',
    due_date TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
