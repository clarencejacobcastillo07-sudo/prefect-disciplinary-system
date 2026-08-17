-- =============================================================================
-- Prefect Disciplinary Action System - Seed Data
-- Client: St. Agnes Academy of Caloocan Inc.
-- Compatible: PostgreSQL 14+ / Supabase
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
-- NOTE: Passwords are managed exclusively by Supabase Auth.
-- Create the matching Supabase Auth users via the Supabase dashboard or Admin API
-- using the emails below, then back-fill supabase_uid manually or on first login.
INSERT INTO users (id, role_id, full_name, email, is_active) VALUES
(1, 1, 'System Administrator',  'admin@stagnes.edu.ph',     TRUE),
(2, 2, 'Mr. Ricardo Santos',    'prefect@stagnes.edu.ph',   TRUE),
(3, 3, 'Ms. Maria Teresa Cruz', 'guidance@stagnes.edu.ph',  TRUE),
(4, 4, 'Sr. Agnes D. Reyes',    'principal@stagnes.edu.ph', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. Students
-- ============================================================
INSERT INTO students
    (id, lrn, first_name, last_name, middle_name,
     grade_level, section, track_strand, gender,
     conduct_points, status, clearance_status)
VALUES
(1, '136123450001', 'Juan',         'Dela Cruz', 'Santos',     'Grade 10', 'St. Thomas',     'Junior High', 'Male',   85,  'Under Warning', 'Hold'),
(2, '136123450002', 'Maria Clara',  'Gonzales',  'Reyes',      'Grade 11', 'St. Bernadette', 'STEM',        'Female', 95,  'Good Standing', 'Cleared'),
(3, '136123450003', 'Mark Anthony', 'Bautista',  'Aquino',     'Grade 9',  'St. Lorenzo',    'Junior High', 'Male',   70,  'Probation',     'Hold'),
(4, '136123450004', 'Sophia',       'Mendoza',   'Flores',     'Grade 12', 'St. Catherine',  'ABM',         'Female', 100, 'Good Standing', 'Cleared'),
(5, '136123450005', 'Christian',    'Navarro',   'Villanueva', 'Grade 8',  'St. Francis',    'Junior High', 'Male',   60,  'Suspended',     'Hold')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. Parents / Guardians
-- ============================================================
INSERT INTO parents
    (id, student_id, guardian_name, relationship, contact_number, email, address)
VALUES
(1, 1, 'Pedro Dela Cruz',  'Father', '09171234567', 'pedro.delacruz@gmail.com', '123 Camarin Rd, Caloocan City'),
(2, 2, 'Elena Gonzales',   'Mother', '09189876543', 'elena.gonzales@yahoo.com',  '456 Bagong Silang, Caloocan City'),
(3, 3, 'Antonio Bautista', 'Father', '09205554433', 'antonio.b@gmail.com',       '789 Zabarte Rd, Caloocan City'),
(4, 4, 'Grace Mendoza',    'Mother', '09193332211', 'grace.m@gmail.com',         '321 Deparo, Caloocan City'),
(5, 5, 'Roberto Navarro',  'Father', '09228889900', 'roberto.n@gmail.com',       '654 Tala, Caloocan City')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. Violations Taxonomy (DepEd-aligned)
-- ============================================================
INSERT INTO violations
    (id, code, title, description, category, demerit_points, recommended_sanction, is_active)
VALUES
(1,  'V-MIN-001', 'Tardiness',
     'Arriving to class or assembly 15 minutes after official start time without valid excuse.',
     'Minor', 3, 'Verbal Warning & Attendance Reminder', TRUE),

(2,  'V-MIN-002', 'Improper Uniform',
     'Failure to comply with complete prescribed school uniform and haircut standard.',
     'Minor', 5, 'Written Warning', TRUE),

(3,  'V-MIN-003', 'Littering in Campus Grounds',
     'Disposing trash outside designated waste bins inside school premises.',
     'Minor', 5, 'Campus Cleaning Duty (1 hour)', TRUE),

(4,  'V-MAJ-001', 'Cutting Classes / Truancy',
     'Leaving classroom or school premises during official class hours without permission.',
     'Major', 15, '1-Day In-School Suspension & Parent Conference', TRUE),

(5,  'V-MAJ-002', 'Vandalism of School Property',
     'Defacing desks, walls, or damaging school equipment intentionally.',
     'Major', 20, 'Property Restitution & 2-Day Suspension', TRUE),

(6,  'V-MAJ-003', 'Bullying / Harassment',
     'Physical, verbal, or cyber intimidation and threatening towards fellow students.',
     'Major', 25, 'Formal Hearing & Guidance Counseling Sessions', TRUE),

(7,  'V-SEV-001', 'Cheating during Major Examination',
     'Possession of unauthorized notes, gadgets, or sources during official examinations.',
     'Severe', 35, 'Exam Invalidation & 3-Day In-School Suspension', TRUE),

(8,  'V-SEV-002', 'Brawling / Physical Assault',
     'Engaging in violent physical altercation inside or within the vicinity of school grounds.',
     'Severe', 40, 'Indefinite Suspension & Disciplinary Hearing Board Review', TRUE),

(9,  'V-MIN-004', 'Unauthorized Use of Mobile Phone',
     'Use of mobile phone during class hours or restricted areas without teacher permission.',
     'Minor', 5, 'Confiscation & Written Warning', TRUE),

(10, 'V-MAJ-004', 'Disrespect to School Personnel',
     'Verbal or physical disrespect directed at a teacher, staff, or school official.',
     'Major', 20, 'Formal Apology Letter & 1-Day Suspension', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 6. Incident Reports
-- ============================================================
INSERT INTO incident_reports
    (id, incident_number, student_id, violation_id, reported_by,
     incident_date, location, description, witnesses, status)
VALUES
(1, 'INC-2026-0001', 1, 4, 2,
    '2026-07-20 10:15:00+08', 'High School Building Floor 2',
    'Student was seen scaling the back fence to skip 3rd period Mathematics class.',
    'Security Guard Ramos, Mr. Cruz (Math Teacher)',
    'Sanctioned'),

(2, 'INC-2026-0002', 3, 6, 3,
    '2026-07-22 13:30:00+08', 'Student Canteen Area',
    'Student verbally harassed and threatened a Grade 7 student over lunch seating arrangement.',
    'Ms. Santos (Canteen Supervisor), Grade 7 classmates',
    'Hearing Scheduled'),

(3, 'INC-2026-0003', 5, 8, 2,
    '2026-07-25 15:45:00+08', 'School Gymnasium Rear Court',
    'Student engaged in physical altercation with a co-player after intramural basketball match.',
    'Coach Fernandez, PE Faculty, student spectators',
    'Under Investigation'),

(4, 'INC-2026-0004', 1, 2, 2,
    '2026-07-28 07:45:00+08', 'Grade 10 Corridor',
    'Student reported to class in improper uniform — untucked polo and wearing rubber shoes.',
    'Ms. Rivera (Class Adviser)',
    'Resolved'),

(5, 'INC-2026-0005', 3, 9, 2,
    '2026-07-30 09:20:00+08', 'Classroom 9-B',
    'Student was caught using a mobile phone to take photos during a surprise quiz period.',
    'Mr. Gomez (Science Teacher)',
    'Pending Review')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 7. Behavior Points
-- ============================================================
INSERT INTO behavior_points
    (id, student_id, incident_id, points_change, point_type, reason, created_by)
VALUES
(1, 1, 1, -15, 'Demerit',            'Deduction for Cutting Classes infraction (INC-2026-0001)', 2),
(2, 3, 2, -25, 'Demerit',            'Deduction for Bullying / Harassment infraction (INC-2026-0002)', 2),
(3, 5, 3, -40, 'Demerit',            'Deduction for Brawling / Physical Assault infraction (INC-2026-0003)', 2),
(4, 2, NULL, 5, 'Merit',              'Commendation for exemplary conduct during High School Foundation Day 2026', 3),
(5, 1, 4, -5,  'Demerit',            'Deduction for Improper Uniform infraction (INC-2026-0004)', 2),
(6, 3, 5, -5,  'Demerit',            'Deduction for Unauthorized Mobile Phone use (INC-2026-0005)', 2),
(7, 4, NULL, 5, 'Merit',              'Outstanding academic performance – honor roll recognition Q1 2026', 3),
(8, 2, NULL, 3, 'Reformation Reward', 'Completed 3 hours of voluntary campus clean-up program', 3)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 8. Disciplinary Hearings
-- ============================================================
INSERT INTO hearings
    (id, incident_id, hearing_date, hearing_time, venue,
     committee_members, status, decision_notes, presided_by)
VALUES
(1, 2, '2026-08-05', '10:00:00',
    'Prefect Disciplinary Board Room',
    'Mr. Ricardo Santos (Prefect Officer), Ms. Maria Teresa Cruz (Guidance Counselor), Parent/Guardian of Mark Anthony Bautista',
    'Scheduled',
    'Review incident evidence and hear parent statement prior to issuing formal sanction.',
    2),

(2, 3, '2026-08-10', '14:00:00',
    'Principal Office Conference Room',
    'Sr. Agnes D. Reyes (Principal), Mr. Ricardo Santos (Prefect Officer), Ms. Maria Teresa Cruz (Guidance Counselor), Coach Fernandez',
    'Scheduled',
    'Escalated severe brawling case — requires Principal approval for indefinite suspension.',
    4)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 9. Sanctions
-- ============================================================
INSERT INTO sanctions
    (id, incident_id, student_id, sanction_type,
     start_date, end_date, status, remarks, issued_by)
VALUES
(1, 1, 1, '1-Day In-School Suspension & Reflection Paper',
    '2026-07-22', '2026-07-23',
    'Served',
    'Student completed and submitted the reflection essay on time. Parent conference acknowledgment slip received.',
    2),

(2, 4, 1, 'Verbal Warning',
    '2026-07-28', '2026-07-28',
    'Served',
    'Student acknowledged the uniform policy and received a written reminder slip.',
    2)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 10. Clearance Holds
-- ============================================================
INSERT INTO clearance_holds
    (id, student_id, incident_id, hold_reason, is_active, flagged_by)
VALUES
(1, 1, 1, 'Pending submission of signed Parent Conference Acknowledgment Slip for INC-2026-0001', TRUE, 2),
(2, 3, 2, 'Active disciplinary investigation and scheduled hearing on August 5, 2026 for INC-2026-0002', TRUE, 2),
(3, 5, 3, 'Student suspended pending Disciplinary Board resolution for brawling incident INC-2026-0003', TRUE, 2)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 11. Reformation Programs
-- ============================================================
INSERT INTO reformation_programs
    (id, student_id, incident_id, program_title, description,
     assigned_supervisor, total_hours, completed_hours, status)
VALUES
(1, 1, 1,
    'Campus Eco-Cleanliness & Reflection',
    'Student assists the library custodian and renders 10 hours of campus eco-service as corrective action. Includes weekly reflection journal submission.',
    3, 10, 6, 'In Progress'),

(2, 3, 2,
    'Peer Sensitivity & Behavior Coaching',
    'Mandatory 5-session empathy and behavior coaching module conducted by the Guidance Counselor. Includes role-play activities and peer conflict resolution exercises.',
    3, 8, 2, 'In Progress'),

(3, 5, 3,
    'Violence Prevention & Social Skills Workshop',
    'Intensive 12-hour social skills and anger management workshop facilitated by the Guidance Counselor. Requires signed parental consent and weekly check-ins.',
    3, 12, 0, 'Assigned')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 12. SMS Logs
-- ============================================================
INSERT INTO sms_logs
    (id, parent_id, student_id, phone_number, message_content, provider, status, sent_by)
VALUES
(1, 1, 1, '09171234567',
    'ST. AGNES ACADEMY ALERT: Dear Mr. Pedro, your child Juan Dela Cruz (Grade 10) has been logged for Cutting Classes on July 20, 2026. Please report to the Prefect Office at your soonest convenience. Ref: INC-2026-0001.',
    'Semaphore', 'Sent', 2),

(2, 3, 3, '09205554433',
    'ST. AGNES ACADEMY NOTICE: Dear Mr. Antonio, a disciplinary hearing for Mark Anthony Bautista is scheduled on August 5, 2026 at 10:00 AM at the Prefect Disciplinary Board Room. Your presence is required. Ref: INC-2026-0002.',
    'Semaphore', 'Sent', 2),

(3, 5, 5, '09228889900',
    'ST. AGNES ACADEMY URGENT: Dear Mr. Roberto, Christian Navarro has been involved in a physical altercation on July 25, 2026. He is currently under investigation. Please contact the school immediately. Ref: INC-2026-0003.',
    'Semaphore', 'Sent', 2)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 13. Audit Logs
-- ============================================================
INSERT INTO audit_logs
    (id, user_id, user_name, action, module, description, ip_address)
VALUES
(1,  2, 'Mr. Ricardo Santos',    'CREATE_INCIDENT',    'Incident Management',  'Filed incident report INC-2026-0001 against Juan Dela Cruz (Grade 10) for Cutting Classes', '127.0.0.1'),
(2,  2, 'Mr. Ricardo Santos',    'FLAG_CLEARANCE',     'Clearance Hold',       'Flagged clearance hold for Juan Dela Cruz pending parent acknowledgment slip', '127.0.0.1'),
(3,  2, 'Mr. Ricardo Santos',    'CREATE_SANCTION',    'Disciplinary Hearings','Issued 1-Day In-School Suspension & Reflection Paper to Juan Dela Cruz (INC-2026-0001)', '127.0.0.1'),
(4,  2, 'Mr. Ricardo Santos',    'SEND_SMS',           'Parent Notification',  'Sent SMS to parent Pedro Dela Cruz regarding INC-2026-0001 cutting classes incident', '127.0.0.1'),
(5,  3, 'Ms. Maria Teresa Cruz', 'CREATE_INCIDENT',    'Incident Management',  'Filed incident report INC-2026-0002 against Mark Anthony Bautista (Grade 9) for Bullying', '127.0.0.1'),
(6,  2, 'Mr. Ricardo Santos',    'FLAG_CLEARANCE',     'Clearance Hold',       'Flagged clearance hold for Mark Anthony Bautista pending investigation and hearing', '127.0.0.1'),
(7,  2, 'Mr. Ricardo Santos',    'SCHEDULE_HEARING',   'Disciplinary Hearings','Scheduled disciplinary hearing on 2026-08-05 for INC-2026-0002 (Bullying case)', '127.0.0.1'),
(8,  2, 'Mr. Ricardo Santos',    'SEND_SMS',           'Parent Notification',  'Sent SMS to parent Antonio Bautista regarding hearing on 2026-08-05', '127.0.0.1'),
(9,  3, 'Ms. Maria Teresa Cruz', 'ASSIGN_REFORMATION', 'Reformation Program',  'Assigned Campus Eco-Cleanliness & Reflection program to Juan Dela Cruz (10 hrs)', '127.0.0.1'),
(10, 3, 'Ms. Maria Teresa Cruz', 'ASSIGN_REFORMATION', 'Reformation Program',  'Assigned Peer Sensitivity & Behavior Coaching to Mark Anthony Bautista (8 hrs)', '127.0.0.1'),
(11, 2, 'Mr. Ricardo Santos',    'CREATE_INCIDENT',    'Incident Management',  'Filed incident report INC-2026-0003 against Christian Navarro (Grade 8) for Brawling', '127.0.0.1'),
(12, 2, 'Mr. Ricardo Santos',    'FLAG_CLEARANCE',     'Clearance Hold',       'Flagged clearance hold for Christian Navarro pending Disciplinary Board resolution', '127.0.0.1'),
(13, 2, 'Mr. Ricardo Santos',    'SCHEDULE_HEARING',   'Disciplinary Hearings','Scheduled escalated hearing on 2026-08-10 for INC-2026-0003 (Brawling — Principal presiding)', '127.0.0.1'),
(14, 2, 'Mr. Ricardo Santos',    'SEND_SMS',           'Parent Notification',  'Sent urgent SMS to parent Roberto Navarro regarding brawling incident INC-2026-0003', '127.0.0.1'),
(15, 1, 'System Administrator',  'CREATE_USER',        'User Management',      'Created user accounts for all staff roles during initial system setup', '127.0.0.1')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Reset sequences to continue from the last inserted ID
-- ============================================================
SELECT setval('roles_id_seq', (SELECT MAX(id) FROM roles));
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('students_id_seq', (SELECT MAX(id) FROM students));
SELECT setval('parents_id_seq', (SELECT MAX(id) FROM parents));
SELECT setval('violations_id_seq', (SELECT MAX(id) FROM violations));
SELECT setval('incident_reports_id_seq', (SELECT MAX(id) FROM incident_reports));
SELECT setval('behavior_points_id_seq', (SELECT MAX(id) FROM behavior_points));
SELECT setval('hearings_id_seq', (SELECT MAX(id) FROM hearings));
SELECT setval('sanctions_id_seq', (SELECT MAX(id) FROM sanctions));
SELECT setval('clearance_holds_id_seq', (SELECT MAX(id) FROM clearance_holds));
SELECT setval('reformation_programs_id_seq', (SELECT MAX(id) FROM reformation_programs));
SELECT setval('sms_logs_id_seq', (SELECT MAX(id) FROM sms_logs));
SELECT setval('audit_logs_id_seq', (SELECT MAX(id) FROM audit_logs));