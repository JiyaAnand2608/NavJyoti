import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { SimulationBadge } from '../../components/common/SimulationBadge';
import { UserCheck, Building, ShieldCheck, MapPin, Award } from 'lucide-react';

export function WorkerProfilePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#103342] font-serif">
            Health Worker Credentials & Jurisdiction
          </h1>
          <p className="text-xs text-[#294B57]/80">
            Authorized Auxiliary Nurse Midwife (ANM) profile and assigned public health jurisdiction
          </p>
        </div>
        <SimulationBadge label="Verified Credentials" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="p-5 bg-[#FBF8F2] border border-[#D8E6DA]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#103342] text-[#F4B83F] flex items-center justify-center font-bold text-lg shadow-xs">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-[#103342] text-base font-serif">{user?.name || "Rekha Devi"}</h3>
              <p className="text-xs text-[#007F68] font-semibold">{user?.workerType || "ANM (Auxiliary Nurse Midwife)"}</p>
            </div>
          </div>
          <div className="space-y-2 text-xs text-[#294B57] border-t border-[#D8E6DA] pt-3">
            <p><strong>Worker ID:</strong> <span className="font-mono font-bold text-[#103342]">{user?.workerId || "ANM-UP-BLS-4019"}</span></p>
            <p><strong>Mobile:</strong> {user?.phone || "+91 94123 99887"}</p>
            <p><strong>Designation:</strong> Primary Healthcare Frontline Vaccinator</p>
          </div>
        </Card>

        <Card className="p-5 bg-[#FBF8F2] border border-[#D8E6DA]">
          <h3 className="font-bold text-sm text-[#103342] mb-3 flex items-center gap-2 font-serif">
            <Building className="w-4 h-4 text-[#007F68]" />
            <span>Assigned Jurisdiction</span>
          </h3>
          <div className="space-y-2 text-xs text-[#294B57]">
            <p><strong>Sub-Centre:</strong> Rampur Sub-Centre</p>
            <p><strong>Primary Health Centre (PHC):</strong> Bilaspur Sadar PHC</p>
            <p><strong>District & State:</strong> Bilaspur, Uttar Pradesh</p>
            <p><strong>Assigned Villages:</strong> Rampur, Kalyanpur, Shivpur</p>
            <p><strong>Cohort Size:</strong> ~4,850 Population</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
