import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useHealthData } from '../../contexts/HealthDataContext';
import { Card, CardHeader } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  ArrowLeft,
  Syringe,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export function ChildDetailPage() {
  const { id } = useParams();
  const { childrenList, administerDose } = useHealthData();
  const [activeTab, setActiveTab] = useState('doses');

  // Administration modal
  const [administerModalOpen, setAdministerModalOpen] = useState(false);
  const [targetVaccine, setTargetVaccine] = useState(null);
  const [batchNumber, setBatchNumber] = useState('BATCH-2024-X1');
  const [facility, setFacility] = useState('Rampur Sub-Centre');

  const child = childrenList.find((c) => c.id === id) || childrenList[0];

  if (!child) {
    return <div className="p-8 text-center text-[#294B57]">Child record not found.</div>;
  }

  const handleOpenAdminister = (dose) => {
    setTargetVaccine(dose);
    setAdministerModalOpen(true);
  };

  const handleConfirmAdminister = (e) => {
    e.preventDefault();
    if (targetVaccine) {
      administerDose(child.id, targetVaccine.vaccineId, {
        batch: batchNumber,
        facility: facility,
        workerName: "Rekha Devi (ANM)",
        dateAdministered: new Date().toISOString().split('T')[0],
      });
      setAdministerModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-[#294B57]">
      {/* Top Breadcrumb */}
      <div>
        <Link
          to="/worker/registry"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#103342] hover:text-[#007F68] mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Child Registry</span>
        </Link>

        {/* Child Header Card */}
        <div className="p-6 rounded-3xl bg-[#FBF8F2] border border-[#D8E6DA] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#DDF0E3] text-[#007F68] flex items-center justify-center font-bold text-xl">
              {child.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-[#103342] font-serif">{child.name}</h1>
                {child.priorityLevel === 'red' && <Badge variant="overdue">Red Priority (Urgent)</Badge>}
                {child.priorityLevel === 'amber' && <Badge variant="dueSoon">Amber (Due Soon)</Badge>}
                {child.priorityLevel === 'green' && <Badge variant="upToDate">Green (Up to Date)</Badge>}
              </div>
              <p className="text-xs text-[#294B57] mt-1">
                ID: <span className="font-mono font-semibold text-[#007F68]">{child.id}</span> • {child.ageMonths} Months ({child.gender}) • DOB: {child.dob}
              </p>
              <div className="mt-2 text-xs text-[#294B57] flex flex-wrap items-center gap-4">
                <span>Caregiver: <strong className="text-[#103342]">{child.caregiverName}</strong> ({child.caregiverPhone})</span>
                <span>Village: <strong className="text-[#103342]">{child.village}</strong> ({child.subCentre})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#D8E6DA] text-xs font-semibold">
        <button
          onClick={() => setActiveTab('doses')}
          className={`py-3 px-4 border-b-2 transition-all cursor-pointer ${
            activeTab === 'doses'
              ? 'border-[#007F68] text-[#007F68]'
              : 'border-transparent text-[#294B57] hover:text-[#103342]'
          }`}
        >
          Clinical Vaccination Records ({child.doses?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('milestones')}
          className={`py-3 px-4 border-b-2 transition-all cursor-pointer ${
            activeTab === 'milestones'
              ? 'border-[#007F68] text-[#007F68]'
              : 'border-transparent text-[#294B57] hover:text-[#103342]'
          }`}
        >
          Milestone Observations ({child.milestones?.length || 0})
        </button>
      </div>

      {/* Doses Tab Content */}
      {activeTab === 'doses' && (
        <Card className="bg-[#FBF8F2] border-[#D8E6DA]">
          <CardHeader
            title="UIP Immunisation History & Due Queue"
            subtitle="Authorised ANM Administration Interface"
          />
          <div className="divide-y divide-[#D8E6DA]/70 text-xs">
            {child.doses?.map((dose) => {
              const isDone = dose.status === 'administered';
              return (
                <div key={dose.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F0EBE1]/40">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                      isDone ? 'bg-[#DDF0E3] text-[#007F68]' : 'bg-[#FDF8EF] text-[#B87D14]'
                    }`}>
                      {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="font-bold text-sm text-[#103342]">{dose.vaccineName}</span>
                      <p className="text-[11px] text-[#294B57] mt-0.5">
                        {isDone
                          ? `Administered: ${dose.dateAdministered} • Batch: ${dose.batch} • Recorded by ${dose.workerName}`
                          : `Scheduled Due: ${dose.dueDate || 'Immediate catch-up'}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isDone ? (
                      <Badge variant="upToDate">Administered & Verified</Badge>
                    ) : (
                      <>
                        <Badge variant={dose.status === 'overdue' ? 'overdue' : 'dueSoon'}>
                          {dose.status === 'overdue' ? 'Overdue Dose' : 'Due Soon'}
                        </Badge>
                        <button
                          onClick={() => handleOpenAdminister(dose)}
                          className="px-3 py-1.5 rounded-full bg-[#007F68] text-white font-semibold text-xs hover:bg-[#005F52] transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <Syringe className="w-3.5 h-3.5" />
                          <span>Administer Dose</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Milestones Tab Content */}
      {activeTab === 'milestones' && (
        <Card className="bg-[#FBF8F2] border-[#D8E6DA]">
          <CardHeader
            title="Frontline Observational Developmental Checkpoints"
            subtitle="Observational indicators for early growth tracking"
          />
          <div className="p-4 space-y-3 text-xs text-[#294B57]">
            {child.milestones && child.milestones.length > 0 ? (
              child.milestones.map((m) => (
                <div key={m.id} className="p-3 rounded-xl bg-white border border-[#D8E6DA]">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-[#103342] capitalize">{m.domain} Milestone</span>
                    <Badge variant={m.status === 'recorded' ? 'upToDate' : 'overdue'}>{m.status}</Badge>
                  </div>
                  <p className="text-[#294B57]">{m.notes}</p>
                  <span className="text-[10px] text-[#294B57]/70 block mt-1">Observed: {m.observedDate}</span>
                </div>
              ))
            ) : (
              <p className="text-[#294B57]/70 text-center py-6">No specific milestone observations logged yet for this child.</p>
            )}
          </div>
        </Card>
      )}

      {/* Administer Modal */}
      {targetVaccine && (
        <Modal
          isOpen={administerModalOpen}
          onClose={() => setAdministerModalOpen(false)}
          title={`Record Dose Administration: ${targetVaccine.vaccineName}`}
          subtitle={`Child: ${child.name} (${child.id})`}
        >
          <form onSubmit={handleConfirmAdminister} className="space-y-4 text-xs text-[#294B57]">
            <div>
              <label className="block font-semibold text-[#103342] mb-1">Vaccine Batch ID</label>
              <input
                type="text"
                required
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342] font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#103342] mb-1">Healthcare Facility</label>
              <input
                type="text"
                required
                value={facility}
                onChange={(e) => setFacility(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#103342] mb-1">Administering Health Worker</label>
              <input
                type="text"
                disabled
                value="Rekha Devi (ANM - Rampur Sub-Centre)"
                className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-[#F0EBE1] text-[#294B57]"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-full bg-[#007F68] text-white font-semibold text-xs hover:bg-[#005F52] transition-all cursor-pointer mt-2 shadow-xs"
            >
              Sign & Officially Record Dose
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
