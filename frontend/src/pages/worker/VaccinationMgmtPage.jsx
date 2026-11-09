import React, { useState } from 'react';
import { useHealthData } from '../../contexts/HealthDataContext';
import { Card, CardHeader } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Check, Syringe, CheckCircle2, AlertCircle, Filter, Calendar } from 'lucide-react';

export function VaccinationMgmtPage() {
  const { childrenList, administerDose } = useHealthData();
  const [filterType, setFilterType] = useState('due_soon'); // 'all' | 'due_soon' | 'overdue'

  // Modal State
  const [administerModalOpen, setAdministerModalOpen] = useState(false);
  const [selectedDose, setSelectedDose] = useState(null);
  const [batchNumber, setBatchNumber] = useState('BATCH-2024-X1');
  const [facility, setFacility] = useState('Rampur Sub-Centre');
  const [site, setSite] = useState('Left upper arm');
  const [doseDate, setDoseDate] = useState(new Date().toISOString().split('T')[0]);
  const [doseNotes, setDoseNotes] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Collect pending/due doses across all children in cohort
  const allPendingDoses = [];
  childrenList.forEach((child) => {
    child.doses?.forEach((dose) => {
      if (dose.status === 'due_soon' || dose.status === 'overdue') {
        allPendingDoses.push({
          ...dose,
          childId: child.id,
          childName: child.name,
          village: child.village,
          caregiverPhone: child.caregiverPhone,
        });
      }
    });
  });

  const displayedDoses =
    filterType === 'all'
      ? allPendingDoses
      : allPendingDoses.filter((d) => d.status === filterType);

  const handleOpenAdministerModal = (dose) => {
    setSelectedDose(dose);
    setBatchNumber(`BATCH-2024-${Math.floor(100 + Math.random() * 900)}`);
    setDoseDate(new Date().toISOString().split('T')[0]);
    setDoseNotes('');
    setAdministerModalOpen(true);
  };

  const handleConfirmAdminister = (e) => {
    e.preventDefault();
    if (!selectedDose) return;

    administerDose(selectedDose.childId, selectedDose.vaccineId, {
      vaccineName: selectedDose.vaccineName,
      batch: batchNumber,
      facility,
      site,
      dateAdministered: doseDate,
      notes: doseNotes,
      workerName: "Rekha Devi (ANM)",
    });

    setAdministerModalOpen(false);
    setSuccessMsg(`Vaccine dose ${selectedDose.vaccineName} recorded for ${selectedDose.childName}.`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-[#294B57]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#103342] font-serif">
            Vaccination Management & Session Drive
          </h1>
          <p className="text-xs text-[#294B57]">
            Cohort immunisation queue for Village Health & Nutrition Day (VHND) sessions
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-[#FBF8F2] border border-[#D8E6DA] rounded-xl text-xs font-medium">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer ${
              filterType === 'all' ? 'bg-[#103342] text-white font-semibold' : 'text-[#294B57] hover:bg-[#F0EBE1]'
            }`}
          >
            All Pending ({allPendingDoses.length})
          </button>
          <button
            onClick={() => setFilterType('overdue')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer ${
              filterType === 'overdue' ? 'bg-[#E57373] text-white font-semibold' : 'text-[#294B57] hover:bg-[#F0EBE1]'
            }`}
          >
            Overdue Catch-up ({allPendingDoses.filter(d => d.status === 'overdue').length})
          </button>
          <button
            onClick={() => setFilterType('due_soon')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer ${
              filterType === 'due_soon' ? 'bg-[#F4B83F] text-[#103342] font-semibold' : 'text-[#294B57] hover:bg-[#F0EBE1]'
            }`}
          >
            Due in 7–14 Days ({allPendingDoses.filter(d => d.status === 'due_soon').length})
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-[#DDF0E3] border border-[#A8D5B5] text-xs text-[#005F52] font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#007F68]" />
          <span>{successMsg}</span>
        </div>
      )}

      <Card className="bg-[#FBF8F2] border-[#D8E6DA] overflow-hidden">
        <CardHeader
          title="Scheduled Immunisation Queue"
          subtitle="Frontline verification and official administration for UIP doses"
        />
        {displayedDoses.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#294B57]">
            No pending doses found matching this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F0EBE1] border-b border-[#D8E6DA] text-[#294B57] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Child Name & ID</th>
                  <th className="py-3 px-3">Vaccine Dose</th>
                  <th className="py-3 px-3">Village</th>
                  <th className="py-3 px-3">Caregiver Phone</th>
                  <th className="py-3 px-3">Target Due Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8E6DA]/70 text-[#294B57]">
                {displayedDoses.map((dose) => (
                  <tr key={`${dose.childId}_${dose.vaccineId}`} className="hover:bg-[#F0EBE1]/40 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-[#103342] block">{dose.childName}</span>
                      <span className="text-[10px] text-[#007F68] font-mono font-semibold">{dose.childId}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-[#103342]">{dose.vaccineName}</span>
                    </td>
                    <td className="py-3 px-3 text-[#103342]">{dose.village}</td>
                    <td className="py-3 px-3 font-mono text-[#294B57]">{dose.caregiverPhone}</td>
                    <td className="py-3 px-3 font-mono">{dose.dueDate || 'Session Due'}</td>
                    <td className="py-3 px-3">
                      {dose.status === 'overdue' ? (
                        <Badge variant="overdue">Overdue</Badge>
                      ) : (
                        <Badge variant="dueSoon">Due Soon</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenAdministerModal(dose)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#007F68] hover:bg-[#005F52] text-white font-semibold text-xs shadow-2xs cursor-pointer transition-colors"
                      >
                        <Syringe className="w-3.5 h-3.5" />
                        <span>Administer Dose</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Administer Modal with Confirmation */}
      {administerModalOpen && selectedDose && (
        <Modal
          isOpen={administerModalOpen}
          onClose={() => setAdministerModalOpen(false)}
          title={`Confirm Administration: ${selectedDose.vaccineName}`}
          subtitle={`Child: ${selectedDose.childName} (${selectedDose.childId})`}
        >
          <form onSubmit={handleConfirmAdminister} className="space-y-4 text-xs text-[#294B57]">
            <div className="p-3 rounded-xl bg-[#DDF0E3] border border-[#A8D5B5] text-[#005F52]">
              <strong>Official Clinical Action:</strong> This dose will be recorded into the state registry and will update the caregiver's digital health pass.
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#103342] mb-1">Date Administered</label>
                <input
                  type="date"
                  required
                  value={doseDate}
                  onChange={(e) => setDoseDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#103342] mb-1">Vaccine Batch ID *</label>
                <input
                  type="text"
                  required
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342] font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#103342] mb-1">Facility Name</label>
                <input
                  type="text"
                  required
                  value={facility}
                  onChange={(e) => setFacility(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#103342] mb-1">Anatomical Site</label>
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
            </div>

            <div>
              <label className="block font-semibold text-[#103342] mb-1">Notes / Observations</label>
              <input
                type="text"
                value={doseNotes}
                onChange={(e) => setDoseNotes(e.target.value)}
                placeholder="e.g. Session dose verified, mother counseled..."
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
                Commit Dose Entry
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
