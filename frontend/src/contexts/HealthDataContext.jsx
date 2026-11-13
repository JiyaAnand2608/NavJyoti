import React, {
  createContext, useContext, useState, useEffect, useMemo, useCallback,
} from 'react';
import { useAuth } from './AuthContext';
import { backendApi } from '../services/backendApi';
import { getLastSelectedChildId, setLastSelectedChildId } from '../services/storage';

const HealthDataContext = createContext(null);
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const TOKEN_KEY = 'navjyoti_access_token';

async function apiRequest(path, options = {}) {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (!token) throw new Error('Please sign in again.');

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      typeof result?.detail === 'string'
        ? result.detail
        : `Backend request failed (${response.status})`
    );
  }
  return result;
}

function formatChild(record, currentUser, vaccinations = [], growth = [], milestones = []) {
  const dob = record.date_of_birth;
  return {
    id: record.id,
    name: record.name,
    dob,
    date_of_birth: dob,
    parent_id: record.parent_id,
    caregiverId: record.parent_id,
    caregiverName: currentUser.role === 'parent' ? currentUser.name : '',
    caregiverPhone: '',
    assigned_worker_id: record.assigned_worker_id,
    assignedWorker: null,
    village: null,
    subCentre: null,
    phc: null,
    priorityLevel: null,
    // QR access must be implemented securely on the backend.
    qrToken: null,
    doses: vaccinations.map((v) => ({
      id: v.id,
      vaccineId: String(v.id),
      vaccineName: v.vaccine_name,
      dueDate: v.due_date,
      dateAdministered: v.administered_date,
      status: v.completed ? 'administered' : 'scheduled',
    })),
    growthRecords: growth.map((g) => ({
      id: g.id,
      date: g.measurement_date,
      weightKg: g.weight_kg,
      heightCm: g.height_cm,
      recordedBy: g.recorded_by,
    })),
    milestones: milestones.map((m) => ({
      id: m.id,
      milestoneId: String(m.id),
      domain: m.category,
      title: m.description,
      status: m.status,
      observedDate: m.observation_date,
      notes: m.description,
    })),
    visitHistory: [],
    followUpNotes: '',
  };
}

function formatAppointment(a) {
  return {
    id: a.id,
    childId: a.child_id,
    requestedDate: a.appointment_date,
    purpose: a.reason,
    reason: a.reason,
    status: a.status,
    timeSlot: null,
    visitType: null,
  };
}

const notConnected = (feature) => {
  throw new Error(`${feature} is not connected to the backend yet.`);
};

