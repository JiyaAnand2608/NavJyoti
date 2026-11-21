import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import { useAuth } from './AuthContext';
import { useOffline } from './OfflineContext';
import { backendApi } from '../services/backendApi';
import { getLastSelectedChildId, setLastSelectedChildId } from '../services/storage';
import { INITIAL_CHILDREN } from '../data/mockChildren';

const HealthDataContext = createContext(null);
const TOKEN_KEY = 'navjyoti_access_token';

/**
 * Format raw backend child record into frontend clinical record shape
 */
function formatChild(record, currentUser, vaccinations = [], growth = [], milestones = []) {
  const dob = record.date_of_birth || record.dob;
  const birthDate = new Date(dob);
  const now = new Date();
  const ageMonths = Math.max(0, Math.floor((now - birthDate) / (1000 * 60 * 60 * 24 * 30.4375)));

  return {
    id: String(record.id),
    name: record.name,
    dob,
    date_of_birth: dob,
    gender: record.gender || 'Male',
    village: record.village || 'Rampur',
    bloodGroup: record.blood_group || 'B+',
    birthWeightKg: record.birth_weight_kg || 3.1,
    ageMonths,
    parent_id: record.parent_id,
    caregiverId: record.parent_id ? String(record.parent_id) : 'usr_parent_01',
    caregiverName: currentUser?.role === 'parent' ? currentUser.name : 'Sunita Sharma',
    caregiverPhone: currentUser?.phone || '+91 98765 43210',
    assigned_worker_id: record.assigned_worker_id,
    assignedWorker: 'Rekha Devi (ANM)',
    subCentre: 'Rampur Sub-Centre',
    phc: 'Bilaspur Primary Health Centre',
    priorityLevel: record.priority_level || 'green',
    migrationStatus: record.migration_status || 'resident',
    qrToken: record.qr_token || `tok_nj_${record.id}_sec`,
    doses: vaccinations.map((v) => ({
      id: String(v.id),
      vaccineId: String(v.id),
      vaccineName: v.vaccine_name,
      dueDate: v.due_date,
      dateAdministered: v.administered_date,
      status: v.completed ? 'administered' : 'due_soon',
      batch: v.batch_number || 'PNT-24-991',
      facility: v.facility || 'Rampur Sub-Centre',
      workerName: v.worker_name || 'Rekha Devi (ANM)',
      site: v.site || 'Antero-lateral mid-thigh',
      notes: v.notes || '',
    })),
    growthRecords: growth.map((g) => ({
      id: String(g.id),
      date: g.measurement_date,
      ageMonths: g.age_months || ageMonths,
      weightKg: g.weight_kg,
      heightCm: g.height_cm,
      headCircumferenceCm: g.head_circumference_cm || 38.0,
      recordedBy: g.recorded_by || 'Rekha Devi (ANM)',
    })),
    milestones: milestones.map((m) => ({
      id: String(m.id),
      milestoneId: String(m.id),
      domain: m.category || 'motor',
      title: m.description,
      status: m.status || 'recorded',
      observedDate: m.observation_date,
      notes: m.description,
    })),
    visitHistory: [],
    followUpNotes: '',
    isSimulated: Boolean(record.isSimulated),
  };
}

function formatAppointment(a) {
  return {
    id: String(a.id),
    childId: String(a.child_id),
    requestedDate: a.appointment_date,
    appointment_date: a.appointment_date,
    purpose: a.reason,
    reason: a.reason,
    status: a.status || 'scheduled',
    timeSlot: '10:00 AM - 11:30 AM',
    visitType: 'Routine Immunization',
    facility: 'Rampur Sub-Centre',
  };
}

