import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useHealthData } from '../../contexts/HealthDataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  Syringe,
  Activity,
  CalendarCheck,
  ArrowRight,
  CheckCircle2,
  FileText,
  Baby,
  Plus,
  Clock,
  AlertTriangle,
  Bell,
  ChevronRight,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

export function ParentDashboardHome() {
  const { user } = useAuth();
  const { childrenList, activeChild, activeChildId, setActiveChildId, registerChild, appointments, notifications } = useHealthData();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildDob, setNewChildDob] = useState('');
  const [newChildGender, setNewChildGender] = useState('Male');
  const [newChildBirthWeight, setNewChildBirthWeight] = useState('3.1');
  const [newChildBloodGroup, setNewChildBloodGroup] = useState('B+');

  const handleAddChildSubmit = (e) => {
    e.preventDefault();
    if (!newChildName.trim() || !newChildDob) return;

    registerChild({
      name: newChildName.trim(),
      dob: newChildDob,
      gender: newChildGender,
      birthWeightKg: Number(newChildBirthWeight) || 3.1,
      bloodGroup: newChildBloodGroup,
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
        <div className="w-16 h-16 rounded-3xl bg-[#DDF0E3] text-[#007F68] mx-auto flex items-center justify-center shadow-xs">
          <Baby className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[#103342] font-serif">
            {t('parentDashboard.emptyStateTitle') || "Let's add your child's profile to get started."}
          </h1>
          <p className="text-xs sm:text-sm text-[#294B57] max-w-md mx-auto leading-relaxed">
            {t('parentDashboard.emptyStateSubtitle') || "Add your child's birth details to view their UIP immunisation schedule and developmental checkpoints."}
          </p>
        </div>

        <div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#007F68] text-white font-semibold text-xs shadow-sm hover:bg-[#005F52] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('parentDashboard.addChildBtn') || "Add Child"}</span>
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
              <label className="block font-semibold text-[#103342] mb-1">Child's Full Name</label>
              <input
                type="text"
                required
                value={newChildName}
                onChange={(e) => setNewChildName(e.target.value)}
                placeholder="e.g. Aarav Sharma"
                className="w-full px-3 py-2.5 rounded-xl border border-[#D8E6DA] bg-white text-[#103342] focus:ring-2 focus:ring-[#007F68]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#103342] mb-1">Date of Birth</label>
                <input
                  type="date"
                  required
                  value={newChildDob}
                  onChange={(e) => setNewChildDob(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#103342] mb-1">Gender</label>
                <select
                  value={newChildGender}
                  onChange={(e) => setNewChildGender(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#103342] mb-1">Birth Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newChildBirthWeight}
                  onChange={(e) => setNewChildBirthWeight(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#103342] mb-1">Blood Group</label>
                <select
                  value={newChildBloodGroup}
                  onChange={(e) => setNewChildBloodGroup(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 rounded-full bg-[#007F68] text-white font-semibold text-xs hover:bg-[#005F52] transition-all cursor-pointer shadow-xs"
              >
                Create Digital Health Pass
              </button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  // Derived Metrics for Active Child
  const totalDoses = activeChild.doses?.length || 0;
  const completedDoses = activeChild.doses?.filter((d) => d.status === 'administered').length || 0;
  const dueSoonDoses = activeChild.doses?.filter((d) => d.status === 'due_soon') || [];
  const overdueDoses = activeChild.doses?.filter((d) => d.status === 'overdue') || [];
  const nextDose = dueSoonDoses[0] || overdueDoses[0] || null;
  const progressPercent = totalDoses > 0 ? Math.round((completedDoses / totalDoses) * 100) : 0;

  // Developmental milestone summary
  const totalMilestonesObserved = activeChild.milestones?.filter((m) => m.status === 'recorded').length || 0;

  // Active appointments for active child
  const childAppointments = appointments.filter((a) => a.childId === activeChild.id && a.status !== 'cancelled');
  const nextAppointment = childAppointments[0] || null;

  // Unread reminders
  const unreadNotifs = notifications.filter((n) => !n.read);

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-[#294B57]">
      {/* 1. WELCOME BANNER WITH LANDSCAPE AESTHETIC & ACTIVE CHILD SELECTOR */}
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#F5F1E9] via-[#EBF4EE] to-[#E5F2E9] border border-[#D8E6DA] p-6 sm:p-7 shadow-xs">
        {/* Decorative subtle sun & hill silhouette */}
        <svg
          className="absolute right-0 top-0 w-72 h-full pointer-events-none opacity-25"
          viewBox="0 0 280 160"
          fill="none"
          preserveAspectRatio="none"
        >
          <path d="M40 160 Q 140 60, 280 120 L 280 160 Z" fill="#007F68" />
          <circle cx="220" cy="45" r="30" fill="#F4B83F" />
        </svg>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/90 text-[10px] font-bold uppercase tracking-wider text-[#007F68] border border-[#D8E6DA]">
                Caregiver Health Pass
              </span>
              <span className="text-xs text-[#294B57]">
                {user?.village || "Rampur"} • {user?.jurisdiction?.phc || "Bilaspur PHC"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#103342] font-serif">
              Welcome back, {user?.name || "Sunita Sharma"}
            </h1>

            <p className="text-xs sm:text-sm text-[#294B57] max-w-xl">
              Monitoring childhood vaccinations and milestone progress for your family.
            </p>
          </div>

          {/* Child Switcher Pill */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/90 p-1.5 rounded-2xl border border-[#D8E6DA] flex items-center gap-2 shadow-2xs">
              <span className="text-xs font-semibold text-[#103342] pl-2">Active Child:</span>
              <select
                value={activeChildId || ''}
                onChange={(e) => setActiveChildId(e.target.value)}
                className="bg-[#F0EBE1] text-[#103342] text-xs font-bold py-1.5 px-3 rounded-xl border-none focus:ring-1 focus:ring-[#007F68] cursor-pointer"
              >
                {childrenList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.ageMonths}m old)
                  </option>
                ))}
              </select>
              <Link
                to="/parent/children"
                className="p-1.5 rounded-xl hover:bg-[#F0EBE1] text-[#007F68] transition-colors"
                title="Manage All Children"
              >
                <Plus className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 2. THREE SUMMARY KPI STATUS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Immunisation Status Card */}
        <Card className="p-5 bg-[#FBF8F2] border-[#D8E6DA] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#294B57] flex items-center gap-1.5">
                <Syringe className="w-4 h-4 text-[#007F68]" />
                <span>UIP Immunisation</span>
              </span>
              {overdueDoses.length > 0 ? (
                <Badge variant="overdue">{overdueDoses.length} Overdue</Badge>
              ) : dueSoonDoses.length > 0 ? (
                <Badge variant="dueSoon">Due Soon</Badge>
              ) : (
                <Badge variant="upToDate">Up to Date</Badge>
              )}
            </div>

            <div className="space-y-1">
              <div className="text-2xl font-bold text-[#103342]">
                {completedDoses} / {totalDoses} Doses
              </div>
              <p className="text-xs text-[#294B57]">
                {progressPercent}% of age-appropriate national UIP vaccines completed
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-[#E5DFD4] h-2 rounded-full overflow-hidden mt-3">
              <div
                className="bg-[#007F68] h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#D8E6DA]/70 flex items-center justify-between text-xs font-semibold text-[#007F68]">
            <Link to="/parent/vaccines" className="hover:underline flex items-center gap-1">
              <span>View Full Schedule</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Card>

        {/* Milestones Status Card */}
        <Card className="p-5 bg-[#FBF8F2] border-[#D8E6DA] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#294B57] flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-[#007F68]" />
                <span>Development Milestones</span>
              </span>
              <Badge variant="teal">{totalMilestonesObserved} Observed</Badge>
            </div>

            <div className="space-y-1">
              <div className="text-2xl font-bold text-[#103342]">
                {totalMilestonesObserved} Checkpoints
              </div>
              <p className="text-xs text-[#294B57]">
                Natural behavioral milestones observed for age {activeChild.ageMonths} months
              </p>
            </div>

            <div className="mt-3 p-2.5 rounded-xl bg-[#F0EBE1] text-[11px] text-[#294B57]">
              Non-diagnostic observations aligned with WHO ECD benchmarks.
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#D8E6DA]/70 flex items-center justify-between text-xs font-semibold text-[#007F68]">
            <Link to="/parent/milestones" className="hover:underline flex items-center gap-1">
              <span>Check Milestones</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Card>

        {/* Upcoming Visit Card */}
        <Card className="p-5 bg-[#FBF8F2] border-[#D8E6DA] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#294B57] flex items-center gap-1.5">
                <CalendarCheck className="w-4 h-4 text-[#007F68]" />
                <span>Next Health Visit</span>
              </span>
              {nextAppointment ? (
                <Badge variant={nextAppointment.status === 'confirmed' ? 'upToDate' : 'dueSoon'}>
                  {nextAppointment.status === 'confirmed' ? 'Confirmed' : 'Requested'}
                </Badge>
              ) : (
                <Badge variant="default">No Active Booking</Badge>
              )}
            </div>

            {nextAppointment ? (
              <div className="space-y-1.5">
                <div className="text-sm font-bold text-[#103342] line-clamp-1">
                  {nextAppointment.purpose}
                </div>
                <p className="text-xs text-[#294B57] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#007F68]" />
                  <span>{nextAppointment.requestedDate} at {nextAppointment.timeSlot}</span>
                </p>
                <p className="text-[11px] text-[#294B57]/70">
                  Assigned ANM: {nextAppointment.assignedWorker}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-xs text-[#294B57]">
                  Need a home checkup or consultation with your village ANM?
                </p>
                <p className="text-[11px] text-[#294B57]/70">
                  Regular sessions held on Wednesday (VHND).
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#D8E6DA]/70 flex items-center justify-between text-xs font-semibold text-[#007F68]">
            <Link to="/parent/appointments" className="hover:underline flex items-center gap-1">
              <span>{nextAppointment ? "View Appointment" : "Request ANM Visit"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Card>
      </div>

      {/* 3. NEXT RECOMMENDED ACTION & QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Next Recommended Action */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-5 bg-[#FBF8F2] border border-[#D8E6DA]">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#007F68]" />
              <h3 className="font-bold text-sm text-[#103342] font-serif">
                {t('parentDashboard.recommendedActionTitle') || "Recommended Next Action"}
              </h3>
            </div>

            {nextDose ? (
              <div className="p-4 rounded-2xl bg-white border border-[#D8E6DA] space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#007F68]">
                      Upcoming Universal Immunisation
                    </span>
                    <h4 className="font-bold text-base text-[#103342] mt-0.5">
                      {nextDose.vaccineName}
                    </h4>
                    <p className="text-xs text-[#294B57] mt-1">
                      Due around: <strong className="font-mono text-[#103342]">{nextDose.dueDate || "Next Routine Session"}</strong> at {activeChild.village} Sub-Centre.
                    </p>
                  </div>
                  <Badge variant={nextDose.status === 'overdue' ? 'overdue' : 'dueSoon'}>
                    {nextDose.status === 'overdue' ? 'Overdue Action' : 'Scheduled'}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <Link
                    to="/parent/appointments"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#007F68] hover:bg-[#005F52] text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <CalendarCheck className="w-3.5 h-3.5" />
                    <span>Book Session Visit</span>
                  </Link>
                  <Link
                    to="/parent/vaccines"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F0EBE1] hover:bg-[#E5DFD4] text-[#103342] text-xs font-semibold transition-colors"
                  >
                    <span>View Vaccine Info</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-[#DDF0E3] border border-[#A8D5B5] text-xs text-[#005F52] flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#007F68] shrink-0" />
                <div>
                  <span className="font-bold block">All scheduled vaccines up to date!</span>
                  <span>{activeChild.name} is on track for their current age. Next milestone checks can be logged anytime.</span>
                </div>
              </div>
            )}
          </Card>

          {/* Recent Activity Log */}
          <Card className="bg-[#FBF8F2] border-[#D8E6DA]">
            <CardHeader
              title={t('parentDashboard.recentActivityHeading') || "Recent Health Activity"}
              subtitle={`Latest recorded entries for ${activeChild.name}`}
            />
            <div className="divide-y divide-[#D8E6DA]/70 text-xs">
              {activeChild.visitHistory && activeChild.visitHistory.length > 0 ? (
                activeChild.visitHistory.slice(0, 3).map((vh) => (
                  <div key={vh.id} className="p-4 flex items-start gap-3 hover:bg-[#F0EBE1]/40 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-[#DDF0E3] text-[#007F68] flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#103342]">{vh.visitType}</span>
                        <span className="text-[10px] font-mono text-[#294B57]/70">{vh.date}</span>
                      </div>
                      <p className="text-xs text-[#294B57] mt-0.5">{vh.notes}</p>
                      <span className="text-[10px] text-[#007F68] font-medium block mt-1">Provider: {vh.provider}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-[#294B57]/70">No recorded activity yet.</div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Quick Action Grid & Reminders Snippet */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-5 bg-[#FBF8F2] border border-[#D8E6DA]">
            <h3 className="font-bold text-sm text-[#103342] font-serif mb-4">
              {t('parentDashboard.quickActionsHeading') || "Quick Actions"}
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <Link
                to="/parent/vaccines"
                className="p-3.5 rounded-2xl bg-white border border-[#D8E6DA] hover:border-[#007F68] transition-all group flex flex-col justify-between"
              >
                <div className="w-8 h-8 rounded-xl bg-[#DDF0E3] text-[#007F68] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Syringe className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-[#103342] block">Vaccine Tracker</span>
                  <span className="text-[10px] text-[#294B57]/70">View UIP stages</span>
                </div>
              </Link>

              <Link
                to="/parent/records"
                className="p-3.5 rounded-2xl bg-white border border-[#D8E6DA] hover:border-[#007F68] transition-all group flex flex-col justify-between"
              >
                <div className="w-8 h-8 rounded-xl bg-[#DDF0E3] text-[#007F68] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-[#103342] block">Digital Health Pass</span>
                  <span className="text-[10px] text-[#294B57]/70">QR Pass & Growth</span>
                </div>
              </Link>

              <Link
                to="/parent/milestones"
                className="p-3.5 rounded-2xl bg-white border border-[#D8E6DA] hover:border-[#007F68] transition-all group flex flex-col justify-between"
              >
                <div className="w-8 h-8 rounded-xl bg-[#DDF0E3] text-[#007F68] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-[#103342] block">Milestones</span>
                  <span className="text-[10px] text-[#294B57]/70">Log observations</span>
                </div>
              </Link>

              <Link
                to="/parent/appointments"
                className="p-3.5 rounded-2xl bg-white border border-[#D8E6DA] hover:border-[#007F68] transition-all group flex flex-col justify-between"
              >
                <div className="w-8 h-8 rounded-xl bg-[#DDF0E3] text-[#007F68] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-[#103342] block">Appointments</span>
                  <span className="text-[10px] text-[#294B57]/70">Book with ANM</span>
                </div>
              </Link>
            </div>
          </Card>

          {/* Active Notifications Preview */}
          <Card className="p-5 bg-[#FBF8F2] border border-[#D8E6DA]">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-sm text-[#103342] font-serif flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-[#007F68]" />
                <span>Active Alerts ({unreadNotifs.length})</span>
              </span>
              <Link to="/parent/reminders" className="text-xs text-[#007F68] font-semibold hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-2.5 text-xs">
              {notifications.slice(0, 2).map((n) => (
                <div
                  key={n.id}
                  className={`p-3 rounded-xl border transition-all ${
                    !n.read ? 'bg-white border-[#007F68]/30 shadow-2xs' : 'bg-[#F0EBE1]/60 border-[#D8E6DA]'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-[#103342]">
                    <span>{n.title}</span>
                    <span className="text-[10px] font-mono text-[#294B57]/60">{n.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-[#294B57] mt-1 leading-relaxed">{n.message}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
