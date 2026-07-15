CREATE TABLE IF NOT EXISTS small_groups (
    id VARCHAR(255) PRIMARY KEY, name VARCHAR(255), description TEXT, congregation_id VARCHAR(255),
    leader_id VARCHAR(255), meeting_day VARCHAR(50), meeting_time VARCHAR(50), location VARCHAR(255), active BOOLEAN DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS committees (
    id VARCHAR(255) PRIMARY KEY, name VARCHAR(255), description TEXT, congregation_id VARCHAR(255),
    chairperson_id VARCHAR(255), meeting_frequency VARCHAR(50), active BOOLEAN DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS visitors (
    id VARCHAR(255) PRIMARY KEY, full_name VARCHAR(255), phone VARCHAR(50), email VARCHAR(255),
    visit_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, purpose TEXT, congregation_id VARCHAR(255),
    followed_up BOOLEAN DEFAULT FALSE
);
