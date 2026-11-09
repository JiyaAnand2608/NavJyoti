import React, { useState } from 'react';
import { useHealthData } from '../../contexts/HealthDataContext';
import { Card, CardHeader } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { SimulationBanner } from '../../components/common/SimulationBadge';
import { MessageSquare, PhoneCall, CheckCircle2, AlertCircle, Edit3, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PriorityFollowUpPage() {
  const { childrenList, updateFollowUp } = useHealthData();
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Follow-up outreach modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedChild, setSelectedChild] = useState(null);
  const [outreachStatus, setOutreachStatus] = useState('contacted');
  const [outreachNotes, setOutreachNotes] = useState('');
  const [newPriority, setNewPriority] = useState('amber');
  const [successMsg, setSuccessMsg] = useState('');

  const redList = childrenList.filter((c) => c.priorityLevel === 'red');
  const amberList = childrenList.filter((c) => c.priorityLevel === 'amber');
  const greenList = childrenList.filter((c) => c.priorityLevel === 'green');

  const displayedChildren =
    selectedFilter === 'all'
      ? childrenList
      : childrenList.filter((c) => c.priorityLevel === selectedFilter);

  const handleOpenOutreach = (child) => {
    setSelectedChild(child);
    setOutreachNotes(child.followUpNotes || '');
    setNewPriority(child.priorityLevel);
    setOutreachStatus('contacted');
    setIsModalOpen(true);
  };

  const handleSaveOutreach = (e) => {
    e.preventDefault();
    if (!selectedChild) return;

    updateFollowUp(selectedChild.id, {
      priorityLevel: newPriority,
      notes: `[${outreachStatus.toUpperCase()}] ${outreachNotes.trim()}`,
    });

    setIsModalOpen(false);
    setSuccessMsg(`Outreach recorded for ${selectedChild.name}. Priority updated to ${newPriority.toUpperCase()}.`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

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

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-[#DDF0E3] border border-[#A8D5B5] text-xs text-[#005F52] font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#007F68]" />
          <span>{successMsg}</span>
        </div>
      )}

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

      {/* Filter Reset if filtered */}
      {selectedFilter !== 'all' && (
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-[#103342]">Filtered by: {selectedFilter.toUpperCase()}</span>
          <button
            onClick={() => setSelectedFilter('all')}
            className="text-[#007F68] font-bold hover:underline cursor-pointer"
          >
            Clear Filter (Show All {childrenList.length})
          </button>
        </div>
      )}

      {/* Actionable Follow-up List */}
      <Card className="bg-[#FBF8F2] border-[#D8E6DA] overflow-hidden">
        <CardHeader
          title={`Follow-up Outreach Queue (${displayedChildren.length} Children)`}
          subtitle="Click Log Outreach to record home visits, counseling, or update priority"
        />
        <div className="divide-y divide-[#D8E6DA]/70 text-xs">
          {displayedChildren.map((child) => (
            <div key={child.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F0EBE1]/40 transition-colors">
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
                    <span className="font-bold text-sm text-[#103342] font-serif">{child.name}</span>
                    <span className="text-[10px] font-mono text-[#007F68] font-bold">{child.id}</span>
                    {child.migrationStatus === 'migrant_in' && (
                      <Badge variant="teal">Migrant Inflow</Badge>
                    )}
                  </div>
                  <p className="text-xs text-[#294B57] mt-0.5">
                    Caregiver: <strong className="text-[#103342]">{child.caregiverName}</strong> ({child.caregiverPhone}) • Village: {child.village}
                  </p>
                  {child.followUpNotes && (
                    <p className="text-[11px] text-[#007F68] mt-1 font-medium italic">
                      Latest Note: "{child.followUpNotes}"
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleOpenOutreach(child)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#007F68] text-white font-semibold text-xs hover:bg-[#005F52] cursor-pointer shadow-2xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Log Outreach</span>
                </button>
                <Link
                  to={`/worker/children/${child.id}`}
                  className="px-3 py-1.5 rounded-lg bg-white border border-[#D8E6DA] text-[#103342] font-semibold text-xs hover:bg-[#F0EBE1] inline-flex items-center gap-1"
                >
                  <span>360° View</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Outreach Action Modal */}
      {isModalOpen && selectedChild && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Log Outreach & Update Status: ${selectedChild.name}`}
          subtitle={`Caregiver: ${selectedChild.caregiverName} (${selectedChild.caregiverPhone})`}
        >
          <form onSubmit={handleSaveOutreach} className="space-y-4 text-xs text-[#294B57]">
            <div>
              <label className="block font-semibold text-[#103342] mb-1">Outreach Action Taken</label>
              <select
                value={outreachStatus}
                onChange={(e) => setOutreachStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
              >
                <option value="contacted">Caregiver Contacted by Phone / ASHA</option>
                <option value="home_visit">Home Visit Conducted & Mother Counseled</option>
                <option value="scheduled_vhnd">Scheduled for Next Wednesday VHND Session</option>
                <option value="resolved">Catch-up Doses Administered (Resolved)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#103342] mb-1">Update Priority Level</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setNewPriority('red')}
                  className={`py-2 rounded-xl border font-semibold text-xs cursor-pointer ${
                    newPriority === 'red' ? 'bg-[#FDECEC] border-[#E57373] text-[#D9534F]' : 'bg-white border-[#D8E6DA]'
                  }`}
                >
                  Red (Urgent)
                </button>
                <button
                  type="button"
                  onClick={() => setNewPriority('amber')}
                  className={`py-2 rounded-xl border font-semibold text-xs cursor-pointer ${
                    newPriority === 'amber' ? 'bg-[#FDF8EF] border-[#F4B83F] text-[#B87D14]' : 'bg-white border-[#D8E6DA]'
                  }`}
                >
                  Amber (Due Soon)
                </button>
                <button
                  type="button"
                  onClick={() => setNewPriority('green')}
                  className={`py-2 rounded-xl border font-semibold text-xs cursor-pointer ${
                    newPriority === 'green' ? 'bg-[#DDF0E3] border-[#007F68] text-[#005F52]' : 'bg-white border-[#D8E6DA]'
                  }`}
                >
                  Green (Up to Date)
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#103342] mb-1">Follow-up Notes</label>
              <textarea
                rows={3}
                required
                value={outreachNotes}
                onChange={(e) => setOutreachNotes(e.target.value)}
                placeholder="e.g. Spoke with mother; confirmed attendance for Pentavalent-2 on Wednesday..."
                className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342] focus:ring-2 focus:ring-[#007F68]"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white border border-[#D8E6DA] text-[#103342] font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#007F68] text-white font-semibold text-xs hover:bg-[#005F52] cursor-pointer shadow-xs"
              >
                Save Outreach
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
