CREATE TABLE IF NOT EXISTS church_locator (
    id VARCHAR(255) PRIMARY KEY,
    congregation_id VARCHAR(255),
    name VARCHAR(255),
    address TEXT,
    latitude DOUBLE PRECISION DEFAULT 0,
    longitude DOUBLE PRECISION DEFAULT 0,
    service_times TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    livestream_url VARCHAR(1000),
    website VARCHAR(1000)
);
