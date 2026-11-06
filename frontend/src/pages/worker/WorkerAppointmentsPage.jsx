import React from 'react';
import { useHealthData } from '../../contexts/HealthDataContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { CalendarCheck, Check, X, Clock, CheckCircle2 } from 'lucide-react';

export function WorkerAppointmentsPage() {
  const { appointments, updateAppointmentStatus } = useHealthData();

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-[#294B57]">
      <div>
        <h1 className="text-2xl font-bold text-[#103342] font-serif">
          Visit & Appointment Management
        </h1>
        <p className="text-xs text-[#294B57]">
          Review caregiver requests for home visits and VHND sub-centre sessions
        </p>
      </div>

      <div className="space-y-4">
        {appointments.map((apt) => (
          <Card key={apt.id} className="p-5 bg-[#FBF8F2] border-[#D8E6DA]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  apt.status === 'confirmed' ? 'bg-[#DDF0E3] text-[#007F68]' : 'bg-[#FDF8EF] text-[#B87D14]'
                }`}>
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-[#103342]">{apt.purpose}</h3>
                    {apt.status === 'confirmed' ? (
                      <Badge variant="upToDate">Confirmed</Badge>
                    ) : apt.status === 'completed' ? (
                      <Badge variant="navy">Completed</Badge>
                    ) : (
                      <Badge variant="dueSoon">Pending Acceptance</Badge>
                    )}
                  </div>
                  <p className="text-xs text-[#294B57] mt-1">
                    Child: <strong className="text-[#103342]">{apt.childName}</strong> (ID: {apt.childId}) • Caregiver: {apt.caregiverName} ({apt.caregiverPhone})
                  </p>
                  <p className="text-[11px] text-[#294B57]/80 mt-1 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#007F68]" />
                    <span>Requested for {apt.requestedDate} at {apt.timeSlot} • Type: <strong className="capitalize">{apt.visitType.replace('_', ' ')}</strong></span>
                  </p>
                  {apt.notes && (
                    <p className="text-[11px] text-[#294B57]/70 mt-1 italic">Note: "{apt.notes}"</p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {apt.status === 'requested' && (
                  <>
                    <button
                      onClick={() => updateAppointmentStatus(apt.id, 'confirmed', 'Accepted by ANM for morning sector round')}
                      className="px-3 py-1.5 rounded-full bg-[#007F68] text-white font-semibold text-xs hover:bg-[#005F52] transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept Visit</span>
                    </button>
                    <button
                      onClick={() => updateAppointmentStatus(apt.id, 'declined', 'Session rescheduled to VHND')}
                      className="px-3 py-1.5 rounded-full bg-[#FDECEC] text-[#D9534F] font-semibold text-xs hover:bg-red-100 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </button>
                  </>
                )}
                {apt.status === 'confirmed' && (
                  <button
                    onClick={() => updateAppointmentStatus(apt.id, 'completed', 'Visit completed and dose recorded')}
                    className="px-3 py-1.5 rounded-full bg-[#007F68] text-white font-semibold text-xs hover:bg-[#005F52] transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
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
