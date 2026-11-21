import React, { useState } from 'react';
import { useHealthData } from '../../contexts/HealthDataContext';
import { UIP_SCHEDULE } from '../../data/uipVaccineSchedule';
import { Card, CardBody } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Info,
  Syringe,
  Filter,
  RefreshCw,
  Calendar,
  Building,
  Tag,
  UserCheck
} from 'lucide-react';

function textOrFallback(value, fallback = 'Not recorded') {
  return value === null || value === undefined || value === '' ? fallback : String(value);
}

/**
 * Categorize a dose into Completed, Overdue, or Upcoming
 */
function classifyDose(dose) {
  const isCompleted = dose.status === 'administered' || Boolean(dose.dateAdministered);
  if (isCompleted) {
    return {
      category: 'completed',
      label: 'Completed',
      badgeVariant: 'upToDate',
    };
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const isOverdue =
    dose.status === 'overdue' ||
    (dose.dueDate && dose.dueDate < todayStr);

  if (isOverdue) {
    return {
      category: 'overdue',
      label: 'Overdue',
      badgeVariant: 'overdue',
    };
  }

  return {
    category: 'upcoming',
    label: 'Upcoming / Due Soon',
    badgeVariant: 'dueSoon',
  };
}

export function VaccinationTrackerPage() {
  const {
    childrenList,
    activeChild,
    activeChildId,
    setActiveChildId,
    childrenLoading,
    childrenError,
    refreshChildren,
  } = useHealthData();

  const [filterCategory, setFilterCategory] = useState('all'); // 'all' | 'completed' | 'upcoming' | 'overdue'
  const [selectedVaccineModal, setSelectedVaccineModal] = useState(null);

  if (childrenLoading) {
    return (
      <div className="p-12 text-center text-sm text-[#294B57] space-y-3" role="status">
        <RefreshCw className="w-6 h-6 animate-spin text-[#007F68] mx-auto" />
        <p className="font-semibold text-[#103342]">Loading vaccination records from NavJyoti...</p>
        <p className="text-xs text-[#294B57]">Retrieving verified records for linked child profiles.</p>
      </div>
    );
  }

  if (childrenError) {
    return (
      <div role="alert" className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-800 space-y-3 max-w-2xl mx-auto my-8">
        <p className="font-semibold flex items-center gap-2 text-base">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          Could not load health records
        </p>
        <p className="text-xs text-red-700 leading-relaxed">{childrenError}</p>
        {refreshChildren && (
          <button
            type="button"
            onClick={refreshChildren}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#007F68] text-white text-xs font-semibold hover:bg-[#005F52] cursor-pointer shadow-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        )}
      </div>
    );
  }

  if (!activeChild) {
    return (
      <div className="p-12 text-center text-xs text-[#294B57] bg-[#FBF8F2] rounded-3xl border border-[#D8E6DA] max-w-lg mx-auto my-8 space-y-3">
        <Info className="w-8 h-8 text-[#007F68] mx-auto" />
        <h3 className="text-sm font-bold text-[#103342]">No Active Child Selected</h3>
        <p>Please select a linked child profile or add a child in the "My Children" portal.</p>
      </div>
    );
  }

  // Live records returned from authorized backend APIs
  const records = Array.isArray(activeChild.doses) ? activeChild.doses : [];

  const completedRecords = records.filter((d) => classifyDose(d).category === 'completed');
  const overdueRecords = records.filter((d) => classifyDose(d).category === 'overdue');
  const upcomingRecords = records.filter((d) => classifyDose(d).category === 'upcoming');

  const visibleRecords = records.filter((d) => {
    if (filterCategory === 'all') return true;
    return classifyDose(d).category === filterCategory;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-[#294B57]">
      {/* Header with Child Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#103342] font-serif">
            Vaccination Schedule Tracker
          </h1>
          <p className="text-xs text-[#294B57] mt-0.5">
            Verified immunization status and UIP schedule alignment for 0–5 years
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#FBF8F2] border border-[#D8E6DA] p-1.5 rounded-2xl">
          <label htmlFor="vaccination-child" className="text-xs font-semibold text-[#103342] pl-2">
            Selected Child:
          </label>
          <select
            id="vaccination-child"
            value={activeChildId == null ? '' : String(activeChildId)}
            onChange={(e) => setActiveChildId(e.target.value)}
            className="bg-[#F0EBE1] text-[#103342] text-xs font-bold py-1.5 px-3 rounded-xl border-none focus:ring-1 focus:ring-[#007F68] cursor-pointer"
          >
            {childrenList.map((child) => (
              <option key={child.id} value={String(child.id)}>
                {child.name} ({child.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3-Bucket Status KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-[#FBF8F2] border-[#D8E6DA]">
          <div className="text-[11px] font-semibold text-[#294B57] uppercase tracking-wider">Total Recorded</div>
          <div className="text-2xl font-bold text-[#103342] mt-1">{records.length}</div>
          <div className="text-[10px] text-[#294B57]/70 mt-0.5">Database entries</div>
        </Card>

        <Card
          onClick={() => setFilterCategory('completed')}
          className={`p-4 transition-all cursor-pointer border-2 ${
            filterCategory === 'completed' ? 'border-[#007F68] bg-[#DDF0E3]' : 'border-[#D8E6DA] bg-[#FBF8F2] hover:border-[#007F68]/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#005F52] uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-[#007F68]" />
          </div>
          <div className="text-2xl font-bold text-[#007F68] mt-1">{completedRecords.length}</div>
          <div className="text-[10px] text-[#005F52] mt-0.5">Recorded as given</div>
        </Card>

        <Card
          onClick={() => setFilterCategory('upcoming')}
          className={`p-4 transition-all cursor-pointer border-2 ${
            filterCategory === 'upcoming' ? 'border-[#F4B83F] bg-[#FDF8EF]' : 'border-[#D8E6DA] bg-[#FBF8F2] hover:border-[#F4B83F]/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#B87D14] uppercase tracking-wider">Upcoming / Due Soon</span>
            <Clock className="w-4 h-4 text-[#B87D14]" />
          </div>
          <div className="text-2xl font-bold text-[#B87D14] mt-1">{upcomingRecords.length}</div>
          <div className="text-[10px] text-[#B87D14] mt-0.5">Next scheduled doses</div>
        </Card>

        <Card
          onClick={() => setFilterCategory('overdue')}
          className={`p-4 transition-all cursor-pointer border-2 ${
            filterCategory === 'overdue' ? 'border-[#E57373] bg-[#FDECEC]' : 'border-[#D8E6DA] bg-[#FBF8F2] hover:border-[#E57373]/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#D9534F] uppercase tracking-wider">Overdue</span>
            <AlertTriangle className="w-4 h-4 text-[#D9534F]" />
          </div>
          <div className="text-2xl font-bold text-[#D9534F] mt-1">{overdueRecords.length}</div>
          <div className="text-[10px] text-[#D9534F] mt-0.5">Requires catch-up visit</div>
        </Card>
      </div>

      {/* Clinical Advisory Banner */}
      <div className="flex gap-3 items-start p-3.5 rounded-2xl bg-[#FDF8EF] border border-[#F4B83F]/60 text-xs text-[#103342]">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#B87D14]" />
        <span>
          <strong>Clinical Verification Notice:</strong> Status categories represent entries recorded in the NavJyoti system by your assigned ANM/ASHA worker. If a vaccine was administered at another facility or private clinic, present your physical MCP card to the sub-centre worker for official record updating.
        </span>
      </div>

      {/* Categorized Records List */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold text-base text-[#103342] font-serif">
            {activeChild.name}'s Immunization Records
          </h2>
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#FBF8F2] border border-[#D8E6DA] rounded-xl text-xs font-medium">
            {[
              { value: 'all', label: `All (${records.length})` },
              { value: 'completed', label: `Completed (${completedRecords.length})` },
              { value: 'upcoming', label: `Upcoming (${upcomingRecords.length})` },
              { value: 'overdue', label: `Overdue (${overdueRecords.length})` },
            ].map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setFilterCategory(filter.value)}
                aria-pressed={filterCategory === filter.value}
                className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  filterCategory === filter.value
                    ? 'bg-[#103342] text-white font-semibold'
                    : 'text-[#294B57] hover:bg-[#F0EBE1]'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <Card className="overflow-hidden bg-[#FBF8F2] border-[#D8E6DA]">
          <CardBody className="p-0">
            {visibleRecords.length === 0 ? (
              <div className="p-10 text-center text-xs text-[#294B57] space-y-2">
                <Syringe className="w-8 h-8 text-[#007F68]/40 mx-auto" />
                <p className="font-semibold text-sm text-[#103342]">
                  {records.length === 0
                    ? 'No vaccination records have been entered for this child yet.'
                    : `No records match the "${filterCategory}" filter.`}
                </p>
                <p className="text-[11px] text-[#294B57]/70">
                  {records.length === 0
                    ? 'Your healthcare worker will record scheduled UIP doses during session days.'
                    : 'Switch filter to "All" to view the complete vaccination history.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#D8E6DA]/70">
                {visibleRecords.map((dose) => {
                  const classification = classifyDose(dose);
                  const isCompleted = classification.category === 'completed';
                  const isOverdue = classification.category === 'overdue';

                  return (
                    <button
                      key={dose.id}
                      type="button"
                      onClick={() => setSelectedVaccineModal({ kind: 'record', dose, classification })}
                      className="w-full text-left p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F0EBE1]/40 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            isCompleted
                              ? 'bg-[#DDF0E3] text-[#007F68]'
                              : isOverdue
                              ? 'bg-[#FDECEC] text-[#D9534F]'
                              : 'bg-[#FDF8EF] text-[#B87D14]'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : isOverdue ? (
                            <AlertTriangle className="w-5 h-5" />
                          ) : (
                            <Clock className="w-5 h-5" />
                          )}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-sm text-[#103342]">
                              {textOrFallback(dose.vaccineName, 'Unnamed vaccine')}
                            </span>
                            <span className="text-[10px] text-[#294B57]/70 font-mono">
                              #{dose.id}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#294B57] mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-[#294B57]/60" />
                              Due Date: <strong>{textOrFallback(dose.dueDate)}</strong>
                            </span>
                            {isCompleted && (
                              <span className="flex items-center gap-1 text-[#007F68] font-medium">
                                <CheckCircle2 className="w-3 h-3" />
                                Given: <strong>{textOrFallback(dose.dateAdministered)}</strong>
                              </span>
                            )}
                            {dose.facility && (
                              <span className="flex items-center gap-1 text-[#294B57]/80">
                                <Building className="w-3 h-3 text-[#294B57]/60" />
                                {dose.facility}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                        <Badge variant={classification.badgeVariant}>
                          {classification.label}
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Reference Schedule: UIP Reference for Educational Context */}
      <div className="space-y-4 pt-4 border-t border-[#D8E6DA]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-bold text-base text-[#103342] font-serif">Universal Immunization Programme (UIP) Reference</h2>
            <p className="text-xs text-[#294B57] mt-0.5">
              National immunization framework recommended by the Ministry of Health and Family Welfare (MoHFW) for ages 0–5
            </p>
          </div>
          <ShieldCheck className="w-5 h-5 shrink-0 text-[#007F68]" />
        </div>

        {UIP_SCHEDULE.map((stage) => (
          <Card key={stage.stageId} className="overflow-hidden bg-[#FBF8F2] border-[#D8E6DA]">
            <div className="bg-[#F0EBE1]/70 border-b border-[#D8E6DA] px-5 py-3 flex items-center justify-between gap-2">
              <span className="font-bold text-[#103342] text-sm font-serif">{stage.ageLabel}</span>
              <span className="text-[11px] text-[#294B57] font-mono">Approx. Day {stage.ageDays}</span>
            </div>
            <CardBody className="p-0">
              <div className="divide-y divide-[#D8E6DA]/70 text-xs">
                {stage.vaccines.map((vac) => (
                  <button
                    key={vac.id}
                    type="button"
                    onClick={() => setSelectedVaccineModal({ kind: 'reference', vaccine: vac })}
                    className="w-full text-left p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F0EBE1]/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#F0EBE1] text-[#294B57] flex items-center justify-center shrink-0 mt-0.5">
                        <Syringe className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-[#103342]">
                          {vac.name} <span className="text-[#294B57]/70 font-medium">({vac.dose})</span>
                        </p>
                        <p className="text-[#294B57] text-[11px] mt-0.5">Protects against: {vac.targetDisease}</p>
                      </div>
                    </div>
                    <div className="sm:text-right shrink-0">
                      <Badge variant="default">Educational Reference</Badge>
                      <span className="block text-[10px] text-[#294B57]/70 mt-1">Route: {vac.route}</span>
                    </div>
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Vaccine Details Modal */}
      {selectedVaccineModal && (
        <Modal
          isOpen={Boolean(selectedVaccineModal)}
          onClose={() => setSelectedVaccineModal(null)}
          title={
            selectedVaccineModal.kind === 'record'
              ? textOrFallback(selectedVaccineModal.dose.vaccineName, 'Vaccination Record')
              : `${selectedVaccineModal.vaccine.name} (${selectedVaccineModal.vaccine.dose})`
          }
          subtitle={
            selectedVaccineModal.kind === 'record'
              ? `NavJyoti Health Record #${selectedVaccineModal.dose.id}`
              : 'Universal Immunization Programme Reference'
          }
        >
          {selectedVaccineModal.kind === 'record' ? (
            <div className="space-y-3 text-xs text-[#294B57]">
              <div className="p-3 rounded-xl bg-[#F0EBE1] border border-[#D8E6DA] space-y-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-[#103342]">Vaccination Status:</span>
                  <Badge variant={selectedVaccineModal.classification.badgeVariant}>
                    {selectedVaccineModal.classification.label}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-[#103342]">Target Due Date:</span>
                  <span className="font-mono">{textOrFallback(selectedVaccineModal.dose.dueDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-[#103342]">Date Administered:</span>
                  <span className="font-mono text-[#007F68] font-bold">
                    {textOrFallback(selectedVaccineModal.dose.dateAdministered, 'Pending administration')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-[#103342]">Vaccine Batch Number:</span>
                  <span className="font-mono">{textOrFallback(selectedVaccineModal.dose.batch)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-[#103342]">Administering Facility:</span>
                  <span>{textOrFallback(selectedVaccineModal.dose.facility)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-[#103342]">Administered By / ANM:</span>
                  <span>{textOrFallback(selectedVaccineModal.dose.workerName)}</span>
                </div>
                {selectedVaccineModal.dose.notes && (
                  <div className="pt-2 border-t border-[#D8E6DA]/70">
                    <span className="font-semibold text-[#103342] block mb-0.5">Clinical Notes:</span>
                    <p className="italic text-[#294B57]">{selectedVaccineModal.dose.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-xs text-[#294B57]">
              <div className="p-3.5 rounded-xl bg-[#F0EBE1] border border-[#D8E6DA] space-y-2">
                <p><strong>Target Disease:</strong> {selectedVaccineModal.vaccine.targetDisease}</p>
                <p><strong>Recommended Timing:</strong> {selectedVaccineModal.vaccine.timing}</p>
                <p><strong>Route of Administration:</strong> {selectedVaccineModal.vaccine.route}</p>
                <p><strong>Recommended Anatomical Site:</strong> {selectedVaccineModal.vaccine.site}</p>
              </div>
              <div className="p-3 rounded-xl bg-[#FDF8EF] border border-[#F4B83F]/60 text-[11px] text-[#B87D14] flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>This schedule row is a national medical guideline and does not indicate personal administration without a corresponding record above.</span>
              </div>
            </div>
          )}
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={() => setSelectedVaccineModal(null)}
              className="px-4 py-2 rounded-xl bg-[#007F68] text-white font-semibold text-xs hover:bg-[#005F52] cursor-pointer"
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
