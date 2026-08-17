# Prefect Disciplinary Action System - RESTful API Reference

**Client:** St. Agnes Academy of Caloocan Inc.  
**Base Endpoint:** `http://localhost/prefect-disciplinary-system/api.php`

---

## 1. Authentication Service (`?service=auth`)

### `POST ?service=auth&action=login`
Authenticates user against system database or Supabase Auth.
- **Request Body**: `{ "email": "admin@stagnes.edu.ph", "password": "Password123!" }`
- **Response**: `{ "status": "success", "data": { "token": "...", "user": {...} } }`

### `POST ?service=auth&action=logout`
Terminates user session.

---

## 2. Student Records Service (`?service=students`)

### `GET ?service=students`
Retrieves student profiles with parent/guardian contact details.
- **Query Params**: `search`, `grade_level`, `clearance_status`

### `POST ?service=students`
Creates new student profile and guardian contact record.

---

## 3. Incident Management Service (`?service=incidents`)

### `GET ?service=incidents`
Fetches logged disciplinary incidents.

### `POST ?service=incidents`
Logs new infraction incident report, calculates demerit point deduction, checks clearance hold thresholds, and queues SMS parent alert.

### `GET ?service=incidents&action=violations`
Retrieves offense taxonomy and demerit point definitions.

---

## 4. Disciplinary Proceedings Service (`?service=proceedings`)

### `GET ?service=proceedings&action=hearings`
Retrieves scheduled disciplinary hearings.

### `POST ?service=proceedings&action=hearings`
Schedules a formal hearing.

### `GET ?service=proceedings&action=sanctions`
Retrieves list of issued sanctions.

### `POST ?service=proceedings&action=clearance`
Flags or releases student clearance hold for enrollment/graduation.

---

## 5. Notification Service (`?service=notifications`)

### `GET ?service=notifications&action=logs`
Retrieves SMS audit log.

### `POST ?service=notifications&action=send`
Sends SMS alert to parent phone number via Semaphore SMS API Abstraction.

---

## 6. Reports & Analytics Service (`?service=reports`)

### `GET ?service=reports&action=dashboard`
Retrieves KPI statistics, recent incidents, and monthly trends.

### `GET ?service=reports&action=audit`
Retrieves system activity audit log.
