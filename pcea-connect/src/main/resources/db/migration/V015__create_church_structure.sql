CREATE TABLE IF NOT EXISTS regions (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) UNIQUE,
    address VARCHAR(255),
    phone VARCHAR(255),
    email VARCHAR(255),
    active BOOLEAN
);
CREATE TABLE IF NOT EXISTS presbyteries (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) UNIQUE,
    address VARCHAR(255),
    phone VARCHAR(255),
    email VARCHAR(255),
    region_id VARCHAR(255),
    active BOOLEAN,
    FOREIGN KEY (region_id) REFERENCES regions(id)
);
CREATE TABLE IF NOT EXISTS parishes (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) UNIQUE,
    address VARCHAR(255),
    phone VARCHAR(255),
    email VARCHAR(255),
    presbytery_id VARCHAR(255),
    active BOOLEAN,
    FOREIGN KEY (presbytery_id) REFERENCES presbyteries(id)
);
CREATE TABLE IF NOT EXISTS congregations (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) UNIQUE,
    address VARCHAR(255),
    phone VARCHAR(255),
    email VARCHAR(255),
    parish_id VARCHAR(255),
    active BOOLEAN,
    FOREIGN KEY (parish_id) REFERENCES parishes(id)
);
CREATE TABLE IF NOT EXISTS general_assembly (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    address VARCHAR(255),
    phone VARCHAR(255),
    email VARCHAR(255),
    active BOOLEAN
);
