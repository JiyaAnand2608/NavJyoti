import React, { useState } from 'react';
import { useHealthData } from '../../contexts/HealthDataContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { CalendarCheck, Plus, Clock, User, AlertCircle, CheckCircle2, XCircle, Trash2 } from 'lucide-react';

export function ParentAppointmentsPage() {
  const { appointments, activeChild, childrenList, requestAppointment, cancelAppointment } = useHealthData();
  const [filterStatus, setFilterStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [selectedChildId, setSelectedChildId] = useState(activeChild?.id || childrenList[0]?.id || '');
  const [requestedDate, setRequestedDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('10:00 AM');
  const [visitType, setVisitType] = useState('home_visit');
  const [purpose, setPurpose] = useState('Routine UIP Immunisation & Growth Assessment');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Min date for appointment is today
  const todayStr = new Date().toISOString().split('T')[0];

  const handleRequest = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!requestedDate) {
      setErrorMsg('Please select a visit date.');
      return;
    }
    if (requestedDate < todayStr) {
      setErrorMsg('Cannot schedule an appointment in the past.');
      return;
    }

    const childObj = childrenList.find((c) => c.id === selectedChildId) || activeChild;

    try {
      requestAppointment({
        childId: childObj.id,
        childName: childObj.name,
        caregiverName: childObj.caregiverName,
        caregiverPhone: childObj.caregiverPhone,
        requestedDate,
        timeSlot,
        visitType,
        purpose,
        assignedWorker: childObj.assignedWorker || "Rekha Devi (ANM)",
        notes: "Awaiting frontline worker confirmation",
      });

      setIsModalOpen(false);
      setSuccessMsg(`Visit request submitted for ${childObj.name} on ${requestedDate}.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Error requesting appointment.');
    }
  };

  const handleCancel = (aptId, childName) => {
    if (window.confirm(`Are you sure you want to cancel the appointment for ${childName}?`)) {
      cancelAppointment(aptId, 'Cancelled by caregiver');
      setSuccessMsg('Appointment cancelled.');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'confirmed') return apt.status === 'confirmed';
    if (filterStatus === 'requested') return apt.status === 'requested';
    if (filterStatus === 'history') return apt.status === 'completed' || apt.status === 'cancelled' || apt.status === 'declined';
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-[#294B57]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#103342] font-serif">
            Frontline Appointments & Visits
          </h1>
          <p className="text-xs text-[#294B57]">
            Request home visits from your village ANM or schedule sub-centre check-ups
          </p>
        </div>
        <button
          onClick={() => {
            setErrorMsg('');
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#007F68] text-white text-xs font-semibold hover:bg-[#005F52] transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Request Health Worker Visit</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-[#DDF0E3] border border-[#A8D5B5] text-xs text-[#005F52] font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#007F68] shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Notice regarding confirmation */}
      <div className="p-3.5 rounded-xl bg-[#F0EBE1] text-xs text-[#294B57] flex items-center gap-2 border border-[#D8E6DA]">
        <AlertCircle className="w-4 h-4 text-[#007F68] shrink-0" />
        <span>
          <strong className="text-[#103342]">Health Visit Protocol:</strong> Requested visits are reviewed and accepted by your assigned frontline worker (ANM) before they are officially scheduled into the field round.
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-[#FBF8F2] border border-[#D8E6DA] rounded-xl text-xs font-medium w-fit">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            filterStatus === 'all' ? 'bg-[#103342] text-white font-semibold' : 'text-[#294B57] hover:bg-[#F0EBE1]'
          }`}
        >
          All ({appointments.length})
        </button>
        <button
          onClick={() => setFilterStatus('confirmed')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            filterStatus === 'confirmed' ? 'bg-[#007F68] text-white font-semibold' : 'text-[#294B57] hover:bg-[#F0EBE1]'
          }`}
        >
          Confirmed ({appointments.filter(a => a.status === 'confirmed').length})
        </button>
        <button
          onClick={() => setFilterStatus('requested')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            filterStatus === 'requested' ? 'bg-[#F4B83F] text-[#103342] font-semibold' : 'text-[#294B57] hover:bg-[#F0EBE1]'
          }`}
        >
          Pending ({appointments.filter(a => a.status === 'requested').length})
        </button>
        <button
          onClick={() => setFilterStatus('history')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            filterStatus === 'history' ? 'bg-[#F0EBE1] text-[#103342] font-bold' : 'text-[#294B57] hover:bg-[#F0EBE1]'
          }`}
        >
          Past / Completed
        </button>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {filteredAppointments.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#294B57] bg-[#FBF8F2] rounded-2xl border border-[#D8E6DA]">
            No appointments found in this category.
          </div>
        ) : (
          filteredAppointments.map((apt) => (
            <Card key={apt.id} className="p-5 bg-[#FBF8F2] border-[#D8E6DA] hover:border-[#007F68]/40 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    apt.status === 'confirmed' ? 'bg-[#DDF0E3] text-[#007F68]' :
                    apt.status === 'completed' ? 'bg-[#103342] text-white' :
                    apt.status === 'cancelled' || apt.status === 'declined' ? 'bg-red-50 text-red-500' :
                    'bg-[#FDF8EF] text-[#B87D14]'
                  }`}>
                    <CalendarCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-[#103342] font-serif">{apt.purpose}</h3>
                      {apt.status === 'confirmed' && <Badge variant="upToDate">Confirmed by Worker</Badge>}
                      {apt.status === 'requested' && <Badge variant="dueSoon">Pending Acceptance</Badge>}
                      {apt.status === 'completed' && <Badge variant="navy">Completed</Badge>}
                      {apt.status === 'cancelled' && <Badge variant="overdue">Cancelled</Badge>}
                      {apt.status === 'declined' && <Badge variant="overdue">Declined</Badge>}
                    </div>
                    <p className="text-xs text-[#294B57] mt-1">
                      For: <strong className="text-[#103342]">{apt.childName}</strong> • Visit Type:{' '}
                      <span className="capitalize font-medium">{apt.visitType.replace('_', ' ')}</span>
                    </p>
                    <div className="mt-2 text-[11px] text-[#294B57]/80 flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#007F68]" />
                        {apt.requestedDate} at {apt.timeSlot}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-[#007F68]" />
                        ANM: {apt.assignedWorker}
                      </span>
                    </div>
                    {apt.notes && (
                      <p className="text-[11px] text-[#294B57]/80 mt-1 italic">Note: "{apt.notes}"</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {(apt.status === 'requested' || apt.status === 'confirmed') && (
                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      onClick={() => handleCancel(apt.id, apt.childName)}
                      className="px-3 py-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Request Visit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Request Frontline Health Visit"
        subtitle="Coordinate a home visit or Sub-Centre checkup with your village ANM"
      >
        <form onSubmit={handleRequest} className="space-y-4 text-xs text-[#294B57]">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-[#103342] mb-1">Select Child *</label>
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
            >
              {childrenList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.id})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#103342] mb-1">Visit Date *</label>
              <input
                type="date"
                min={todayStr}
                required
                value={requestedDate}
                onChange={(e) => setRequestedDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#103342] mb-1">Preferred Time *</label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
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
            <label className="block font-semibold text-[#103342] mb-1">Visit Location / Type</label>
            <select
              value={visitType}
              onChange={(e) => setVisitType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
            >
              <option value="home_visit">Home Visit (ASHA / ANM visits household)</option>
              <option value="subcentre">Village Sub-Centre (In-clinic appointment)</option>
              <option value="vhnd_session">VHND Weekly Wednesday Drive</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#103342] mb-1">Purpose / Details</label>
            <input
              type="text"
              required
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Scheduled 9-month MR-1 vaccination catch-up"
              className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-white border border-[#D8E6DA] text-[#103342] font-semibold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#007F68] text-white font-semibold text-xs hover:bg-[#005F52] transition-all cursor-pointer shadow-xs"
            >
              Submit Visit Request
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
