/**
 * NavJyoti Client-Side Demo Persistence Service
 * 
 * IMPORTANT ARCHITECTURE & SECURITY NOTICE:
 * This is a frontend-only prototype persistence abstraction using browser localStorage.
 * It does NOT provide production cryptographic security, real OTP verification, or server-enforced RBAC.
 * In production, this layer is replaced by RESTful API endpoints with JWT/HttpOnly cookie sessions.
 * 
 * Capabilities:
 * - Versioned schema management (SCHEMA_VERSION = 2)
 * - Safe JSON parsing with fallback
 * - Session persistence with explicit expiry policy
 * - Separation of active session from persistent demo accounts & child records
 * - Caregiver-child relationship mapping & isolation
 * - Preserving child records on logout
 * - Communication history persistence
 * - Reset demo data to factory defaults
 */

import { INITIAL_CHILDREN } from '../data/mockChildren.js';

const SCHEMA_VERSION = 2;

const STORAGE_KEYS = {
  SCHEMA_VERSION: 'navjyoti_schema_version',
  SESSION: 'navjyoti_session',
  PARENT_SESSION: 'navjyoti_parent_session',
  WORKER_SESSION: 'navjyoti_worker_session',
  ACCOUNTS: 'navjyoti_accounts',
  CHILDREN: 'navjyoti_children',
  APPOINTMENTS: 'navjyoti_appointments',
  NOTIFICATIONS: 'navjyoti_notifications',
  COMMUNICATIONS: 'navjyoti_communications',
  LAST_SELECTED_CHILD: 'navjyoti_last_selected_child_map',
  LANG: 'navjyoti_lang',
  OFFLINE_QUEUE: 'navjyoti_offline_queue',
};

// Default Demo Accounts (Pre-seeded synthetic users for all 3 roles)
export const DEFAULT_ACCOUNTS = [
  {
    id: "usr_parent_01",
    role: "parent",
    name: "Sunita Sharma",
    phone: "+91 98765 43210",
    village: "Rampur",
    district: "Bilaspur Sadar",
    state: "Uttar Pradesh",
    language: "hi",
    linkedChildIds: ["NJ-2024-0891"],
    createdAt: "2024-03-15T00:00:00Z",
    isSimulated: true,
  },
  {
    id: "usr_parent_02",
    role: "parent",
    name: "Pooja Verma",
    phone: "+91 98112 34567",
    village: "Kalyanpur",
    district: "Bilaspur Sadar",
    state: "Uttar Pradesh",
    language: "hi",
    linkedChildIds: ["NJ-2024-0412"],
    createdAt: "2024-06-20T00:00:00Z",
    isSimulated: true,
  },
  {
    id: "hw_anm_01",
    role: "worker",
    name: "Rekha Devi",
    workerType: "ANM (Auxiliary Nurse Midwife)",
    phone: "+91 94123 99887",
    workerId: "ANM-UP-BLS-4019",
    jurisdiction: {
      subCentre: "Rampur Sub-Centre",
      phc: "Bilaspur Primary Health Centre",
      block: "Bilaspur Sadar",
      district: "Bilaspur",
      villagesCovered: ["Rampur", "Kalyanpur", "Shivpur"],
      assignedPopulation: 4850,
      verifiedSimulatedBadge: true,
    },
    createdAt: "2023-01-01T00:00:00Z",
    isSimulated: true,
  },
  {
    id: "sup_moic_01",
    role: "supervisor",
    name: "Dr. Alok Verma",
    designation: "Medical Officer In-Charge (MOIC)",
    phone: "+91 94150 11223",
    workerId: "MOIC-UP-BLS-1001",
    jurisdiction: {
      block: "Bilaspur Sadar Block",
      district: "Bilaspur",
      state: "Uttar Pradesh",
      subCentresSupervised: ["Rampur Sub-Centre", "Kalyanpur Sub-Centre", "Shivpur Sub-Centre"],
      villagesCovered: ["Rampur", "Kalyanpur", "Shivpur"],
      assignedPopulation: 14200,
      anmStaffCount: 6,
      ashaWorkerCount: 18,
    },
    createdAt: "2022-06-01T00:00:00Z",
    isSimulated: true,
  },
];

export const DEFAULT_COMMUNICATIONS = [
  {
    id: "comm_1",
    recipientName: "Sunita Sharma",
    recipientPhone: "+91 98765 43210",
    childId: "NJ-2024-0891",
    childName: "Aarav Sharma",
    type: "due_soon",
    message: "नमस्ते Sunita Sharma, आपके बच्चे Aarav Sharma का अगला नियमित टीका (MR 1 & PCV) अगले सप्ताह देय है। कृपया बुधवार को रामपुर उप-केंद्र पर संपर्क करें। - एएनएम रेखा देवी",
    channel: "Simulated SMS",
    sentAt: "2024-11-01T10:30:00Z",
    status: "Delivered (Simulated)",
  },
  {
    id: "comm_2",
    recipientName: "Pooja Verma",
    recipientPhone: "+91 98112 34567",
    childId: "NJ-2024-0412",
    childName: "Ananya Verma",
    type: "overdue",
    message: "महत्वपूर्ण सूचना: Pooja Verma, आपके बच्चे Ananya Verma की आवश्यक खुराक Pentavalent-2 छूट गई है। बाल स्वास्थ्य सुरक्षा के लिए कृपया आगामी टीकाकरण सत्र में अवश्य आएं। - एएनएम रेखा देवी",
    channel: "Simulated SMS",
    sentAt: "2024-11-03T14:15:00Z",
    status: "Delivered (Simulated)",
  }
];

