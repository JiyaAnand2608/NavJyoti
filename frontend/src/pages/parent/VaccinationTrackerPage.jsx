import React, { useState } from 'react';
import { useHealthData } from '../../contexts/HealthDataContext';
import { UIP_SCHEDULE } from '../../data/uipVaccineSchedule';
import { Card, CardBody } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import { Modal } from '../../components/common/Modal';

export function VaccinationTrackerPage() {
  const { activeChild } = useHealthData();
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedVaccineModal, setSelectedVaccineModal] = useState(null);

  if (!activeChild) return null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-[#294B57]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#103342] font-serif">
            Vaccination Schedule Tracker
          </h1>
          <p className="text-xs text-[#294B57]">
            India Universal Immunisation Programme (UIP) for {activeChild.name} ({activeChild.ageMonths}m old)
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-[#FBF8F2] border border-[#D8E6DA] rounded-xl text-xs font-medium">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filterStatus === 'all' ? 'bg-[#103342] text-white font-semibold' : 'text-[#294B57] hover:bg-[#F0EBE1]'
            }`}
          >
            All UIP
          </button>
          <button
            onClick={() => setFilterStatus('administered')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filterStatus === 'administered' ? 'bg-[#007F68] text-white font-semibold' : 'text-[#294B57] hover:bg-[#F0EBE1]'
            }`}
          >
            Administered
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filterStatus === 'pending' ? 'bg-[#F4B83F] text-[#103342] font-semibold' : 'text-[#294B57] hover:bg-[#F0EBE1]'
            }`}
          >
            Due / Overdue
          </button>
        </div>
      </div>

      {/* Official Guidelines Disclaimer */}
      <div className="p-4 rounded-2xl bg-[#FBF8F2] border border-[#D8E6DA] text-xs text-[#294B57] flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#007F68] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-[#103342] block">UIP Official Schedule Alignment:</span>
          <span>
            Follows the national guidelines prescribed by the Ministry of Health and Family Welfare (MoHFW), Govt of India. Official dose recording and batch authorization must be performed by authorized ANM / medical staff.
          </span>
        </div>
      </div>

      {/* Timeline stages */}
      <div className="space-y-6">
        {UIP_SCHEDULE.map((stage) => {
          return (
            <Card key={stage.stageId} className="overflow-hidden bg-[#FBF8F2] border-[#D8E6DA]">
              <div className="bg-[#F0EBE1]/70 border-b border-[#D8E6DA] px-5 py-3 flex items-center justify-between">
                <span className="font-bold text-[#103342] text-sm font-serif">{stage.ageLabel}</span>
                <span className="text-[11px] text-[#294B57] font-mono">Approx. Day {stage.ageDays}</span>
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
                              <span className="text-[#294B57]/70">({vac.dose})</span>
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
            <div className="p-3 rounded-xl bg-[#F0EBE1]/70 border border-[#D8E6DA] space-y-1.5">
              <p><strong>Target Disease:</strong> {selectedVaccineModal.targetDisease}</p>
              <p><strong>Administration Route:</strong> {selectedVaccineModal.route}</p>
              <p><strong>Anatomical Site:</strong> {selectedVaccineModal.site}</p>
            </div>

            {selectedVaccineModal.childDose?.status === 'administered' ? (
              <div className="p-3 rounded-xl bg-[#DDF0E3] border border-[#A8D5B5] text-[#005F52] space-y-1">
                <span className="font-bold block">Officially Recorded Dose</span>
                <p>Date: {selectedVaccineModal.childDose.dateAdministered}</p>
                <p>Facility: {selectedVaccineModal.childDose.facility}</p>
                <p>Batch ID: {selectedVaccineModal.childDose.batch}</p>
                <p>Administered By: {selectedVaccineModal.childDose.workerName}</p>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-[#FDF8EF] border border-[#F4B83F]/50 text-[#103342] space-y-1">
                <span className="font-bold block text-[#B87D14]">Status: Due / Pending</span>
                <p>Please visit your assigned Anganwadi or Sub-Centre during the regular Wednesday Village Health & Nutrition Day (VHND) session.</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
