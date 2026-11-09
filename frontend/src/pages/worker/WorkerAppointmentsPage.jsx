import React, { useState } from 'react';
import { useHealthData } from '../../contexts/HealthDataContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { CalendarCheck, Check, X, Clock, CheckCircle2, RotateCw, AlertCircle } from 'lucide-react';

export function WorkerAppointmentsPage() {
  const { appointments, updateAppointmentStatus, rescheduleAppointment } = useHealthData();
  const [filterStatus, setFilterStatus] = useState('all');

  // Reschedule modal
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [selectedApt, setSelectedApt] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('10:00 AM');
  const [rescheduleReason, setRescheduleReason] = useState('VHND sector shift');
  const [successMsg, setSuccessMsg] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const handleOpenReschedule = (apt) => {
    setSelectedApt(apt);
    setNewDate(apt.requestedDate || todayStr);
    setNewTime(apt.timeSlot || '10:00 AM');
    setIsRescheduleOpen(true);
  };

  const handleSaveReschedule = (e) => {
    e.preventDefault();
    if (!selectedApt) return;

    rescheduleAppointment(selectedApt.id, newDate, newTime, rescheduleReason);
    setIsRescheduleOpen(false);
    setSuccessMsg(`Appointment for ${selectedApt.childName} rescheduled to ${newDate} at ${newTime}.`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleAccept = (aptId, childName) => {
    updateAppointmentStatus(aptId, 'confirmed', 'Accepted by ANM for morning sector round');
    setSuccessMsg(`Visit confirmed for ${childName}.`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleDecline = (aptId, childName) => {
    updateAppointmentStatus(aptId, 'declined', 'Declined: Please visit Sub-Centre during Wednesday VHND');
    setSuccessMsg(`Visit declined for ${childName}.`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleComplete = (aptId, childName) => {
    updateAppointmentStatus(aptId, 'completed', 'Visit successfully conducted and dose administered');
    setSuccessMsg(`Visit marked as completed for ${childName}.`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'pending') return apt.status === 'requested';
    if (filterStatus === 'confirmed') return apt.status === 'confirmed';
    if (filterStatus === 'completed') return apt.status === 'completed';
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-[#294B57]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#103342] font-serif">
            Visit & Appointment Management
          </h1>
          <p className="text-xs text-[#294B57]">
            Review caregiver requests for home visits and VHND sub-centre sessions
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-[#FBF8F2] border border-[#D8E6DA] rounded-xl text-xs font-medium">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer ${
              filterStatus === 'all' ? 'bg-[#103342] text-white font-semibold' : 'text-[#294B57] hover:bg-[#F0EBE1]'
            }`}
          >
            All ({appointments.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer ${
              filterStatus === 'pending' ? 'bg-[#F4B83F] text-[#103342] font-semibold' : 'text-[#294B57] hover:bg-[#F0EBE1]'
            }`}
          >
            Pending Requests ({appointments.filter(a => a.status === 'requested').length})
          </button>
          <button
            onClick={() => setFilterStatus('confirmed')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer ${
              filterStatus === 'confirmed' ? 'bg-[#007F68] text-white font-semibold' : 'text-[#294B57] hover:bg-[#F0EBE1]'
            }`}
          >
            Confirmed ({appointments.filter(a => a.status === 'confirmed').length})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer ${
              filterStatus === 'completed' ? 'bg-[#103342] text-white font-semibold' : 'text-[#294B57] hover:bg-[#F0EBE1]'
            }`}
          >
            Completed ({appointments.filter(a => a.status === 'completed').length})
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-[#DDF0E3] border border-[#A8D5B5] text-xs text-[#005F52] font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#007F68]" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="space-y-4">
        {filteredAppointments.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#294B57] bg-[#FBF8F2] rounded-2xl border border-[#D8E6DA]">
            No appointments in this category.
          </div>
        ) : (
          filteredAppointments.map((apt) => (
            <Card key={apt.id} className="p-5 bg-[#FBF8F2] border-[#D8E6DA]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    apt.status === 'confirmed' ? 'bg-[#DDF0E3] text-[#007F68]' :
                    apt.status === 'completed' ? 'bg-[#103342] text-white' :
                    apt.status === 'declined' || apt.status === 'cancelled' ? 'bg-red-50 text-red-500' :
                    'bg-[#FDF8EF] text-[#B87D14]'
                  }`}>
                    <CalendarCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-[#103342] font-serif">{apt.purpose}</h3>
                      {apt.status === 'confirmed' && <Badge variant="upToDate">Confirmed</Badge>}
                      {apt.status === 'completed' && <Badge variant="navy">Completed</Badge>}
                      {apt.status === 'requested' && <Badge variant="dueSoon">Pending Acceptance</Badge>}
                      {apt.status === 'declined' && <Badge variant="overdue">Declined</Badge>}
                      {apt.status === 'cancelled' && <Badge variant="overdue">Cancelled</Badge>}
                    </div>
                    <p className="text-xs text-[#294B57] mt-1">
                      Child: <strong className="text-[#103342]">{apt.childName}</strong> (ID: {apt.childId}) • Caregiver: {apt.caregiverName} ({apt.caregiverPhone})
                    </p>
                    <p className="text-[11px] text-[#294B57]/80 mt-1 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#007F68]" />
                      <span>Requested for {apt.requestedDate} at {apt.timeSlot} • Type: <strong className="capitalize">{apt.visitType?.replace('_', ' ')}</strong></span>
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
                        onClick={() => handleAccept(apt.id, apt.childName)}
                        className="px-3.5 py-1.5 rounded-full bg-[#007F68] text-white font-semibold text-xs hover:bg-[#005F52] transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept Visit</span>
                      </button>
                      <button
                        onClick={() => handleOpenReschedule(apt)}
                        className="px-3 py-1.5 rounded-full bg-white border border-[#D8E6DA] text-[#103342] font-semibold text-xs hover:bg-[#F0EBE1] transition-all cursor-pointer flex items-center gap-1"
                      >
                        <RotateCw className="w-3.5 h-3.5 text-[#007F68]" />
                        <span>Reschedule</span>
                      </button>
                      <button
                        onClick={() => handleDecline(apt.id, apt.childName)}
                        className="px-3 py-1.5 rounded-full bg-red-50 text-red-600 font-semibold text-xs hover:bg-red-100 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>
                    </>
                  )}
                  {apt.status === 'confirmed' && (
                    <>
                      <button
                        onClick={() => handleComplete(apt.id, apt.childName)}
                        className="px-3.5 py-1.5 rounded-full bg-[#007F68] text-white font-semibold text-xs hover:bg-[#005F52] transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Completed</span>
                      </button>
                      <button
                        onClick={() => handleOpenReschedule(apt)}
                        className="px-3 py-1.5 rounded-full bg-white border border-[#D8E6DA] text-[#103342] font-semibold text-xs hover:bg-[#F0EBE1] cursor-pointer"
                      >
                        Change Time
                      </button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Reschedule Modal */}
      {isRescheduleOpen && selectedApt && (
        <Modal
          isOpen={isRescheduleOpen}
          onClose={() => setIsRescheduleOpen(false)}
          title={`Reschedule Visit: ${selectedApt.childName}`}
          subtitle={`Current Request: ${selectedApt.requestedDate} at ${selectedApt.timeSlot}`}
        >
          <form onSubmit={handleSaveReschedule} className="space-y-4 text-xs text-[#294B57]">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#103342] mb-1">New Date</label>
                <input
                  type="date"
                  min={todayStr}
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#103342] mb-1">New Time Slot</label>
                <select
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
                >
                  <option value="09:00 AM">09:00 AM (Morning Round)</option>
                  <option value="10:30 AM">10:30 AM (Morning Round)</option>
                  <option value="12:00 PM">12:00 PM (Noon Round)</option>
                  <option value="02:30 PM">02:30 PM (Afternoon Round)</option>
                  <option value="04:00 PM">04:00 PM (Evening Session)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#103342] mb-1">Reason for Rescheduling</label>
              <input
                type="text"
                required
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                placeholder="e.g. Wednesday sector round timing adjustment..."
                className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsRescheduleOpen(false)}
                className="px-4 py-2 rounded-xl bg-white border border-[#D8E6DA] text-[#103342] font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#007F68] text-white font-semibold text-xs hover:bg-[#005F52] cursor-pointer shadow-xs"
              >
                Confirm Reschedule
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
