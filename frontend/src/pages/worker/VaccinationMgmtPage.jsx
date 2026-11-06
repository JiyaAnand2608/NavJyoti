import React, { useState } from 'react';
import { useHealthData } from '../../contexts/HealthDataContext';
import { Card, CardHeader } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Check } from 'lucide-react';

export function VaccinationMgmtPage() {
  const { childrenList, administerDose } = useHealthData();
  const [filterType, setFilterType] = useState('due_soon');

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

  const displayedDoses = filterType === 'all'
    ? allPendingDoses
    : allPendingDoses.filter((d) => d.status === filterType);

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
            Overdue Catch-up
          </button>
          <button
            onClick={() => setFilterType('due_soon')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer ${
              filterType === 'due_soon' ? 'bg-[#F4B83F] text-[#103342] font-semibold' : 'text-[#294B57] hover:bg-[#F0EBE1]'
            }`}
          >
            Due in 7–14 Days
          </button>
        </div>
      </div>

      <Card className="bg-[#FBF8F2] border-[#D8E6DA]">
        <CardHeader
          title="Scheduled Immunisation Queue"
          subtitle="Frontline verification for administered doses"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F0EBE1]/70 border-b border-[#D8E6DA] text-[#294B57] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Child Name & ID</th>
                <th className="py-3 px-3">Vaccine Dose</th>
                <th className="py-3 px-3">Village</th>
                <th className="py-3 px-3">Target Due Date</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8E6DA]/70 text-[#294B57]">
              {displayedDoses.map((dose) => (
                <tr key={`${dose.childId}_${dose.vaccineId}`} className="hover:bg-[#F0EBE1]/40">
                  <td className="py-3 px-4">
                    <span className="font-bold text-[#103342] block">{dose.childName}</span>
                    <span className="text-[10px] text-[#294B57]/70 font-mono">{dose.childId}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-[#103342]">{dose.vaccineName}</span>
                  </td>
                  <td className="py-3 px-3 text-[#103342]">{dose.village}</td>
                  <td className="py-3 px-3 font-mono">{dose.dueDate || 'Session Due'}</td>
                  <td className="py-3 px-3">
                    {dose.status === 'overdue' ? (
                      <Badge variant="overdue">Overdue Catch-up</Badge>
                    ) : (
                      <Badge variant="dueSoon">Due Soon</Badge>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        administerDose(dose.childId, dose.vaccineId, {
                          batch: "BATCH-DRIVE-24",
                          facility: `${dose.village} Sub-Centre`,
                          workerName: "Rekha Devi (ANM)",
                        });
                        alert(`Officially recorded ${dose.vaccineName} for ${dose.childName}!`);
                      }}
                      className="px-3 py-1.5 rounded-full bg-[#007F68] text-white font-semibold text-xs hover:bg-[#005F52] transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Mark Administered</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
