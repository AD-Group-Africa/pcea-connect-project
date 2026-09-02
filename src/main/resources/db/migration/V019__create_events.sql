CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50),
    location VARCHAR(255),
    organizer_id VARCHAR(255),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    max_attendees INT DEFAULT 0,
    requires_registration BOOLEAN DEFAULT FALSE,
    qr_check_in_enabled BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS event_registrations (
    id VARCHAR(255) PRIMARY KEY,
    event_id VARCHAR(255),
    user_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'REGISTERED',
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    attended_at TIMESTAMP,
    ticket_code VARCHAR(10),
    FOREIGN KEY (event_id) REFERENCES events(id)
);
