-- Sunday School domain — child/parent/teacher journey built on the shared Ministry
-- framework. Children are NOT users (no credentials) — their minimal profiles are
-- visible only to linked parents and assigned teachers (object-level authorization).

CREATE TABLE IF NOT EXISTS sunday_school_classes (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    age_group VARCHAR(255),
    ministry_id VARCHAR(255),
    congregation_id VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ministry_id) REFERENCES ministries(id)
);
CREATE INDEX IF NOT EXISTS idx_ss_classes_congregation ON sunday_school_classes(congregation_id);

CREATE TABLE IF NOT EXISTS sunday_school_teacher_assignments (
    id VARCHAR(255) PRIMARY KEY,
    class_id VARCHAR(255) NOT NULL,
    teacher_user_id VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'TEACHER',
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES sunday_school_classes(id)
);
CREATE INDEX IF NOT EXISTS idx_ss_teacher_assignments_teacher ON sunday_school_teacher_assignments(teacher_user_id);

CREATE TABLE IF NOT EXISTS sunday_school_children (
    id VARCHAR(255) PRIMARY KEY,
    child_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    class_id VARCHAR(255),
    congregation_id VARCHAR(255),
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (class_id) REFERENCES sunday_school_classes(id)
);
CREATE INDEX IF NOT EXISTS idx_ss_children_class ON sunday_school_children(class_id);

CREATE TABLE IF NOT EXISTS sunday_school_parent_links (
    id VARCHAR(255) PRIMARY KEY,
    child_id VARCHAR(255) NOT NULL,
    parent_user_id VARCHAR(255) NOT NULL,
    relationship VARCHAR(50) DEFAULT 'PARENT',
    linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES sunday_school_children(id)
);
CREATE INDEX IF NOT EXISTS idx_ss_parent_links_parent ON sunday_school_parent_links(parent_user_id);

CREATE TABLE IF NOT EXISTS sunday_school_lessons (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    bible_reference VARCHAR(255),
    description TEXT,
    class_id VARCHAR(255),
    lesson_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES sunday_school_classes(id)
);
CREATE INDEX IF NOT EXISTS idx_ss_lessons_class ON sunday_school_lessons(class_id);

CREATE TABLE IF NOT EXISTS sunday_school_attendance (
    id VARCHAR(255) PRIMARY KEY,
    child_id VARCHAR(255),
    lesson_id VARCHAR(255),
    attendance_date DATE,
    present BOOLEAN DEFAULT TRUE,
    note TEXT,
    recorded_by_user_id VARCHAR(255),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES sunday_school_children(id),
    FOREIGN KEY (lesson_id) REFERENCES sunday_school_lessons(id)
);
CREATE INDEX IF NOT EXISTS idx_ss_attendance_child ON sunday_school_attendance(child_id);

CREATE TABLE IF NOT EXISTS sunday_school_progress (
    id VARCHAR(255) PRIMARY KEY,
    child_id VARCHAR(255),
    lesson_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'ON_TRACK',
    note TEXT,
    recorded_by_user_id VARCHAR(255),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES sunday_school_children(id)
);
CREATE INDEX IF NOT EXISTS idx_ss_progress_child ON sunday_school_progress(child_id);
