# HostForge Production Deployment Guide
**Prefect Disciplinary Action System (PDS)**  
*St. Agnes Academy of Caloocan Inc.*

---

## 1. Production Architecture Overview

```
GitHub Repository (clarencejacobcastillo07/prefect-disciplinary-system)
   ↓
HostForge Apache / PHP Server (Production Web Host)
   ↓
PHP Application Layer
   ├── Supabase PostgreSQL Cloud Database (Port 5432, SSL required)
   ├── Supabase Auth API (Bearer JWT /auth/v1/user)
   └── Semaphore SMS API v4 (https://api.semaphore.co/api/v4)
```

- **Target Web Host:** HostForge
- **Production Domains:** `stagnesacademy-sms.com` / `prefect.sms.school`
- **Database:** Supabase PostgreSQL Cloud Database
- **Authentication:** Supabase Auth & Bearer JWT Token Verification
- **SMS Gateway:** Semaphore SMS API v4

---

## 2. HostForge Manual Configuration Checklist

Follow this step-by-step checklist when setting up your application in HostForge:

1. **Connect GitHub Repository**:
   - Authorize HostForge to access your GitHub account (`clarencejacobcastillo07@gmail.com`).
   - Select repository: `prefect-disciplinary-system` (Branch: `main`).

2. **Configure PHP Runtime**:
   - Set PHP Version to **PHP 8.1+** or **PHP 8.2+**.
   - Enable required PHP extensions: `pdo`, `pdo_pgsql`, `curl`, `json`, `mbstring`, `openssl`.

3. **Configure Environment Variables in HostForge Dashboard**:
   Add the following environment variables in your HostForge site settings:

   ```env
   # Application Environment
   APP_ENV=production
   APP_DEBUG=false
   APP_NAME="St. Agnes Academy"

   # Domain & CORS Configuration
   FRONTEND_URL=https://prefect.sms.school
   ALLOWED_ORIGINS=https://prefect.sms.school,https://stagnesacademy-sms.com

   # Supabase Cloud Database Connection (PostgreSQL)
   DB_DRIVER=pgsql
   SUPABASE_DB_HOST=aws-0-ap-northeast-2.pooler.supabase.com
   SUPABASE_DB_PORT=5432
   SUPABASE_DB_NAME=postgres
   SUPABASE_DB_USER=postgres.pgjzryisriyjsqjgwsxa
   SUPABASE_DB_PASSWORD=your_supabase_db_password_here

   # Supabase Auth Configuration
   SUPABASE_URL=https://pgjzryisriyjsqjgwsxa.supabase.co
   SUPABASE_ANON_KEY=your_supabase_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

   # Semaphore SMS API Gateway Configuration
   SEMAPHORE_API_KEY=your_live_semaphore_api_key_here
   SEMAPHORE_SENDER_NAME=STAGNES
   ```

4. **Configure Document Root & Apache Rewrite Rules**:
   - Upload/deploy the root project folder.
   - The root `.htaccess` file automatically enforces file protection (`.env`, `.sqlite`, `.log`, `.git` blocked) and sets security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).

5. **Configure Domain & SSL/TLS Certificate**:
   - Assign domain `stagnesacademy-sms.com` or `prefect.sms.school` in HostForge settings.
   - Enable Let's Encrypt SSL/TLS Certificate for HTTPS.

6. **Verify Outbound Network Connectivity**:
   - Verify outbound HTTPS access to Supabase (`https://*.supabase.co`) and Semaphore (`https://api.semaphore.co`).
   - Verify outbound TCP port 5432 connection to Supabase database host (`aws-0-ap-northeast-2.pooler.supabase.com`).

---

## 3. Post-Deployment Security Verification

After deploying on HostForge, test the security and configuration by running:
```bash
php test_security.php
```
Ensure all 46 automated security tests pass with zero failures.
