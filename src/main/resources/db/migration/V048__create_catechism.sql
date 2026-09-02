-- Catechism foundation — reusable learning structure (course → module → lesson →
-- enrollment → progress → assessment). Confirmation criteria and theological
-- progression are NOT hard-coded; the workflow is configurable through status and
-- sequence_order fields.

CREATE TABLE IF NOT EXISTS catechism_courses (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    congregation_id VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_catechism_courses_congregation ON catechism_courses(congregation_id);

CREATE TABLE IF NOT EXISTS catechism_modules (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    course_id VARCHAR(255),
    sequence_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES catechism_courses(id)
);
CREATE INDEX IF NOT EXISTS idx_catechism_modules_course ON catechism_modules(course_id);

CREATE TABLE IF NOT EXISTS catechism_lessons (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    bible_reference VARCHAR(255),
    module_id VARCHAR(255),
    sequence_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES catechism_modules(id)
);
CREATE INDEX IF NOT EXISTS idx_catechism_lessons_module ON catechism_lessons(module_id);

CREATE TABLE IF NOT EXISTS catechism_enrollments (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    course_id VARCHAR(255),
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'IN_PROGRESS',
    FOREIGN KEY (course_id) REFERENCES catechism_courses(id)
);
CREATE INDEX IF NOT EXISTS idx_catechism_enrollments_user ON catechism_enrollments(user_id);

CREATE TABLE IF NOT EXISTS catechism_progress (
    id VARCHAR(255) PRIMARY KEY,
    enrollment_id VARCHAR(255),
    lesson_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'NOT_STARTED',
    completed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enrollment_id) REFERENCES catechism_enrollments(id)
);
CREATE INDEX IF NOT EXISTS idx_catechism_progress_enrollment ON catechism_progress(enrollment_id);

CREATE TABLE IF NOT EXISTS catechism_assessments (
    id VARCHAR(255) PRIMARY KEY,
    enrollment_id VARCHAR(255),
    lesson_id VARCHAR(255) NOT NULL,
    score INT DEFAULT 0,
    max_score INT DEFAULT 100,
    passed BOOLEAN DEFAULT FALSE,
    assessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enrollment_id) REFERENCES catechism_enrollments(id)
);
CREATE INDEX IF NOT EXISTS idx_catechism_assessments_enrollment ON catechism_assessments(enrollment_id);
