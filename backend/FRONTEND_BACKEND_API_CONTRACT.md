# NavJyoti — Frontend-to-Backend API Contract & Integration Specification

**Platform:** NavJyoti — Child Development, Immunisation & Healthcare Support Platform  
**Backend Framework:** FastAPI / PostgreSQL / SQLAlchemy 2.0  
**Authentication Standard:** 
- **Parents/Caregivers:** Mobile Number (`+91XXXXXXXXXX`) + Password (Email is optional)
- **Health Workers & Supervisors:** Registered Email + Secure 6-Digit One-Time Password (OTP) via Keyed HMAC-SHA256
- **Existing Staff / Admin:** Optional Email + Password fallback compatibility
**Security Standard:** Argon2 Password Hashing, Keyed HMAC-SHA256 OTP Hashes, Role-Based Access Control (RBAC)  

---

## 1. Authentication & Role-Based Access Control (RBAC)

The system supports three primary user roles:
1. `parent` — Caregivers managing linked children's healthcare and vaccination schedules.
2. `worker` — Frontline healthcare workers (ANMs, ASHAs) conducting field vaccinations, growth recording, and priority follow-ups.
3. `supervisor` — Medical Officers In-Charge (MOIC) and health authority supervisors reviewing aggregate health metrics.

### Authentication Headers
For all authenticated routes, the frontend client must supply the access token in the `Authorization` header:
```http
Authorization: Bearer <ACCESS_TOKEN>
```

---

## 2. Complete Endpoint Inventory & Specifications

### 2.1 Authentication & User Management

#### `POST /auth/register`
- **Feature:** Parent/Caregiver Registration (Option B: Mobile Number + Password)
- **Status:** **Implemented & Verified** (Indian mobile number validation, optional email)
- **Auth Required:** No (Public)
- **Allowed Roles:** Public (Always creates a `parent` role)
- **Request Body:**
  ```json
  {
    "name": "Sunita Sharma",
    "phone": "+91 98765 43210",
    "password": "SecurePassword123!",
    "village": "Rampur",
    "preferred_language": "hi",
    "consent": true,
    "email": null
  }
  ```
- **Phone Number Validation:**
  - Standardizes to canonical `+91XXXXXXXXXX` format.
  - Accepts `9876543210`, `+91 98765 43210`, `09876543210`.
  - Rejects numbers not starting with 6, 7, 8, 9 or invalid length.
- **Response Body (201 Created):**
  ```json
  {
    "id": 1,
    "name": "Sunita Sharma",
    "role": "parent",
    "phone": "+919876543210",
    "email": null,
    "village": "Rampur",
    "preferred_language": "hi",
    "consent": true,
    "worker_id": null
  }
  ```
- **Error Codes:**
  - `409 Conflict`: Mobile number or email already registered.
  - `422 Unprocessable Entity`: Invalid mobile number format, missing password (< 8 chars), or unaccepted consent.

---

#### `POST /auth/login`
- **Feature:** Authentication Login (Phone + Password for Parents; Email + Password for Staff)
- **Status:** **Implemented & Verified** (Supports both phone numbers and emails)
- **Auth Required:** No (Public)
- **Request Body (Parent Phone Login):**
  ```json
  {
    "identifier": "9876543210",
    "password": "SecurePassword123!"
  }
  ```
- **Request Body (Staff Email Login):**
  ```json
  {
    "identifier": "rekha.anm@navjyoti.gov.in",
    "password": "StaffPassword123!"
  }
  ```
- **Response Body (200 OK):**
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
    "token_type": "bearer",
    "role": "parent",
    "user": {
      "id": 1,
      "name": "Sunita Sharma",
      "role": "parent",
      "phone": "+919876543210",
      "email": null,
      "village": "Rampur",
      "preferred_language": "hi",
      "worker_id": null
    }
  }
  ```
- **Error Codes:**
  - `401 Unauthorized`: Invalid mobile number/email or incorrect password.

---

#### `POST /auth/otp/request`
- **Feature:** One-Time Password Request for Health Workers & Supervisors
- **Status:** **Implemented & Verified**
- **Auth Required:** No (Public)
- **Allowed Roles:** `worker`, `supervisor`
- **Request Body:**
  ```json
  {
    "email": "rekha.anm@navjyoti.gov.in",
    "role": "worker"
  }
  ```
- **Response Body (200 OK):**
  ```json
  {
    "message": "If rekha.anm@navjyoti.gov.in is registered as an authorized worker, a 6-digit verification code has been dispatched.",
    "cooldown_seconds": 60
  }
  ```
- **Security Protections:**
  - Anti-enumeration generic response.
  - 60-second resend cooldown (`HTTP 429` if re-requested within 60s).
  - Keyed HMAC-SHA256 OTP hashing before database storage.
  - 5-minute lifespan.

---

#### `POST /auth/otp/verify`
- **Feature:** Verify OTP & Issue Authenticated Session
- **Status:** **Implemented & Verified**
- **Auth Required:** No (Public)
- **Allowed Roles:** `worker`, `supervisor`
- **Request Body:**
  ```json
  {
    "email": "rekha.anm@navjyoti.gov.in",
    "role": "worker",
    "otp": "409218"
  }
  ```
- **Response Body (200 OK):**
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
    "token_type": "bearer",
    "role": "worker",
    "user": {
      "id": 2,
      "name": "Rekha Devi (ANM)",
      "email": "rekha.anm@navjyoti.gov.in",
      "role": "worker",
      "phone": "+919876512345",
      "worker_id": "ANM-UP-BLS-4019"
    }
  }
  ```