export function HealthDataProvider({ children }) {
  const { user, isLoading: authLoading } = useAuth();
  const [allChildren, setAllChildren] = useState([]);
  const [childrenLoading, setChildrenLoading] = useState(true);
  const [childrenError, setChildrenError] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [communications] = useState([]);
  const [activeChildId, setActiveChildIdState] = useState(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const refreshChildren = useCallback(() => setRefreshIndex((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function loadChildren() {
      setAllChildren([]);
      setAppointments([]);
      setChildrenError(null);
      setChildrenLoading(true);

      if (authLoading) return;
      if (!user) {
        setChildrenLoading(false);
        return;
      }

      const token = sessionStorage.getItem(TOKEN_KEY);
      if (!token) {
        setChildrenError('Please sign in again.');
        setChildrenLoading(false);
        return;
      }

      try {
        let records = [];
        if (user.role === 'parent') {
          records = await backendApi.getChildren(token);
        } else if (user.role === 'worker') {
          records = await apiRequest('/worker/children');
        } // No supervisor child-list API has been built yet.

        const detailed = await Promise.all(records.map(async (record) => {
          // Parent and assigned worker vaccination access is checked by FastAPI.
          const [vaccinations, growth, milestones, childAppointments] = await Promise.all([
            apiRequest(`/children/${record.id}/vaccinations`),
            apiRequest(`/children/${record.id}/growth`),
            apiRequest(`/children/${record.id}/milestones`),
            apiRequest(`/children/${record.id}/appointments`),
          ]);
          return {
            child: formatChild(record, user, vaccinations, growth, milestones),
            appointments: childAppointments.map(formatAppointment),
          };
        }));

        if (!cancelled) {
          setAllChildren(detailed.map((item) => item.child));
          setAppointments(detailed.flatMap((item) => item.appointments));
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load NavJyoti records:', error);
          setChildrenError(error.message);
        }
      } finally {
        if (!cancelled) setChildrenLoading(false);
      }
    }

    loadChildren();
    return () => { cancelled = true; };
  }, [user?.id, user?.role, authLoading, refreshIndex]);

  // The server filters records for the authenticated parent or worker.
  const accessibleChildren = useMemo(() => {
    if (user?.role === 'parent' || user?.role === 'worker') return allChildren;
    return [];
  }, [user?.role, allChildren]);

  useEffect(() => {
    if (!user || accessibleChildren.length === 0) {
      setActiveChildIdState(null);
      return;
    }
    setActiveChildIdState((oldId) => {
      if (accessibleChildren.some((c) => String(c.id) === String(oldId))) return oldId;
      const saved = user.role === 'parent' ? getLastSelectedChildId(user.id) : null;
      const matched = accessibleChildren.find((c) => String(c.id) === String(saved));
      return (matched || accessibleChildren[0]).id;
    });
  }, [user?.id, user?.role, accessibleChildren]);

  const setActiveChildId = (childId) => {
    const matched = accessibleChildren.find((c) => String(c.id) === String(childId));
    if (!matched) return;
    setActiveChildIdState(matched.id);
    if (user?.role === 'parent') setLastSelectedChildId(user.id, String(matched.id));
  };

  const activeChild = accessibleChildren.find(
    (c) => String(c.id) === String(activeChildId)
  ) || null;

  // This is a real backend write; callers should await registerChild(...).
  const registerChild = async (data) => {
    if (user?.role !== 'parent') throw new Error('Only parents can register children.');
    const created = await apiRequest('/children', {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        date_of_birth: data.dob || data.date_of_birth,
      }),
    });
    refreshChildren();
    return formatChild(created, user);
  };

  // The existing UI actions below must not silently alter local copies of
  // medical data. Wire them to verified API endpoints before enabling them.
  const updateChild = async () => notConnected('Child profile editing');
  const administerDose = async () => notConnected('Vaccination recording from this screen');
  const recordMilestoneObservation = async () => notConnected('Milestone recording from this screen');
  const updateFollowUp = async () => notConnected('Follow-up changes from this screen');

  const requestAppointment = async (data) => {
    const created = await apiRequest(`/children/${data.childId}/appointments`, {
      method: 'POST',
      body: JSON.stringify({
        appointment_date: data.requestedDate || data.appointment_date,
        reason: data.purpose || data.reason,
      }),
    });
    setAppointments((prev) => [...prev, formatAppointment(created)]);
    return formatAppointment(created);
  };

  const updateAppointmentStatus = async (id, newStatus) => {
    const updated = await apiRequest(`/worker/appointments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
    setAppointments((prev) => prev.map((a) =>
      String(a.id) === String(id) ? formatAppointment(updated) : a
    ));
    return formatAppointment(updated);
  };

  const rescheduleAppointment = async (id, newDate) => {
    const updated = await apiRequest(`/worker/appointments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'rescheduled', appointment_date: newDate }),
    });
    setAppointments((prev) => prev.map((a) =>
      String(a.id) === String(id) ? formatAppointment(updated) : a
    ));
    return formatAppointment(updated);
  };

  const cancelAppointment = async () => notConnected('Appointment cancellation from this screen');

  // Notifications and SMS are not backed by a real service yet.
  const markNotificationAsRead = (id) => setNotifications((prev) =>
    prev.map((n) => n.id === id ? { ...n, read: true } : n)
  );
  const markAllNotificationsAsRead = () => setNotifications((prev) =>
    prev.map((n) => ({ ...n, read: true }))
  );
  const dismissNotification = (id) => setNotifications((prev) =>
    prev.filter((n) => n.id !== id)
  );
  const sendSimulatedMessage = async () => notConnected('Messaging');
  const resetDemoData = () => notConnected('Demo reset');

  return (
    <HealthDataContext.Provider value={{
      childrenList: accessibleChildren,
      allChildren,
      childrenLoading,
      childrenError,
      activeChild,
      activeChildId,
      setActiveChildId,
      refreshChildren,
      appointments,
      notifications,
      communications,
      administerDose,
      registerChild,
      updateChild,
      recordMilestoneObservation,
      requestAppointment,
      updateAppointmentStatus,
      rescheduleAppointment,
      cancelAppointment,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      dismissNotification,
      sendSimulatedMessage,
      updateFollowUp,
      resetDemoData,
    }}>
      {children}
    </HealthDataContext.Provider>
  );
}

export function useHealthData() {
  const context = useContext(HealthDataContext);
  if (!context) throw new Error('useHealthData must be used within a HealthDataProvider');
  return context;
}
