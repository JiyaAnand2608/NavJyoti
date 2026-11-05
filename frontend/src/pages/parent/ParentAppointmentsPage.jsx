import React, { useState } from 'react';
import { useHealthData } from '../../contexts/HealthDataContext';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { CalendarCheck, Plus, Clock, CheckCircle2, User, MapPin, AlertCircle } from 'lucide-react';

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
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#17394A] font-serif">
            Frontline Appointments & Visits
          </h1>
          <p className="text-xs text-slate-500">
            Request home visits from your village ASHA/ANM or book sub-centre check-ups
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#006B64] text-white text-xs font-semibold hover:bg-[#00524c] transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Request Health Worker Visit</span>
        </button>
      </div>

      {/* Notice regarding confirmation */}
      <div className="p-3.5 rounded-xl bg-slate-100 text-xs text-slate-600 flex items-center gap-2 border border-slate-200">
        <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
        <span>
          <strong>Note:</strong> Requested visits must be accepted and confirmed by your assigned frontline worker (ANM) before they are scheduled.
        </span>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {appointments.map((apt) => (
          <Card key={apt.id} className="p-5 hover:border-slate-300 transition-colors">
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
                      <Badge variant="upToDate">Confirmed by Worker</Badge>
                    ) : (
                      <Badge variant="dueSoon">Pending Acceptance</Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    For: <span className="font-semibold text-[#17394A]">{apt.childName}</span> • Type:{' '}
                    <span className="capitalize font-medium">{apt.visitType.replace('_', ' ')}</span>
                  </p>
                  <div className="mt-2 text-[11px] text-slate-500 flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {apt.requestedDate} at {apt.timeSlot}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Worker: {apt.assignedWorker}
                    </span>
                  </div>
                  {apt.notes && (
                    <p className="text-[11px] text-slate-500 mt-1 italic">Note: "{apt.notes}"</p>
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
        <form onSubmit={handleRequest} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Visit Type</label>
            <select
              value={visitType}
              onChange={(e) => setVisitType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
            >
              <option value="home_visit">Home Visit (ASHA / ANM Doorstep)</option>
              <option value="subcentre">Sub-Centre Session (Wednesday VHND)</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Preferred Date</label>
            <input
              type="date"
              required
              value={requestedDate}
              onChange={(e) => setRequestedDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Preferred Time Slot</label>
            <select
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
            >
              <option value="10:00 AM">Morning (10:00 AM – 11:30 AM)</option>
              <option value="12:00 PM">Noon (12:00 PM – 01:30 PM)</option>
              <option value="03:00 PM">Afternoon (03:00 PM – 04:30 PM)</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Visit Purpose</label>
            <input
              type="text"
              required
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Due vaccination dose or milestone consultation"
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-[#006B64] text-white font-semibold text-xs hover:bg-[#00524c] transition-all cursor-pointer"
          >
            Submit Request for Worker Acceptance
          </button>
        </form>
      </Modal>
    </div>
  );
}
