/**
 * NavJyoti Unified Backend API Client
 * 
 * Implements complete REST API contracts matching FastAPI backend.
 * Provides resilient error handling, token injection, and configurable base URL.
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

const TOKEN_KEY = "navjyoti_access_token";

/**
 * Universal JSON fetch helper with standard Authorization header injection.
 */
async function request(endpoint, options = {}) {
  const token = options.token || sessionStorage.getItem(TOKEN_KEY);
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (networkError) {
    throw new Error(
      `Cannot connect to NavJyoti backend at ${API_BASE_URL}. (${networkError.message})`
    );
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    let errorMsg = `Request failed (${response.status})`;
    if (typeof data?.detail === "string") {
      errorMsg = data.detail;
    } else if (Array.isArray(data?.detail)) {
      errorMsg = data.detail.map((d) => d.msg || JSON.stringify(d)).join(", ");
    }
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const backendApi = {
  // System Health
  health: () => request("/health"),
  dbCheck: () => request("/db-check"),

  // Authentication & Registration
  register: ({ name, phone, password, village, preferred_language = "hi", consent = true, email = null }) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name,
        phone,
        password,
        village: village || "Rampur",
        preferred_language,
        consent: Boolean(consent),
        email: email && String(email).trim() ? String(email).trim() : null,
      }),
    }),

  login: (identifier, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        identifier: String(identifier).trim(),
        password,
      }),
    }),

  requestOtp: (email, role = "worker") =>
    request("/auth/otp/request", {
      method: "POST",
      body: JSON.stringify({
        email: String(email).trim(),
        role,
      }),
    }),

  verifyOtp: (email, role = "worker", otp) =>
    request("/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify({
        email: String(email).trim(),
        role,
        otp: String(otp).trim(),
      }),
    }),

  getProfile: (token) =>
    request("/auth/me", { token }),

  // Children Management
  getChildren: (token) =>
    request("/children", { token }),

  getChild: (id, token) =>
    request(`/children/${id}`, { token }),

  createChild: (childData, token) =>
    request("/children", {
      method: "POST",
      token,
      body: JSON.stringify({
        name: childData.name,
        date_of_birth: childData.date_of_birth || childData.dob,
        gender: childData.gender || "Male",
        village: childData.village || "Rampur",
        blood_group: childData.blood_group || null,
        birth_weight_kg: childData.birth_weight_kg ? Number(childData.birth_weight_kg) : null,
        migration_status: childData.migration_status || "resident",
        priority_level: childData.priority_level || "green",
      }),
    }),

  updateChild: (id, patchData, token) =>
    request(`/children/${id}`, {
      method: "PATCH",
      token,
      body: JSON.stringify(patchData),
    }),

  // Vaccinations
  getChildVaccinations: (childId, token) =>
    request(`/children/${childId}/vaccinations`, { token }),

  getVaccineSchedule: () =>
    request("/vaccinations/schedule"),

  scheduleVaccination: (childId, vaxData, token) =>
    request(`/children/${childId}/vaccinations`, {
      method: "POST",
      token,
      body: JSON.stringify(vaxData),
    }),

  administerVaccination: (adminData, token) =>
    request("/worker/vaccinations/administer", {
      method: "POST",
      token,
      body: JSON.stringify(adminData),
    }),

  completeVaccination: (vaccinationId, completeData, token) =>
    request(`/worker/vaccinations/${vaccinationId}/complete`, {
      method: "PATCH",
      token,
      body: JSON.stringify(completeData),
    }),

  // Clinical Growth & Milestones
  getChildGrowth: (childId, token) =>
    request(`/children/${childId}/growth`, { token }),

  recordGrowth: (childId, growthData, token) =>
    request(`/children/${childId}/growth`, {
      method: "POST",
      token,
      body: JSON.stringify(growthData),
    }),

  getChildMilestones: (childId, token) =>
    request(`/children/${childId}/milestones`, { token }),

  recordMilestone: (childId, milestoneData, token) =>
    request(`/children/${childId}/milestones`, {
      method: "POST",
      token,
      body: JSON.stringify(milestoneData),
    }),

  // Appointments
  getChildAppointments: (childId, token) =>
    request(`/children/${childId}/appointments`, { token }),

  createAppointment: (childId, apptData, token) =>
    request(`/children/${childId}/appointments`, {
      method: "POST",
      token,
      body: JSON.stringify(apptData),
    }),

  cancelAppointment: (appointmentId, reason, token) =>
    request(`/appointments/${appointmentId}/cancel`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ reason }),
    }),

  // Frontline Health Worker Endpoints
  getAssignedChildren: (token) =>
    request("/worker/children", { token }),

  getWorkerAppointments: (token) =>
    request("/worker/appointments", { token }),

  updateWorkerAppointment: (appointmentId, updateData, token) =>
    request(`/worker/appointments/${appointmentId}`, {
      method: "PATCH",
      token,
      body: JSON.stringify(updateData),
    }),

  getFollowUps: (token) =>
    request("/worker/follow-ups", { token }),

  updateFollowUp: (followupId, updateData, token) =>
    request(`/worker/follow-ups/${followupId}`, {
      method: "PATCH",
      token,
      body: JSON.stringify(updateData),
    }),

  // QR Pass & Strict Public Verification
  createQRToken: (childId, token) =>
    request(`/children/${childId}/qr-token`, {
      method: "POST",
      token,
    }),

  lookupQRRecord: (qrToken) =>
    request(`/records/lookup/${encodeURIComponent(qrToken)}`),

  // In-App Notifications
  getNotifications: (token) =>
    request("/notifications", { token }),

  markNotificationRead: (id, token) =>
    request(`/notifications/${id}/read`, {
      method: "PATCH",
      token,
    }),

  // Outreach Communications
  getCommunications: (token) =>
    request("/communications", { token }),

  createCommunication: (commData, token) =>
    request("/communications", {
      method: "POST",
      token,
      body: JSON.stringify(commData),
    }),

  // Supervisor Analytics
  getSupervisorDashboard: (token) =>
    request("/supervisor/dashboard", { token }),

  getSupervisorChildren: (token) =>
    request("/supervisor/children", { token }),
};
