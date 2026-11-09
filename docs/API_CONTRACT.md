# NavJyoti — Frontend API Service Contract & Backend Integration Specification

## 1. Overview
This document specifies the data models, REST endpoints, and authentication contracts required to transition **NavJyoti** from the current client-side prototype service (`src/services/api.js` & `storage.js`) to production backend services (FastAPI/PostgreSQL).

---

## 2. Authentication & RBAC Contract

### Supported Roles
1. `parent` — Caregiver managing linked children profiles.
2. `worker` — Frontline healthcare workers (ANM, ASHA, Anganwadi worker).
3. `supervisor` — Medical Officer In-Charge (MOIC) / District Health Authority.

### Endpoints
- `POST /api/v1/auth/login`
  - **Request Body**: `{ "identifier": "+91 98765 43210", "role": "parent", "password": "...", "otp": "..." }`
  - **Response**: `{ "user": { "id": "...", "role": "parent", "name": "...", "phone": "..." }, "token": "JWT_TOKEN" }`
- `POST /api/v1/auth/register`
  - **Request Body**: `{ "name": "Sunita Sharma", "phone": "+91 98765 43210", "village": "Rampur", "language": "hi", "consent": true }`
  - **Response**: `{ "user": { ... }, "token": "JWT_TOKEN" }`
- `POST /api/v1/auth/forgot-password`
  - **Request Body**: `{ "identifier": "+91 98765 43210" }`
  - **Response**: `{ "success": true, "message": "OTP dispatched to registered mobile." }`
- `PUT /api/v1/auth/profile`
  - **Request Body**: `{ "name": "Sunita Sharma", "phone": "...", "village": "..." }`
  - **Response**: `{ "user": { ... } }`

---

## 3. Child Health Records Contract

### Entity Schema
```json
{
  "id": "NJ-2024-0891",
  "name": "Aarav Sharma",
  "dob": "2024-03-15",
  "gender": "Male",
  "bloodGroup": "B+",
  "birthWeightKg": 3.2,
  "ageMonths": 8,
  "caregiverId": "usr_parent_01",
  "caregiverName": "Sunita Sharma",
  "caregiverPhone": "+91 98765 43210",
  "village": "Rampur",
  "subCentre": "Rampur Sub-Centre",
  "phc": "Bilaspur Primary Health Centre",
  "assignedWorker": "Rekha Devi (ANM)",
  "priorityLevel": "amber",
  "migrationStatus": "resident",
  "qrToken": "tok_aarav_0891_sec",
  "doses": [],
  "milestones": [],
  "growthRecords": [],
  "visitHistory": []
}
```

### Endpoints
- `GET /api/v1/children` — List children filtered by caregiver or worker jurisdiction.
- `GET /api/v1/children/:id` — Full 360° health record by child ID or QR token.
- `POST /api/v1/children` — Register a newborn or migrant child profile.
- `PUT /api/v1/children/:id` — Update demographic details, assigned worker, or migration status.

---

## 4. Universal Immunisation Programme (UIP) Contract

### Endpoints
- `GET /api/v1/vaccinations/schedule` — Return national UIP master schedule (0–5 years).
- `POST /api/v1/vaccinations/administer`
  - **Request Body**:
    ```json
    {
      "childId": "NJ-2024-0891",
      "vaccineId": "mr_1",
      "vaccineName": "MR 1",
      "batch": "MR-24-991",
      "facility": "Rampur Sub-Centre",
      "workerName": "Rekha Devi (ANM)",
      "site": "Right upper arm",
      "dateAdministered": "2024-12-15",
      "notes": "Verified dose"
    }
    ```
  - **Validation Rules**:
    - Rejects duplicate dose recording for the same child and vaccine stage.
    - Recalculates administrative priority (red/amber/green) deterministically.

---

## 5. Developmental Milestones Contract

### Endpoints
- `GET /api/v1/milestones/schedule` — Returns age bands (0–2m, 2–4m, 6–9m, 9–12m, etc.) and domains.
- `POST /api/v1/milestones/observe`
  - **Request Body**:
    ```json
    {
      "childId": "NJ-2024-0891",
      "milestoneId": "m_6_1",
      "domain": "motor",
      "title": "Sits without support",
      "status": "recorded",
      "notes": "Child sits steadily during play"
    }
    ```

---

## 6. Appointments & Field Visits Contract

### Endpoints
- `GET /api/v1/appointments` — Fetch appointments for active caregiver or assigned ANM.
- `POST /api/v1/appointments`
  - **Request Body**:
    ```json
    {
      "childId": "NJ-2024-0891",
      "childName": "Aarav Sharma",
      "caregiverName": "Sunita Sharma",
      "caregiverPhone": "+91 98765 43210",
      "requestedDate": "2024-11-20",
      "timeSlot": "10:30 AM",
      "visitType": "home_visit",
      "purpose": "Routine 9-Month Vaccine Session"
    }
    ```
  - **Validation Rules**:
    - Disallows dates in the past (`requestedDate < CURRENT_DATE`).
    - Disallows duplicate active requests for the same child on the same date.
- `PUT /api/v1/appointments/:id/status` — Accept, complete, reschedule, or cancel visit.

---

## 7. Notifications & Communications Contract

### Endpoints
- `GET /api/v1/notifications` — Retrieve user notifications.
- `PUT /api/v1/notifications/:id/read` — Mark notification as read.
- `PUT /api/v1/notifications/read-all` — Mark all as read.
- `DELETE /api/v1/notifications/:id` — Dismiss notification.
- `POST /api/v1/communications/send`
  - **Request Body**:
    ```json
    {
      "recipientName": "Sunita Sharma",
      "recipientPhone": "+91 98765 43210",
      "childId": "NJ-2024-0891",
      "message": "...",
      "type": "due_soon"
    }
    ```

---

## 8. Supervisor Analytics Contract

### Endpoints
- `GET /api/v1/analytics/supervisor?village=...&worker=...`
  - **Response**:
    ```json
    {
      "totalChildren": 424,
      "fullyImmunisedCount": 346,
      "coverageRate": 81,
      "overdueDosesCount": 27,
      "villageBreakdown": [
        { "village": "Rampur", "cohort": 184, "fullyImmunised": 156, "coverage": 84, "dropOutRate": 3.2, "overdue": 8 }
      ],
      "workerWorkload": [
        { "name": "Rekha Devi (ANM)", "assignedChildren": 184, "pendingVisits": 4, "urgentFollowups": 8 }
      ]
    }
    ```

---

## 9. Next Stage Backend Implementation Checklist
- [ ] Set up FastAPI project with Alembic migrations and PostgreSQL.
- [ ] Implement JWT authentication with HTTP-only secure cookie support.
- [ ] Connect SMS gateway (NIC SMS / CDAC Mobile Seva / Twilio).
- [ ] Map PostgreSQL models to match `INITIAL_CHILDREN` and `UIP_SCHEDULE`.
- [ ] Swap `src/services/api.js` local calls with `axios` or native `fetch` requests pointing to `VITE_API_BASE_URL`.