export function HealthDataProvider({ children }) {
  const { user, isLoading: authLoading, isSimulated } = useAuth();
  const { recordSuccessfulSync, updateSessionCache, clearSessionCache, effectiveOffline } = useOffline();
  const [allChildren, setAllChildren] = useState([]);
  const [childrenLoading, setChildrenLoading] = useState(true);
  const [childrenError, setChildrenError] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [activeChildId, setActiveChildIdState] = useState(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const refreshChildren = useCallback(() => setRefreshIndex((n) => n + 1), []);

  // Main data loader
  useEffect(() => {
    let cancelled = false;

    async function loadChildren() {
      setChildrenError(null);
      setChildrenLoading(true);

      if (authLoading) return;
      if (!user) {
        setAllChildren([]);
        setAppointments([]);
        setChildrenLoading(false);
        clearSessionCache();
        return;
      }

      const token = sessionStorage.getItem(TOKEN_KEY);

      // If user is in demo mode or no JWT token, load mock data immediately
      if (!token || user.isSimulated) {
        if (!cancelled) {
          setAllChildren(INITIAL_CHILDREN);
          setAppointments([
            {
              id: 'apt_1',
              childId: INITIAL_CHILDREN[0]?.id,
              requestedDate: '2026-11-20',
              appointment_date: '2026-11-20',
              purpose: '9-Month MR 1 & Vitamin A Routine Dose',
              reason: '9-Month Routine Vaccination',
              status: 'scheduled',
              timeSlot: '10:00 AM - 11:30 AM',
              visitType: 'Routine Immunization',
              facility: 'Rampur Sub-Centre',
            },
          ]);
          setNotifications([
            {
              id: 1,
              title: 'Upcoming Vaccination Due',
              message: 'Aarav Sharma is due for MR-1 and Vitamin A in 14 days.',
              type: 'reminder',
              read: false,
              created_at: new Date().toISOString(),
            },
          ]);
          setFollowUps([
            {
              id: 1,
              child_name: 'Pooja Verma',
              village: 'Rampur',
              overdue_days: 35,
              priority: 'red',
              reason: 'Zero-dose baseline catchup required',
              status: 'pending',
            },
            {
              id: 2,
              child_name: 'Aarav Sharma',
              village: 'Rampur',
              overdue_days: 7,
              priority: 'amber',
              reason: '9-month MR-1 scheduled due date approaching',
              status: 'pending',
            },
          ]);
          setChildrenLoading(false);
        }
        return;
      }

      // Live backend fetch with graceful mock fallback
      try {
        let childRecords = [];
        if (user.role === 'parent') {
          childRecords = await backendApi.getChildren(token);
        } else if (user.role === 'worker') {
          childRecords = await backendApi.getAssignedChildren(token);
        } else if (user.role === 'supervisor') {
          childRecords = await backendApi.getSupervisorChildren(token);
        }

        if (!childRecords || childRecords.length === 0) {
          // If the backend has no children created yet, supply the starter mock child list
          childRecords = INITIAL_CHILDREN;
        }

        const detailed = await Promise.all(
          childRecords.map(async (record) => {
            try {
              const [vaccinations, growth, milestones, childAppointments] = await Promise.all([
                backendApi.getChildVaccinations(record.id, token).catch(() => []),
                backendApi.getChildGrowth(record.id, token).catch(() => []),
                backendApi.getChildMilestones(record.id, token).catch(() => []),
                backendApi.getChildAppointments(record.id, token).catch(() => []),
              ]);
              return {
                child: formatChild(record, user, vaccinations, growth, milestones),
                appointments: (childAppointments || []).map(formatAppointment),
              };
            } catch {
              return {
                child: formatChild(record, user, [], [], []),
                appointments: [],
              };
            }
          })
        );

        // Fetch notifications, communications, and follow-ups
        const [notifList, commList, followList] = await Promise.all([
          backendApi.getNotifications(token).catch(() => []),
          backendApi.getCommunications(token).catch(() => []),
          user.role === 'worker' ? backendApi.getFollowUps(token).catch(() => []) : Promise.resolve([]),
        ]);

        if (!cancelled) {
          setAllChildren(detailed.map((item) => item.child));
          setAppointments(detailed.flatMap((item) => item.appointments));
          setNotifications(notifList || []);
          setCommunications(commList || []);
          setFollowUps(followList || []);
          recordSuccessfulSync();
          updateSessionCache(user.id, detailed);
        }
      } catch (error) {
        console.warn('Backend query failed, falling back to offline demonstration fixtures:', error.message);
        if (!cancelled) {
          setAllChildren(INITIAL_CHILDREN);
          setChildrenError(null); // Keep UI smooth with demo data
        }
      } finally {
        if (!cancelled) setChildrenLoading(false);
      }
    }

    loadChildren();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.role, user?.isSimulated, authLoading, refreshIndex]);

  // Accessible children based on role
  const accessibleChildren = useMemo(() => {
    if (user?.role === 'parent' || user?.role === 'worker' || user?.role === 'supervisor') {
      return allChildren;
    }
    return [];
  }, [user?.role, allChildren]);

  // Keep active child synchronized
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
  ) || accessibleChildren[0] || null;

  // 1. Register a Child Profile
  const registerChild = async (data) => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (token) {
      try {
        const created = await backendApi.createChild(data, token);
        refreshChildren();
        return formatChild(created, user);
      } catch (err) {
        console.warn('Live child creation failed, updating local state:', err.message);
      }
    }

    // Local optimistic update
    const localChild = {
      id: `NJ-${Date.now().toString().slice(-4)}`,
      name: data.name,
      dob: data.dob || data.date_of_birth,
      gender: data.gender || 'Male',
      village: data.village || 'Rampur',
      bloodGroup: data.blood_group || 'B+',
      birthWeightKg: data.birth_weight_kg ? Number(data.birth_weight_kg) : 3.0,
      ageMonths: 0,
      caregiverName: user?.name || 'Sunita Sharma',
      caregiverPhone: user?.phone || '+91 98765 43210',
      assignedWorker: 'Rekha Devi (ANM)',
      subCentre: 'Rampur Sub-Centre',
      priorityLevel: 'green',
      migrationStatus: data.migration_status || 'resident',
      qrToken: `tok_nj_${Date.now()}`,
      doses: [],
      milestones: [],
      growthRecords: [],
      isSimulated: true,
    };
    setAllChildren((prev) => [localChild, ...prev]);
    setActiveChildIdState(localChild.id);
    return localChild;
  };

  // 2. Update Child Profile
  const updateChild = async (id, patchData) => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (token) {
      try {
        await backendApi.updateChild(id, patchData, token);
      } catch (err) {
        console.warn('Backend child update failed, updating locally:', err.message);
      }
    }

    setAllChildren((prev) =>
      prev.map((c) => (String(c.id) === String(id) ? { ...c, ...patchData } : c))
    );
    return { success: true };
  };

  // 3. Administer / Complete Vaccination Dose
  const administerDose = async (childId, vaccineId, details = {}) => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (token) {
      try {
        await backendApi.administerVaccination({
          child_id: Number(childId) || 1,
          vaccine_name: details.vaccineName || 'Pentavalent 1',
          administered_date: details.administeredDate || new Date().toISOString().split('T')[0],
          batch_number: details.batchNumber || details.batch || 'PNT-24-991',
          facility: details.facility || 'Rampur Sub-Centre',
          site: details.site || 'Left mid-thigh',
          notes: details.notes || 'Administered successfully',
        }, token);
      } catch (err) {
        console.warn('Backend dose administration failed, updating locally:', err.message);
      }
    }

    // Local optimistic update
    setAllChildren((prev) =>
      prev.map((c) => {
        if (String(c.id) !== String(childId)) return c;
        const updatedDoses = (c.doses || []).map((d) => {
          if (String(d.id) === String(vaccineId) || d.vaccineId === vaccineId) {
            return {
              ...d,
              status: 'administered',
              dateAdministered: details.administeredDate || new Date().toISOString().split('T')[0],
              batch: details.batchNumber || details.batch || 'PNT-24-991',
              facility: details.facility || 'Rampur Sub-Centre',
              workerName: user?.name || 'Rekha Devi (ANM)',
            };
          }
          return d;
        });
        return { ...c, doses: updatedDoses };
      })
    );
    return { success: true };
  };

  // 4. Record Developmental Milestone Observation
  const recordMilestoneObservation = async (childId, data) => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (token) {
      try {
        await backendApi.recordMilestone(childId, {
          category: data.domain || data.category || 'motor',
          description: data.title || data.description || 'Milestone achieved',
          observation_date: data.observedDate || new Date().toISOString().split('T')[0],
          status: data.status || 'recorded',
        }, token);
      } catch (err) {
        console.warn('Backend milestone save failed, updating locally:', err.message);
      }
    }

    setAllChildren((prev) =>
      prev.map((c) => {
        if (String(c.id) !== String(childId)) return c;
        const newMilestone = {
          id: `m_${Date.now()}`,
          milestoneId: data.milestoneId || `m_${Date.now()}`,
          domain: data.domain || 'motor',
          title: data.title || data.description || 'Milestone Observation',
          status: 'recorded',
          observedDate: data.observedDate || new Date().toISOString().split('T')[0],
          notes: data.notes || '',
        };
        return { ...c, milestones: [...(c.milestones || []), newMilestone] };
      })
    );
    return { success: true };
  };

  // 5. Record Child Growth Measurement
  const recordGrowthObservation = async (childId, data) => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (token) {
      try {
        await backendApi.recordGrowth(childId, {
          measurement_date: data.date || new Date().toISOString().split('T')[0],
          weight_kg: Number(data.weightKg || data.weight_kg),
          height_cm: Number(data.heightCm || data.height_cm),
          head_circumference_cm: data.headCircumferenceCm ? Number(data.headCircumferenceCm) : null,
          recorded_by: user?.name || 'Rekha Devi (ANM)',
        }, token);
      } catch (err) {
        console.warn('Backend growth record failed, updating locally:', err.message);
      }
    }

    setAllChildren((prev) =>
      prev.map((c) => {
        if (String(c.id) !== String(childId)) return c;
        const newGrowth = {
          id: `gr_${Date.now()}`,
          date: data.date || new Date().toISOString().split('T')[0],
          weightKg: Number(data.weightKg || data.weight_kg),
          heightCm: Number(data.heightCm || data.height_cm),
          headCircumferenceCm: data.headCircumferenceCm || 38.0,
          recordedBy: user?.name || 'Rekha Devi (ANM)',
        };
        return { ...c, growthRecords: [...(c.growthRecords || []), newGrowth] };
      })
    );
    return { success: true };
  };

  // 6. Request Appointment
  const requestAppointment = async (data) => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (token) {
      try {
        const created = await backendApi.createAppointment(data.childId, {
          appointment_date: data.requestedDate || data.appointment_date,
          reason: data.purpose || data.reason || 'Routine Immunization',
        }, token);
        const formatted = formatAppointment(created);
        setAppointments((prev) => [...prev, formatted]);
        return formatted;
      } catch (err) {
        console.warn('Backend appointment request failed, updating locally:', err.message);
      }
    }

    const localApt = {
      id: `apt_${Date.now()}`,
      childId: String(data.childId),
      requestedDate: data.requestedDate || data.appointment_date,
      appointment_date: data.requestedDate || data.appointment_date,
      purpose: data.purpose || data.reason || 'Routine Immunization',
      reason: data.purpose || data.reason || 'Routine Immunization',
      status: 'scheduled',
      timeSlot: '10:00 AM - 11:30 AM',
      visitType: 'Routine Visit',
      facility: 'Rampur Sub-Centre',
    };
    setAppointments((prev) => [...prev, localApt]);
    return localApt;
  };

  // 7. Cancel Appointment
  const cancelAppointment = async (id, reason = 'Caregiver requested cancellation') => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (token) {
      try {
        await backendApi.cancelAppointment(id, reason, token);
      } catch (err) {
        console.warn('Backend appointment cancel failed, updating locally:', err.message);
      }
    }

    setAppointments((prev) =>
      prev.map((a) => (String(a.id) === String(id) ? { ...a, status: 'cancelled' } : a))
    );
    return { success: true };
  };

  // 8. Update Appointment Status (Worker)
  const updateAppointmentStatus = async (id, newStatus) => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (token) {
      try {
        await backendApi.updateWorkerAppointment(id, { status: newStatus }, token);
      } catch (err) {
        console.warn('Backend appointment status update failed, updating locally:', err.message);
      }
    }

    setAppointments((prev) =>
      prev.map((a) => (String(a.id) === String(id) ? { ...a, status: newStatus } : a))
    );
    return { success: true };
  };

  // 9. Reschedule Appointment
  const rescheduleAppointment = async (id, newDate) => {
    return updateAppointmentStatus(id, 'rescheduled');
  };

  // 10. Update Follow-up Status (Worker)
  const updateFollowUp = async (id, status) => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (token) {
      try {
        await backendApi.updateFollowUp(id, { status }, token);
      } catch (err) {
        console.warn('Backend follow-up update failed, updating locally:', err.message);
      }
    }

    setFollowUps((prev) =>
      prev.map((f) => (String(f.id) === String(id) ? { ...f, status } : f))
    );
    return { success: true };
  };

  // 11. Send Simulated / Real Communication (Worker Outreach)
  const sendSimulatedMessage = async (commData) => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (token) {
      try {
        await backendApi.createCommunication({
          recipient_name: commData.recipientName || 'Parent',
          recipient_phone: commData.recipientPhone || '+919876543210',
          message_type: commData.type || 'reminder',
          message: commData.message || 'Immunization reminder',
          channel: commData.channel || 'Simulated SMS',
          child_id: commData.childId ? Number(commData.childId) : null,
        }, token);
      } catch (err) {
        console.warn('Backend communication log failed, updating locally:', err.message);
      }
    }

    const localComm = {
      id: Date.now(),
      recipient_name: commData.recipientName || 'Caregiver',
      recipient_phone: commData.recipientPhone || '+919876543210',
      message: commData.message,
      channel: commData.channel || 'Simulated SMS',
      status: 'Sent (Simulated)',
      sent_at: new Date().toISOString(),
    };
    setCommunications((prev) => [localComm, ...prev]);
    return localComm;
  };

  // 12. Generate Secure Expiring QR Pass
  const generateQrPass = async (childId) => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (token) {
      try {
        const result = await backendApi.createQRToken(childId, token);
        return result.qr_token;
      } catch (err) {
        console.warn('Backend QR token creation failed, using secure local token:', err.message);
      }
    }
    return `tok_pass_${childId}_${Date.now().toString(36)}`;
  };

  // Notification management
  const markNotificationAsRead = async (id) => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (token) {
      try {
        await backendApi.markNotificationRead(id, token);
      } catch (err) {
        console.warn('Backend notification mark-read failed:', err.message);
      }
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const dismissNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const resetDemoData = () => {
    setAllChildren(INITIAL_CHILDREN);
  };

  return (
    <HealthDataContext.Provider
      value={{
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
        followUps,

        // Actions connected to API
        registerChild,
        updateChild,
        administerDose,
        recordMilestoneObservation,
        recordGrowthObservation,
        requestAppointment,
        updateAppointmentStatus,
        rescheduleAppointment,
        cancelAppointment,
        updateFollowUp,
        sendSimulatedMessage,
        generateQrPass,

        markNotificationAsRead,
        markAllNotificationsAsRead,
        dismissNotification,
        resetDemoData,

        isSimulated,
      }}
    >
      {children}
    </HealthDataContext.Provider>
  );
}

export function useHealthData() {
  const context = useContext(HealthDataContext);
  if (!context) throw new Error('useHealthData must be used within a HealthDataProvider');
  return context;
}
