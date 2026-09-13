-- =============================================================================
-- Prefect Disciplinary Action System - Clean Seed Data
-- Client: St. Agnes Academy of Caloocan Inc.
-- Compatible: PostgreSQL 14+ / Supabase / SQLite
--
-- AUTHENTICATION NOTICE:
-- Supabase Auth is the SINGLE authentication authority for this application.
-- User accounts below map to Supabase Auth users via email / supabase_uid.
-- Passwords are strictly managed by Supabase Auth.
-- The local 'users' table stores application profile and RBAC role assignments.
-- =============================================================================

-- ============================================================
-- 1. Roles
-- ============================================================
INSERT INTO roles (id, name, description) VALUES
(1, 'Administrator',      'Full system administration, user management, settings, and audit logs'),
(2, 'Prefect Officer',    'Infraction logging, hearing scheduling, clearance holds, and sanctioning'),
(3, 'Guidance Counselor', 'Behavior monitoring, reformation program management, and student guidance'),
(4, 'Principal',          'Executive review, severe sanction approval, and high-level analytics')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. Users (Mapped to Supabase Auth Users)
-- ============================================================
INSERT INTO users (id, role_id, full_name, email, is_active) VALUES
(1, 1, 'System Administrator',  'cjbngx@gmail.com',     TRUE),
(2, 2, 'Mr. Ricardo Santos',    'cjbinance007@gmail.com',   TRUE),
(3, 3, 'Ms. Maria Teresa Cruz', 'cjsatoshi072@gmail.com',  TRUE),
(4, 4, 'Sr. Charles Reyes',    'stacksmusic07@gmail.com', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. Student Records
-- ============================================================
INSERT INTO students
    (id, lrn, first_name, last_name, middle_name,
     grade_level, section, track_strand, gender,
     conduct_points, status, clearance_status)
VALUES
(1, '001', 'Johnmark', 'Santos', 'De Leon',  'Grade 10', 'Section A', 'Junior High', 'Male',   100, 'Good Standing', 'Cleared'),
(2, '002', 'Rianne',   'Reyes',  'Gomez',    'Grade 11', 'Section B', 'STEM',        'Female', 100, 'Good Standing', 'Cleared'),
(3, '003', 'Mark',     'Aquino', 'Pascual',  'Grade 9',  'Section C', 'Junior High', 'Male',   100, 'Good Standing', 'Cleared')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. Parents / Guardians
-- ============================================================
INSERT INTO parents
    (id, student_id, guardian_name, relationship, contact_number, email, address)
VALUES
(1, 1, 'Mr. Eduardo Santos',   'Father', '09170000001', 'eduardo.santos@test.com', '123 Sampaguita St, Caloocan City'),
(2, 2, 'Mrs. Teresa Reyes',    'Mother', '09180000002', 'teresa.reyes@test.com',   '456 Mabini St, Caloocan City'),
(3, 3, 'Mrs. Corazon Aquino',  'Mother', '09200000003', 'corazon.aquino@test.com', '789 Rizal Ave, Caloocan City')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. System Settings (Non-Sensitive Defaults)
-- ============================================================
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('school_name',             'St. Agnes Academy of Caloocan Inc.',            'Official institution name'),
('school_address',          'Camarin Road, Barangay 180, Caloocan City',     'Official school address'),
('academic_year',           'S.Y. 2026 - 2027',                              'Current active school year'),
('semester',                '1st Semester',                                  'Active grading/semester period'),
('conduct_points_baseline', '100',                                           'Initial conduct points per student'),
('low_risk_threshold',      '90',                                            'Points threshold for Low Risk standing'),
('moderate_risk_threshold', '75',                                            'Points threshold for Moderate Risk standing'),
('minor_demerit_default',   '3',                                             'Default demerits for Minor infractions'),
('major_demerit_default',   '5',                                             'Default demerits for Major infractions'),
('severe_demerit_default',  '8',                                             'Default demerits for Severe infractions'),
('semaphore_sender_name',   'STAGNES',                                       'Approved SMS sender ID'),
('email_notifications',     'true',                                          'Enable email alert notifications'),
('sms_notifications',       'true',                                          'Enable SMS alert notifications'),
('auto_clearance_flag',     'true',                                          'Automatic hold flagging on major infractions'),
('auto_points_deduction',   'true',                                          'Automatic points deduction on report logging')
ON CONFLICT (setting_key) DO NOTHING;