- **Security Guarantees:**
  - Constant-time keyed HMAC comparison.
  - Atomic single-use consumption (race-condition proof across concurrent workers).
  - Maximum 5 attempts allowed; increments attempt counter on failure.

---

#### `GET /auth/me`
- **Feature:** Current User Profile
- **Status:** **Working**
- **Auth Required:** Yes (`Bearer <token>`)

---

### 2.2 Child Health Records Management

#### `POST /children`
- **Feature:** Register Child Profile
- **Status:** **Enhanced & Verified**
- **Auth Required:** Yes (`Bearer <token>`)
- **Allowed Roles:** `parent` (self-registration), `worker` (field registration)
- **Request Body:**
  ```json
  {
    "name": "Aarav Sharma",
    "date_of_birth": "2024-03-15",
    "gender": "Male",
    "village": "Rampur",
    "blood_group": "B+",
    "birth_weight_kg": 3.1,
    "migration_status": "resident"
  }
  ```

---

#### `GET /children`
- **Feature:** List Children (Role-Filtered)
- **Status:** **Working**
- **Allowed Roles:** `parent` (own children), `worker` (assigned children), `supervisor` (all)

---

#### `GET /children/{id}`
- **Feature:** Retrieve Single Child 360° Record
- **Status:** **Implemented & Verified**
- **Allowed Roles:** Parent (own child), Worker (assigned or facility), Supervisor

---

#### `PATCH /children/{id}`
- **Feature:** Update Child Demographic or Clinical Information
- **Status:** **Implemented & Verified**
- **Allowed Roles:** `parent` (own child), `worker` (assigned child), `supervisor`

---

#### `GET /worker/children` & `GET /supervisor/children`
- **Feature:** Filtered Child Records for Healthcare Staff
- **Status:** **Working & Verified**

---

### 2.3 Universal Immunisation Programme (UIP) & Vaccinations

#### `GET /vaccinations/schedule`
- **Feature:** Official National UIP Master Schedule (0–5 Years)
- **Status:** **Implemented & Verified** (Public reference)

---

#### `GET /children/{id}/vaccinations`
- **Feature:** Child Vaccination History
- **Status:** **Working**

---

#### `PATCH /worker/vaccinations/{id}/complete`
- **Feature:** Complete Scheduled Dose
- **Status:** **Enhanced & Verified** (Batch, facility, worker name, site, notes)

---

#### `POST /worker/vaccinations/administer`
- **Feature:** Direct Dose Administration Entry
- **Status:** **Implemented & Verified** (Prevents duplicate completion with `HTTP 409`)

---

### 2.4 Milestones & Growth Records

#### `GET /children/{id}/milestones` & `POST /children/{id}/milestones`
- **Feature:** Developmental Milestone Observations
- **Status:** **Working & Verified**

---

#### `GET /children/{id}/growth` & `POST /children/{id}/growth`
- **Feature:** Child Growth Measurements (Weight & Height)
- **Status:** **Working & Verified**

---

### 2.5 Appointments & Follow-Ups

#### `POST /children/{id}/appointments`
- **Feature:** Request Appointment
- **Status:** **Working & Verified** (Date cannot be in the past)

---

#### `PATCH /worker/appointments/{id}`
- **Feature:** Worker Approve / Reschedule / Complete / Cancel
- **Status:** **Working & Verified**

---

#### `PATCH /appointments/{id}/cancel`
- **Feature:** Parent Appointment Cancellation
- **Status:** **Implemented & Verified**

---

#### `POST /children/{id}/follow-ups` & `PATCH /worker/follow-ups/{id}`
- **Feature:** Priority Administrative Follow-Ups
- **Status:** **Working & Verified**

---

### 2.6 Supervisor Analytics

#### `GET /supervisor/dashboard`
- **Feature:** Supervisor KPI Summary
- **Status:** **Verified (Strictly matches frontend contract: 6 non-negative numbers)**
- **Response Format:**
  ```json
  {
    "total_children": 42,
    "total_workers": 6,
    "total_vaccinations": 128,
    "completed_vaccinations": 104,
    "pending_followups": 3,
    "upcoming_appointments": 5
  }
  ```

---

### 2.7 Secure QR Health Pass & Resolver

#### `POST /children/{id}/qr-token`
- **Feature:** Generate Expiring QR Pass
- **Status:** **Implemented & Verified** (7-day UTC expiry, SHA-256 hashed storage)

---

