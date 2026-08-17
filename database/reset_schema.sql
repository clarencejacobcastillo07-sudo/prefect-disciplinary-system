-- =============================================================================
-- DESTRUCTIVE DATABASE RESET SCRIPT (DEVELOPMENT / STAGING ONLY)
-- Prefect Disciplinary Action System - St. Agnes Academy of Caloocan Inc.
--
-- WARNING: Executing this script WILL DESTROY ALL EXISTING DATA in the database!
-- DO NOT RUN THIS SCRIPT ON A PRODUCTION DATABASE CONTAINING REAL DATA.
-- =============================================================================

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS sms_logs CASCADE;
DROP TABLE IF EXISTS reformation_programs CASCADE;
DROP TABLE IF EXISTS clearance_holds CASCADE;
DROP TABLE IF EXISTS sanctions CASCADE;
DROP TABLE IF EXISTS hearings CASCADE;
DROP TABLE IF EXISTS behavior_points CASCADE;
DROP TABLE IF EXISTS incident_reports CASCADE;
DROP TABLE IF EXISTS violations CASCADE;
DROP TABLE IF EXISTS parents CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
