import React, { useState } from 'react';
import { useHealthData } from '../../contexts/HealthDataContext';
import { UIP_SCHEDULE } from '../../data/uipVaccineSchedule';
import { Card, CardBody } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { CheckCircle2, Clock, ShieldCheck, AlertCircle, Info, ChevronDown } from 'lucide-react';
import { Modal } from '../../components/common/Modal';

export function VaccinationTrackerPage() {
  const { childrenList, activeChild, activeChildId, setActiveChildId } = useHealthData();
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedVaccineModal, setSelectedVaccineModal] = useState(null);

  if (!activeChild) {
    return (
      <div className="p-8 text-center text-xs text-[#294B57]">
        No active child selected. Please add or select a child in "My Children".
      </div>
    );
  }

  // Calculate Progress Stats
  const totalDoses = activeChild.doses?.length || 0;
  const administeredCount = activeChild.doses?.filter((d) => d.status === 'administered').length || 0;
  const overdueCount = activeChild.doses?.filter((d) => d.status === 'overdue').length || 0;
  const dueSoonCount = activeChild.doses?.filter((d) => d.status === 'due_soon').length || 0;
  const progressPercent = totalDoses > 0 ? Math.round((administeredCount / totalDoses) * 100) : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-[#294B57]">
      {/* Header with Child Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#103342] font-serif">
            Vaccination Schedule Tracker
          </h1>
          <p className="text-xs text-[#294B57]">
            Universal Immunisation Programme (UIP) National Guidelines for 0–5 Years
          </p>
        </div>

        {/* Child Selector */}
        <div className="flex items-center gap-2 bg-[#FBF8F2] border border-[#D8E6DA] p-1.5 rounded-2xl">
          <span className="text-xs font-semibold text-[#103342] pl-2">Child:</span>
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
        </div>
      </div>

      {/* Progress & Milestone Summary Banner */}
      <Card className="p-5 bg-[#FBF8F2] border-[#D8E6DA]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-[#103342] font-serif">
                {activeChild.name}'s Immunisation Progress
              </span>
              {overdueCount > 0 ? (
                <Badge variant="overdue">{overdueCount} Catch-up Due</Badge>
              ) : dueSoonCount > 0 ? (
                <Badge variant="dueSoon">{dueSoonCount} Scheduled Soon</Badge>
              ) : (
                <Badge variant="upToDate">Up to Date</Badge>
              )}
            </div>
            <p className="text-xs text-[#294B57]">
              {administeredCount} of {totalDoses} national UIP scheduled doses verified and recorded.
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-[#E5DFD4] h-2.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-[#007F68] h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-4 text-center border-t md:border-t-0 md:border-l border-[#D8E6DA] pt-3 md:pt-0 md:pl-5 shrink-0">
            <div>
              <div className="text-2xl font-bold text-[#007F68]">{administeredCount}</div>
              <div className="text-[10px] uppercase font-semibold text-[#294B57]">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#B87D14]">{dueSoonCount}</div>
              <div className="text-[10px] uppercase font-semibold text-[#294B57]">Upcoming</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#D9534F]">{overdueCount}</div>
              <div className="text-[10px] uppercase font-semibold text-[#294B57]">Overdue</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-[#FBF8F2] border border-[#D8E6DA] rounded-xl text-xs font-medium">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filterStatus === 'all' ? 'bg-[#103342] text-white font-semibold' : 'text-[#294B57] hover:bg-[#F0EBE1]'
            }`}
          >
            All UIP Schedule
          </button>
          <button
            onClick={() => setFilterStatus('administered')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filterStatus === 'administered' ? 'bg-[#007F68] text-white font-semibold' : 'text-[#294B57] hover:bg-[#F0EBE1]'
            }`}
          >
            Administered ({administeredCount})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filterStatus === 'pending' ? 'bg-[#F4B83F] text-[#103342] font-semibold' : 'text-[#294B57] hover:bg-[#F0EBE1]'
            }`}
          >
            Due / Catch-up ({dueSoonCount + overdueCount})
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#294B57]">
          <ShieldCheck className="w-4 h-4 text-[#007F68]" />
          <span>MoHFW UIP National Standard</span>
        </div>
      </div>

      {/* Timeline stages */}
      <div className="space-y-6">
        {UIP_SCHEDULE.map((stage) => {
          return (
            <Card key={stage.stageId} className="overflow-hidden bg-[#FBF8F2] border-[#D8E6DA]">
              <div className="bg-[#F0EBE1]/70 border-b border-[#D8E6DA] px-5 py-3 flex items-center justify-between">
                <span className="font-bold text-[#103342] text-sm font-serif">{stage.ageLabel}</span>
                <span className="text-[11px] text-[#294B57] font-mono">Benchmark: Approx. Day {stage.ageDays}</span>
              </div>
              <CardBody className="p-0">
                <div className="divide-y divide-[#D8E6DA]/70 text-xs">
                  {stage.vaccines.map((vac) => {
                    const childDose = activeChild.doses?.find((d) => d.vaccineId === vac.id);
                    const isDone = childDose?.status === 'administered';
                    const isOverdue = childDose?.status === 'overdue';

                    if (filterStatus === 'administered' && !isDone) return null;
                    if (filterStatus === 'pending' && isDone) return null;

                    return (
                      <div
                        key={vac.id}
                        onClick={() => setSelectedVaccineModal({ ...vac, childDose })}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F0EBE1]/40 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 font-bold ${
                            isDone ? 'bg-[#DDF0E3] text-[#007F68]' : isOverdue ? 'bg-[#FDECEC] text-[#D9534F]' : 'bg-[#FDF8EF] text-[#B87D14]'
                          }`}>
                            {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-[#103342]">{vac.name}</span>
                              <span className="text-[#294B57]/70 font-medium">({vac.dose})</span>
                            </div>
                            <p className="text-[#294B57] text-[11px] mt-0.5">
                              Protects against: <span className="font-medium text-[#103342]">{vac.targetDisease}</span>
                            </p>
                            {isDone && (
                              <p className="text-[11px] text-[#007F68] font-medium mt-1">
                                Administered on {childDose.dateAdministered} • Batch: {childDose.batch} • {childDose.workerName}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="sm:text-right shrink-0">
                          {isDone ? (
                            <Badge variant="upToDate">Administered</Badge>
                          ) : isOverdue ? (
                            <Badge variant="overdue">Overdue Catch-up</Badge>
                          ) : (
                            <Badge variant="dueSoon">Scheduled</Badge>
                          )}
                          <span className="block text-[10px] text-[#294B57]/70 mt-1">
                            Route: {vac.route}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Vaccine Detail Modal */}
      {selectedVaccineModal && (
        <Modal
          isOpen={!!selectedVaccineModal}
          onClose={() => setSelectedVaccineModal(null)}
          title={`${selectedVaccineModal.name} (${selectedVaccineModal.dose})`}
          subtitle="Official Universal Immunisation Programme Specification"
        >
          <div className="space-y-4 text-xs text-[#294B57]">
            <div className="p-3.5 rounded-xl bg-[#F0EBE1]/70 border border-[#D8E6DA] space-y-1.5">
              <p><strong>Target Disease:</strong> {selectedVaccineModal.targetDisease}</p>
              <p><strong>Administration Route:</strong> {selectedVaccineModal.route}</p>
              <p><strong>Anatomical Site:</strong> {selectedVaccineModal.site}</p>
            </div>

            {selectedVaccineModal.childDose?.status === 'administered' ? (
              <div className="p-3.5 rounded-xl bg-[#DDF0E3] border border-[#A8D5B5] text-[#005F52] space-y-1">
                <span className="font-bold block text-sm">Officially Recorded Dose</span>
                <p>Date: {selectedVaccineModal.childDose.dateAdministered}</p>
                <p>Facility: {selectedVaccineModal.childDose.facility}</p>
                <p>Batch ID: {selectedVaccineModal.childDose.batch}</p>
                <p>Administered By: {selectedVaccineModal.childDose.workerName}</p>
                {selectedVaccineModal.childDose.notes && (
                  <p>Notes: "{selectedVaccineModal.childDose.notes}"</p>
                )}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-[#FDF8EF] border border-[#F4B83F]/50 text-[#103342] space-y-1.5">
                <span className="font-bold block text-[#B87D14]">Status: Due / Pending Session</span>
                <p>
                  This dose is pending administrative recording. Please attend your nearest Anganwadi centre or Sub-centre during the regular Village Health & Nutrition Day (VHND) session.
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedVaccineModal(null)}
                className="px-4 py-2 rounded-xl bg-[#007F68] text-white font-semibold text-xs cursor-pointer hover:bg-[#005F52]"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