#### `GET /records/lookup/{qr_token}`
- **Feature:** Public Health Resolver
- **Status:** **Implemented & Verified**
- **Security Guarantee:**
  - Returns **HTTP 404** if invalid, expired, or revoked.
  - **Zero Fallback**: Never discloses another child's record.
  - **Minimal PII**: Masked child identifier (`NJ-****-{id}`) and dose summary.
  - **Authority Attribution**: Explicitly identified as `"NavJyoti Health Record Platform"` (truth in verification, no unverified claims of national registry integration).
- **Response Body (200 OK):**
  ```json
  {
    "valid": true,
    "child_identifier": "NJ-****-1",
    "age_months": 12,
    "gender": "Female",
    "total_doses": 18,
    "administered_doses": 6,
    "verification_authority": "NavJyoti Health Record Platform",
    "expires_at": "2026-11-16T15:00:00Z"
  }
  ```

---

### 2.8 In-App Notifications & Communications

#### `GET /notifications` & `PATCH /notifications/{id}/read`
- **Feature:** In-App Notification System
- **Status:** **Implemented & Verified**

---

#### `POST /communications` & `GET /communications`
- **Feature:** Outreach Messaging Logs
- **Status:** **Implemented & Verified**

---

## 3. Exact Frontend Changes Required for Phase 3 Integration

*(Do not modify frontend files until Phase 3 integration begins)*

1. **`frontend/src/services/backendApi.js`**:
   - Update `register`:
     ```javascript
     register: (name, phone, password, village, language, consent, email) =>
       request("/auth/register", {
         method: "POST",
         body: JSON.stringify({
           name,
           phone,
           password,
           village: village || "Rampur",
           preferred_language: language || "hi",
           consent: Boolean(consent),
           email: email || undefined,
         }),
       }),
     ```
   - Update `login`:
     ```javascript
     login: (identifier, password) =>
       request("/auth/login", {
         method: "POST",
         body: JSON.stringify({ identifier, password }),
       }),
     ```
   - Add OTP methods:
     ```javascript
     requestOtp: (email, role) =>
       request("/auth/otp/request", {
         method: "POST",
         body: JSON.stringify({ email, role }),
       }),
     verifyOtp: (email, role, otp) =>
       request("/auth/otp/verify", {
         method: "POST",
         body: JSON.stringify({ email, role, otp }),
       }),
     ```

2. **`frontend/src/pages/auth/RegisterPage.jsx`**:
   - Add a `Password` input field (min 8 chars) to the form so caregivers choose a password during registration.
   - On submit, call `registerCaregiver({ name, phone, password, village, language, consent })`.

3. **`frontend/src/pages/auth/LoginPage.jsx`**:
   - For `selectedRole === 'parent'`: change input label from "Email Address" to "Mobile Number", with placeholder `"Enter registered mobile number"`.
   - For `selectedRole === 'worker'` or `'supervisor'`: provide email input with OTP flow (Request OTP -> Enter 6-digit OTP -> Verify).

4. **`frontend/src/contexts/HealthDataContext.jsx`**:
   - Connect the currently disconnected helper methods:
     - `updateChild(id, patch)` -> `PATCH /children/{id}`
     - `administerDose(childId, vaccineId, details)` -> `POST /worker/vaccinations/administer`
     - `recordMilestoneObservation(childId, data)` -> `POST /children/{childId}/milestones`
     - `cancelAppointment(id, reason)` -> `PATCH /appointments/{id}/cancel`
     - `updateFollowUp(id, status)` -> `PATCH /worker/follow-ups/{id}`
     - `sendSimulatedMessage(commData)` -> `POST /communications`

---

## 4. Automated Test Verification Summary

- **Total Tests Executed:** 37
- **Passed:** 37
- **Failed / Errored:** 0
- **Execution Time:** ~3.0s
- **Breakdown by Test File:**
  - `backend/tests/test_api_integration.py` (11 tests): Registration, Duplicate Rejection, Password Login, Auth Me, Worker OTP, Child Isolation, UIP Schedule & Dose Administration, Appointments & Cancellation, Supervisor Analytics, QR Pass & Strict Lookup.
  - `backend/tests/test_auth_security.py` (5 tests): Missing Secret Safe Failure, Valid Token Creation & Decoding, Expired Token Rejection, Argon2 Hashing & Verification, Tampered Token Rejection.
  - `backend/tests/test_models.py` (5 tests): User & Child Relations, Clinical Vaccination & Growth Models, OTP Record Persistence, QR Token Records, Notifications & Communications.
  - `backend/tests/test_otp_service.py` (8 tests): Unknown Account Anti-Enumeration, Valid Dispatch, Cooldown Enforcement (HTTP 429), Verification Success, Failed Attempt Counting, Expired OTP Rejection, Role Mismatch Protection, Email Provider Failure Handling.
  - `backend/tests/test_phone_auth.py` (8 tests): Indian Mobile Number Normalization Variations, Invalid Mobile Format Rejections, Parent Phone+Password Registration, Duplicate Phone Rejection (HTTP 409), Parent Login via Phone & Password, Legacy Staff/Parent Email Compatibility, Multiple Null Email Persistence (PostgreSQL standard), Legacy Null-Phone Account Compatibility.

