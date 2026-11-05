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
          <h1 className="text-2xl font-bold text-[#17394A] font-serif">
            Health Worker Credentials & Jurisdiction
          </h1>
          <p className="text-xs text-slate-500">
            Authorized Auxiliary Nurse Midwife (ANM) profile and assigned public health jurisdiction
          </p>
        </div>
        <SimulationBadge label="Verified Credentials" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#17394A] text-[#F5C45E] flex items-center justify-center font-bold text-lg">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-[#17394A] text-base">{user?.name || "Rekha Devi"}</h3>
              <p className="text-xs text-[#006B64] font-semibold">{user?.workerType || "ANM (Auxiliary Nurse Midwife)"}</p>
            </div>
          </div>
          <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
            <p><strong>Worker ID:</strong> <span className="font-mono font-bold text-[#17394A]">{user?.workerId || "ANM-UP-BLS-4019"}</span></p>
            <p><strong>Mobile:</strong> {user?.phone || "+91 94123 99887"}</p>
            <p><strong>Designation:</strong> Primary Healthcare Frontline Vaccinator</p>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-bold text-sm text-[#17394A] mb-3 flex items-center gap-2">
            <Building className="w-4 h-4 text-[#006B64]" />
            <span>Assigned Jurisdiction</span>
          </h3>
          <div className="space-y-2 text-xs text-slate-600">
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
