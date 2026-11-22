# NavJyoti — Database & Infrastructure Handoff Guide

**Document Purpose:** This document provides the engineering teammate with complete, actionable instructions to connect PostgreSQL, execute migrations, configure live SMTP/SMS gateways, and transition NavJyoti from development mock fixtures to a production PostgreSQL database.

---

## 1. System Architecture & Prerequisites

The NavJyoti backend is implemented in **Python 3.12+ / FastAPI / SQLAlchemy 2.0 / Pydantic v2**.
The frontend is built with **React 19 / Vite / Tailwind CSS v4**.

- **Backend Directory:** `/backend`
- **Frontend Directory:** `/frontend`
- **Database Engine:** PostgreSQL (including Neon). SQLite in-memory databases are used for isolated tests.
- **KIDZY AI:** Groq credentials are backend-only environment variables; never configure them as `VITE_*` variables.

---

## 2. Environment Variables Configuration

Create a `.env` file in `/backend` using `/backend/.env.example` as a template:

```env
# Database Connection URL (use the value supplied by Neon in production)
DATABASE_URL=<NEON_POSTGRES_CONNECTION_URL>

# Application Security
# Generate with: python -c "import secrets; print(secrets.token_hex(32))"
JWT_SECRET_KEY=your_generated_64_character_hex_secret_key_here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60

# Environment Mode
ENVIRONMENT=production

# Additional CORS origins (comma-separated, no wildcard)
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,https://navjyoti-web.vercel.app

# KIDZY AI (backend only)
GROQ_API_KEY=<BACKEND_SECRET>
GROQ_MODEL=llama-3.3-70b-versatile

# Live Email Delivery for Staff OTP (optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=no-reply@navjyoti.gov.in
SMTP_USE_TLS=true
```

### Frontend Configuration (`/frontend/.env`):
```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

---

## 3. Database Migration Instructions

Migrations are reviewed SQL files; the application does not apply them automatically.
`002_add_auth_clinical_qr_features.sql` and `003_add_audit_logs_and_jurisdiction.sql`
have already been applied to Neon production. Do not execute either migration again
against production. Preserve the `ON DELETE RESTRICT` foreign key on
`audit_logs.user_id` in migration 003.

Migration `004_prevent_duplicate_vaccinations.sql` adds a unique index for
normalized child/vaccine-stage pairs. It has not been applied to production. Before
any deployment, inspect the target database for duplicate child/vaccine pairs and
review the migration plan; do not apply it without explicit approval and a backup.
The migration intentionally fails rather than deleting or resolving existing rows.

For a future approved schema change, first confirm the target is an isolated
environment, take and verify a backup, inspect the target schema and duplicate
data, and review the exact SQL. Do not copy production credentials into test
commands or run destructive/down migrations against Neon. Prefer a reviewed
fix-forward migration for deployed data. Never use `create_tables.py` in production.

---

## 4. Live SMTP & SMS Gateway Activation

### 4.1 Email Service (`backend/email_service.py`)
- The backend contains an abstract `EmailProvider` interface.
- `SMTPEmailProvider` is already implemented. Once `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASSWORD` are configured, worker OTP verification emails dispatch through live SMTP.
- If SMTP credentials are absent, the application logs a safe warning to console and functions without crashing.

### 4.2 SMS Gateway Integration (`backend/main.py` -> `POST /communications`)
- Frontline health worker reminders use `POST /communications`.
- The current route records a simulated communication; it does not dispatch a real SMS. Integrate and review a provider before representing a message as delivered.

---

## 5. Running and Verifying the Integration

### 5.1 Run Isolated Automated Tests
```bash
cd backend
python run_tests.py
```

The PostgreSQL end-to-end suite is opt-in and requires a separate
`NAVJYOTI_TEST_DATABASE_URL` whose database name contains `test`; it refuses to
use the configured application database. Never point it at Neon production.
Without that variable the PostgreSQL suite is skipped. SQLite tests do not require
database credentials.

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
