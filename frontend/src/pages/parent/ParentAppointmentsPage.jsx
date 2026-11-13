
import React, { useState } from 'react';
import { useHealthData } from '../../contexts/HealthDataContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  CalendarCheck,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';

function localDateToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function statusLabel(status) {
  const labels = {
    requested: 'Pending Worker Review',
    approved: 'Approved by Worker',
    confirmed: 'Confirmed',
    rescheduled: 'Rescheduled',
    completed: 'Completed',
    cancelled: 'Cancelled',
    declined: 'Declined',
    rejected: 'Rejected',
  };

  return labels[status] || status || 'Unknown';
}

function statusVariant(status) {
  if (status === 'approved' || status === 'confirmed') {
    return 'upToDate';
  }

  if (status === 'requested' || status === 'rescheduled') {
    return 'dueSoon';
  }

  if (status === 'cancelled' || status === 'declined') {
    return 'overdue';
  }

  return 'default';
}

export function ParentAppointmentsPage() {
  const {
    appointments,
    activeChild,
    childrenList,
    childrenLoading,
    childrenError,
    requestAppointment,
  } = useHealthData();

  const [filterStatus, setFilterStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [requestedDate, setRequestedDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const todayStr = localDateToday();

  // The backend stores child, date, reason and status.
  // It does not currently store a preferred time or visit type.
  const openRequestModal = () => {
    setSelectedChildId(
      String(activeChild?.id ?? childrenList[0]?.id ?? '')
    );
    setRequestedDate('');
    setPurpose('Routine health visit');
    setErrorMsg('');
    setSuccessMsg('');
    setIsModalOpen(true);
  };

  const handleRequest = async (event) => {
    event.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const child = childrenList.find(
      (item) => String(item.id) === String(selectedChildId)
    );

    if (!child) {
      setErrorMsg('Please select a child.');
      return;
    }

    if (!requestedDate) {
      setErrorMsg('Please select an appointment date.');
      return;
    }

    if (requestedDate < localDateToday()) {
      setErrorMsg('Please choose today or a future date.');
      return;
    }

    if (!purpose.trim()) {
      setErrorMsg('Please enter the reason for the visit.');
      return;
    }

    setIsSubmitting(true);

    try {
      // This function sends POST /children/{id}/appointments
      // to FastAPI and waits for the database response.
      await requestAppointment({
        childId: child.id,
        requestedDate,
        purpose: purpose.trim(),
      });

      setIsModalOpen(false);

      setSuccessMsg(
        `Appointment request for ${child.name} was saved. ` +
        `A health worker must review it before confirmation.`
      );

      setRequestedDate('');
      setPurpose('');
    } catch (error) {
      setErrorMsg(
        error.message || 'Unable to save the appointment.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show only appointments belonging to accessible children.
  const accessibleIds = new Set(
    childrenList.map((child) => String(child.id))
  );

  const accessibleAppointments = appointments.filter(
    (appointment) =>
      accessibleIds.has(String(appointment.childId))
  );

  const filteredAppointments = accessibleAppointments.filter(
    (appointment) => {
      if (filterStatus === 'all') return true;

      if (filterStatus === 'pending') {
        return appointment.status === 'requested';
      }

      if (filterStatus === 'approved') {
        return [
          'approved',
          'confirmed',
          'rescheduled',
        ].includes(appointment.status);
      }

      if (filterStatus === 'history') {
        return [
          'completed',
          'cancelled',
          'declined',
          'rejected',
        ].includes(appointment.status);
      }

      return true;
    }
  );

  const sortedAppointments = [...filteredAppointments].sort(
    (a, b) =>
      String(b.requestedDate || '').localeCompare(
        String(a.requestedDate || '')
      )
  );

  const findChildName = (childId) => {
    const child = childrenList.find(
      (item) => String(item.id) === String(childId)
    );

    return child?.name || `Child ID ${childId}`;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-[#294B57]">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#103342] font-serif">
            Frontline Appointments & Visits
          </h1>

          <p className="text-xs text-[#294B57] mt-1">
            Request health worker appointments and track
            their status through NavJyoti.
          </p>
        </div>

        <button
          type="button"
          onClick={openRequestModal}
          disabled={childrenLoading || childrenList.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#007F68] text-white text-xs font-semibold hover:bg-[#005F52] disabled:opacity-50 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Request Health Worker Visit
        </button>
      </div>

      {/* LOADING */}
      {childrenLoading && (
        <div className="p-4 bg-[#FBF8F2] rounded-xl border border-[#D8E6DA] text-xs">
          Loading appointments from NavJyoti...
        </div>
      )}

      {/* BACKEND ERROR */}
      {childrenError && (
        <div
          role="alert"
          className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{childrenError}</span>
        </div>
      )}

      {/* SUCCESS MESSAGE */}
      {successMsg && (
        <div
          role="status"
          className="p-4 bg-[#DDF0E3] border border-[#A8D5B5] rounded-xl text-[#005F52] text-xs flex gap-2"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* DEVELOPMENT NOTICE */}
      <div className="p-4 rounded-xl bg-[#F0EBE1] border border-[#D8E6DA] flex items-start gap-3 text-xs">
        <Info className="w-5 h-5 text-[#007F68] shrink-0" />

        <p>
          <strong>Appointment workflow:</strong> Requests are
          saved in PostgreSQL. A health worker must review
          and approve them. Visit times, locations and
          caregiver cancellation are not supported by the
          current backend.
        </p>
      </div>

      {/* STATUS FILTERS */}
      <div className="flex flex-wrap items-center gap-2">

        {[
          ['all', 'All'],
          ['pending', 'Pending'],
          ['approved', 'Approved'],
          ['history', 'History'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilterStatus(value)}
            className={`px-4 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
              filterStatus === value
                ? 'bg-[#103342] border-[#103342] text-white'
                : 'bg-[#FBF8F2] border-[#D8E6DA] text-[#294B57]'
            }`}
          >
            {label}
          </button>
        ))}

      </div>

      {/* DATABASE APPOINTMENTS */}
      <div className="space-y-4">

        {!childrenLoading &&
        !childrenError &&
        sortedAppointments.length === 0 ? (
          <Card className="p-8 bg-[#FBF8F2] border-[#D8E6DA]">

            <div className="text-center space-y-3">
              <CalendarCheck className="w-10 h-10 text-[#007F68] mx-auto" />

              <h3 className="font-bold text-[#103342]">
                No Appointments Found
              </h3>

              <p className="text-xs text-[#294B57]">
                No appointment records are available for
                this category.
              </p>
            </div>

          </Card>
        ) : (
          sortedAppointments.map((appointment) => (

            <Card
              key={appointment.id}
              className="p-5 bg-[#FBF8F2] border-[#D8E6DA]"
            >

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                <div className="flex items-start gap-3">

                  <div className="w-10 h-10 rounded-xl bg-[#DDF0E3] text-[#007F68] flex items-center justify-center shrink-0">
                    <CalendarCheck className="w-5 h-5" />
                  </div>

                  <div className="space-y-2">

                    <h3 className="font-bold text-sm text-[#103342]">
                      {appointment.purpose ||
                        appointment.reason ||
                        'Health Visit'}
                    </h3>

                    <p className="text-xs text-[#294B57]">
                      For:{' '}
                      <strong>
                        {findChildName(appointment.childId)}
                      </strong>
                    </p>

                    <p className="text-xs text-[#294B57] flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#007F68]" />
                      Date: {appointment.requestedDate || 'Not recorded'}
                    </p>

                    <p className="text-[11px] text-[#294B57]/70">
                      Database Appointment ID: {appointment.id}
                    </p>

                  </div>
                </div>

                <div>
                  <Badge variant={statusVariant(appointment.status)}>
                    {statusLabel(appointment.status)}
                  </Badge>
                </div>

              </div>

            </Card>

          ))
        )}

      </div>

      {/* REQUEST APPOINTMENT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          if (!isSubmitting) setIsModalOpen(false);
        }}
        title="Request Frontline Health Visit"
        subtitle="Submit an appointment request to NavJyoti"
      >

        <form
          onSubmit={handleRequest}
          className="space-y-4 text-xs text-[#294B57]"
        >

          {errorMsg && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
          )}

          <div>
            <label
              htmlFor="appointment-child"
              className="block font-semibold text-[#103342] mb-1.5"
            >
              Select Child
            </label>

            <select
              id="appointment-child"
              required
              disabled={isSubmitting}
              value={selectedChildId}
              onChange={(e) =>
                setSelectedChildId(e.target.value)
              }
              className="w-full px-3 py-2.5 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
            >
              {childrenList.map((child) => (
                <option key={child.id} value={String(child.id)}>
                  {child.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="appointment-date"
              className="block font-semibold text-[#103342] mb-1.5"
            >
              Requested Visit Date
            </label>

            <input
              id="appointment-date"
              type="date"
              required
              min={todayStr}
              disabled={isSubmitting}
              value={requestedDate}
              onChange={(e) =>
                setRequestedDate(e.target.value)
              }
              className="w-full px-3 py-2.5 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
            />
          </div>

          <div>
            <label
              htmlFor="appointment-purpose"
              className="block font-semibold text-[#103342] mb-1.5"
            >
              Reason for Visit
            </label>

            <textarea
              id="appointment-purpose"
              required
              rows={3}
              disabled={isSubmitting}
              value={purpose}
              onChange={(e) =>
                setPurpose(e.target.value)
              }
              placeholder="Describe the reason for the visit"
              className="w-full px-3 py-2.5 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
            />
          </div>

          <div className="p-3 rounded-xl bg-[#FDF8EF] border border-[#F4B83F]/50 text-[#294B57]">
            Submitting a request does not confirm the
            appointment. Confirmation requires health worker
            approval.
          </div>

          <div className="flex justify-end gap-2 pt-2">

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-white border border-[#D8E6DA] text-[#103342] font-semibold cursor-pointer disabled:opacity-50"
            >
              Close
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#007F68] text-white font-semibold hover:bg-[#005F52] cursor-pointer disabled:opacity-50"
            >
              {isSubmitting
                ? 'Saving Request...'
                : 'Submit Visit Request'}
            </button>

          </div>
        </form>

      </Modal>

    </div>
  );
}
