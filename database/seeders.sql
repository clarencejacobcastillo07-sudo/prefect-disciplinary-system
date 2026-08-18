-- =============================================================================
-- Prefect Disciplinary Action System - Clean Seed Data
-- Client: St. Agnes Academy of Caloocan Inc.
-- Compatible: PostgreSQL 14+ / Supabase / SQLite
--
-- AUTHENTICATION NOTICE:
-- Supabase Auth is the SINGLE authentication authority for this application.
-- User accounts below map to Supabase Auth users via email / supabase_uid.
-- Passwords are strictly managed by Supabase Auth (e.g. Password123! in Supabase Auth).
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
(1, 1, 'System Administrator',  'admin@stagnes.edu.ph',     TRUE),
(2, 2, 'Mr. Ricardo Santos',    'prefect@stagnes.edu.ph',   TRUE),
(3, 3, 'Ms. Maria Teresa Cruz', 'guidance@stagnes.edu.ph',  TRUE),
(4, 4, 'Sr. Agnes D. Reyes',    'principal@stagnes.edu.ph', TRUE)
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
-- Reset sequences (for PostgreSQL)
-- ============================================================
-- NOTE: In PostgreSQL, sequence update statements can be run when using PostgreSQL.