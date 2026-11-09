import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import {
  getChildren,
  saveChildren,
  updateChildRecord,
  getChildrenForCaregiver,
  getChildrenForWorker,
  getLastSelectedChildId,
  setLastSelectedChildId,
  getStoredAppointments,
  saveStoredAppointments,
  getStoredNotifications,
  saveStoredNotifications,
  getStoredCommunications,
  saveStoredCommunications,
  resetAllDemoData,
  DEFAULT_COMMUNICATIONS,
} from '../services/storage';

const HealthDataContext = createContext(null);

const DEFAULT_APPOINTMENTS = [
  {
    id: "apt_001",
    childId: "NJ-2024-0891",
    childName: "Aarav Sharma",
    caregiverName: "Sunita Sharma",
    caregiverPhone: "+91 98765 43210",
    requestedDate: "2024-11-18",
    timeSlot: "10:30 AM",
    visitType: "home_visit",
    purpose: "9-Month MR-1 Immunisation & Growth Assessment",
    status: "confirmed",
    assignedWorker: "Rekha Devi (ANM)",
    notes: "ANM confirmed for morning sector round.",
  },
  {
    id: "apt_002",
    childId: "NJ-2024-0412",
    childName: "Ananya Verma",
    caregiverName: "Pooja Verma",
    caregiverPhone: "+91 98112 34567",
    requestedDate: "2024-11-20",
    timeSlot: "02:00 PM",
    visitType: "subcentre",
    purpose: "Overdue Pentavalent-2 Administration Catch-up",
    status: "requested",
    assignedWorker: "Rekha Devi (ANM)",
    notes: "Caregiver requested sub-centre appointment on Wednesday.",
  }
];

const DEFAULT_NOTIFICATIONS = [
  {
    id: "notif_1",
    title: "Upcoming UIP Dose: MR 1 & PCV Booster",
    message: "Aarav's 9-month Measles-Rubella dose is scheduled soon. Visit Rampur Sub-Centre on Wednesday.",
    type: "due_soon",
    timestamp: "Yesterday, 4:00 PM",
    read: false,
    childId: "NJ-2024-0891",
  },
  {
    id: "notif_2",
    title: "Home Visit Confirmed",
    message: "ANM Rekha Devi confirmed the home visit for 18th Nov at 10:30 AM.",
    type: "appointment",
    timestamp: "2 days ago",
    read: true,
    childId: "NJ-2024-0891",
  },
  {
    id: "notif_3",
    title: "Developmental Checkpoint Observed",
    message: "Motor milestone 'Sits without support' logged by frontline worker.",
    type: "milestone",
    timestamp: "5 days ago",
    read: true,
    childId: "NJ-2024-0891",
  }
];

