# Production Deployment Security & SMS Gateway Guide
**Prefect Disciplinary Action System (PDS)**  
*St. Agnes Academy of Caloocan Inc.*

---

## 1. Executive Summary & Security Posture
The Prefect Disciplinary Action System is engineered for mission-critical school disciplinary records, case proceedings, and real-time parent notifications. The application implements defense-in-depth across the API, database, authentication, and SMS gateway layers.

| Security Domain | Implementation | Production Status |
| :--- | :--- | :--- |
| **Authentication** | Supabase Auth API Bearer JWT (`/auth/v1/user`) + UUID format validation | **Enforced & Hardened** |
| **Authorization** | Strict Role-Based Access Control (`RBACMiddleware`) per microservice route | **Enforced** |
| **SQL Injection** | 100% Prepared Statements via PDO with strictly typed/parameterized queries | **Enforced** |
| **Mass Assignment** | Strict constant whitelist arrays across all service operations | **Enforced** |
| **Error Sanitization** | Fail-closed exception handlers; zero stack trace leakage to clients | **Enforced** |
| **Rate Limiting** | Automated token bucket rate limiter per client IP and route category | **Enforced** |
| **HTTP Headers** | `X-Content-Type-Options`, `X-Frame-Options: DENY`, `X-XSS-Protection`, `Referrer-Policy`, `HSTS` | **Enforced** |
| **SMS Gateway** | Semaphore SMS API v4 with Philippine E.164 normalization, fail-safe isolation, delivery tracking | **Enforced** |

---

## 2. Semaphore SMS Gateway Integration & Setup

### A. Environment Configuration
Set the following keys in your secure production `.env` file:
```env
# Semaphore SMS Gateway
SEMAPHORE_API_KEY=your_live_semaphore_api_key_here
SEMAPHORE_SENDER_NAME=STAGNES
SEMAPHORE_WEBHOOK_SECRET=your_optional_webhook_secret
```

### B. Sandbox vs Production Behavior
- **Sandbox Mode (`SEMAPHORE_DEMO_API_KEY` or empty)**:
  - Dispatches are automatically simulated with simulated Message IDs (`SIM-1726750000-1234`).
  - SMS records are logged to `sms_logs` with status `Simulated`.
  - Account balance reports simulated 500 SMS credits.
- **Production Mode (Live Key)**:
  - Dispatches real SMS to Philippine mobile numbers via Semaphore v4 API (`https://api.semaphore.co/api/v4/messages`).
  - Supports telecom networks: Globe, Smart, TNT, TM, DITO.
  - Queries live delivery receipts (`/api/v4/messages/{id}`) and updates status to `Delivered` or `Failed`.

### C. Philippine Mobile Number Formatting
The service automatically normalizes all of the following formats into the standard 11-digit format `09XXXXXXXXX`:
- `+639171234567`
- `639171234567`
- `0917-123-4567`
- `0917 123 4567`
- `9171234567`

---

## 3. Automated Event-Driven Parent Alert Triggers

The system automatically dispatches parent SMS notifications upon the following events:

1. **Incident Recorded**:
   - Dispatches notice containing student name, violation category, and incident date.
   - Message: `"ST. AGNES ACADEMY NOTICE: An incident ({title}) involving {name} was recorded on {date}. Please contact the Prefect Office."`
2. **Disciplinary Hearing Scheduled**:
   - Dispatches formal hearing summons.
   - Message: `"ST. AGNES ACADEMY SUMMONS: Disciplinary hearing for {name} is scheduled on {date} at {time} ({venue}). Guardian presence is required."`
3. **Formal Sanction Issued**:
   - Dispatches sanction details (Suspension, Detention, Community Service).
   - Message: `"ST. AGNES ACADEMY NOTICE: Sanction issued for {name}: {type} effective {start_date}. Please coordinate with the Prefect Office."`
4. **Clearance Hold Flagged**:
   - Dispatches urgent notice of blocked school clearance.
   - Message: `"ST. AGNES ACADEMY ALERT: {name} has an active Clearance Hold ({reason}). Please resolve pending obligations at the Prefect Office."`
5. **Reformation Program Assigned**:
   - Dispatches corrective program details and required hours.
   - Message: `"ST. AGNES ACADEMY NOTICE: {name} has been enrolled in {program} ({hours} hrs). Please report to Guidance/Prefect Office."`

*Note: All event-driven SMS dispatches are wrapped in non-blocking fail-safe blocks so that any telecom gateway latency or network hiccup never interrupts database commits.*

---

## 4. Production Deployment Checklist

### 1. Web Server & SSL/TLS Configuration
- [ ] Configure HTTPS with valid SSL/TLS certificates (e.g. Let's Encrypt / DigiCert).
- [ ] Ensure Apache / Nginx redirects all HTTP (Port 80) traffic to HTTPS (Port 443).
- [ ] Ensure `.env` and `*.sqlite` files are explicitly blocked by the web server config.

### 2. Environment Variables (.env)
- [ ] Set `APP_ENV=production`
- [ ] Set `DB_DRIVER=pgsql`
- [ ] Provide Supabase production PostgreSQL connection string (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSLMODE=require`).
- [ ] Provide valid Supabase credentials (`SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_KEY`).
- [ ] Provide production `SEMAPHORE_API_KEY` and registered `SEMAPHORE_SENDER_NAME`.
- [ ] Set `ALLOWED_ORIGINS` to the exact school domain (e.g., `https://prefect.stagnes.edu.ph`).

### 3. Database Security
- [ ] Database credentials must use SSL (`sslmode=require`).
- [ ] Run initial schema from `database/schema.sql`.
- [ ] Verify that `audit_logs` and `sms_logs` indexes are created.

### 4. Application Rate Limiting
- [ ] `RateLimitMiddleware` automatically enforces:
  - Max 20 SMS sends / min per IP
  - Max 15 auth attempts / min per IP
  - Max 150 general API requests / min per IP

---

## 5. Security Verification & Test Execution
Execute the automated security test suite on the production server:
```bash
php test_security.php
```
Verify that all test suites pass with 0 failures before opening access to institutional users.
