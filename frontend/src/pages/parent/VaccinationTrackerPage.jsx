import React, { useState } from 'react';
import { useHealthData } from '../../contexts/HealthDataContext';
import { UIP_SCHEDULE } from '../../data/uipVaccineSchedule';
import { Card, CardBody } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { CheckCircle2, Clock, ShieldCheck, AlertCircle, Info, Syringe } from 'lucide-react';

// The database currently stores vaccination records independently of the
// frontend's UIP schedule IDs. Do not match records based on a guessed ID.
// Only backend records are evidence of an administered vaccination.
function getRecordedStatus(dose) {
  if (dose.status === 'administered') return 'administered';
  return 'scheduled';
}

function textOrFallback(value, fallback = 'Not recorded') {
  return value === null || value === undefined || value === '' ? fallback : String(value);
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

  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedVaccineModal, setSelectedVaccineModal] = useState(null);

  if (childrenLoading) {
    return (
      <div className="p-8 text-center text-sm text-[#294B57]" role="status">
        Loading vaccination records from NavJyoti...
      </div>
    );
  }

  if (childrenError) {
    return (
      <div role="alert" className="p-5 rounded-2xl bg-red-50 border border-red-200 text-red-800 space-y-3">
        <p className="font-semibold">Could not load health records.</p>
        <p className="text-sm">{childrenError}</p>
        {refreshChildren && (
          <button type="button" onClick={refreshChildren} className="px-4 py-2 rounded-xl bg-[#007F68] text-white text-sm">
            Retry
          </button>
        )}
      </div>
    );
  }

  if (!activeChild) {
    return (
      <div className="p-8 text-center text-xs text-[#294B57]">
        No active child selected. Please add or select a child in "My Children".
      </div>
    );
  }

  // These records come from GET /children/{id}/vaccinations via HealthDataContext.
  // A count of recorded doses is NOT a count of all recommended UIP doses.
  const records = Array.isArray(activeChild.doses) ? activeChild.doses : [];
  const administeredCount = records.filter((d) => getRecordedStatus(d) === 'administered').length;
  const scheduledCount = records.length - administeredCount;
  const visibleRecords = records.filter((d) => {
    if (filterStatus === 'administered') return getRecordedStatus(d) === 'administered';
    if (filterStatus === 'pending') return getRecordedStatus(d) !== 'administered';
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-[#294B57]">
      {/* Header with child selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#103342] font-serif">
            Vaccination Schedule Tracker
          </h1>
          <p className="text-xs text-[#294B57]">
            Recorded vaccinations from NavJyoti and the reference UIP schedule for ages 0–5 years
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#FBF8F2] border border-[#D8E6DA] p-1.5 rounded-2xl">
          <label htmlFor="vaccination-child" className="text-xs font-semibold text-[#103342] pl-2">Child:</label>
          <select
            id="vaccination-child"
            value={activeChildId == null ? '' : String(activeChildId)}
            onChange={(e) => setActiveChildId(e.target.value)}
            className="bg-[#F0EBE1] text-[#103342] text-xs font-bold py-1.5 px-3 rounded-xl border-none focus:ring-1 focus:ring-[#007F68] cursor-pointer"
          >
            {childrenList.map((child) => (
              <option key={child.id} value={String(child.id)}>{child.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary — avoids an unverified percentage */}
      <Card className="p-5 bg-[#FBF8F2] border-[#D8E6DA]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-base text-[#103342] font-serif">
                {activeChild.name}'s Immunisation Records
              </span>
              <Badge variant="default">Schedule Not Verified</Badge>
            </div>
            <p className="text-xs text-[#294B57]">
              {records.length} vaccination record{records.length === 1 ? '' : 's'} in the database;
              {' '}{administeredCount} marked administered and {scheduledCount} not marked administered.
            </p>
            <div className="flex gap-2 items-start p-3 rounded-xl bg-[#FDF8EF] border border-[#F4B83F]/50 text-xs text-[#103342]">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#B87D14]" />
              <span>
                These counts only describe stored records. They do not establish whether all age-appropriate vaccines have been given, or whether a missing record means a vaccine was missed. Confirm the child's vaccination history with a qualified health worker.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-center border-t md:border-t-0 md:border-l border-[#D8E6DA] pt-3 md:pt-0 md:pl-5 shrink-0">
            <div>
              <div className="text-2xl font-bold text-[#007F68]">{administeredCount}</div>
              <div className="text-[10px] uppercase font-semibold text-[#294B57]">Recorded as Given</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#B87D14]">{scheduledCount}</div>
              <div className="text-[10px] uppercase font-semibold text-[#294B57]">Not Marked Given</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Backend record filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold text-base text-[#103342] font-serif">Database Vaccination Records</h2>
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#FBF8F2] border border-[#D8E6DA] rounded-xl text-xs font-medium">
            {[
              { value: 'all', label: `All Records (${records.length})` },
              { value: 'administered', label: `Administered (${administeredCount})` },
              { value: 'pending', label: `Not Marked Given (${scheduledCount})` },
            ].map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setFilterStatus(filter.value)}
                aria-pressed={filterStatus === filter.value}
                className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  filterStatus === filter.value
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
              <div className="p-6 text-center text-sm text-[#294B57]">
                {records.length === 0
                  ? 'No vaccination records have been entered for this child in the database.'
                  : 'No vaccination records match this filter.'}
              </div>
            ) : (
              <div className="divide-y divide-[#D8E6DA]/70">
                {visibleRecords.map((dose) => {
                  const administered = getRecordedStatus(dose) === 'administered';
                  return (
                    <button
                      key={dose.id}
                      type="button"
                      onClick={() => setSelectedVaccineModal({ kind: 'record', dose })}
                      className="w-full text-left p-4 flex items-start sm:items-center justify-between gap-3 hover:bg-[#F0EBE1]/40 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${administered ? 'bg-[#DDF0E3] text-[#007F68]' : 'bg-[#FDF8EF] text-[#B87D14]'}`}>
                          {administered ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-[#103342]">{textOrFallback(dose.vaccineName, 'Unnamed vaccine')}</p>
                          <p className="text-[11px] text-[#294B57] mt-1">
                            Record #{dose.id} · Due date: {textOrFallback(dose.dueDate)}
                          </p>
                          {administered && (
                            <p className="text-[11px] text-[#007F68] mt-1">
                              Administered date: {textOrFallback(dose.dateAdministered)}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant={administered ? 'upToDate' : 'default'}>
                        {administered ? 'Recorded as Administered' : 'Not Marked Administered'}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Reference schedule: does not infer individual medical status. */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-bold text-base text-[#103342] font-serif">UIP Reference Schedule</h2>
            <p className="text-xs text-[#294B57] mt-1">
              General educational reference only. These rows are not linked to database doses and do not indicate which vaccines this child has received or is due for.
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
                    className="w-full text-left p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F0EBE1]/40 transition-colors"
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
                      <Badge variant="default">Reference Only</Badge>
                      <span className="block text-[10px] text-[#294B57]/70 mt-1">Route: {vac.route}</span>
                    </div>
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Record and reference details */}
      {selectedVaccineModal && (
        <Modal
          isOpen={Boolean(selectedVaccineModal)}
          onClose={() => setSelectedVaccineModal(null)}
          title={selectedVaccineModal.kind === 'record'
            ? textOrFallback(selectedVaccineModal.dose.vaccineName, 'Vaccination record')
            : `${selectedVaccineModal.vaccine.name} (${selectedVaccineModal.vaccine.dose})`}
          subtitle={selectedVaccineModal.kind === 'record' ? 'NavJyoti database record' : 'UIP educational reference'}
        >
          {selectedVaccineModal.kind === 'record' ? (
            <div className="space-y-2 p-3.5 rounded-xl bg-[#F0EBE1] text-xs text-[#294B57]">
              <p><strong>Record ID:</strong> {selectedVaccineModal.dose.id}</p>
              <p><strong>Status:</strong> {getRecordedStatus(selectedVaccineModal.dose) === 'administered' ? 'Marked administered' : 'Not marked administered'}</p>
              <p><strong>Due date:</strong> {textOrFallback(selectedVaccineModal.dose.dueDate)}</p>
              <p><strong>Administered date:</strong> {textOrFallback(selectedVaccineModal.dose.dateAdministered)}</p>
              <p><strong>Facility:</strong> {textOrFallback(selectedVaccineModal.dose.facility)}</p>
              <p><strong>Batch:</strong> {textOrFallback(selectedVaccineModal.dose.batch)}</p>
              <p><strong>Worker:</strong> {textOrFallback(selectedVaccineModal.dose.workerName)}</p>
            </div>
          ) : (
            <div className="space-y-2 p-3.5 rounded-xl bg-[#F0EBE1] text-xs text-[#294B57]">
              <p><strong>Target Disease:</strong> {selectedVaccineModal.vaccine.targetDisease}</p>
              <p><strong>Route:</strong> {selectedVaccineModal.vaccine.route}</p>
              <p><strong>Site:</strong> {selectedVaccineModal.vaccine.site}</p>
              <p className="flex gap-2 items-start pt-2"><AlertCircle className="w-4 h-4 shrink-0" /> This reference does not establish whether the child is due, overdue, or vaccinated.</p>
            </div>
          )}
          <div className="flex justify-end pt-4">
            <button type="button" onClick={() => setSelectedVaccineModal(null)} className="px-4 py-2 rounded-xl bg-[#007F68] text-white font-semibold text-xs">Close</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
