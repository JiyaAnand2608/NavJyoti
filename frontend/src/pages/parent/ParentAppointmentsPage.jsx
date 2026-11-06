import React, { useState } from 'react';
import { useHealthData } from '../../contexts/HealthDataContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { CalendarCheck, Plus, Clock, User, AlertCircle } from 'lucide-react';

export function ParentAppointmentsPage() {
  const { appointments, activeChild, requestAppointment } = useHealthData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requestedDate, setRequestedDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('10:00 AM');
  const [visitType, setVisitType] = useState('home_visit');
  const [purpose, setPurpose] = useState('Routine 9-Month Vaccine Session & Milestone Check');

  const handleRequest = (e) => {
    e.preventDefault();
    requestAppointment({
      childId: activeChild.id,
      childName: activeChild.name,
      caregiverName: activeChild.caregiverName,
      caregiverPhone: activeChild.caregiverPhone,
      requestedDate,
      timeSlot,
      visitType,
      purpose,
      assignedWorker: "Rekha Devi (ANM)",
      notes: "Awaiting ANM confirmation",
    });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-[#294B57]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#103342] font-serif">
            Frontline Appointments & Visits
          </h1>
          <p className="text-xs text-[#294B57]">
            Request home visits from your village ASHA/ANM or book sub-centre check-ups
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#007F68] text-white text-xs font-semibold hover:bg-[#005F52] transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Request Health Worker Visit</span>
        </button>
      </div>

      {/* Notice regarding confirmation */}
      <div className="p-3.5 rounded-xl bg-[#F0EBE1] text-xs text-[#294B57] flex items-center gap-2 border border-[#D8E6DA]">
        <AlertCircle className="w-4 h-4 text-[#007F68] shrink-0" />
        <span>
          <strong className="text-[#103342]">Note:</strong> Requested visits must be accepted and confirmed by your assigned frontline worker (ANM) before they are scheduled.
        </span>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {appointments.map((apt) => (
          <Card key={apt.id} className="p-5 bg-[#FBF8F2] border-[#D8E6DA] hover:border-[#007F68]/40 transition-colors">
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
                      <Badge variant="upToDate">Confirmed by Worker</Badge>
                    ) : (
                      <Badge variant="dueSoon">Pending Acceptance</Badge>
                    )}
                  </div>
                  <p className="text-xs text-[#294B57] mt-1">
                    For: <span className="font-semibold text-[#103342]">{apt.childName}</span> • Type:{' '}
                    <span className="capitalize font-medium">{apt.visitType.replace('_', ' ')}</span>
                  </p>
                  <div className="mt-2 text-[11px] text-[#294B57]/80 flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#007F68]" />
                      {apt.requestedDate} at {apt.timeSlot}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-[#007F68]" />
                      Worker: {apt.assignedWorker}
                    </span>
                  </div>
                  {apt.notes && (
                    <p className="text-[11px] text-[#294B57]/70 mt-1 italic">Note: "{apt.notes}"</p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Request Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Request Frontline Visit"
        subtitle="Choose preferred date for ANM home or sub-centre visit"
      >
        <form onSubmit={handleRequest} className="space-y-4 text-xs text-[#294B57]">
          <div>
            <label className="block font-semibold text-[#103342] mb-1">Visit Type</label>
            <select
              value={visitType}
              onChange={(e) => setVisitType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
            >
              <option value="home_visit">Home Visit (ASHA / ANM Doorstep)</option>
              <option value="subcentre">Sub-Centre Session (Wednesday VHND)</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold text-[#103342] mb-1">Preferred Date</label>
            <input
              type="date"
              required
              value={requestedDate}
              onChange={(e) => setRequestedDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
            />
          </div>
          <div>
            <label className="block font-semibold text-[#103342] mb-1">Preferred Time Slot</label>
            <select
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
            >
              <option value="10:00 AM">Morning (10:00 AM – 11:30 AM)</option>
              <option value="12:00 PM">Noon (12:00 PM – 01:30 PM)</option>
              <option value="03:00 PM">Afternoon (03:00 PM – 04:30 PM)</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold text-[#103342] mb-1">Visit Purpose</label>
            <input
              type="text"
              required
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Due vaccination dose or milestone consultation"
              className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-full bg-[#007F68] text-white font-semibold text-xs hover:bg-[#005F52] transition-all cursor-pointer shadow-xs"
          >
            Submit Request for Worker Acceptance
          </button>
        </form>
      </Modal>
    </div>
  );
}
