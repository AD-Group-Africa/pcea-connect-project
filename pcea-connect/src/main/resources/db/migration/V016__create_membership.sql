ALTER TABLE users ADD COLUMN IF NOT EXISTS congregation_id VARCHAR(255);
ALTER TABLE users ADD CONSTRAINT fk_users_congregation FOREIGN KEY (congregation_id) REFERENCES congregations(id);
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
