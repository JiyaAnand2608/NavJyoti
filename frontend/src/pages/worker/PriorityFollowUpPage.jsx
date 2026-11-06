import React, { useState } from 'react';
import { useHealthData } from '../../contexts/HealthDataContext';
import { Card, CardHeader } from '../../components/common/Card';
import { SimulationBanner } from '../../components/common/SimulationBadge';
import { MessageSquare } from 'lucide-react';
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
    <div className="space-y-6 max-w-6xl mx-auto text-[#294B57]">
      <div>
        <h1 className="text-2xl font-bold text-[#103342] font-serif">
          Administrative Follow-up Prioritisation Dashboard
        </h1>
        <p className="text-xs text-[#294B57]">
          Targeted outreach queue based on scheduled UIP vaccination intervals and migration continuity
        </p>
      </div>

      <SimulationBanner
        title="Administrative Prioritisation Engine Notice"
        message="The Red / Amber / Green system reflects administrative follow-up workflow urgency (e.g., >30 days overdue), not clinical diagnostic or validated prognostic risk. Migration status triggers record-continuity cross-checks."
      />

      {/* Priority Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div
          onClick={() => setSelectedFilter('red')}
          className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${
            selectedFilter === 'red' ? 'border-[#E57373] bg-[#FDECEC]' : 'border-[#D8E6DA] bg-[#FBF8F2] hover:border-[#E57373]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-sm text-[#D9534F]">Red Priority (Urgent)</span>
            <span className="w-3 h-3 rounded-full bg-[#E57373]" />
          </div>
          <div className="text-3xl font-extrabold text-[#D9534F]">{redList.length}</div>
          <p className="text-xs text-[#294B57] mt-1">Overdue &gt;30 days or zero-dose baseline</p>
        </div>

        <div
          onClick={() => setSelectedFilter('amber')}
          className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${
            selectedFilter === 'amber' ? 'border-[#F4B83F] bg-[#FDF8EF]' : 'border-[#D8E6DA] bg-[#FBF8F2] hover:border-[#F4B83F]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-sm text-[#B87D14]">Amber Priority (Needs Attention)</span>
            <span className="w-3 h-3 rounded-full bg-[#F4B83F]" />
          </div>
          <div className="text-3xl font-extrabold text-[#B87D14]">{amberList.length}</div>
          <p className="text-xs text-[#294B57] mt-1">Doses due in next 7–14 days</p>
        </div>

        <div
          onClick={() => setSelectedFilter('green')}
          className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${
            selectedFilter === 'green' ? 'border-[#007F68] bg-[#DDF0E3]' : 'border-[#D8E6DA] bg-[#FBF8F2] hover:border-[#007F68]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-sm text-[#005F52]">Green (Up to Date)</span>
            <span className="w-3 h-3 rounded-full bg-[#007F68]" />
          </div>
          <div className="text-3xl font-extrabold text-[#005F52]">{greenList.length}</div>
          <p className="text-xs text-[#294B57] mt-1">All age-appropriate doses administered</p>
        </div>
      </div>

      {/* Actionable Follow-up List */}
      <Card className="bg-[#FBF8F2] border-[#D8E6DA]">
        <CardHeader
          title={`Follow-up Outreach Queue (${displayedChildren.length} Children)`}
          subtitle="Click any child to log home visit or review past contact"
        />
        <div className="divide-y divide-[#D8E6DA]/70 text-xs">
          {displayedChildren.map((child) => (
            <div key={child.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F0EBE1]/40">
              <div className="flex items-start gap-3.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                  child.priorityLevel === 'red' ? 'bg-[#FDECEC] text-[#D9534F]' :
                  child.priorityLevel === 'amber' ? 'bg-[#FDF8EF] text-[#B87D14]' :
                  'bg-[#DDF0E3] text-[#007F68]'
                }`}>
                  {child.priorityLevel === 'red' ? '!' : '•'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#103342]">{child.name}</span>
                    <span className="text-[10px] text-[#294B57]/70 font-mono">({child.id})</span>
                    {child.migrationStatus === 'migrant_in' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#DDF0E3] text-[#007F68] border border-[#007F68]/30">
                        In-Migrant Continuity Check
                      </span>
                    )}
                  </div>
                  <p className="text-[#294B57] mt-0.5">
                    Caregiver: <strong>{child.caregiverName}</strong> ({child.caregiverPhone}) • Village: {child.village}
                  </p>
                  <p className="text-[11px] text-[#294B57]/80 mt-1">
                    Pending / Next Doses: {child.doses?.filter(d => d.status !== 'administered').map(d => d.vaccineName).join(', ') || 'None'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to={`/worker/children/${child.id}`}
                  className="px-3 py-1.5 rounded-full bg-[#DDF0E3] hover:bg-[#C7E4CD] text-[#007F68] font-semibold text-xs"
                >
                  Record
                </Link>
                <Link
                  to="/worker/messages"
                  className="px-3 py-1.5 rounded-full bg-[#007F68] hover:bg-[#005F52] text-white font-semibold text-xs flex items-center gap-1 shadow-2xs"
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