// Helper for safe JSON reading
export function safeGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[NavJyoti Storage] Corrupted key "${key}". Resetting to fallback.`, err);
    return fallback;
  }
}

// Helper for safe JSON writing
export function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`[NavJyoti Storage] Write error for "${key}":`, err);
    return false;
  }
}

/**
 * Initialize storage schema on app bootstrap
 */
export function initializeStorage() {
  const currentVersion = safeGet(STORAGE_KEYS.SCHEMA_VERSION, null);

  if (currentVersion !== SCHEMA_VERSION) {
    safeSet(STORAGE_KEYS.CHILDREN, INITIAL_CHILDREN);
    safeSet(STORAGE_KEYS.ACCOUNTS, DEFAULT_ACCOUNTS);
    safeSet(STORAGE_KEYS.COMMUNICATIONS, DEFAULT_COMMUNICATIONS);
    safeSet(STORAGE_KEYS.SCHEMA_VERSION, SCHEMA_VERSION);
  }

  // Hydrate separate role sessions from existing legacy session if needed
  const legacySession = safeGet(STORAGE_KEYS.SESSION, null);
  if (legacySession && legacySession.role) {
    if (legacySession.role === 'parent' && !safeGet(STORAGE_KEYS.PARENT_SESSION, null)) {
      safeSet(STORAGE_KEYS.PARENT_SESSION, legacySession);
    } else if ((legacySession.role === 'worker' || legacySession.role === 'supervisor') && !safeGet(STORAGE_KEYS.WORKER_SESSION, null)) {
      safeSet(STORAGE_KEYS.WORKER_SESSION, legacySession);
    }
  }
}

/**
 * SESSION MANAGEMENT
 * Policy: 7 days validity for demo prototype.
 * Parent and Worker authentication states are maintained independently.
 */
const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export function getParentSession() {
  const session = safeGet(STORAGE_KEYS.PARENT_SESSION, null);
  if (!session) return null;
  if (session.expiresAt && Date.now() > session.expiresAt) {
    clearParentSession();
    return null;
  }
  return session;
}

export function getWorkerSession() {
  const session = safeGet(STORAGE_KEYS.WORKER_SESSION, null);
  if (!session) return null;
  if (session.expiresAt && Date.now() > session.expiresAt) {
    clearWorkerSession();
    return null;
  }
  return session;
}

export function getSession(roleKey = null) {
  if (roleKey === 'parent') return getParentSession();
  if (roleKey === 'worker' || roleKey === 'supervisor') return getWorkerSession();

  const session = safeGet(STORAGE_KEYS.SESSION, null);
  if (session && (!session.expiresAt || Date.now() <= session.expiresAt)) {
    return session;
  }
  return getParentSession() || getWorkerSession();
}

export function saveSession(user) {
  if (!user || !user.id) return null;

  const session = {
    userId: user.id,
    role: user.role,
    name: user.name,
    phone: user.phone,
    workerId: user.workerId,
    designation: user.designation,
    jurisdiction: user.jurisdiction,
    village: user.village,
    loginAt: Date.now(),
    expiresAt: Date.now() + SESSION_EXPIRY_MS,
    sessionVersion: SCHEMA_VERSION,
  };

  if (user.role === 'parent') {
    safeSet(STORAGE_KEYS.PARENT_SESSION, session);
  } else if (user.role === 'worker' || user.role === 'supervisor') {
    safeSet(STORAGE_KEYS.WORKER_SESSION, session);
  }
  safeSet(STORAGE_KEYS.SESSION, session);
  return session;
}

export function clearParentSession() {
  localStorage.removeItem(STORAGE_KEYS.PARENT_SESSION);
  const general = safeGet(STORAGE_KEYS.SESSION, null);
  if (general && general.role === 'parent') {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  }
}

export function clearWorkerSession() {
  localStorage.removeItem(STORAGE_KEYS.WORKER_SESSION);
  const general = safeGet(STORAGE_KEYS.SESSION, null);
  if (general && (general.role === 'worker' || general.role === 'supervisor')) {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  }
}

export function clearSession(role = null) {
  if (role === 'parent') {
    clearParentSession();
  } else if (role === 'worker' || role === 'supervisor') {
    clearWorkerSession();
  } else {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    localStorage.removeItem(STORAGE_KEYS.PARENT_SESSION);
    localStorage.removeItem(STORAGE_KEYS.WORKER_SESSION);
  }
}

/**
 * ACCOUNTS MANAGEMENT
 */
export function getAccounts() {
  return safeGet(STORAGE_KEYS.ACCOUNTS, DEFAULT_ACCOUNTS);
}

export function findAccountByPhoneOrId(identifier, role = 'parent') {
  const accounts = getAccounts();
  const cleanId = String(identifier).trim().toLowerCase().replace(/[\s-]/g, '');

  return accounts.find((acc) => {
    if (role && acc.role !== role) return false;
    const phoneClean = String(acc.phone || '').toLowerCase().replace(/[\s-]/g, '');
    const workerClean = String(acc.workerId || '').toLowerCase().replace(/[\s-]/g, '');
    return phoneClean.includes(cleanId) || workerClean.includes(cleanId);
  });
}

export function createOrUpdateAccount(accountData) {
  const accounts = getAccounts();
  const existingIdx = accounts.findIndex((a) => a.id === accountData.id);

  let updatedAccounts;
  if (existingIdx >= 0) {
    updatedAccounts = [...accounts];
    updatedAccounts[existingIdx] = { ...updatedAccounts[existingIdx], ...accountData, updatedAt: new Date().toISOString() };
  } else {
    const newAccount = {
      id: accountData.id || `usr_${Date.now()}`,
      createdAt: new Date().toISOString(),
      linkedChildIds: [],
      isSimulated: true,
      ...accountData,
    };
    updatedAccounts = [newAccount, ...accounts];
  }

  safeSet(STORAGE_KEYS.ACCOUNTS, updatedAccounts);
  return updatedAccounts;
}

/**
 * CHILDREN MANAGEMENT
 */
export function getChildren() {
  return safeGet(STORAGE_KEYS.CHILDREN, INITIAL_CHILDREN);
}

export function saveChildren(children) {
  return safeSet(STORAGE_KEYS.CHILDREN, children);
}

export function updateChildRecord(childId, patchData) {
  const children = getChildren();
  const idx = children.findIndex((c) => c.id === childId);
  if (idx < 0) return null;

  const updatedChild = { ...children[idx], ...patchData, updatedAt: new Date().toISOString() };
  children[idx] = updatedChild;
  saveChildren(children);
  return updatedChild;
}

/**
 * Retrieve children isolated for a specific caregiver
 */
export function getChildrenForCaregiver(caregiverId, caregiverPhone) {
  const allChildren = getChildren();
  if (!caregiverId && !caregiverPhone) return [];

  return allChildren.filter((child) => {
    if (child.caregiverId && child.caregiverId === caregiverId) return true;
    if (caregiverPhone && child.caregiverPhone === caregiverPhone) return true;
    return false;
  });
}

/**
 * Retrieve children for a frontline health worker jurisdiction
 */
export function getChildrenForWorker(jurisdiction) {
  const allChildren = getChildren();
  if (!jurisdiction || !jurisdiction.villagesCovered) return allChildren;

  return allChildren.filter((child) => {
    return jurisdiction.villagesCovered.includes(child.village);
  });
}

/**
 * Store and retrieve the last selected child per caregiver
 */
export function getLastSelectedChildId(caregiverId) {
  const map = safeGet(STORAGE_KEYS.LAST_SELECTED_CHILD, {});
  return map[caregiverId] || null;
}

export function setLastSelectedChildId(caregiverId, childId) {
  const map = safeGet(STORAGE_KEYS.LAST_SELECTED_CHILD, {});
  map[caregiverId] = childId;
  safeSet(STORAGE_KEYS.LAST_SELECTED_CHILD, map);
}

/**
 * Appointments & Notifications
 */
export function getStoredAppointments(fallback = []) {
  return safeGet(STORAGE_KEYS.APPOINTMENTS, fallback);
}

export function saveStoredAppointments(appointments) {
  return safeSet(STORAGE_KEYS.APPOINTMENTS, appointments);
}

export function getStoredNotifications(fallback = []) {
  return safeGet(STORAGE_KEYS.NOTIFICATIONS, fallback);
}

export function saveStoredNotifications(notifications) {
  return safeSet(STORAGE_KEYS.NOTIFICATIONS, notifications);
}

/**
 * Communications
 */
export function getStoredCommunications(fallback = DEFAULT_COMMUNICATIONS) {
  return safeGet(STORAGE_KEYS.COMMUNICATIONS, fallback);
}

export function saveStoredCommunications(comms) {
  return safeSet(STORAGE_KEYS.COMMUNICATIONS, comms);
}

/**
 * Factory Reset Demo Data
 * Strictly isolated for development/demo testing
 */
export function resetAllDemoData() {
  safeSet(STORAGE_KEYS.CHILDREN, INITIAL_CHILDREN);
  safeSet(STORAGE_KEYS.ACCOUNTS, DEFAULT_ACCOUNTS);
  safeSet(STORAGE_KEYS.LAST_SELECTED_CHILD, {});
  safeSet(STORAGE_KEYS.APPOINTMENTS, null);
  safeSet(STORAGE_KEYS.NOTIFICATIONS, null);
  safeSet(STORAGE_KEYS.COMMUNICATIONS, DEFAULT_COMMUNICATIONS);
  clearSession();
}
