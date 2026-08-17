-- =============================================================================
-- Prefect Disciplinary Action System - PostgreSQL / Supabase Schema
-- Client: St. Agnes Academy of Caloocan Inc.
-- Compatible: PostgreSQL 14+ / Supabase
--
-- SAFE NON-DESTRUCTIVE SCHEMA CREATION SCRIPT.
-- Uses CREATE TABLE IF NOT EXISTS to prevent accidental data loss.
-- To perform a destructive reset during development, use database/reset_schema.sql.
-- =============================================================================

-- =============================================================================
-- 1. Roles Table
--    RBAC roles: Administrator | Prefect Officer | Guidance Counselor | Principal
-- =============================================================================
CREATE TABLE IF NOT EXISTS roles (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 2. Users Table
--    Application profile and RBAC record. Authentication is handled exclusively
--    by Supabase Auth. supabase_uid links this record to the Supabase Auth user.
-- =============================================================================
-- NOTE: Authentication is handled exclusively by Supabase Auth.
-- This table stores application profile, role, and RBAC information only.
-- Supabase Auth owns: email, password, UUID identity.
-- This table owns: role_id, full_name, is_active, and the supabase_uid link.
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    supabase_uid  VARCHAR(128) UNIQUE,
    role_id       INT NOT NULL,
    full_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(120) NOT NULL UNIQUE,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);

