import React, { useState } from 'react';
import { useHealthData } from '../../contexts/HealthDataContext';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { SimulationBanner } from '../../components/common/SimulationBadge';
import { ShieldAlert, PhoneCall, CheckSquare, MessageSquare, MapPin, User, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PriorityFollowUpPage() {
  const { childrenList } = useHealthData();
  const [selectedFilter, setSelectedFilter] = useState('all');

  const redList = childrenList.filter((c) => c.priorityLevel === 'red');
  const amberList = childrenList.filter((c) => c.priorityLevel === 'amber');
  const greenList = childrenList.filter((c) => c.priorityLevel === 'green');

  const displayedChildren = selectedFilter === 'all'
    ? childrenList
    : childrenList.filter((c) => c.priorityLevel === selectedFilter);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[#17394A] font-serif">
          Administrative Follow-up Prioritisation Dashboard
        </h1>
        <p className="text-xs text-slate-500">
          Targeted outreach queue based on scheduled UIP vaccination intervals and migration continuity
        </p>
      </div>

      {/* User Correction #3 Banner */}
      <SimulationBanner
        title="Administrative Prioritisation Engine Notice"
        message="The Red / Amber / Green system reflects administrative follow-up workflow urgency (e.g., >30 days overdue), not clinical diagnostic or validated prognostic risk. Migration status triggers record-continuity cross-checks."
      />

      {/* Priority Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div
          onClick={() => setSelectedFilter('red')}
          className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${
            selectedFilter === 'red' ? 'border-[#ECA4A2] bg-[#fdf2f2]' : 'border-slate-200 bg-white hover:border-[#ECA4A2]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-sm text-[#d87e7b]">Red Priority (Urgent)</span>
            <span className="w-3 h-3 rounded-full bg-[#d87e7b]" />
          </div>
          <div className="text-3xl font-extrabold text-[#d87e7b]">{redList.length}</div>
          <p className="text-xs text-slate-600 mt-1">Overdue &gt;30 days or zero-dose baseline</p>
        </div>

        <div
          onClick={() => setSelectedFilter('amber')}
          className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${
            selectedFilter === 'amber' ? 'border-[#F5C45E] bg-[#fef7e8]' : 'border-slate-200 bg-white hover:border-[#F5C45E]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-sm text-[#dc9a23]">Amber Priority (Needs Attention)</span>
            <span className="w-3 h-3 rounded-full bg-[#F5C45E]" />
          </div>
          <div className="text-3xl font-extrabold text-[#dc9a23]">{amberList.length}</div>
          <p className="text-xs text-slate-600 mt-1">Doses due in next 7–14 days</p>
        </div>

        <div
          onClick={() => setSelectedFilter('green')}
          className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${
            selectedFilter === 'green' ? 'border-[#006B64] bg-[#EAF7F0]' : 'border-slate-200 bg-white hover:border-[#006B64]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-sm text-[#00524c]">Green (Up to Date)</span>
            <span className="w-3 h-3 rounded-full bg-[#006B64]" />
          </div>
          <div className="text-3xl font-extrabold text-[#00524c]">{greenList.length}</div>
          <p className="text-xs text-slate-600 mt-1">All age-appropriate doses administered</p>
        </div>
      </div>

      {/* Actionable Follow-up List */}
      <Card>
        <CardHeader
          title={`Follow-up Outreach Queue (${displayedChildren.length} Children)`}
          subtitle="Click any child to log home visit or review past contact"
        />
        <div className="divide-y divide-slate-100 text-xs">
          {displayedChildren.map((child) => (
            <div key={child.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70">
              <div className="flex items-start gap-3.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                  child.priorityLevel === 'red' ? 'bg-[#fdf2f2] text-[#d87e7b]' :
                  child.priorityLevel === 'amber' ? 'bg-[#fef7e8] text-[#dc9a23]' :
                  'bg-[#EAF7F0] text-[#00524c]'
                }`}>
                  {child.priorityLevel === 'red' ? '!' : '•'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#17394A]">{child.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({child.id})</span>
                    {child.migrationStatus === 'migrant_in' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        In-Migrant Continuity Check
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 mt-0.5">
                    Caregiver: <strong>{child.caregiverName}</strong> ({child.caregiverPhone}) • Village: {child.village}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Pending / Next Doses: {child.doses?.filter(d => d.status !== 'administered').map(d => d.vaccineName).join(', ') || 'None'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to={`/worker/children/${child.id}`}
                  className="px-3 py-1.5 rounded-lg bg-[#EAF5F8] hover:bg-[#d8eaf5] text-[#17394A] font-semibold text-xs"
                >
                  Record
                </Link>
                <Link
                  to="/worker/messages"
                  className="px-3 py-1.5 rounded-lg bg-[#17394A] hover:bg-[#0f2632] text-white font-semibold text-xs flex items-center gap-1"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Send Alert</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
