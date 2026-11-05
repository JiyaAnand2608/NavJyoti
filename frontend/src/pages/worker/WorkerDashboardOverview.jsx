import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useHealthData } from '../../contexts/HealthDataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  Users,
  Syringe,
  AlertTriangle,
  CalendarCheck,
  PlusCircle,
  Clock,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
  Search,
  Building2,
  FileSpreadsheet,
  ArrowRight,
  ClipboardCheck,
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';

export function WorkerDashboardOverview() {
  const { user } = useAuth();
  const { childrenList, appointments } = useHealthData();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');

  // 4 Derived Summary Counts
  const totalChildren = childrenList.length;
  const dueSoonChildren = childrenList.filter((c) => c.priorityLevel === 'amber').length;
  const overdueChildren = childrenList.filter((c) => c.priorityLevel === 'red').length;
  const pendingAppointments = appointments.filter((a) => a.status === 'requested').length;

  const filteredWorklist = childrenList.filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.id.toLowerCase().includes(term) ||
      c.village.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-[#17394A]">
      {/* 1. COMPACT SAGE/TEAL WELCOME BANNER (Section 6) */}
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#DCEFE5] via-[#EAF7F0] to-[#E3F2E9] border border-[#CDE5D6] p-6 sm:p-7 shadow-xs">
        {/* Abstract subtle healthcare checklist & wave silhouette */}
        <svg
          className="absolute right-0 top-0 w-72 h-full pointer-events-none opacity-25"
          viewBox="0 0 280 160"
          fill="none"
          preserveAspectRatio="none"
        >
          <path d="M40 160 Q 140 60, 280 120 L 280 160 Z" fill="#006B64" />
          <circle cx="210" cy="50" r="28" fill="#F5C45E" />
        </svg>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white text-[10px] font-bold uppercase tracking-wider text-[#006B64] border border-[#CDE5D6]">
                Frontline Fieldwork Portal
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {user?.jurisdiction?.subCentre || "Rampur Sub-Centre"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#17394A] font-serif">
              ANM Overview: {user?.name || "Rekha Devi"}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 max-w-xl">
              Assigned jurisdiction: <strong>{user?.jurisdiction?.villagesCovered?.join(', ') || "Rampur, Kalyanpur, Shivpur"}</strong> • {user?.jurisdiction?.phc || "Bilaspur PHC"}.
            </p>
          </div>

          {/* Quick CTA to Priority Worklist */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/worker/priority"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#006B64] hover:bg-[#00544e] text-white font-semibold text-xs shadow-xs transition-all"
            >
              <ClipboardCheck className="w-4 h-4 text-white/90" />
              <span>View Follow-ups ({overdueChildren + dueSoonChildren})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 2. SUMMARY (4 Compact Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Registered Children */}
        <div className="p-4 rounded-2xl bg-white border border-[#DCEFE5] shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">
            Registered Children (0–5)
          </span>
          <div className="text-2xl font-bold text-[#17394A] mt-1">{totalChildren}</div>
          <span className="text-[10px] text-slate-400 block mt-0.5">Assigned cohort</span>
        </div>

        {/* Card 2: Due Soon */}
        <div className="p-4 rounded-2xl bg-white border border-[#fbeccb] shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">
            Vaccinations Due Soon
          </span>
          <div className="text-2xl font-bold text-[#dfab3e] mt-1">{dueSoonChildren}</div>
          <span className="text-[10px] text-slate-400 block mt-0.5">Due in next 7–14 days</span>
        </div>

        {/* Card 3: Overdue */}
        <div className="p-4 rounded-2xl bg-white border border-[#f9dbdb] shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">
            Overdue Vaccinations
          </span>
          <div className="text-2xl font-bold text-[#D98282] mt-1">{overdueChildren}</div>
          <span className="text-[10px] text-slate-400 block mt-0.5">&gt;30d overdue follow-up</span>
        </div>

        {/* Card 4: Pending Follow-ups */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">
            Pending Visit Requests
          </span>
          <div className="text-2xl font-bold text-[#17394A] mt-1">{pendingAppointments}</div>
          <span className="text-[10px] text-slate-400 block mt-0.5">Awaiting ANM response</span>
        </div>
      </div>

      {/* 3. QUICK ACTIONS */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to="/worker/registry"
            className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-[#006B64] transition-all flex items-center gap-3 shadow-2xs group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#EAF7F0] text-[#006B64] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-[#17394A] block">Register Child</span>
              <span className="text-[10px] text-slate-400">Add to registry</span>
            </div>
          </Link>

          <Link
            to="/worker/vaccinations"
            className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-[#006B64] transition-all flex items-center gap-3 shadow-2xs group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#EAF7F0] text-[#006B64] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Syringe className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-[#17394A] block">Record Vaccine</span>
              <span className="text-[10px] text-slate-400">Log dose drive</span>
            </div>
          </Link>

          <Link
            to="/worker/priority"
            className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-[#006B64] transition-all flex items-center gap-3 shadow-2xs group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#fdf8ef] text-[#dfab3e] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-[#17394A] block">View Follow-ups</span>
              <span className="text-[10px] text-slate-400">Priority matrix</span>
            </div>
          </Link>

          <Link
            to="/worker/appointments"
            className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-[#006B64] transition-all flex items-center gap-3 shadow-2xs group"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-[#17394A] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-[#17394A] block">Manage Visits</span>
              <span className="text-[10px] text-slate-400">Accept requests</span>
            </div>
          </Link>
        </div>
      </div>

      {/* 4. PRIORITY WORKLIST */}
      <Card>
        <CardHeader
          title="Administrative Priority Worklist"
          subtitle="Organised for administrative follow-up only — not a clinical medical diagnosis"
          action={
            <div className="relative w-48 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search child or village..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#006B64]"
              />
            </div>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#FAFBF8] border-b border-slate-100 text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Child Identity</th>
                <th className="py-3 px-3">Village</th>
                <th className="py-3 px-3">Vaccination Status</th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredWorklist.map((child) => (
                <tr key={child.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-bold text-[#17394A] block">{child.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">ID: {child.id} • {child.ageMonths}m</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-medium text-slate-800">{child.village}</span>
                    {child.migrationStatus === 'migrant_in' && (
                      <span className="block text-[10px] text-blue-600 font-semibold">New Migrant</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-slate-600">
                      {child.doses?.filter(d => d.status === 'administered').length} of {child.doses?.length} Doses
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {child.priorityLevel === 'red' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#fdf2f1] text-[#D98282] border border-[#D98282]/30">
                        Red (Urgent Follow-up)
                      </span>
                    )}
                    {child.priorityLevel === 'amber' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#fdf8ef] text-[#dfab3e] border border-[#F5C45E]/40">
                        Amber (Due Soon)
                      </span>
                    )}
                    {child.priorityLevel === 'green' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF7F0] text-[#006B64] border border-[#006B64]/30">
                        Green (Up to Date)
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/worker/children/${child.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#EAF5F8] hover:bg-[#d4eaf0] text-[#17394A] font-semibold text-xs transition-colors"
                    >
                      <span>View Records</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
