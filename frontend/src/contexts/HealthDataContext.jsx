import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import {
  getChildren,
  saveChildren,
  getChildrenForCaregiver,
  getChildrenForWorker,
  getLastSelectedChildId,
  setLastSelectedChildId,
  getStoredAppointments,
  saveStoredAppointments,
  getStoredNotifications,
  saveStoredNotifications,
  resetAllDemoData,
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
  const { user, role } = useAuth();

  const [allChildren, setAllChildren] = useState(() => getChildren());
  const [appointments, setAppointments] = useState(() => getStoredAppointments(DEFAULT_APPOINTMENTS));
  const [notifications, setNotifications] = useState(() => getStoredNotifications(DEFAULT_NOTIFICATIONS));

  // Determine accessible children based on authenticated role & user ID (Data Isolation)
  const accessibleChildren = useMemo(() => {
    if (!user) return [];
    if (user.role === 'parent') {
      return getChildrenForCaregiver(user.id, user.phone);
    }
    if (user.role === 'worker') {
      return getChildrenForWorker(user.jurisdiction);
    }
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
      // Worker role
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

  // Officially record an administered dose
  const administerDose = (childId, vaccineId, details) => {
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
            notes: details.notes || "",
          };
        }
        return d;
      });

      return {
        ...c,
        doses: updatedDoses,
        priorityLevel: computePriority(updatedDoses),
      };
    });

    updateAllChildren(updated);

    // Add alert notification
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
      migrationStatus: newChildData.migrationStatus || "resident",
      priorityLevel: "amber",
      qrToken: `tok_${stableId.toLowerCase().replace('-', '_')}_sec`,
      createdAt: new Date().toISOString(),
      doses: newChildData.doses || [
        { id: `d_${Date.now()}_1`, vaccineId: "bcg", vaccineName: "BCG", status: "administered", dateAdministered: newChildData.dob, facility: "Sub-Centre", workerName: "Rekha Devi (ANM)" },
        { id: `d_${Date.now()}_2`, vaccineId: "opv_0", vaccineName: "OPV 0", status: "administered", dateAdministered: newChildData.dob, facility: "Sub-Centre", workerName: "Rekha Devi (ANM)" },
        { id: `d_${Date.now()}_3`, vaccineId: "penta_1", vaccineName: "Pentavalent 1", status: "due_soon", dueDate: "2024-12-15", facility: "Sub-Centre" }
      ],
      milestones: newChildData.milestones || [],
      ...newChildData,
    };

    const updatedChildren = [fullChild, ...allChildren];
    updateAllChildren(updatedChildren);

    if (user && user.role === 'parent') {
      setActiveChildId(stableId);
    }
    return fullChild;
  };

  // Request new appointment
  const requestAppointment = (aptData) => {
    const newApt = {
      id: `apt_${Date.now()}`,
      status: "requested",
      createdAt: new Date().toISOString(),
      ...aptData,
    };
    const updated = [newApt, ...appointments];
    setAppointments(updated);
    saveStoredAppointments(updated);
  };

  // Accept/decline appointment
  const updateAppointmentStatus = (aptId, newStatus, workerNotes = "") => {
    const updated = appointments.map((a) =>
      a.id === aptId ? { ...a, status: newStatus, notes: workerNotes || a.notes } : a
    );
    setAppointments(updated);
    saveStoredAppointments(updated);
  };

  // Factory reset demo data (for development/testing only)
  const resetDemoData = () => {
    resetAllDemoData();
    setAllChildren(getChildren());
    setAppointments(DEFAULT_APPOINTMENTS);
    setNotifications(DEFAULT_NOTIFICATIONS);
    setActiveChildIdState(null);
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
        administerDose,
        registerChild,
        requestAppointment,
        updateAppointmentStatus,
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
