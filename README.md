# Prefect Disciplinary Action System

**BSIT Capstone Project:** Development of an Incident Report and Disciplinary Proceedings Management System for School Prefects with SMS-Based Parent Alerts  
**Client:** St. Agnes Academy of Caloocan Inc. (Private High School)  

---

## 🏗️ Architecture & Environments

### Local Development Environment
- **Web Server:** XAMPP (Apache / localhost)
- **Language:** PHP 8+
- **Database:** Supabase PostgreSQL (or SQLite for local offline development)
- **Frontend:** Vanilla JavaScript SPA
- **SMS Gateway:** Semaphore SMS API (Sandbox Simulation mode)

### Production Deployment Target
- **Hosting Provider:** **HostForge** (Apache / PHP Server)
- **Database:** **Supabase PostgreSQL** (Cloud Database)
- **Authentication:** **Supabase Auth / Bearer JWT**
- **SMS Gateway:** **Semaphore SMS API v4** (Live Production Key)
- **Architecture Flow:**
  ```
  GitHub Repository → HostForge (PHP 8 / Apache) → Supabase PostgreSQL & Auth / Semaphore SMS API
  ```

---

## 🌟 Features & Implemented Modules

1. **Dashboard**: Live KPI metrics, violation category distribution, pending hearings, active clearance holds, and recent incident logs.
2. **Student Records**: Comprehensive High School student directory with guardian emergency contacts and conduct standing.
3. **Infraction Logging**: Detailed incident report filing with evidence notes, witness entries, and automated parent alert triggers.
4. **Behavior Monitoring**: Conduct point score tracking with risk tier indicators (Low, Moderate, High Risk).
5. **Violation Category Setup**: Offense taxonomy management (Minor, Major, Severe) with standardized demerit points.
6. **Sanction Management**: Warning letters, detention, and suspension penalties tracking.
7. **Parent Notification Tool**: Outgoing SMS alert log and Semaphore SMS API gateway integration layer.
8. **Disciplinary Hearing Schedule**: Hearing calendar, board member assignments, and decision outcome logs.
9. **Clearance Hold Flagging**: Lock student clearance for enrollment or graduation based on active disciplinary cases.
10. **Incident Report Generation**: Printable official Incident Report form with St. Agnes Academy crest branding.
11. **Behavior Points Tracking**: Conduct ledger for merit score awards and demerit penalties.
12. **Reformation Program Assignment**: Counseling, reflection tasks, and community service hour tracking.
13. **Reports & Analytics**: Interactive trend graphs, PDF summary reports, and Excel/CSV data exports.
14. **User Management**: RBAC permission management for Administrator, Prefect, Guidance, and Principal.
15. **System Settings**: Academic year setup, point thresholds, and SMS API keys.
16. **Audit Logs**: Immutable system activity trail.

---

## 💻 Local Development Setup (XAMPP)

1. Place `prefect-disciplinary-system` in your XAMPP `htdocs` directory (`C:\xampp\htdocs\prefect-disciplinary-system`).
2. Start **Apache** in the XAMPP Control Panel.
3. Open `http://localhost/prefect-disciplinary-system/` in your browser.

---

## 🌐 Production Deployment (HostForge)

For production deployment instructions and configuration checklists for **HostForge**, refer to the detailed guide:
- [`documentation/PRODUCTION_SECURITY_DEPLOYMENT_GUIDE.md`](file:///c:/xampp/htdocs/prefect-disciplinary-system/documentation/PRODUCTION_SECURITY_DEPLOYMENT_GUIDE.md)
