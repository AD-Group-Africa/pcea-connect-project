CREATE TABLE IF NOT EXISTS volunteer_teams (id VARCHAR(255) PRIMARY KEY, name VARCHAR(255), description TEXT, congregation_id VARCHAR(255));
CREATE TABLE IF NOT EXISTS volunteer_schedules (id VARCHAR(255) PRIMARY KEY, team_id VARCHAR(255), event_name VARCHAR(255), scheduled_at TIMESTAMP, duration_minutes INT);
CREATE TABLE IF NOT EXISTS volunteer_signups (id VARCHAR(255) PRIMARY KEY, schedule_id VARCHAR(255), user_id VARCHAR(255), role VARCHAR(255), attended BOOLEAN DEFAULT FALSE);
CREATE TABLE IF NOT EXISTS volunteer_service_hours (id VARCHAR(255) PRIMARY KEY, user_id VARCHAR(255), team_id VARCHAR(255), hours DOUBLE PRECISION, date TIMESTAMP);
