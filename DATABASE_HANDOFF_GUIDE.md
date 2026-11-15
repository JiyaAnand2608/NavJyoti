# NavJyoti — Database & Infrastructure Handoff Guide

**Document Purpose:** This document provides the engineering teammate with complete, actionable instructions to connect PostgreSQL, execute migrations, configure live SMTP/SMS gateways, and transition NavJyoti from development mock fixtures to a production PostgreSQL database.

---

## 1. System Architecture & Prerequisites

The NavJyoti backend is implemented in **Python 3.12+ / FastAPI / SQLAlchemy 2.0 / Pydantic v2**.
The frontend is built with **React 19 / Vite / Tailwind CSS v4**.

- **Branch:** `feature/navjyoti-backend` (Verified Commit: `e514811f7e60d7f1b980981a16a0f72d53a165bd`)
- **Backend Directory:** `/backend`
- **Frontend Directory:** `/frontend`
- **Current Database Engine:** PostgreSQL 16 (Compatible with local PostgreSQL service, cloud PostgreSQL like Neon/Supabase/RDS, and self-contained embedded PostgreSQL via `pgserver`). SQLite in-memory engine retained exclusively for isolated unit tests.
- **Test Suite Status:** 43/43 passing automated tests (37 core integration/unit tests + 6 live PostgreSQL end-to-end integration tests).

---

## 2. Environment Variables Configuration

Create a `.env` file in `/backend` using `/backend/.env.example` as a template:

```env
# Database Connection URL (PostgreSQL 14+)
DATABASE_URL=postgresql+psycopg://postgres:<PASSWORD>@localhost:5432/navjyoti

# Application Security
# Generate with: python -c "import secrets; print(secrets.token_hex(32))"
JWT_SECRET_KEY=your_generated_64_character_hex_secret_key_here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60

# Environment Mode
ENVIRONMENT=production

# CORS Allowed Origins
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,https://navjyoti-web.vercel.app

# Live Email Delivery for Staff OTP (Optional - Falls back to console log warning if unconfigured)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_team_alerts@navjyoti.gov.in
SMTP_PASSWORD=your_app_specific_password
FROM_EMAIL=no-reply@navjyoti.gov.in
```

### Frontend Configuration (`/frontend/.env`):
```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

---

## 3. Database Migration Instructions

The schema migration is transaction-wrapped in:
`backend/migrations/002_add_auth_clinical_qr_features.sql`

### Step 3.1: Pre-Migration Backup (Mandatory on existing DB)
```bash
pg_dump -U postgres -h localhost -p 5432 -d navjyoti -F c -b -v -f "navjyoti_backup_$(date +%Y%m%d_%H%M%S).dump"
```

### Step 3.2: Inspect Target Database
Before applying, ensure the target database exists:
```sql
SELECT current_database(), current_user, version();
```

### Step 3.3: Apply UP Migration
Execute the SQL script via `psql`:
```bash
psql -U postgres -h localhost -p 5432 -d navjyoti -f backend/migrations/002_add_auth_clinical_qr_features.sql
```
*Key schema modifications applied:*
- `ALTER TABLE users ALTER COLUMN email DROP NOT NULL;` (Supports phone-only parent registration).
- `ALTER TABLE users ADD CONSTRAINT uq_users_phone UNIQUE (phone);` (Enforces canonical `+91XXXXXXXXXX` uniqueness).
- Adds `village`, `preferred_language`, `worker_id`, `consent` to `users`.
- Adds `gender`, `village`, `blood_group`, `birth_weight_kg`, `migration_status`, `priority_level` to `children`.
- Adds `batch_number`, `facility`, `worker_name`, `site`, `notes` to `vaccinations`.
- Creates `otp_records` table (HMAC-SHA256 OTPs, single-use `is_used`, `attempts` counter, rate limiting cooldown).
- Creates `notifications`, `communications`, and `qr_token_records` tables with foreign key cascades and indexes.

### Step 3.4: Rollback Strategy
- The DOWN migration script is commented out at the bottom of `002_add_auth_clinical_qr_features.sql`.
- **Destructive Down Migration:** Only uncomment and execute if aborting an immediate deployment before any production records have been created.
- **Live Data Recovery:** If user data has already been collected, use a fix-forward migration or restore from the `.dump` backup via `pg_restore`.

---

## 4. Live SMTP & SMS Gateway Activation

### 4.1 Email Service (`backend/email_service.py`)
- The backend contains an abstract `EmailProvider` interface.
- `SMTPEmailProvider` is already implemented. Once `SMTP_SERVER`, `SMTP_USERNAME`, and `SMTP_PASSWORD` are defined in `.env`, worker OTP verification emails will automatically dispatch through live SMTP.
- If SMTP credentials are absent, the application logs a safe warning to console and functions without crashing.

### 4.2 SMS Gateway Integration (`backend/main.py` -> `POST /communications`)
- Frontline health worker reminders use `POST /communications`.
- To attach a real SMS provider (e.g. CDAC Mobile Seva / NIC SMS Gateway / Twilio), add the provider dispatch call inside `create_communication_log` in `backend/main.py`.

---

## 5. Running and Verifying the Integration

### 5.1 Run Automated Tests (All 43 Tests)
```bash
cd backend
.venv\Scripts\python run_tests.py
```
*(All 43 unit, API security, phone auth, and PostgreSQL end-to-end integration tests execute in ~3.8 seconds and report OK).*

### 5.2 Start Backend Server
```bash
cd backend
.venv\Scripts\uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### 5.3 Verify Database Connection
Navigate to `http://127.0.0.1:8000/db-check`:
- Connected response: `{"database": "connected"}`
- Health check: `{"status": "ok", "project": "NavJyoti"}`

### 5.4 Build & Preview Frontend
```bash
cd frontend
npm run build
npm run preview
```
*(Frontend builds with Vite in ~11s without errors).*
