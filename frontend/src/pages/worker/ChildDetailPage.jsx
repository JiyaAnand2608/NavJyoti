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
  Calendar,
  Activity,
  FileText,
  Edit3,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export function ChildDetailPage() {
  const { id } = useParams();
  const { childrenList, administerDose, updateFollowUp, appointments } = useHealthData();
  const [activeTab, setActiveTab] = useState('doses'); // 'doses' | 'milestones' | 'growth' | 'appointments' | 'notes'

  // Administration modal
  const [administerModalOpen, setAdministerModalOpen] = useState(false);
  const [targetVaccine, setTargetVaccine] = useState(null);
  const [batchNumber, setBatchNumber] = useState('BATCH-2024-X1');
  const [facility, setFacility] = useState('Rampur Sub-Centre');
  const [site, setSite] = useState('Left upper arm');
  const [doseNotes, setDoseNotes] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Follow-up notes editing
  const child = childrenList.find((c) => c.id === id) || childrenList[0];
  const [followUpText, setFollowUpText] = useState(child?.followUpNotes || '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  if (!child) {
    return <div className="p-8 text-center text-[#294B57]">Child record not found.</div>;
  }

  const childAppointments = appointments.filter((a) => a.childId === child.id);

  const handleOpenAdminister = (dose) => {
    setTargetVaccine(dose);
    setBatchNumber(`BATCH-2024-${Math.floor(100 + Math.random() * 900)}`);
    setDoseNotes('');
    setAdministerModalOpen(true);
  };

  const handleConfirmAdminister = (e) => {
    e.preventDefault();
    if (targetVaccine) {
      administerDose(child.id, targetVaccine.vaccineId, {
        vaccineName: targetVaccine.vaccineName,
        batch: batchNumber,
        facility: facility,
        workerName: "Rekha Devi (ANM)",
        site: site,
        notes: doseNotes,
        dateAdministered: new Date().toISOString().split('T')[0],
      });
      setAdministerModalOpen(false);
      setSuccessMsg(`Vaccine dose ${targetVaccine.vaccineName} officially administered & recorded.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const handleSaveNotes = (e) => {
    e.preventDefault();
    updateFollowUp(child.id, { notes: followUpText });
    setIsEditingNotes(false);
    setSuccessMsg('Field follow-up notes updated.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const administeredCount = child.doses?.filter(d => d.status === 'administered').length || 0;
  const totalCount = child.doses?.length || 0;

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

        {successMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-[#DDF0E3] border border-[#A8D5B5] text-xs text-[#005F52] font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#007F68] shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

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
                {child.migrationStatus === 'migrant_in' && <Badge variant="teal">Migrant Inflow</Badge>}
              </div>
              <p className="text-xs text-[#294B57] mt-1">
                Unique Child ID: <span className="font-mono font-bold text-[#007F68]">{child.id}</span> • {child.ageMonths} Months ({child.gender}) • DOB: {child.dob} • Blood: {child.bloodGroup || 'B+'}
              </p>
              <div className="mt-2 text-xs text-[#294B57] flex flex-wrap items-center gap-4">
                <span>Caregiver: <strong className="text-[#103342]">{child.caregiverName}</strong> ({child.caregiverPhone})</span>
                <span>Village: <strong className="text-[#103342]">{child.village}</strong> ({child.subCentre})</span>
                <span>Assigned: <strong className="text-[#103342]">{child.assignedWorker || 'Rekha Devi (ANM)'}</strong></span>
              </div>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-[#D8E6DA] text-center shrink-0">
            <div className="text-2xl font-bold text-[#007F68]">{administeredCount} / {totalCount}</div>
            <div className="text-[10px] uppercase font-bold text-[#294B57]/70">UIP Doses Complete</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#D8E6DA] text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('doses')}
          className={`py-3 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'doses'
              ? 'border-[#007F68] text-[#007F68]'
              : 'border-transparent text-[#294B57] hover:text-[#103342]'
          }`}
        >
          Clinical Vaccination Records ({child.doses?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('milestones')}
          className={`py-3 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'milestones'
              ? 'border-[#007F68] text-[#007F68]'
              : 'border-transparent text-[#294B57] hover:text-[#103342]'
          }`}
        >
          Developmental Milestones ({child.milestones?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('growth')}
          className={`py-3 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'growth'
              ? 'border-[#007F68] text-[#007F68]'
              : 'border-transparent text-[#294B57] hover:text-[#103342]'
          }`}
        >
          Growth Trajectory ({child.growthRecords?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('appointments')}
          className={`py-3 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'appointments'
              ? 'border-[#007F68] text-[#007F68]'
              : 'border-transparent text-[#294B57] hover:text-[#103342]'
          }`}
        >
          Appointments ({childAppointments.length})
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`py-3 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'notes'
              ? 'border-[#007F68] text-[#007F68]'
              : 'border-transparent text-[#294B57] hover:text-[#103342]'
          }`}
        >
          Follow-Up Notes
        </button>
      </div>

      {/* Tab 1: Vaccination Records */}
      {activeTab === 'doses' && (
        <Card className="bg-[#FBF8F2] border-[#D8E6DA] overflow-hidden">
          <CardHeader
            title="National UIP Vaccination Record"
            subtitle="Verified frontline clinical entry and administration records"
          />
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F0EBE1] border-b border-[#D8E6DA] text-[#294B57] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Vaccine Name</th>
                  <th className="py-2.5 px-3">Target Disease</th>
                  <th className="py-2.5 px-3">Administration Status</th>
                  <th className="py-2.5 px-3">Date & Batch</th>
                  <th className="py-2.5 px-3">Facility / Provider</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8E6DA]/70 text-[#294B57]">
                {child.doses?.map((dose) => {
                  const isDone = dose.status === 'administered';
                  return (
                    <tr key={dose.id} className="hover:bg-[#F0EBE1]/40">
                      <td className="py-3 px-4 font-bold text-[#103342]">{dose.vaccineName}</td>
                      <td className="py-3 px-3">{dose.vaccineName.includes('BCG') ? 'Tuberculosis (TB)' : dose.vaccineName.includes('OPV') ? 'Polio' : 'UIP Target Disease'}</td>
                      <td className="py-3 px-3">
                        {isDone ? (
                          <Badge variant="upToDate">Administered</Badge>
                        ) : dose.status === 'overdue' ? (
                          <Badge variant="overdue">Overdue Catch-up</Badge>
                        ) : (
                          <Badge variant="dueSoon">Scheduled Due</Badge>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {isDone ? `${dose.dateAdministered} (${dose.batch})` : dose.dueDate || 'Session Due'}
                      </td>
                      <td className="py-3 px-3">
                        {isDone ? `${dose.facility || 'Sub-Centre'} • ${dose.workerName || 'ANM'}` : 'Pending session'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!isDone ? (
                          <button
                            onClick={() => handleOpenAdminister(dose)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#007F68] text-white font-semibold text-xs hover:bg-[#005F52] transition-colors cursor-pointer shadow-2xs"
                          >
                            <Syringe className="w-3.5 h-3.5" />
                            <span>Administer</span>
                          </button>
                        ) : (
                          <span className="text-[11px] font-semibold text-[#007F68] flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 2: Milestones */}
      {activeTab === 'milestones' && (
        <Card className="p-5 bg-[#FBF8F2] border-[#D8E6DA] space-y-3">
          <h3 className="font-bold text-sm text-[#103342] font-serif mb-2">
            Recorded Milestone Observations
          </h3>
          {child.milestones && child.milestones.length > 0 ? (
            <div className="divide-y divide-[#D8E6DA]/70 text-xs">
              {child.milestones.map((m) => (
                <div key={m.id} className="py-3 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#DDF0E3] text-[#007F68] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-[#103342]">{m.title || m.milestoneId}</span>
                    <span className="text-[10px] uppercase font-bold text-[#007F68] bg-[#DDF0E3] px-2 py-0.5 rounded-full ml-2">
                      {m.domain}
                    </span>
                    <p className="text-[#294B57] mt-0.5">"{m.notes}"</p>
                    <span className="text-[10px] text-[#294B57]/70 font-mono block mt-1">Observed Date: {m.observedDate}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#294B57]">No milestone observations recorded for this child yet.</p>
          )}
        </Card>
      )}

      {/* Tab 3: Growth */}
      {activeTab === 'growth' && (
        <Card className="p-5 bg-[#FBF8F2] border-[#D8E6DA]">
          <h3 className="font-bold text-sm text-[#103342] font-serif mb-3">
            Growth & Anthropometric Trajectory
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F0EBE1] border-b border-[#D8E6DA] text-[#294B57] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Age</th>
                  <th className="py-2.5 px-3">Weight (kg)</th>
                  <th className="py-2.5 px-3">Height (cm)</th>
                  <th className="py-2.5 px-3">Head Circ. (cm)</th>
                  <th className="py-2.5 px-3">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8E6DA]/70 text-[#294B57]">
                {child.growthRecords?.map((g) => (
                  <tr key={g.id}>
                    <td className="py-2.5 px-3 font-mono font-semibold">{g.date}</td>
                    <td className="py-2.5 px-3">{g.ageMonths}m</td>
                    <td className="py-2.5 px-3 font-bold text-[#007F68]">{g.weightKg} kg</td>
                    <td className="py-2.5 px-3">{g.heightCm} cm</td>
                    <td className="py-2.5 px-3">{g.headCircumferenceCm} cm</td>
                    <td className="py-2.5 px-3 text-[#294B57]/80">{g.recordedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 4: Appointments */}
      {activeTab === 'appointments' && (
        <Card className="p-5 bg-[#FBF8F2] border-[#D8E6DA] space-y-3">
          <h3 className="font-bold text-sm text-[#103342] font-serif">Appointment History</h3>
          {childAppointments.length === 0 ? (
            <p className="text-xs text-[#294B57]">No appointment requests on file for this child.</p>
          ) : (
            <div className="space-y-2">
              {childAppointments.map((apt) => (
                <div key={apt.id} className="p-3 bg-white rounded-xl border border-[#D8E6DA] flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-bold text-[#103342]">{apt.purpose}</h4>
                    <p className="text-[11px] text-[#294B57]">{apt.requestedDate} at {apt.timeSlot} • Type: {apt.visitType}</p>
                    {apt.notes && <p className="text-[10px] text-slate-500 italic">"{apt.notes}"</p>}
                  </div>
                  <Badge variant={apt.status === 'confirmed' ? 'upToDate' : 'dueSoon'}>
                    {apt.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab 5: Follow-Up Notes */}
      {activeTab === 'notes' && (
        <Card className="p-5 bg-[#FBF8F2] border-[#D8E6DA] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-[#103342] font-serif">
                Frontline Worker Field & Outreach Notes
              </h3>
              <p className="text-xs text-[#294B57]">
                Record observations regarding migration status, family contacts, and home visit follow-ups
              </p>
            </div>
            {!isEditingNotes && (
              <button
                onClick={() => setIsEditingNotes(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-[#D8E6DA] text-xs font-semibold text-[#007F68] hover:bg-[#F0EBE1] cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Notes</span>
              </button>
            )}
          </div>

          {isEditingNotes ? (
            <form onSubmit={handleSaveNotes} className="space-y-3 text-xs">
              <textarea
                rows={4}
                value={followUpText}
                onChange={(e) => setFollowUpText(e.target.value)}
                className="w-full p-3 rounded-xl border border-[#D8E6DA] bg-white text-[#103342] focus:ring-2 focus:ring-[#007F68]"
                placeholder="Enter field observations, reasons for delay, or scheduled session date..."
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingNotes(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-[#D8E6DA] text-[#103342] font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#007F68] text-white font-semibold text-xs hover:bg-[#005F52] cursor-pointer shadow-xs"
                >
                  Save Field Notes
                </button>
              </div>
            </form>
          ) : (
            <div className="p-4 rounded-xl bg-white border border-[#D8E6DA] text-xs text-[#294B57] leading-relaxed">
              {child.followUpNotes ? child.followUpNotes : "No field follow-up notes recorded yet for this child."}
            </div>
          )}
        </Card>
      )}

      {/* Administer Vaccine Modal */}
      {administerModalOpen && targetVaccine && (
        <Modal
          isOpen={administerModalOpen}
          onClose={() => setAdministerModalOpen(false)}
          title={`Administer Vaccine: ${targetVaccine.vaccineName}`}
          subtitle={`Child: ${child.name} (${child.id})`}
        >
          <form onSubmit={handleConfirmAdminister} className="space-y-4 text-xs text-[#294B57]">
            <div className="p-3 rounded-xl bg-[#DDF0E3] border border-[#A8D5B5] text-xs text-[#005F52]">
              <strong>Official Clinical Action:</strong> Recording this dose commits it to the child's permanent digital health pass and updates parental notifications.
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#103342] mb-1">Batch Number *</label>
                <input
                  type="text"
                  required
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342] font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#103342] mb-1">Facility Name *</label>
                <input
                  type="text"
                  required
                  value={facility}
                  onChange={(e) => setFacility(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#103342] mb-1">Anatomical Route / Site</label>
                <select
                  value={site}
                  onChange={(e) => setSite(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
                >
                  <option value="Left upper arm">Left upper arm (ID)</option>
                  <option value="Antero-lateral mid-thigh">Antero-lateral mid-thigh (IM)</option>
                  <option value="Oral">Oral (Drops)</option>
                  <option value="Right upper arm">Right upper arm (SC)</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[#103342] mb-1">Administering ANM</label>
                <input
                  type="text"
                  disabled
                  value="Rekha Devi (ANM)"
                  className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-slate-100 text-[#103342]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#103342] mb-1">Clinical Notes (Optional)</label>
              <input
                type="text"
                value={doseNotes}
                onChange={(e) => setDoseNotes(e.target.value)}
                placeholder="e.g. Mild cry, mother counseled on post-dose care..."
                className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAdministerModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white border border-[#D8E6DA] text-[#103342] font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#007F68] text-white font-semibold text-xs hover:bg-[#005F52] cursor-pointer shadow-xs"
              >
                Confirm Dose Administration
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
