import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useHealthData } from '../../contexts/HealthDataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  Users,
  Syringe,
  PlusCircle,
  CalendarCheck,
  ChevronRight,
  ShieldAlert,
  Search,
  ArrowRight,
  ClipboardCheck,
  CheckCircle2,
  Clock,
  Activity,
  FileText
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';

export function WorkerDashboardOverview() {
  const { user } = useAuth();
  const { childrenList, appointments, notifications } = useHealthData();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');

  // Derived Summary Counts
  const totalChildren = childrenList.length;
  const dueSoonChildren = childrenList.filter((c) => c.priorityLevel === 'amber').length;
  const overdueChildren = childrenList.filter((c) => c.priorityLevel === 'red').length;
  const pendingAppointments = appointments.filter((a) => a.status === 'requested').length;
  const confirmedAppointments = appointments.filter((a) => a.status === 'confirmed').length;

  const filteredWorklist = childrenList.filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.id.toLowerCase().includes(term) ||
      c.village.toLowerCase().includes(term) ||
      c.caregiverName.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-[#294B57]">
      {/* 1. SAGE/CREAM WELCOME BANNER */}
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#F5F1E9] via-[#EBF4EE] to-[#E5F2E9] border border-[#D8E6DA] p-6 sm:p-7 shadow-xs">
        <svg
          className="absolute right-0 top-0 w-72 h-full pointer-events-none opacity-20"
          viewBox="0 0 280 160"
          fill="none"
          preserveAspectRatio="none"
        >
          <path d="M40 160 Q 140 60, 280 120 L 280 160 Z" fill="#007F68" />
          <circle cx="210" cy="50" r="28" fill="#F4B83F" />
        </svg>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/90 text-[10px] font-bold uppercase tracking-wider text-[#007F68] border border-[#D8E6DA]">
                Frontline Fieldwork Portal
              </span>
              <span className="text-xs text-[#294B57] font-mono">
                {user?.jurisdiction?.subCentre || "Rampur Sub-Centre"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#103342] font-serif">
              ANM Overview: {user?.name || "Rekha Devi"}
            </h1>

            <p className="text-xs sm:text-sm text-[#294B57] max-w-xl">
              Assigned jurisdiction: <strong>{user?.jurisdiction?.villagesCovered?.join(', ') || "Rampur, Kalyanpur, Shivpur"}</strong> • {user?.jurisdiction?.phc || "Bilaspur PHC"}.
            </p>
          </div>

          {/* Quick CTA to Priority Worklist */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/worker/priority"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#007F68] hover:bg-[#005F52] text-white font-semibold text-xs shadow-xs transition-all cursor-pointer"
            >
              <ClipboardCheck className="w-4 h-4 text-white/90" />
              <span>Priority Outreach ({overdueChildren + dueSoonChildren})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 2. SUMMARY (4 Compact KPI Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Registered Children */}
        <Link
          to="/worker/registry"
          className="p-4 rounded-2xl bg-[#FBF8F2] border border-[#D8E6DA] shadow-2xs hover:border-[#007F68] transition-colors group"
        >
          <span className="text-[11px] font-medium text-[#294B57] block">
            Registered Cohort (0–5)
          </span>
          <div className="text-2xl font-bold text-[#103342] mt-1 group-hover:text-[#007F68] transition-colors">
            {totalChildren}
          </div>
          <span className="text-[10px] text-[#294B57]/70 block mt-0.5">Assigned children in sector</span>
        </Link>

        {/* Card 2: Due Soon */}
        <Link
          to="/worker/vaccinations"
          className="p-4 rounded-2xl bg-[#FBF8F2] border border-[#D8E6DA] shadow-2xs hover:border-[#F4B83F] transition-colors group"
        >
          <span className="text-[11px] font-medium text-[#294B57] block">
            Due in 7–14 Days
          </span>
          <div className="text-2xl font-bold text-[#B87D14] mt-1">
            {dueSoonChildren}
          </div>
          <span className="text-[10px] text-[#294B57]/70 block mt-0.5">Upcoming VHND session</span>
        </Link>

        {/* Card 3: Overdue */}
        <Link
          to="/worker/priority"
          className="p-4 rounded-2xl bg-[#FBF8F2] border border-[#D8E6DA] shadow-2xs hover:border-[#E57373] transition-colors group"
        >
          <span className="text-[11px] font-medium text-[#294B57] block">
            Overdue Follow-ups
          </span>
          <div className="text-2xl font-bold text-[#D9534F] mt-1">
            {overdueChildren}
          </div>
          <span className="text-[10px] text-[#294B57]/70 block mt-0.5">Urgent home visit queue</span>
        </Link>

        {/* Card 4: Appointments */}
        <Link
          to="/worker/appointments"
          className="p-4 rounded-2xl bg-[#FBF8F2] border border-[#D8E6DA] shadow-2xs hover:border-[#007F68] transition-colors group"
        >
          <span className="text-[11px] font-medium text-[#294B57] block">
            Visit Requests
          </span>
          <div className="text-2xl font-bold text-[#103342] mt-1 group-hover:text-[#007F68] transition-colors">
            {pendingAppointments} Pending
          </div>
          <span className="text-[10px] text-[#294B57]/70 block mt-0.5">
            {confirmedAppointments} confirmed visits
          </span>
        </Link>
      </div>

      {/* 3. PRIORITY WORKLIST & RECENT LOG */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Worklist Table */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="bg-[#FBF8F2] border-[#D8E6DA] overflow-hidden">
            <div className="p-4 border-b border-[#D8E6DA] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-[#103342] font-serif">
                  Assigned Sector Child Cohort
                </h3>
                <p className="text-xs text-[#294B57]">
                  Children assigned to your sub-centre jurisdiction
                </p>
              </div>

              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search name, ID or village..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#D8E6DA] bg-white text-xs text-[#103342] focus:ring-2 focus:ring-[#007F68]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F0EBE1] border-b border-[#D8E6DA] text-[#294B57] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Child Profile</th>
                    <th className="py-2.5 px-3">Village</th>
                    <th className="py-2.5 px-3">UIP Status</th>
                    <th className="py-2.5 px-3">Priority</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8E6DA]/70 text-[#294B57]">
                  {filteredWorklist.slice(0, 5).map((child) => (
                    <tr key={child.id} className="hover:bg-[#F0EBE1]/40 transition-colors">
                      <td className="py-3 px-4">
                        <Link to={`/worker/children/${child.id}`} className="font-bold text-[#103342] hover:text-[#007F68] block">
                          {child.name}
                        </Link>
                        <span className="text-[10px] text-[#294B57]/70 font-mono">
                          {child.id} • {child.ageMonths}m ({child.gender})
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-[#103342]">{child.village}</td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-[#007F68]">
                          {child.doses?.filter(d => d.status === 'administered').length} / {child.doses?.length} Doses
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {child.priorityLevel === 'red' && <Badge variant="overdue">Urgent Catch-up</Badge>}
                        {child.priorityLevel === 'amber' && <Badge variant="dueSoon">Due Soon</Badge>}
                        {child.priorityLevel === 'green' && <Badge variant="upToDate">Up to Date</Badge>}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/worker/children/${child.id}`}
                          className="text-[#007F68] font-bold hover:underline inline-flex items-center gap-1"
                        >
                          <span>Review</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-[#F0EBE1]/60 border-t border-[#D8E6DA] text-center">
              <Link to="/worker/registry" className="text-xs font-semibold text-[#007F68] hover:underline">
                View All {childrenList.length} Registered Children in Registry →
              </Link>
            </div>
          </Card>
        </div>

        {/* Right: Quick Field Actions & Notifications */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-5 bg-[#FBF8F2] border border-[#D8E6DA]">
            <h3 className="font-bold text-sm text-[#103342] font-serif mb-3">
              Frontline Field Actions
            </h3>
            <div className="space-y-2 text-xs">
              <Link
                to="/worker/vaccinations"
                className="p-3 rounded-xl bg-white border border-[#D8E6DA] hover:border-[#007F68] transition-all flex items-center gap-3 group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#DDF0E3] text-[#007F68] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Syringe className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-[#103342] block">Record Administered Doses</span>
                  <span className="text-[11px] text-[#294B57]/70">VHND session queue</span>
                </div>
              </Link>

              <Link
                to="/worker/priority"
                className="p-3 rounded-xl bg-white border border-[#D8E6DA] hover:border-[#007F68] transition-all flex items-center gap-3 group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#FDECEC] text-[#D9534F] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-[#103342] block">Overdue Outreach Queue</span>
                  <span className="text-[11px] text-[#294B57]/70">Target high-risk dropouts</span>
                </div>
              </Link>

              <Link
                to="/worker/appointments"
                className="p-3 rounded-xl bg-white border border-[#D8E6DA] hover:border-[#007F68] transition-all flex items-center gap-3 group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#DDF0E3] text-[#007F68] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-[#103342] block">Visit & Session Requests</span>
                  <span className="text-[11px] text-[#294B57]/70">Accept/reschedule visits</span>
                </div>
              </Link>

              <Link
                to="/worker/messages"
                className="p-3 rounded-xl bg-white border border-[#D8E6DA] hover:border-[#007F68] transition-all flex items-center gap-3 group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#F0EBE1] text-[#103342] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-[#103342] block">Parent SMS Alerts</span>
                  <span className="text-[11px] text-[#294B57]/70">Dispatch reminders</span>
                </div>
              </Link>
            </div>
          </Card>

          {/* Supervisor Analytics Link */}
          <Card className="p-4 bg-[#DDF0E3]/70 border border-[#A8D5B5] text-xs">
            <span className="font-bold text-[#005F52] block mb-1">Health Authority Reporting</span>
            <p className="text-[#294B57] text-[11px] leading-relaxed">
              Medical Officer In-Charge (MOIC) aggregate coverage statistics, village completion benchmarks, and CSV exports are active.
            </p>
            <Link
              to="/supervisor/analytics"
              className="inline-flex items-center gap-1 font-bold text-[#007F68] mt-2 hover:underline text-xs"
            >
              <span>Open Supervisor Analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