export function HealthDataProvider({ children }) {
  const { user } = useAuth();

  const [allChildren, setAllChildren] = useState(() => getChildren());
  const [appointments, setAppointments] = useState(() => getStoredAppointments(DEFAULT_APPOINTMENTS));
  const [notifications, setNotifications] = useState(() => getStoredNotifications(DEFAULT_NOTIFICATIONS));
  const [communications, setCommunications] = useState(() => getStoredCommunications(DEFAULT_COMMUNICATIONS));

  // Determine accessible children based on authenticated role & user ID (Data Isolation)
  const accessibleChildren = useMemo(() => {
    if (!user) return [];
    if (user.role === 'parent') {
      return getChildrenForCaregiver(user.id, user.phone);
    }
    if (user.role === 'worker') {
      return getChildrenForWorker(user.jurisdiction);
    }
    // Supervisor sees all children in block/district
    return allChildren;
  }, [user, allChildren]);

  // Active child state, isolated per caregiver with persistent memory
  const [activeChildId, setActiveChildIdState] = useState(null);

  useEffect(() => {
    if (!user) {
      setActiveChildIdState(null);
      return;
    }

    if (user.role === 'parent') {
      const savedChildId = getLastSelectedChildId(user.id);
      const isStillAccessible = accessibleChildren.some((c) => c.id === savedChildId);

      if (savedChildId && isStillAccessible) {
        setActiveChildIdState(savedChildId);
      } else if (accessibleChildren.length > 0) {
        setActiveChildIdState(accessibleChildren[0].id);
        setLastSelectedChildId(user.id, accessibleChildren[0].id);
      } else {
        setActiveChildIdState(null);
      }
    } else {
      // Worker or Supervisor role
      if (accessibleChildren.length > 0 && !accessibleChildren.some((c) => c.id === activeChildId)) {
        setActiveChildIdState(accessibleChildren[0].id);
      }
    }
  }, [user, accessibleChildren]);

  const setActiveChildId = (childId) => {
    setActiveChildIdState(childId);
    if (user && user.role === 'parent') {
      setLastSelectedChildId(user.id, childId);
    }
  };

  const activeChild = accessibleChildren.find((c) => c.id === activeChildId) || null;

  // Sync state changes with persistence
  const updateAllChildren = (newChildren) => {
    setAllChildren(newChildren);
    saveChildren(newChildren);
  };

  // Helper to recalculate administrative priority deterministically
  const computePriority = (doses) => {
    const hasOverdue = doses.some((d) => d.status === 'overdue');
    if (hasOverdue) return 'red'; // Administrative urgent follow-up
    const hasDueSoon = doses.some((d) => d.status === 'due_soon');
    if (hasDueSoon) return 'amber';
    return 'green';
  };

  // Officially record an administered dose (with duplicate protection)
  const administerDose = (childId, vaccineId, details) => {
    const child = allChildren.find((c) => c.id === childId);
    if (!child) return;

    const existingDose = child.doses?.find((d) => d.vaccineId === vaccineId);
    if (existingDose && existingDose.status === 'administered') {
      console.warn(`[NavJyoti] Dose ${vaccineId} is already marked as administered.`);
      return;
    }

    const updated = allChildren.map((c) => {
      if (c.id !== childId) return c;
      const updatedDoses = c.doses.map((d) => {
        if (d.vaccineId === vaccineId) {
          return {
            ...d,
            status: "administered",
            dateAdministered: details.dateAdministered || new Date().toISOString().split('T')[0],
            batch: details.batch || `BATCH-${Date.now().toString().slice(-4)}`,
            facility: details.facility || "Rampur Sub-Centre",
            workerName: details.workerName || "Rekha Devi (ANM)",
            site: details.site || "Upper arm / Mid-thigh",
            notes: details.notes || "",
          };
        }
        return d;
      });

      const newVisit = {
        id: `vh_${Date.now()}`,
        date: details.dateAdministered || new Date().toISOString().split('T')[0],
        visitType: "Vaccination Administration",
        provider: details.workerName || "Rekha Devi (ANM)",
        notes: `Administered ${vaccineId.toUpperCase()} (Batch: ${details.batch || 'Verified'}).`,
      };

      return {
        ...c,
        doses: updatedDoses,
        priorityLevel: computePriority(updatedDoses),
        visitHistory: [newVisit, ...(c.visitHistory || [])],
        updatedAt: new Date().toISOString(),
      };
    });

    updateAllChildren(updated);

    // Add notification
    const newNotif = {
      id: `notif_${Date.now()}`,
      title: "Dose Administered & Verified",
      message: `${vaccineId.toUpperCase()} officially recorded by ANM at ${details.facility || "Sub-Centre"}.`,
      type: "administered",
      timestamp: "Just now",
      read: false,
      childId: childId,
    };
    const updatedNotifs = [newNotif, ...notifications];
    setNotifications(updatedNotifs);
    saveStoredNotifications(updatedNotifs);
  };

  // Register a new child linked explicitly to the active caregiver
  const registerChild = (newChildData) => {
    const stableId = `NJ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const fullChild = {
      id: stableId,
      caregiverId: user ? user.id : "usr_parent_01",
      caregiverName: user ? user.name : (newChildData.caregiverName || "Caregiver"),
      caregiverPhone: user ? user.phone : (newChildData.caregiverPhone || "+91 98765 43210"),
      village: user?.village || newChildData.village || "Rampur",
      subCentre: user?.jurisdiction?.subCentre || `${newChildData.village || "Rampur"} Sub-Centre`,
      phc: "Bilaspur Primary Health Centre",
      assignedWorker: newChildData.assignedWorker || "Rekha Devi (ANM)",
      migrationStatus: newChildData.migrationStatus || "resident",
      bloodGroup: newChildData.bloodGroup || "B+",
      birthWeightKg: Number(newChildData.birthWeightKg) || 3.1,
      priorityLevel: "amber",
      qrToken: `tok_${stableId.toLowerCase().replace('-', '_')}_sec`,
      createdAt: new Date().toISOString(),
      doses: newChildData.doses || [
        { id: `d_${Date.now()}_1`, vaccineId: "bcg", vaccineName: "BCG", status: "administered", dateAdministered: newChildData.dob, facility: "Sub-Centre", workerName: "Rekha Devi (ANM)", site: "Left upper arm" },
        { id: `d_${Date.now()}_2`, vaccineId: "opv_0", vaccineName: "OPV 0", status: "administered", dateAdministered: newChildData.dob, facility: "Sub-Centre", workerName: "Rekha Devi (ANM)", site: "Oral" },
        { id: `d_${Date.now()}_3`, vaccineId: "penta_1", vaccineName: "Pentavalent 1", status: "due_soon", dueDate: "2024-12-15", facility: "Sub-Centre" }
      ],
      milestones: newChildData.milestones || [],
      growthRecords: [
        { id: `gr_${Date.now()}`, date: newChildData.dob, ageMonths: 0, weightKg: Number(newChildData.birthWeightKg) || 3.1, heightCm: 49.0, headCircumferenceCm: 34.0, recordedBy: "Sub-Centre" }
      ],
      visitHistory: [
        { id: `vh_${Date.now()}`, date: newChildData.dob, visitType: "Birth Registration", provider: "Rekha Devi (ANM)", notes: "Child profile registered into NavJyoti." }
      ],
      followUpNotes: "",
      ...newChildData,
    };

    const updatedChildren = [fullChild, ...allChildren];
    updateAllChildren(updatedChildren);

    if (user && user.role === 'parent') {
      setActiveChildId(stableId);
    }
    return fullChild;
  };

  // Update existing child profile
  const updateChild = (childId, patchData) => {
    const updated = allChildren.map((c) => (c.id === childId ? { ...c, ...patchData, updatedAt: new Date().toISOString() } : c));
    updateAllChildren(updated);
    return updated.find((c) => c.id === childId);
  };

  // Record or toggle parent/worker milestone observation
  const recordMilestoneObservation = (childId, { milestoneId, domain, title, status = 'recorded', notes = '' }) => {
    const updated = allChildren.map((c) => {
      if (c.id !== childId) return c;
      const currentMilestones = c.milestones || [];
      const existingIdx = currentMilestones.findIndex((m) => m.milestoneId === milestoneId);

      const obs = {
        id: existingIdx >= 0 ? currentMilestones[existingIdx].id : `m_${Date.now()}`,
        milestoneId,
        domain,
        title,
        status,
        observedDate: new Date().toISOString().split('T')[0],
        notes: notes.trim(),
      };

      let nextMilestones;
      if (existingIdx >= 0) {
        nextMilestones = [...currentMilestones];
        nextMilestones[existingIdx] = obs;
      } else {
        nextMilestones = [obs, ...currentMilestones];
      }

      return {
        ...c,
        milestones: nextMilestones,
        updatedAt: new Date().toISOString(),
      };
    });

    updateAllChildren(updated);
  };

  // Request new appointment with duplicate validation
  const requestAppointment = (aptData) => {
    const isDuplicate = appointments.some(
      (a) => a.childId === aptData.childId && a.requestedDate === aptData.requestedDate && a.status !== 'cancelled'
    );
    if (isDuplicate) {
      throw new Error(`An appointment request already exists for this child on ${aptData.requestedDate}.`);
    }

    const newApt = {
      id: `apt_${Date.now()}`,
      status: "requested",
      createdAt: new Date().toISOString(),
      ...aptData,
    };
    const updated = [newApt, ...appointments];
    setAppointments(updated);
    saveStoredAppointments(updated);
    return newApt;
  };

  // Accept/decline/complete appointment
  const updateAppointmentStatus = (aptId, newStatus, workerNotes = "") => {
    const updated = appointments.map((a) =>
      a.id === aptId ? { ...a, status: newStatus, notes: workerNotes || a.notes, updatedAt: new Date().toISOString() } : a
    );
    setAppointments(updated);
    saveStoredAppointments(updated);
  };

  // Reschedule appointment
  const rescheduleAppointment = (aptId, newDate, newTimeSlot, reason = "") => {
    const updated = appointments.map((a) =>
      a.id === aptId
        ? {
            ...a,
            requestedDate: newDate,
            timeSlot: newTimeSlot,
            status: "confirmed",
            notes: reason ? `Rescheduled: ${reason}` : a.notes,
            updatedAt: new Date().toISOString(),
          }
        : a
    );
    setAppointments(updated);
    saveStoredAppointments(updated);
  };

  // Cancel appointment
  const cancelAppointment = (aptId, reason = "") => {
    updateAppointmentStatus(aptId, 'cancelled', reason ? `Cancelled: ${reason}` : 'Cancelled by user');
  };

  // Notifications actions
  const markNotificationAsRead = (notifId) => {
    const updated = notifications.map((n) => (n.id === notifId ? { ...n, read: true } : n));
    setNotifications(updated);
    saveStoredNotifications(updated);
  };

  const markAllNotificationsAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    saveStoredNotifications(updated);
  };

  const dismissNotification = (notifId) => {
    const updated = notifications.filter((n) => n.id !== notifId);
    setNotifications(updated);
    saveStoredNotifications(updated);
  };

  // Communications actions
  const sendSimulatedMessage = ({ recipientName, recipientPhone, childId, childName, message, type = 'reminder' }) => {
    const newComm = {
      id: `comm_${Date.now()}`,
      recipientName,
      recipientPhone,
      childId,
      childName,
      type,
      message,
      channel: "Simulated SMS",
      sentAt: new Date().toISOString(),
      status: "Delivered (Simulated)",
    };

    const updated = [newComm, ...communications];
    setCommunications(updated);
    saveStoredCommunications(updated);
    return newComm;
  };

  // Update follow-up status for priority queue
  const updateFollowUp = (childId, { priorityLevel, notes }) => {
    const updated = allChildren.map((c) => {
      if (c.id !== childId) return c;
      return {
        ...c,
        priorityLevel: priorityLevel || c.priorityLevel,
        followUpNotes: notes !== undefined ? notes : c.followUpNotes,
        updatedAt: new Date().toISOString(),
      };
    });
    updateAllChildren(updated);
  };

  // Factory reset demo data (for development/testing only)
  const resetDemoData = () => {
    resetAllDemoData();
    const freshChildren = getChildren();
    setAllChildren(freshChildren);
    setAppointments(DEFAULT_APPOINTMENTS);
    setNotifications(DEFAULT_NOTIFICATIONS);
    setCommunications(DEFAULT_COMMUNICATIONS);
    setActiveChildIdState(freshChildren[0]?.id || null);
  };

  return (
    <HealthDataContext.Provider
      value={{
        childrenList: accessibleChildren,
        allChildren,
        activeChild,
        activeChildId,
        setActiveChildId,
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
      }}
    >
      {children}
    </HealthDataContext.Provider>
  );
}

export function useHealthData() {
  const context = useContext(HealthDataContext);
  if (!context) {
    throw new Error('useHealthData must be used within a HealthDataProvider');
  }
  return context;
}
