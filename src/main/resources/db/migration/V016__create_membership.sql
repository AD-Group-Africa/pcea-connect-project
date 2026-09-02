-- Membership: users table bootstrap + member profiles.
--
-- NOTE: the users table was historically created by Hibernate ddl-auto, not by a migration.
-- Flyway now owns the schema; this migration self-creates users if absent (fresh databases)
-- and is a no-op on legacy installs where Hibernate already created it.

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    enabled BOOLEAN DEFAULT TRUE
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS congregation_id VARCHAR(255);
ALTER TABLE users ADD CONSTRAINT fk_users_congregation FOREIGN KEY (congregation_id) REFERENCES congregations(id);

-- Foundation tables Hibernate previously created via ddl-auto=update. Folded into V016 so
-- a fresh database receives a complete schema; no-op on legacy installs.
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id VARCHAR(255) PRIMARY KEY,
    token VARCHAR(500),
    user_id VARCHAR(255),
    expiry_date TIMESTAMP
);
-- User.roles @ElementCollection without @CollectionTable => Hibernate default table user_roles
-- (validated empirically by Hibernate schema validation).
CREATE TABLE IF NOT EXISTS user_roles (
    user_id VARCHAR(255) NOT NULL,
    roles VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS ministry_galleries (
    id VARCHAR(255) PRIMARY KEY,
    ministry_id VARCHAR(255),
    image_url VARCHAR(1000),
    caption TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS member_profiles (
    user_id VARCHAR(255) PRIMARY KEY,
    gender VARCHAR(50),
    date_of_birth DATE,
    marital_status VARCHAR(50),
    occupation VARCHAR(255),
    baptism_date DATE,
    membership_date DATE,
    spiritual_gifts TEXT,
    skills TEXT,
    bio TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
