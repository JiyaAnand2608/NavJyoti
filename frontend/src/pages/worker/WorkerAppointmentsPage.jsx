import React from 'react';
import { useHealthData } from '../../contexts/HealthDataContext';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { CalendarCheck, Check, X, Clock, User, Phone, CheckCircle2 } from 'lucide-react';

export function WorkerAppointmentsPage() {
  const { appointments, updateAppointmentStatus } = useHealthData();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[#17394A] font-serif">
          Visit & Appointment Management
        </h1>
        <p className="text-xs text-slate-500">
          Review caregiver requests for home visits and VHND sub-centre sessions
        </p>
      </div>

      <div className="space-y-4">
        {appointments.map((apt) => (
          <Card key={apt.id} className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  apt.status === 'confirmed' ? 'bg-[#EAF7F0] text-[#00524c]' : 'bg-[#fef7e8] text-[#dc9a23]'
                }`}>
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-[#17394A]">{apt.purpose}</h3>
                    {apt.status === 'confirmed' ? (
                      <Badge variant="upToDate">Confirmed</Badge>
                    ) : apt.status === 'completed' ? (
                      <Badge variant="navy">Completed</Badge>
                    ) : (
                      <Badge variant="dueSoon">Pending Acceptance</Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Child: <strong>{apt.childName}</strong> (ID: {apt.childId}) • Caregiver: {apt.caregiverName} ({apt.caregiverPhone})
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Requested for {apt.requestedDate} at {apt.timeSlot} • Type: <strong className="capitalize">{apt.visitType.replace('_', ' ')}</strong></span>
                  </p>
                  {apt.notes && (
                    <p className="text-[11px] text-slate-500 mt-1 italic">Note: "{apt.notes}"</p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {apt.status === 'requested' && (
                  <>
                    <button
                      onClick={() => updateAppointmentStatus(apt.id, 'confirmed', 'Accepted by ANM for morning sector round')}
                      className="px-3 py-1.5 rounded-lg bg-[#006B64] text-white font-semibold text-xs hover:bg-[#00524c] transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept Visit</span>
                    </button>
                    <button
                      onClick={() => updateAppointmentStatus(apt.id, 'declined', 'Session rescheduled to VHND')}
                      className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 font-semibold text-xs hover:bg-red-200 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </button>
                  </>
                )}
                {apt.status === 'confirmed' && (
                  <button
                    onClick={() => updateAppointmentStatus(apt.id, 'completed', 'Visit completed and dose recorded')}
                    className="px-3 py-1.5 rounded-lg bg-[#17394A] text-white font-semibold text-xs hover:bg-[#0f2632] transition-all cursor-pointer flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Completed</span>
                  </button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
