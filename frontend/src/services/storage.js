/**
 * NavJyoti Client-Side Demo Persistence Service
 * 
 * IMPORTANT ARCHITECTURE & SECURITY NOTICE:
 * This is a frontend-only prototype persistence abstraction using browser localStorage.
 * It does NOT provide production cryptographic security, real OTP verification, or server-enforced RBAC.
 * In production, this layer is replaced by FastAPI/PostgreSQL REST endpoints with JWT/HttpOnly cookie sessions.
 * 
 * Capabilities:
 * - Versioned schema management (SCHEMA_VERSION = 1)
 * - Safe JSON parsing with fallback
 * - Session persistence with explicit expiry policy
 * - Separation of active session from persistent demo accounts & child records
 * - Caregiver-child relationship mapping & isolation
 * - Preserving child records on logout
 */

import { INITIAL_CHILDREN } from '../data/mockChildren.js';

const SCHEMA_VERSION = 1;

const STORAGE_KEYS = {
  SCHEMA_VERSION: 'navjyoti_schema_version',
  SESSION: 'navjyoti_session',
  ACCOUNTS: 'navjyoti_accounts',
  CHILDREN: 'navjyoti_children',
  APPOINTMENTS: 'navjyoti_appointments',
  NOTIFICATIONS: 'navjyoti_notifications',
  LAST_SELECTED_CHILD: 'navjyoti_last_selected_child_map',
  LANG: 'navjyoti_lang',
  OFFLINE_QUEUE: 'navjyoti_offline_queue',
};

// Default Demo Accounts (Pre-seeded synthetic users)
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
];

// Helper for safe JSON reading
function safeGet(key, fallback) {
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
function safeSet(key, value) {
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
    // Check if previous children exist or seed defaults
    const existingChildren = safeGet(STORAGE_KEYS.CHILDREN, null);
    if (!existingChildren || !Array.isArray(existingChildren)) {
      safeSet(STORAGE_KEYS.CHILDREN, INITIAL_CHILDREN);
    }

    const existingAccounts = safeGet(STORAGE_KEYS.ACCOUNTS, null);
    if (!existingAccounts || !Array.isArray(existingAccounts)) {
      safeSet(STORAGE_KEYS.ACCOUNTS, DEFAULT_ACCOUNTS);
    }

    safeSet(STORAGE_KEYS.SCHEMA_VERSION, SCHEMA_VERSION);
  }
}

/**
 * SESSION MANAGEMENT
 * Policy: 7 days validity for demo prototype.
 */
const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export function getSession() {
  const session = safeGet(STORAGE_KEYS.SESSION, null);
  if (!session) return null;

  // Check expiration
  if (session.expiresAt && Date.now() > session.expiresAt) {
    console.info("[NavJyoti Storage] Demo session expired. Clearing.");
    clearSession();
    return null;
  }

  return session;
}

export function saveSession(user) {
  if (!user || !user.id) return null;

  const session = {
    userId: user.id,
    role: user.role,
    name: user.name,
    phone: user.phone,
    workerId: user.workerId,
    jurisdiction: user.jurisdiction,
    loginAt: Date.now(),
    expiresAt: Date.now() + SESSION_EXPIRY_MS,
    sessionVersion: SCHEMA_VERSION,
  };

  safeSet(STORAGE_KEYS.SESSION, session);
  return session;
}

export function clearSession() {
  // Clear active session ONLY — child records and accounts are preserved!
  localStorage.removeItem(STORAGE_KEYS.SESSION);
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
    if (acc.role !== role) return false;
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
 * Factory Reset Demo Data
 * Strictly isolated for development/demo testing
 */
export function resetAllDemoData() {
  safeSet(STORAGE_KEYS.CHILDREN, INITIAL_CHILDREN);
  safeSet(STORAGE_KEYS.ACCOUNTS, DEFAULT_ACCOUNTS);
  safeSet(STORAGE_KEYS.LAST_SELECTED_CHILD, {});
  safeSet(STORAGE_KEYS.APPOINTMENTS, null);
  safeSet(STORAGE_KEYS.NOTIFICATIONS, null);
  clearSession();
}
