-- Worship services and digital bulletins
CREATE TABLE IF NOT EXISTS church_services (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    service_date DATE NOT NULL,
    service_time TIME NOT NULL,
    congregation_id VARCHAR(36),
    service_type VARCHAR(50) NOT NULL DEFAULT 'SUNDAY_WORSHIP',
    preacher_name VARCHAR(255),
    preacher_user_id VARCHAR(36),
    sermon_id VARCHAR(36),
    theme VARCHAR(255),
    scripture_ref VARCHAR(255),
    worship_team VARCHAR(255),
    order_of_service TEXT,
    livestream_id VARCHAR(36),
    announcements TEXT,
    bulletin_id VARCHAR(36),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP
);
CREATE INDEX idx_church_services_date ON church_services(service_date);
CREATE INDEX idx_church_services_congregation ON church_services(congregation_id);

CREATE TABLE IF NOT EXISTS bulletins (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    congregation_id VARCHAR(36),
    church_service_id VARCHAR(36),
    service_date DATE NOT NULL,
    welcome_message TEXT,
    order_of_service TEXT,
    scripture_ref VARCHAR(255),
    preacher VARCHAR(255),
    sermon_theme VARCHAR(255),
    announcements TEXT,
    weekly_calendar TEXT,
    ministry_notices TEXT,
    giving_information TEXT,
    livestream_url VARCHAR(500),
    special_events TEXT,
    status VARCHAR(50) DEFAULT 'DRAFT',
    published_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP
);
CREATE INDEX idx_bulletins_date ON bulletins(service_date);
CREATE INDEX idx_bulletins_congregation ON bulletins(congregation_id);