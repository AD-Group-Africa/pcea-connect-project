CREATE TABLE IF NOT EXISTS ministries (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    type VARCHAR(50),
    description TEXT,
    congregation_id VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ministry_members (
    id VARCHAR(255) PRIMARY KEY,
    ministry_id VARCHAR(255),
    user_id VARCHAR(255),
    role VARCHAR(50),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ministry_id) REFERENCES ministries(id)
);

CREATE TABLE IF NOT EXISTS ministry_events (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255),
    description TEXT,
    ministry_id VARCHAR(255),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    location VARCHAR(255),
    FOREIGN KEY (ministry_id) REFERENCES ministries(id)
);

CREATE TABLE IF NOT EXISTS ministry_projects (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    description TEXT,
    ministry_id VARCHAR(255),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'PLANNING',
    FOREIGN KEY (ministry_id) REFERENCES ministries(id)
);