-- =============================================================================
-- 3. Students Table
--    Core student record with conduct point tracking and standing status.
--    status:           Good Standing | Under Warning | Probation | Suspended
--    clearance_status: Cleared | Hold
-- =============================================================================
CREATE TABLE IF NOT EXISTS students (
    id               SERIAL PRIMARY KEY,
    lrn              VARCHAR(12) NOT NULL UNIQUE,
    first_name       VARCHAR(50) NOT NULL,
    last_name        VARCHAR(50) NOT NULL,
    middle_name      VARCHAR(50),
    grade_level      VARCHAR(20) NOT NULL,
    section          VARCHAR(30) NOT NULL,
    track_strand     VARCHAR(50),
    gender           VARCHAR(10),
    conduct_points   INT NOT NULL DEFAULT 100,
    status           VARCHAR(20) NOT NULL DEFAULT 'Good Standing',
    clearance_status VARCHAR(20) NOT NULL DEFAULT 'Cleared',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_students_lrn ON students(lrn);
CREATE INDEX IF NOT EXISTS idx_students_grade ON students(grade_level);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_clearance ON students(clearance_status);

-- =============================================================================
-- 4. Parents / Guardians Table
--    Primary contacts and SMS notification recipients for each student.
-- =============================================================================
CREATE TABLE IF NOT EXISTS parents (
    id              SERIAL PRIMARY KEY,
    student_id      INT NOT NULL,
    guardian_name   VARCHAR(100) NOT NULL,
    relationship    VARCHAR(30) NOT NULL,
    contact_number  VARCHAR(15) NOT NULL,
    email           VARCHAR(120),
    address         TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_parents_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_parents_student ON parents(student_id);

-- =============================================================================
-- 5. Violations Taxonomy Table
--    Standardised violation codes aligned to DepEd-prescribed categories.
--    category: Minor | Major | Severe
-- =============================================================================
CREATE TABLE IF NOT EXISTS violations (
    id                   SERIAL PRIMARY KEY,
    code                 VARCHAR(20) NOT NULL UNIQUE,
    title                VARCHAR(100) NOT NULL,
    description          TEXT,
    category             VARCHAR(10) NOT NULL,
    demerit_points       INT NOT NULL DEFAULT 5,
    recommended_sanction VARCHAR(150),
    is_active            BOOLEAN NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_violations_category CHECK (category IN ('Minor', 'Major', 'Severe'))
);

CREATE INDEX IF NOT EXISTS idx_violations_category ON violations(category);
CREATE INDEX IF NOT EXISTS idx_violations_active ON violations(is_active);

-- =============================================================================
-- 6. Incident Reports Table
--    Central log of every disciplinary incident filed by prefect officers.
--    status: Pending Review | Under Investigation | Hearing Scheduled
--            Sanctioned | Resolved | Dismissed
-- =============================================================================
CREATE TABLE IF NOT EXISTS incident_reports (
    id              SERIAL PRIMARY KEY,
    incident_number VARCHAR(30) NOT NULL UNIQUE,
    student_id      INT NOT NULL,
    violation_id    INT NOT NULL,
    reported_by     INT NOT NULL,
    incident_date   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    location        VARCHAR(100) NOT NULL,
    description     TEXT NOT NULL,
    witnesses       TEXT,
    evidence_url    VARCHAR(255),
    status          VARCHAR(30) NOT NULL DEFAULT 'Pending Review',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_incidents_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_incidents_violation FOREIGN KEY (violation_id) REFERENCES violations(id) ON DELETE RESTRICT,
    CONSTRAINT fk_incidents_reporter FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT chk_incidents_status CHECK (status IN ('Pending Review', 'Under Investigation', 'Hearing Scheduled', 'Sanctioned', 'Resolved', 'Dismissed'))
);

CREATE INDEX IF NOT EXISTS idx_incidents_student ON incident_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_incidents_violation ON incident_reports(violation_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incident_reports(status);
CREATE INDEX IF NOT EXISTS idx_incidents_date ON incident_reports(incident_date);

-- =============================================================================
-- 7. Behavior Points Table
--    Ledger of demerit deductions and merit/reward credits per student.
--    point_type: Demerit | Merit | Reformation Reward
-- =============================================================================
CREATE TABLE IF NOT EXISTS behavior_points (
    id            SERIAL PRIMARY KEY,
    student_id    INT NOT NULL,
    incident_id   INT,
    points_change INT NOT NULL,
    point_type    VARCHAR(25) NOT NULL,
    reason        TEXT NOT NULL,
    created_by    INT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_behavior_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_behavior_incident FOREIGN KEY (incident_id) REFERENCES incident_reports(id) ON DELETE SET NULL,
    CONSTRAINT fk_behavior_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT chk_behavior_type CHECK (point_type IN ('Demerit', 'Merit', 'Reformation Reward'))
);

CREATE INDEX IF NOT EXISTS idx_behavior_student ON behavior_points(student_id);
CREATE INDEX IF NOT EXISTS idx_behavior_incident ON behavior_points(incident_id);
CREATE INDEX IF NOT EXISTS idx_behavior_type ON behavior_points(point_type);

-- =============================================================================
-- 8. Disciplinary Hearings Table
--    Scheduled hearings tied to incidents; tracks committee and decision.
--    status: Scheduled | Completed | Postponed | Cancelled
-- =============================================================================
CREATE TABLE IF NOT EXISTS hearings (
    id                SERIAL PRIMARY KEY,
    incident_id       INT NOT NULL,
    hearing_date      DATE NOT NULL,
    hearing_time      TIME NOT NULL,
    venue             VARCHAR(100) NOT NULL DEFAULT 'Prefect Office / Guidance Office',
    committee_members TEXT,
    status            VARCHAR(20) NOT NULL DEFAULT 'Scheduled',
    decision_notes    TEXT,
    presided_by       INT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_hearings_incident FOREIGN KEY (incident_id) REFERENCES incident_reports(id) ON DELETE CASCADE,
    CONSTRAINT fk_hearings_presider FOREIGN KEY (presided_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_hearings_status CHECK (status IN ('Scheduled', 'Completed', 'Postponed', 'Cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_hearings_incident ON hearings(incident_id);
CREATE INDEX IF NOT EXISTS idx_hearings_date ON hearings(hearing_date);
CREATE INDEX IF NOT EXISTS idx_hearings_status ON hearings(status);

-- =============================================================================
-- 9. Sanctions Table
--    Formal sanctions issued to students after hearing or direct decision.
--    sanction_type: Verbal Warning | Written Warning | Detention |
--                   In-School Suspension | Suspension | Community Service
--    status: Ongoing | Served | Waived | Violated
-- =============================================================================
CREATE TABLE IF NOT EXISTS sanctions (
    id            SERIAL PRIMARY KEY,
    incident_id   INT NOT NULL,
    student_id    INT NOT NULL,
    sanction_type VARCHAR(100) NOT NULL,
    start_date    DATE NOT NULL,
    end_date      DATE,
    status        VARCHAR(20) NOT NULL DEFAULT 'Ongoing',
    remarks       TEXT,
    issued_by     INT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sanctions_incident FOREIGN KEY (incident_id) REFERENCES incident_reports(id) ON DELETE CASCADE,
    CONSTRAINT fk_sanctions_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_sanctions_issuer FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT chk_sanctions_status CHECK (status IN ('Ongoing', 'Served', 'Waived', 'Violated'))
);

CREATE INDEX IF NOT EXISTS idx_sanctions_student ON sanctions(student_id);
CREATE INDEX IF NOT EXISTS idx_sanctions_incident ON sanctions(incident_id);
CREATE INDEX IF NOT EXISTS idx_sanctions_status ON sanctions(status);

-- =============================================================================
-- 10. Clearance Holds Table
--     Active flags blocking a student's semester/year-end clearance.
--     is_active: TRUE = hold active, FALSE = resolved/lifted
-- =============================================================================
CREATE TABLE IF NOT EXISTS clearance_holds (
    id          SERIAL PRIMARY KEY,
    student_id  INT NOT NULL,
    incident_id INT,
    hold_reason TEXT NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    flagged_by  INT NOT NULL,
    resolved_by INT,
    resolved_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_clearance_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_clearance_incident FOREIGN KEY (incident_id) REFERENCES incident_reports(id) ON DELETE SET NULL,
    CONSTRAINT fk_clearance_flagger FOREIGN KEY (flagged_by) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_clearance_resolver FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_clearance_student ON clearance_holds(student_id, is_active);
CREATE INDEX IF NOT EXISTS idx_clearance_active ON clearance_holds(is_active);

-- =============================================================================
-- 11. Reformation Programs Table
--     Community service / counseling programs assigned as corrective action.
--     status: Assigned | In Progress | Completed | Incomplete
-- =============================================================================
CREATE TABLE IF NOT EXISTS reformation_programs (
    id                  SERIAL PRIMARY KEY,
    student_id          INT NOT NULL,
    incident_id         INT,
    program_title       VARCHAR(100) NOT NULL,
    description         TEXT,
    assigned_supervisor INT,
    total_hours         INT NOT NULL DEFAULT 10,
    completed_hours     INT NOT NULL DEFAULT 0,
    status              VARCHAR(20) NOT NULL DEFAULT 'In Progress',
    completion_date     DATE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reformation_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_reformation_incident FOREIGN KEY (incident_id) REFERENCES incident_reports(id) ON DELETE SET NULL,
    CONSTRAINT fk_reformation_supervisor FOREIGN KEY (assigned_supervisor) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_reformation_status CHECK (status IN ('Assigned', 'In Progress', 'Completed', 'Incomplete'))
);

CREATE INDEX IF NOT EXISTS idx_reformation_student ON reformation_programs(student_id);
CREATE INDEX IF NOT EXISTS idx_reformation_status ON reformation_programs(status);

-- =============================================================================
-- 12. SMS Logs Table
--     Audit trail of every parent SMS notification sent or simulated.
--     status: Queued | Sent | Failed | Simulated
-- =============================================================================
CREATE TABLE IF NOT EXISTS sms_logs (
    id               SERIAL PRIMARY KEY,
    parent_id        INT,
    student_id       INT NOT NULL,
    phone_number     VARCHAR(15) NOT NULL,
    message_content  TEXT NOT NULL,
    provider         VARCHAR(30) NOT NULL DEFAULT 'Semaphore',
    status           VARCHAR(15) NOT NULL DEFAULT 'Sent',
    response_payload TEXT,
    sent_by          INT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sms_parent FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE SET NULL,
    CONSTRAINT fk_sms_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_sms_sender FOREIGN KEY (sent_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_sms_status CHECK (status IN ('Queued', 'Sent', 'Failed', 'Simulated'))
);

CREATE INDEX IF NOT EXISTS idx_sms_student ON sms_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_sms_status ON sms_logs(status);

-- =============================================================================
-- 13. Audit Logs Table
--     Immutable activity trail of all significant user actions system-wide.
-- =============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id          SERIAL PRIMARY KEY,
    user_id     INT,
    user_name   VARCHAR(100),
    action      VARCHAR(60) NOT NULL,
    module      VARCHAR(60) NOT NULL,
    description TEXT NOT NULL,
    ip_address  VARCHAR(45),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_module ON audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_audit_date ON audit_logs(created_at);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) ARCHITECTURE & STRATEGY DOCUMENTATION
-- =============================================================================
-- ARCHITECTURE FLOW:
-- Frontend -> Supabase Auth -> Bearer JWT -> PHP REST API (AuthMiddleware)
--          -> Validates JWT via Supabase Auth -> Resolves local user profile & role
--          -> PHP Server PDO connection (SUPABASE_DB_USER) -> Supabase PostgreSQL
--
-- TRUST MODEL & SECURITY BOUNDARY:
-- 1. Authentication & JWT Validation: Handled strictly at the API layer by
--    Supabase Auth API endpoint (/auth/v1/user) via AuthMiddleware.
-- 2. Role-Based Access Control (RBAC): Enforced at the PHP REST API layer using
--    the authenticated user's role_id stored in public.users.
-- 3. PostgreSQL Database Connection: The PHP backend connects via a dedicated
--    server-side pooled PDO user (SUPABASE_DB_USER). As a server connection,
--    it operates as the database object owner and bypasses table RLS policies.
-- 4. RLS Policy Strategy: PostgreSQL auth.uid() policies are NOT enabled because
--    the PHP PDO driver uses a shared pool connection rather than passing Supabase
--    JWT claims per SQL statement. Table-level security and access boundaries are
--    fully guaranteed by PHP AuthMiddleware & service route handlers.
-- =============================================================================