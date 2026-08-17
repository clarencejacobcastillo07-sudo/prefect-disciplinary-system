# St. Agnes Academy - Setup & Installation Guide

## System Name
**Prefect Disciplinary Action System**

## Technology Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6 SPA Router, Modern Dark + Pink UI)
- **Backend**: PHP 8+ (Microservice-Inspired Modular Architecture)
- **Database**: Supabase PostgreSQL
- **Web Server**: Apache / XAMPP (`localhost`)

---

## 1. Local Deployment under XAMPP

1. **Copy Project Directory**:
   Copy the `prefect-disciplinary-system` folder to your XAMPP `htdocs` folder:
   `C:\xampp\htdocs\prefect-disciplinary-system`

2. **Start Apache Server**:
   Open XAMPP Control Panel and start **Apache** (and optionally **MySQL** / **PostgreSQL**).

3. **Access Application**:
   Open your browser and navigate to:
   `http://localhost/prefect-disciplinary-system/` or `http://localhost/prefect-disciplinary-system/frontend/login.html`

---

## 2. PostgreSQL / Supabase Database Setup

1. **Import Database Schema**:
   Open pgAdmin or Supabase SQL Editor and execute:
   - [schema.sql](file:///C:/Users/pc/.gemini/antigravity-ide/scratch/prefect-disciplinary-system/database/schema.sql)
   - [seeders.sql](file:///C:/Users/pc/.gemini/antigravity-ide/scratch/prefect-disciplinary-system/database/seeders.sql)

2. **Configure Database Credentials**:
   Edit `backend/config/database.php` or set environment variables:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=prefect_disciplinary_db
   DB_USER=postgres
   DB_PASS=postgres
   ```

---

## 3. User Credentials for Demonstration

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@stagnes.edu.ph` | `Password123!` | Full System & RBAC Access |
| **Prefect Officer** | `prefect@stagnes.edu.ph` | `Password123!` | Infractions, Hearings, Sanctions, Clearance |
| **Guidance Counselor**| `guidance@stagnes.edu.ph` | `Password123!` | Behavior, Reformation, Hearings |
| **Principal** | `principal@stagnes.edu.ph` | `Password123!` | Executive Review, Analytics, Reports |
