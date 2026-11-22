# NavJyoti project instructions

## Architecture and commands

- The API is FastAPI/SQLAlchemy under `backend/`; React/Vite UI code is under `frontend/`.
- Keep API handlers and existing response shapes compatible with `frontend/src/services/backendApi.js` and `docs/API_CONTRACT.md`.
- Run backend tests from `backend/` with `python run_tests.py`; run pytest-only tests with `pytest -q tests/`.
- Run the frontend production build from `frontend/` with `npm run build`.

## Backend safety

- Derive the authenticated role and user ID from the database-backed bearer token. Never authorize from request-body roles, parent IDs, worker IDs, or jurisdiction values.
- Before returning or changing a child record, verify parent ownership, worker assignment, or the supervisor's exact configured jurisdiction. Supervisors are read-only; there is no authorized transfer workflow, so do not change child assignments or jurisdiction.
- Add clinical audit events through `record_audit_event()` in the same SQLAlchemy transaction as the clinical change. Keep audit payloads free of credentials and direct personal identifiers.
- Keep audit-log retrieval supervisor-only and jurisdiction-scoped. Preserve the audit user foreign key's `ON DELETE RESTRICT`.
- Do not add schema creation to application startup. Add reviewed, idempotent migrations for schema changes; never execute migrations against production from an agent task.
- Tests must use isolated SQLite or a dedicated test database. The PostgreSQL end-to-end suite requires `NAVJYOTI_TEST_DATABASE_URL` with a database name containing `test`; never point it at production Neon.

## KIDZY AI and frontend

- Keep Groq calls server-side and read credentials only from `GROQ_API_KEY`. The backend must send only canonical, general-topic prompts to Groq, never raw user messages, history, page values, or child records.
- Preserve English and Hindi/Hinglish support and existing chat routes while keeping provider errors user-safe and credentials out of logs.
- Avoid frontend changes unless needed for backend compatibility; preserve teammate-owned portal work and the KIDZY chat integration.
- Configure additional browser origins through `CORS_ORIGINS`; do not use wildcard origins with credentials.
