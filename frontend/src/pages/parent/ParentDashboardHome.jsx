import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useHealthData } from '../../contexts/HealthDataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  Syringe,
  Activity,
  CalendarCheck,
  Bell,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Baby,
  Plus,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';

export function ParentDashboardHome() {
  const { user } = useAuth();
  const { childrenList, activeChild, activeChildId, setActiveChildId, registerChild, appointments } = useHealthData();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildDob, setNewChildDob] = useState('');
  const [newChildGender, setNewChildGender] = useState('Male');

  const handleAddChildSubmit = (e) => {
    e.preventDefault();
    if (!newChildName.trim() || !newChildDob) return;

    registerChild({
      name: newChildName.trim(),
      dob: newChildDob,
      gender: newChildGender,
      ageMonths: 1,
    });

    setIsAddModalOpen(false);
    setNewChildName('');
    setNewChildDob('');
  };

  // 1. EMPTY STATE: If caregiver has no linked children
  if (!childrenList || childrenList.length === 0 || !activeChild) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-[#EAF7F0] text-[#006B64] mx-auto flex items-center justify-center shadow-xs">
          <Baby className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[#17394A] font-serif">
            {t('parentDashboard.emptyStateTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            {t('parentDashboard.emptyStateSubtitle')}
          </p>
        </div>

        <div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#006B64] text-white font-semibold text-xs shadow-sm hover:bg-[#00544e] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('parentDashboard.addChildBtn')}</span>
          </button>
        </div>

        {/* Add Child Modal */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add Child Profile"
          subtitle="Link your child's health record to this caregiver account"
        >
          <form onSubmit={handleAddChildSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Child's Full Name</label>
              <input
                type="text"
                required
                value={newChildName}
                onChange={(e) => setNewChildName(e.target.value)}
                placeholder="e.g. Aarav Sharma"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  required
                  value={newChildDob}
                  onChange={(e) => setNewChildDob(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                <select
                  value={newChildGender}
                  onChange={(e) => setNewChildGender(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-full bg-[#006B64] text-white font-semibold text-xs hover:bg-[#00544e] transition-all cursor-pointer mt-2"
            >
              Save Profile & Start Tracking
            </button>
          </form>
        </Modal>
      </div>
    );
  }

  // Active Child Insights answering the 4 questions
  const totalDoses = activeChild.doses?.length || 0;
  const completedDoses = activeChild.doses?.filter((d) => d.status === 'administered').length || 0;
  const progressPercent = totalDoses > 0 ? Math.round((completedDoses / totalDoses) * 100) : 0;

  const nextScheduledDose = activeChild.doses?.find((d) => d.status === 'due_soon' || d.status === 'overdue');
  const overdueDoses = activeChild.doses?.filter((d) => d.status === 'overdue') || [];
  const isOverdue = overdueDoses.length > 0;

  let nextActionMessage = "All age-appropriate doses are up to date. Next session will be on Wednesday at the local Sub-Centre.";
  if (isOverdue) {
    nextActionMessage = `Catch-up needed for ${overdueDoses.map(d => d.vaccineName).join(', ')}. Contact ANM Rekha Devi or visit the Sub-Centre.`;
  } else if (nextScheduledDose) {
    nextActionMessage = `Prepare for ${nextScheduledDose.vaccineName} scheduled on ${nextScheduledDose.dueDate || "next session"}.`;
  }

  const childAppointments = appointments.filter((a) => a.childId === activeChild.id);
  const nextAppointment = childAppointments[0];

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-[#17394A]">
      {/* 1. TOP WELCOMING HERO CARD (Sage Green theme matching Reference Image) */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-b from-[#EAF7F0] via-[#DCEFE5] to-[#D5EBDD] border border-[#CDE5D6] p-6 sm:p-8 shadow-xs">
        {/* Soft abstract landscape waves & sunrise in the background */}
        <svg
          className="absolute right-0 bottom-0 w-80 h-full pointer-events-none opacity-40"
          viewBox="0 0 320 200"
          fill="none"
          preserveAspectRatio="none"
        >
          <circle cx="260" cy="50" r="30" fill="#F5C45E" />
          <path d="M0 160 Q 120 90, 240 140 T 360 120 L 360 200 L 0 200 Z" fill="#BBDCCB" />
          <path d="M40 170 Q 160 110, 280 160 T 360 150 L 360 200 L 40 200 Z" fill="#78B89F" />
        </svg>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/80 text-[10px] font-bold uppercase tracking-wider text-[#006B64] border border-[#CDE5D6]">
                Caregiver Portal
              </span>
              {childrenList.length > 1 && (
                <div className="flex items-center gap-1.5 bg-white/90 px-3 py-1 rounded-full text-xs font-semibold border border-slate-200">
                  <span className="text-slate-500">Child:</span>
                  <select
                    value={activeChildId || ''}
                    onChange={(e) => setActiveChildId(e.target.value)}
                    className="font-bold text-[#17394A] bg-transparent focus:outline-none cursor-pointer"
                  >
                    {childrenList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.ageMonths}m)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#17394A] font-serif">
              Welcome, {user?.name || "Caregiver"}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 max-w-lg leading-relaxed">
              Monitoring health journey for <strong>{activeChild.name}</strong> ({activeChild.ageMonths} months old, ID: <span className="font-mono">{activeChild.id}</span>).
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to="/parent/vaccines"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#006B64] hover:bg-[#00544e] text-white font-semibold text-xs shadow-xs transition-all"
              >
                <Syringe className="w-3.5 h-3.5 text-white/90" />
                <span>View Vaccine Schedule</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white/90 hover:bg-white text-[#17394A] border border-slate-200 font-semibold text-xs shadow-2xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#006B64]" />
                <span>Add Sibling Profile</span>
              </button>
            </div>
          </div>

          {/* Floating Child Health Overview Card (Matches Reference Aesthetic) */}
          <div className="w-full md:w-64 rounded-2xl bg-white/95 backdrop-blur-md p-4 shadow-sm border border-white/80 space-y-3 shrink-0">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Health Status
              </span>
              {isOverdue ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fdf2f1] text-[#D98282]">
                  Action Needed
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF7F0] text-[#006B64]">
                  Up to Date
                </span>
              )}
            </div>

            <div>
              <span className="text-[11px] text-slate-500 block">Universal Immunisation Progress</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold text-[#006B64]">{progressPercent}%</span>
                <span className="text-xs font-semibold text-slate-600">({completedDoses}/{totalDoses} doses)</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-100 mt-1.5 overflow-hidden">
                <div className="h-full bg-[#006B64] rounded-full" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>{activeChild.village} Sub-Centre</span>
              <span className="font-semibold text-[#006B64]">UIP Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DASHBOARD KPI CARDS (Child Health Overview, Next Vaccination, Milestones, Upcoming Visit) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Next Scheduled Vaccination */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#DCEFE5] shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Next Vaccine</span>
            <div className="w-7 h-7 rounded-lg bg-[#EAF7F0] text-[#006B64] flex items-center justify-center">
              <Syringe className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-sm font-bold text-[#17394A] truncate">
            {nextScheduledDose ? nextScheduledDose.vaccineName : "All Up to Date"}
          </div>
          <p className="text-[11px] text-slate-500 truncate">
            {nextScheduledDose ? `Due: ${nextScheduledDose.dueDate || "Next Routine Session"}` : "No immediate pending dose"}
          </p>
        </div>

        {/* Immunisation Status */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Vaccination Status</span>
            <div className="w-7 h-7 rounded-lg bg-[#EAF7F0] text-[#006B64] flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            {isOverdue ? (
              <span className="text-xs font-bold text-[#D98282]">
                {overdueDoses.length} Dose(s) Pending Catch-up
              </span>
            ) : (
              <span className="text-xs font-bold text-[#006B64]">
                Protected & Up to Date
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 truncate">
            Aligned with MoHFW guidelines
          </p>
        </div>

        {/* Developmental Milestones */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#fbeccb] shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Development</span>
            <div className="w-7 h-7 rounded-lg bg-[#fdf8ef] text-[#dfab3e] flex items-center justify-center">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-sm font-bold text-[#17394A]">
            {activeChild.milestones?.length || 0} Checkpoints
          </div>
          <p className="text-[11px] text-slate-500 truncate">
            Motor, Speech, Social & Cognitive
          </p>
        </div>

        {/* Upcoming Visit */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Frontline Visit</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-[#17394A] flex items-center justify-center">
              <CalendarCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-sm font-bold text-[#17394A] truncate">
            {nextAppointment ? (nextAppointment.status === 'confirmed' ? "Confirmed Visit" : "Requested") : "No Active Visit"}
          </div>
          <p className="text-[11px] text-slate-500 truncate">
            {nextAppointment ? `${nextAppointment.requestedDate} (${nextAppointment.timeSlot})` : "ANM: Rekha Devi"}
          </p>
        </div>
      </div>

      {/* Recommended Next Action Banner */}
      <div className="p-4 rounded-2xl bg-[#EAF7F0] border border-[#DCEFE5] flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-white text-[#006B64] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs shadow-2xs">
          ✓
        </div>
        <div>
          <span className="text-xs font-bold text-[#17394A] block">
            Recommended Action:
          </span>
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
            {nextActionMessage}
          </p>
        </div>
      </div>

      {/* 3. QUICK ACTIONS */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <Link
            to="/parent/vaccines"
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#006B64] transition-all text-center group shadow-2xs"
          >
            <div className="w-9 h-9 rounded-xl bg-[#EAF7F0] text-[#006B64] mx-auto flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Syringe className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-[#17394A] block">Vaccinations</span>
            <span className="text-[10px] text-slate-400">UIP Schedule</span>
          </Link>

          <Link
            to="/parent/records"
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#006B64] transition-all text-center group shadow-2xs"
          >
            <div className="w-9 h-9 rounded-xl bg-[#EAF5F8] text-[#006B64] mx-auto flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-[#17394A] block">Health Pass</span>
            <span className="text-[10px] text-slate-400">QR & Records</span>
          </Link>

          <Link
            to="/parent/milestones"
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#006B64] transition-all text-center group shadow-2xs"
          >
            <div className="w-9 h-9 rounded-xl bg-[#fdf8ef] text-[#dfab3e] mx-auto flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Activity className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-[#17394A] block">Milestones</span>
            <span className="text-[10px] text-slate-400">Observational Growth</span>
          </Link>

          <Link
            to="/parent/appointments"
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#006B64] transition-all text-center group shadow-2xs"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-[#17394A] mx-auto flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-[#17394A] block">Appointments</span>
            <span className="text-[10px] text-slate-400">Request Visit</span>
          </Link>
        </div>
      </div>

      {/* 4. RECENT MEANINGFUL ACTIVITY */}
      <Card>
        <CardHeader
          title="Recent Updates & Clinical Logs"
          subtitle="Meaningful updates from your village health worker"
        />
        <div className="divide-y divide-slate-100 text-xs">
          {activeChild.doses?.filter(d => d.status === 'administered').slice(-3).reverse().map((dose) => (
            <div key={dose.id} className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#EAF7F0] text-[#006B64] flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-[#17394A] block">{dose.vaccineName} Administered</span>
                  <span className="text-[11px] text-slate-500">
                    Recorded on {dose.dateAdministered} • {dose.facility || 'Sub-Centre'} • {dose.workerName || 'ANM'}
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-[#006B64]">Verified</span>
            </div>
          ))}
          {activeChild.milestones?.slice(0, 1).map((m) => (
            <div key={m.id} className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#EAF5F8] text-[#17394A] flex items-center justify-center">
                  <Activity className="w-4 h-4 text-[#006B64]" />
                </div>
                <div>
                  <span className="font-bold text-[#17394A] block">Milestone Observation: {m.domain}</span>
                  <span className="text-[11px] text-slate-500">"{m.notes}" ({m.observedDate})</span>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">Observed</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Add Sibling Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Child Profile"
        subtitle="Link a sibling or additional child to your caregiver account"
      >
        <form onSubmit={handleAddChildSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Child's Full Name</label>
            <input
              type="text"
              required
              value={newChildName}
              onChange={(e) => setNewChildName(e.target.value)}
              placeholder="e.g. Priya Sharma"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
              <input
                type="date"
                required
                value={newChildDob}
                onChange={(e) => setNewChildDob(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Gender</label>
              <select
                value={newChildGender}
                onChange={(e) => setNewChildGender(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-full bg-[#006B64] text-white font-semibold text-xs hover:bg-[#00544e] transition-all cursor-pointer mt-2"
          >
            Save Child Profile
          </button>
        </form>
      </Modal>
    </div>
  );
}
