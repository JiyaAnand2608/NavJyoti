/**
 * NavJyoti Unified Frontend API Service Abstraction
 * 
 * ARCHITECTURE NOTICE:
 * This module acts as the service boundary between frontend UI components and the data layer.
 * In the current Phase 2 frontend prototype, it encapsulates localStorage read/writes, simulated delays,
 * and business validation rules.
 * 
 * In Phase 3 (Backend Integration), the implementation of these functions will be replaced by
 * asynchronous HTTP calls (e.g. `fetch('/api/v1/...')`) without changing component-level interfaces.
 */

import * as storage from './storage';
import { UIP_SCHEDULE } from '../data/uipVaccineSchedule';
import { MILESTONE_SCHEDULE, MILESTONE_DOMAINS } from '../data/milestoneSchedule';

// Simulated network latency helper
const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

export const api = {
  // Authentication & Session Service
  auth: {
    async getSession() {
      await delay(50);
      return storage.getSession();
    },

    async login(identifier, role = 'parent', passwordOrOtp = '4092') {
      await delay(200);
      if (!identifier || !identifier.trim()) {
        throw new Error('Identifier (mobile number or worker ID) is required.');
      }

      let account = storage.findAccountByPhoneOrId(identifier, role);
      if (account && account.role !== role) {
        throw new Error(`This credential belongs to a ${account.role} account. Please use the ${account.role} login portal.`);
      }

      if (!account) {
        // Auto-provision demo account for friction-free simulation
        account = {
          id: `usr_${role}_${Date.now()}`,
          role: role,
          name: role === 'parent' ? "Demo Caregiver" : role === 'supervisor' ? "Dr. Demo Supervisor" : "Demo Health Worker",
          phone: identifier,
          workerId: role !== 'parent' ? identifier : undefined,
          village: "Rampur",
          district: "Bilaspur Sadar",
          state: "Uttar Pradesh",
          linkedChildIds: [],
          createdAt: new Date().toISOString(),
          isSimulated: true,
        };
        storage.createOrUpdateAccount(account);
      }

      storage.saveSession(account);
      return account;
    },

    async loginDemo(roleKey = 'parent') {
      await delay(150);
      const accounts = storage.getAccounts();
      const targetRole = roleKey === 'supervisor' ? 'supervisor' : roleKey === 'worker' ? 'worker' : 'parent';
      const demoAccount = accounts.find((a) => a.role === targetRole) || storage.DEFAULT_ACCOUNTS[0];

      storage.saveSession(demoAccount);
      return demoAccount;
    },

    async registerCaregiver({ name, phone, language = 'hi', consent = true }) {
      await delay(250);
      if (!name || !name.trim()) throw new Error('Caregiver name is required.');
      if (!phone || !phone.trim()) throw new Error('Mobile number is required.');

      const newAccount = {
        id: `usr_parent_${Date.now()}`,
        role: 'parent',
        name: name.trim(),
        phone: phone.trim(),
        language,
        consent,
        village: "Rampur",
        district: "Bilaspur Sadar",
        state: "Uttar Pradesh",
        linkedChildIds: [],
        createdAt: new Date().toISOString(),
        isSimulated: true,
      };

      storage.createOrUpdateAccount(newAccount);
      storage.saveSession(newAccount);
      return newAccount;
    },

    async requestPasswordReset(identifier) {
      await delay(300);
      return {
        success: true,
        message: `Simulation Notice: In production, a secure OTP will be dispatched to ${identifier}. This feature is non-operational until real SMS gateway integration.`,
      };
    },

    async updateProfile(userId, patchData) {
      await delay(150);
      const accounts = storage.getAccounts();
      const account = accounts.find((a) => a.id === userId);
      if (!account) throw new Error('Account not found.');

      const updated = { ...account, ...patchData, updatedAt: new Date().toISOString() };
      storage.createOrUpdateAccount(updated);

      // If active session, update session too
      const currentSession = storage.getSession();
      if (currentSession && currentSession.userId === userId) {
        storage.saveSession(updated);
      }
      return updated;
    },

    async logout() {
      await delay(50);
      storage.clearSession();
      return true;
    },
  },

  // Children Records Service
  children: {
    async getAll() {
      await delay(100);
      return storage.getChildren();
    },

    async getById(childId) {
      await delay(100);
      const children = storage.getChildren();
      const found = children.find((c) => c.id === childId || c.qrToken === childId);
      if (!found) throw new Error(`Child record with ID ${childId} not found.`);
      return found;
    },

    async create(newChildData, caregiverUser) {
      await delay(200);
      const currentYear = new Date().getFullYear();
      const randomIdSuffix = Math.floor(1000 + Math.random() * 9000);
      const stableId = `NJ-${currentYear}-${randomIdSuffix}`;

      const newChild = {
        id: stableId,
        name: newChildData.name.trim(),
        dob: newChildData.dob,
        gender: newChildData.gender || 'Male',
        bloodGroup: newChildData.bloodGroup || 'B+',
        birthWeightKg: Number(newChildData.birthWeightKg) || 3.1,
        ageMonths: Number(newChildData.ageMonths) || 1,
        caregiverId: caregiverUser?.id || "usr_parent_01",
        caregiverName: caregiverUser?.name || newChildData.caregiverName || "Caregiver",
        caregiverPhone: caregiverUser?.phone || newChildData.caregiverPhone || "+91 98765 43210",
        village: caregiverUser?.village || newChildData.village || "Rampur",
        subCentre: caregiverUser?.jurisdiction?.subCentre || `${newChildData.village || "Rampur"} Sub-Centre`,
        phc: "Bilaspur Primary Health Centre",
        assignedWorker: newChildData.assignedWorker || "Rekha Devi (ANM)",
        priorityLevel: "amber",
        migrationStatus: newChildData.migrationStatus || "resident",
        qrToken: `tok_${stableId.toLowerCase().replace('-', '_')}_sec`,
        createdAt: new Date().toISOString(),
        doses: [
          { id: `d_${Date.now()}_1`, vaccineId: "bcg", vaccineName: "BCG", status: "administered", dateAdministered: newChildData.dob, facility: "Sub-Centre", workerName: "Rekha Devi (ANM)", site: "Left upper arm" },
          { id: `d_${Date.now()}_2`, vaccineId: "opv_0", vaccineName: "OPV 0", status: "administered", dateAdministered: newChildData.dob, facility: "Sub-Centre", workerName: "Rekha Devi (ANM)", site: "Oral" },
          { id: `d_${Date.now()}_3`, vaccineId: "penta_1", vaccineName: "Pentavalent 1", status: "due_soon", dueDate: "2024-12-15", facility: "Sub-Centre" },
        ],
        milestones: [],
        growthRecords: [
          { id: `gr_${Date.now()}`, date: newChildData.dob, ageMonths: 0, weightKg: Number(newChildData.birthWeightKg) || 3.1, heightCm: 49.0, headCircumferenceCm: 34.0, recordedBy: "Sub-Centre" }
        ],
        visitHistory: [
          { id: `vh_${Date.now()}`, date: newChildData.dob, visitType: "Birth Registration", provider: "Rekha Devi (ANM)", notes: "Child profile registered into NavJyoti." }
        ],
        followUpNotes: "",
      };

      const children = storage.getChildren();
      const updatedList = [newChild, ...children];
      storage.saveChildren(updatedList);

      // Link child to caregiver account
      if (caregiverUser && caregiverUser.id) {
        const accounts = storage.getAccounts();
        const accIdx = accounts.findIndex((a) => a.id === caregiverUser.id);
        if (accIdx >= 0) {
          const linked = accounts[accIdx].linkedChildIds || [];
          if (!linked.includes(stableId)) {
            accounts[accIdx].linkedChildIds = [...linked, stableId];
            storage.createOrUpdateAccount(accounts[accIdx]);
          }
        }
      }

      return newChild;
    },

    async update(childId, patchData) {
      await delay(150);
      const updated = storage.updateChildRecord(childId, patchData);
      if (!updated) throw new Error(`Child ${childId} not found.`);
      return updated;
    },
  },

  // Clinical Vaccination Service
  vaccinations: {
    getSchedule() {
      return UIP_SCHEDULE;
    },

    async administerDose(childId, vaccineId, details) {
      await delay(200);
      const children = storage.getChildren();
      const childIdx = children.findIndex((c) => c.id === childId);
      if (childIdx < 0) throw new Error('Child not found.');

      const child = children[childIdx];
      const existingDose = child.doses?.find((d) => d.vaccineId === vaccineId);

      if (existingDose && existingDose.status === 'administered') {
        throw new Error(`Dose ${existingDose.vaccineName} has already been recorded as administered. Duplicate entries are prevented.`);
      }

      let updatedDoses = [...(child.doses || [])];
      if (existingDose) {
        updatedDoses = updatedDoses.map((d) =>
          d.vaccineId === vaccineId
            ? {
                ...d,
                status: 'administered',
                dateAdministered: details.dateAdministered || new Date().toISOString().split('T')[0],
                batch: details.batch || `BATCH-${Date.now().toString().slice(-4)}`,
                facility: details.facility || "Rampur Sub-Centre",
                workerName: details.workerName || "Rekha Devi (ANM)",
                site: details.site || "Upper arm / Mid-thigh",
                notes: details.notes || "",
              }
            : d
        );
      } else {
        updatedDoses.push({
          id: `dose_${Date.now()}`,
          vaccineId,
          vaccineName: details.vaccineName || vaccineId.toUpperCase(),
          status: 'administered',
          dateAdministered: details.dateAdministered || new Date().toISOString().split('T')[0],
          batch: details.batch || `BATCH-${Date.now().toString().slice(-4)}`,
          facility: details.facility || "Rampur Sub-Centre",
          workerName: details.workerName || "Rekha Devi (ANM)",
          site: details.site || "Upper arm",
        });
      }

      // Recompute administrative priority
      const hasOverdue = updatedDoses.some((d) => d.status === 'overdue');
      const hasDueSoon = updatedDoses.some((d) => d.status === 'due_soon');
      const newPriority = hasOverdue ? 'red' : hasDueSoon ? 'amber' : 'green';

      // Also append to visitHistory
      const newVisit = {
        id: `vh_${Date.now()}`,
        date: details.dateAdministered || new Date().toISOString().split('T')[0],
        visitType: "Vaccination Administration",
        provider: details.workerName || "Rekha Devi (ANM)",
        notes: `Administered ${details.vaccineName || vaccineId.toUpperCase()} (Batch: ${details.batch || 'Verified'}).`,
      };

      const updatedChild = {
        ...child,
        doses: updatedDoses,
        priorityLevel: newPriority,
        visitHistory: [newVisit, ...(child.visitHistory || [])],
        updatedAt: new Date().toISOString(),
      };

      children[childIdx] = updatedChild;
      storage.saveChildren(children);

      // Append persistent notification
      const notifs = storage.getStoredNotifications();
      const newNotif = {
        id: `notif_${Date.now()}`,
        title: "UIP Dose Administered",
        message: `${details.vaccineName || vaccineId.toUpperCase()} officially administered and recorded by ${details.workerName || 'ANM'}.`,
        type: "administered",
        timestamp: "Just now",
        read: false,
        childId,
      };
      storage.saveStoredNotifications([newNotif, ...notifs]);

      return updatedChild;
    },
  },

  // Developmental Milestones Service
  milestones: {
    getSchedule() {
      return MILESTONE_SCHEDULE;
    },
    getDomains() {
      return MILESTONE_DOMAINS;
    },

    async recordObservation(childId, { milestoneId, domain, title, status = 'recorded', notes = '' }) {
      await delay(150);
      const children = storage.getChildren();
      const childIdx = children.findIndex((c) => c.id === childId);
      if (childIdx < 0) throw new Error('Child not found.');

      const child = children[childIdx];
      const milestones = child.milestones || [];
      const existingIdx = milestones.findIndex((m) => m.milestoneId === milestoneId);

      const observation = {
        id: existingIdx >= 0 ? milestones[existingIdx].id : `m_${Date.now()}`,
        milestoneId,
        domain,
        title,
        status, // 'recorded' | 'not_observed'
        observedDate: new Date().toISOString().split('T')[0],
        notes: notes.trim(),
      };

      let updatedMilestones;
      if (existingIdx >= 0) {
        updatedMilestones = [...milestones];
        updatedMilestones[existingIdx] = observation;
      } else {
        updatedMilestones = [observation, ...milestones];
      }

      const updatedChild = {
        ...child,
        milestones: updatedMilestones,
        updatedAt: new Date().toISOString(),
      };

      children[childIdx] = updatedChild;
      storage.saveChildren(children);
      return updatedChild;
    },
  },

  // Appointments Service
  appointments: {
    async getAll() {
      await delay(100);
      return storage.getStoredAppointments();
    },

    async create(aptData) {
      await delay(200);
      // Validate date
      if (!aptData.requestedDate) throw new Error('Requested date is required.');
      const appointments = storage.getStoredAppointments();

      // Duplicate prevention: check if this child already has a requested/confirmed appointment on the same date
      const duplicate = appointments.find(
        (a) => a.childId === aptData.childId && a.requestedDate === aptData.requestedDate && a.status !== 'cancelled'
      );
      if (duplicate) {
        throw new Error(`An active appointment request already exists for this child on ${aptData.requestedDate}.`);
      }

      const newApt = {
        id: `apt_${Date.now()}`,
        status: "requested",
        createdAt: new Date().toISOString(),
        ...aptData,
      };

      const updated = [newApt, ...appointments];
      storage.saveStoredAppointments(updated);
      return newApt;
    },

    async updateStatus(aptId, status, workerNotes = '') {
      await delay(150);
      const appointments = storage.getStoredAppointments();
      const idx = appointments.findIndex((a) => a.id === aptId);
      if (idx < 0) throw new Error('Appointment not found.');

      const updatedApt = {
        ...appointments[idx],
        status,
        notes: workerNotes || appointments[idx].notes,
        updatedAt: new Date().toISOString(),
      };
      appointments[idx] = updatedApt;
      storage.saveStoredAppointments(appointments);
      return updatedApt;
    },

    async reschedule(aptId, newDate, newTimeSlot, reason = '') {
      await delay(150);
      const appointments = storage.getStoredAppointments();
      const idx = appointments.findIndex((a) => a.id === aptId);
      if (idx < 0) throw new Error('Appointment not found.');

      const updatedApt = {
        ...appointments[idx],
        requestedDate: newDate,
        timeSlot: newTimeSlot,
        status: 'confirmed',
        notes: reason ? `Rescheduled: ${reason}` : appointments[idx].notes,
        updatedAt: new Date().toISOString(),
      };
      appointments[idx] = updatedApt;
      storage.saveStoredAppointments(appointments);
      return updatedApt;
    },

    async cancel(aptId, reason = '') {
      return this.updateStatus(aptId, 'cancelled', reason ? `Cancelled: ${reason}` : 'Cancelled by caregiver');
    },
  },

  // Reminders & Notifications Service
  notifications: {
    async getAll() {
      await delay(50);
      return storage.getStoredNotifications();
    },

    async markAsRead(notifId) {
      const notifs = storage.getStoredNotifications();
      const updated = notifs.map((n) => (n.id === notifId ? { ...n, read: true } : n));
      storage.saveStoredNotifications(updated);
      return updated;
    },

    async markAllAsRead() {
      const notifs = storage.getStoredNotifications();
      const updated = notifs.map((n) => ({ ...n, read: true }));
      storage.saveStoredNotifications(updated);
      return updated;
    },

    async dismiss(notifId) {
      const notifs = storage.getStoredNotifications();
      const updated = notifs.filter((n) => n.id !== notifId);
      storage.saveStoredNotifications(updated);
      return updated;
    },
  },

  // Communications Service
  communications: {
    async getAll() {
      await delay(100);
      return storage.getStoredCommunications();
    },

    async sendSimulatedMessage({ recipientName, recipientPhone, childId, childName, message, type = 'reminder' }) {
      await delay(300);
      const comms = storage.getStoredCommunications();
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

      const updated = [newComm, ...comms];
      storage.saveStoredCommunications(updated);
      return newComm;
    },
  },

  // Analytics & Supervision Service
  analytics: {
    async getSupervisorMetrics(villageFilter = 'all', workerFilter = 'all') {
      await delay(150);
      const allChildren = storage.getChildren();
      const appointments = storage.getStoredAppointments();

      // Filter children according to parameters
      let filtered = allChildren;
      if (villageFilter !== 'all') {
        filtered = filtered.filter((c) => c.village === villageFilter);
      }
      if (workerFilter !== 'all') {
        filtered = filtered.filter((c) => c.assignedWorker?.includes(workerFilter));
      }

      const totalChildren = filtered.length;
      let totalAdministeredDoses = 0;
      let totalRequiredDoses = 0;
      let overdueDosesCount = 0;
      let fullyImmunisedCount = 0;

      filtered.forEach((child) => {
        const administered = child.doses?.filter((d) => d.status === 'administered').length || 0;
        const total = child.doses?.length || 0;
        const overdue = child.doses?.filter((d) => d.status === 'overdue').length || 0;

        totalAdministeredDoses += administered;
        totalRequiredDoses += total;
        overdueDosesCount += overdue;

        // Considered fully immunised if up to date or all age-appropriate doses administered
        if (child.priorityLevel === 'green' || (total > 0 && administered === total)) {
          fullyImmunisedCount++;
        }
      });

      const coverageRate = totalRequiredDoses > 0 ? Math.round((totalAdministeredDoses / totalRequiredDoses) * 100) : 0;
      const redFollowups = filtered.filter((c) => c.priorityLevel === 'red').length;
      const amberFollowups = filtered.filter((c) => c.priorityLevel === 'amber').length;

      // Group by village
      const villages = ["Rampur", "Kalyanpur", "Shivpur"];
      const villageBreakdown = villages.map((vName) => {
        const vChildren = allChildren.filter((c) => c.village === vName);
        const vAdmin = vChildren.reduce((sum, c) => sum + (c.doses?.filter((d) => d.status === 'administered').length || 0), 0);
        const vReq = vChildren.reduce((sum, c) => sum + (c.doses?.length || 0), 0);
        const vOverdue = vChildren.reduce((sum, c) => sum + (c.doses?.filter((d) => d.status === 'overdue').length || 0), 0);
        const vRate = vReq > 0 ? Math.round((vAdmin / vReq) * 100) : 0;

        return {
          village: vName,
          cohort: vChildren.length,
          fullyImmunised: vChildren.filter((c) => c.priorityLevel === 'green').length,
          coverage: vRate,
          dropOutRate: (Math.random() * 2 + 3).toFixed(1), // Realistic UIP drop-out percentage
          overdue: vOverdue,
        };
      });

      // Worker workload summary
      const workerWorkload = [
        {
          workerName: "Rekha Devi (ANM)",
          subCentre: "Rampur Sub-Centre",
          assignedChildren: allChildren.filter((c) => c.assignedWorker?.includes("Rekha Devi")).length,
          pendingVisits: appointments.filter((a) => a.assignedWorker?.includes("Rekha Devi") && a.status === 'requested').length,
          confirmedVisits: appointments.filter((a) => a.assignedWorker?.includes("Rekha Devi") && a.status === 'confirmed').length,
          urgentFollowups: allChildren.filter((c) => c.assignedWorker?.includes("Rekha Devi") && c.priorityLevel === 'red').length,
        },
        {
          workerName: "Nirmala Devi (ANM)",
          subCentre: "Shivpur Sub-Centre",
          assignedChildren: allChildren.filter((c) => c.assignedWorker?.includes("Nirmala Devi")).length,
          pendingVisits: appointments.filter((a) => a.assignedWorker?.includes("Nirmala Devi") && a.status === 'requested').length,
          confirmedVisits: appointments.filter((a) => a.assignedWorker?.includes("Nirmala Devi") && a.status === 'confirmed').length,
          urgentFollowups: allChildren.filter((c) => c.assignedWorker?.includes("Nirmala Devi") && c.priorityLevel === 'red').length,
        }
      ];

      return {
        totalChildren,
        fullyImmunisedCount,
        coverageRate,
        overdueDosesCount,
        redFollowups,
        amberFollowups,
        totalAppointments: appointments.length,
        pendingAppointments: appointments.filter((a) => a.status === 'requested').length,
        villageBreakdown,
        workerWorkload,
      };
    },
  },

  // Development & Testing Utilities
  system: {
    resetDemoData() {
      storage.resetAllDemoData();
      return true;
    },
  },
};
