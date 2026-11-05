import React, { useState } from 'react';
import { useHealthData } from '../../contexts/HealthDataContext';
import { UIP_SCHEDULE } from '../../data/uipVaccineSchedule';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Syringe, CheckCircle2, Clock, AlertTriangle, ShieldCheck, Filter, Info } from 'lucide-react';
import { Modal } from '../../components/common/Modal';

export function VaccinationTrackerPage() {
  const { activeChild } = useHealthData();
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedVaccineModal, setSelectedVaccineModal] = useState(null);

  if (!activeChild) return null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#17394A] font-serif">
            Vaccination Schedule Tracker
          </h1>
          <p className="text-xs text-slate-500">
            India Universal Immunisation Programme (UIP) for {activeChild.name} ({activeChild.ageMonths}m old)
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl text-xs font-medium">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filterStatus === 'all' ? 'bg-[#17394A] text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            All UIP
          </button>
          <button
            onClick={() => setFilterStatus('administered')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filterStatus === 'administered' ? 'bg-[#006B64] text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Administered
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filterStatus === 'pending' ? 'bg-[#F5C45E] text-[#17394A]' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Due / Overdue
          </button>
        </div>
      </div>

      {/* Official Guidelines Disclaimer */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#006B64] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-[#17394A] block">UIP Official Schedule Alignment:</span>
          <span>
            Follows the national guidelines prescribed by the Ministry of Health and Family Welfare (MoHFW), Govt of India. Official dose recording and batch authorization must be performed by authorized ANM / medical staff.
          </span>
        </div>
      </div>

      {/* Timeline stages */}
      <div className="space-y-6">
        {UIP_SCHEDULE.map((stage) => {
          return (
            <Card key={stage.stageId} className="overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-100 px-5 py-3 flex items-center justify-between">
                <span className="font-bold text-[#17394A] text-sm font-serif">{stage.ageLabel}</span>
                <span className="text-[11px] text-slate-500 font-mono">Approx. Day {stage.ageDays}</span>
              </div>
              <CardBody className="p-0">
                <div className="divide-y divide-slate-100 text-xs">
                  {stage.vaccines.map((vac) => {
                    // Check status against child's doses
                    const childDose = activeChild.doses?.find((d) => d.vaccineId === vac.id);
                    const isDone = childDose?.status === 'administered';
                    const isOverdue = childDose?.status === 'overdue';
                    const isDueSoon = childDose?.status === 'due_soon';

                    if (filterStatus === 'administered' && !isDone) return null;
                    if (filterStatus === 'pending' && isDone) return null;

                    return (
                      <div
                        key={vac.id}
                        onClick={() => setSelectedVaccineModal({ ...vac, childDose })}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 font-bold ${
                            isDone ? 'bg-[#EAF7F0] text-[#00524c]' : isOverdue ? 'bg-[#fdf2f2] text-[#d87e7b]' : 'bg-[#fef7e8] text-[#dc9a23]'
                          }`}>
                            {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-[#17394A]">{vac.name}</span>
                              <span className="text-slate-400">({vac.dose})</span>
                            </div>
                            <p className="text-slate-500 text-[11px] mt-0.5">
                              Protects against: <span className="font-medium text-slate-700">{vac.targetDisease}</span>
                            </p>
                            {isDone && (
                              <p className="text-[11px] text-[#00524c] font-medium mt-1">
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
                          <span className="block text-[10px] text-slate-400 mt-1">
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
          <div className="space-y-4 text-xs text-slate-700">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <p><strong>Target Disease:</strong> {selectedVaccineModal.targetDisease}</p>
              <p><strong>Administration Route:</strong> {selectedVaccineModal.route}</p>
              <p><strong>Anatomical Site:</strong> {selectedVaccineModal.site}</p>
            </div>

            {selectedVaccineModal.childDose?.status === 'administered' ? (
              <div className="p-3 rounded-xl bg-[#EAF7F0] border border-[#6bc5b5]/40 text-[#00524c] space-y-1">
                <span className="font-bold block">Officially Recorded Dose</span>
                <p>Date: {selectedVaccineModal.childDose.dateAdministered}</p>
                <p>Facility: {selectedVaccineModal.childDose.facility}</p>
                <p>Batch ID: {selectedVaccineModal.childDose.batch}</p>
                <p>Administered By: {selectedVaccineModal.childDose.workerName}</p>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-[#fef7e8] border border-[#fbe09e] text-amber-900 space-y-1">
                <span className="font-bold block">Status: Due / Pending</span>
                <p>Please visit your assigned Anganwadi or Sub-Centre during the regular Wednesday Village Health & Nutrition Day (VHND) session.</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
