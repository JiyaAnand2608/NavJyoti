
import React, { useState } from 'react';
import { useHealthData } from '../../contexts/HealthDataContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

import {
  CalendarCheck,
  Check,
  X,
  Clock,
  CheckCircle2,
  RotateCw,
  AlertCircle,
} from 'lucide-react';

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getStatusLabel(status) {
  const labels = {
    requested: 'Pending Acceptance',
    approved: 'Approved',
    confirmed: 'Confirmed',
    completed: 'Completed',
    rejected: 'Rejected',
    declined: 'Declined',
    cancelled: 'Cancelled',
    rescheduled: 'Rescheduled',
  };

  return labels[status] || status || 'Unknown';
}

function getBadgeVariant(status) {
  if (status === 'approved' || status === 'confirmed') {
    return 'upToDate';
  }

  if (status === 'requested' || status === 'rescheduled') {
    return 'dueSoon';
  }

  if (status === 'completed') {
    return 'navy';
  }

  if (
    status === 'rejected' ||
    status === 'declined' ||
    status === 'cancelled'
  ) {
    return 'overdue';
  }

  return 'default';
}

export function WorkerAppointmentsPage() {
  const {
    appointments = [],
    childrenList = [],
    childrenLoading,
    childrenError,
    updateAppointmentStatus,
    rescheduleAppointment,
    refreshChildren,
  } = useHealthData();

  const [filterStatus, setFilterStatus] = useState('all');
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [selectedApt, setSelectedApt] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [savingId, setSavingId] = useState(null);

  const todayStr = getToday();

  const assignedChildIds = new Set(
    childrenList.map((child) => String(child.id))
  );

  const workerAppointments = appointments.filter((appointment) =>
    assignedChildIds.has(String(appointment.childId))
  );

  const getChildName = (childId) => {
    const child = childrenList.find(
      (item) => String(item.id) === String(childId)
    );

    return child?.name || `Child ID ${childId}`;
  };

  const filteredAppointments = workerAppointments.filter((appointment) => {
    const status = appointment.status;

    if (filterStatus === 'all') return true;

    if (filterStatus === 'pending') {
      return status === 'requested';
    }

    if (filterStatus === 'approved') {
      return status === 'approved' || status === 'confirmed';
    }

    if (filterStatus === 'history') {
      return [
        'completed',
        'rejected',
        'declined',
        'cancelled',
        'rescheduled',
      ].includes(status);
    }

    return true;
  });

  const handleUpdateStatus = async (
    appointment,
    newStatus
  ) => {
    setErrorMsg('');
    setSuccessMsg('');
    setSavingId(appointment.id);

    try {
      await updateAppointmentStatus(
        appointment.id,
        newStatus
      );

      setSuccessMsg(
        `Appointment for ${getChildName(
          appointment.childId
        )} updated to ${getStatusLabel(newStatus)}.`
      );

      // Reload the latest records from PostgreSQL.
      refreshChildren?.();

    } catch (error) {
      setErrorMsg(
        error.message || 'Failed to update appointment.'
      );
    } finally {
      setSavingId(null);
    }
  };

  const handleOpenReschedule = (appointment) => {
    setSelectedApt(appointment);
    setNewDate(appointment.requestedDate || todayStr);
    setErrorMsg('');
    setSuccessMsg('');
    setIsRescheduleOpen(true);
  };

  const handleSaveReschedule = async (event) => {
    event.preventDefault();

    if (!selectedApt) return;

    if (!newDate || newDate < getToday()) {
      setErrorMsg('Please select a valid future date.');
      return;
    }

    setSavingId(selectedApt.id);
    setErrorMsg('');

    try {
      await rescheduleAppointment(
        selectedApt.id,
        newDate
      );

      setIsRescheduleOpen(false);
      setSelectedApt(null);

      setSuccessMsg(
        `Appointment rescheduled to ${newDate}.`
      );

      refreshChildren?.();

    } catch (error) {
      setErrorMsg(
        error.message || 'Unable to reschedule.'
      );
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-[#294B57]">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

        <div>
          <h1 className="text-2xl font-bold text-[#103342] font-serif">
            Visit & Appointment Management
          </h1>

          <p className="text-xs text-[#294B57] mt-1">
            Review requests and update appointments
            for your assigned children.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refreshChildren?.()}
          disabled={childrenLoading || savingId !== null}
          className="px-4 py-2 rounded-xl border border-[#D8E6DA] bg-[#FBF8F2] text-xs font-semibold text-[#007F68] hover:bg-white disabled:opacity-50 cursor-pointer flex items-center gap-2"
        >
          <RotateCw className="w-4 h-4" />
          Refresh Records
        </button>

      </div>

      {/* LOADING */}
      {childrenLoading && (
        <div className="p-4 rounded-xl bg-[#FBF8F2] border border-[#D8E6DA] text-xs">
          Loading worker appointments...
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
                      Child: <strong className="text-[#103342]">{apt.childName}</strong> (ID: {apt.childId}) • Caregiver: {apt.caregiverName} (
                      <a
                        href={`tel:${apt.caregiverPhone?.replace(/\s+/g, '')}`}
                        className="underline hover:text-[#007F68]"
                        title="Call Caregiver"
                      >
                        {apt.caregiverPhone}
                      </a>
                      )
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

      </div>

      {/* APPOINTMENT LIST */}
      <div className="space-y-4">

        {!childrenLoading &&
        !childrenError &&
        filteredAppointments.length === 0 ? (

          <Card className="p-10 bg-[#FBF8F2] border-[#D8E6DA]">

            <div className="text-center">
              <CalendarCheck className="w-10 h-10 text-[#007F68] mx-auto mb-3" />

              <h3 className="font-bold text-[#103342]">
                No Appointments Found
              </h3>

              <p className="text-xs text-[#294B57] mt-2">
                No appointment records in this category
                for your assigned children.
              </p>
            </div>

          </Card>

        ) : (

          filteredAppointments.map((appointment) => {

            const isSaving =
              savingId === appointment.id;

            const approved =
              appointment.status === 'approved' ||
              appointment.status === 'confirmed';

            const canReview =
              appointment.status === 'requested';

            const canReschedule =
              canReview || approved;

            return (
              <Card
                key={appointment.id}
                className="p-5 bg-[#FBF8F2] border-[#D8E6DA]"
              >

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                  {/* APPOINTMENT DETAILS */}
                  <div className="flex items-start gap-3">

                    <div className="w-10 h-10 rounded-2xl bg-[#DDF0E3] text-[#007F68] flex items-center justify-center shrink-0">
                      <CalendarCheck className="w-5 h-5" />
                    </div>

                    <div className="space-y-2">

                      <h3 className="font-bold text-sm text-[#103342] font-serif">
                        {appointment.purpose ||
                          appointment.reason ||
                          'Health Visit'}
                      </h3>

                      <p className="text-xs text-[#294B57]">
                        Child:{' '}
                        <strong>
                          {getChildName(appointment.childId)}
                        </strong>
                      </p>

                      <p className="text-[11px] text-[#294B57] flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#007F68]" />

                        Requested Date:{' '}
                        {appointment.requestedDate || 'Not recorded'}
                      </p>

                      <p className="text-[11px] text-[#294B57]/70">
                        Appointment ID: {appointment.id}
                      </p>

                      <Badge
                        variant={getBadgeVariant(
                          appointment.status
                        )}
                      >
                        {getStatusLabel(
                          appointment.status
                        )}
                      </Badge>

                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="flex flex-wrap items-center gap-2">

                    {canReview && (
                      <>
                        <button
                          type="button"
                          disabled={savingId !== null}
                          onClick={() =>
                            handleUpdateStatus(
                              appointment,
                              'approved'
                            )
                          }
                          className="px-3 py-2 rounded-full bg-[#007F68] text-white font-semibold text-xs hover:bg-[#005F52] disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                        >
                          <Check className="w-4 h-4" />
                          {isSaving
                            ? 'Saving...'
                            : 'Approve Visit'}
                        </button>

                        <button
                          type="button"
                          disabled={savingId !== null}
                          onClick={() =>
                            handleUpdateStatus(
                              appointment,
                              'rejected'
                            )
                          }
                          className="px-3 py-2 rounded-full bg-red-50 text-red-700 font-semibold text-xs hover:bg-red-100 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                        >
                          <X className="w-4 h-4" />
                          Reject
                        </button>
                      </>
                    )}

                    {canReschedule && (
                      <button
                        type="button"
                        disabled={savingId !== null}
                        onClick={() =>
                          handleOpenReschedule(
                            appointment
                          )
                        }
                        className="px-3 py-2 rounded-full bg-white border border-[#D8E6DA] text-[#103342] font-semibold text-xs hover:bg-[#F0EBE1] disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                      >
                        <RotateCw className="w-4 h-4" />
                        Reschedule
                      </button>
                    )}

                    {approved && (
                      <button
                        type="button"
                        disabled={savingId !== null}
                        onClick={() =>
                          handleUpdateStatus(
                            appointment,
                            'completed'
                          )
                        }
                        className="px-3 py-2 rounded-full bg-[#103342] text-white font-semibold text-xs hover:bg-[#0b2631] disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Mark Completed
                      </button>
                    )}

                  </div>
                </div>
              </Card>
            );
          })

        )}

      </div>

      {/* RESCHEDULE MODAL */}
      {isRescheduleOpen && selectedApt && (

        <Modal
          isOpen={isRescheduleOpen}
          onClose={() => {
            if (savingId === null) {
              setIsRescheduleOpen(false);
            }
          }}
          title="Reschedule Health Visit"
          subtitle={`Appointment ID: ${selectedApt.id}`}
        >

          <form
            onSubmit={handleSaveReschedule}
            className="space-y-4 text-xs text-[#294B57]"
          >

            {errorMsg && (
              <div
                role="alert"
                className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                {errorMsg}
              </div>
            )}

            <div>
              <label
                htmlFor="new-appointment-date"
                className="block font-semibold text-[#103342] mb-1.5"
              >
                New Appointment Date
              </label>

              <input
                id="new-appointment-date"
                type="date"
                min={todayStr}
                required
                disabled={savingId !== null}
                value={newDate}
                onChange={(event) =>
                  setNewDate(event.target.value)
                }
                className="w-full px-3 py-2.5 rounded-xl border border-[#D8E6DA] bg-white text-[#103342]"
              />
            </div>

            <p className="p-3 rounded-xl bg-[#F0EBE1] text-xs text-[#294B57]">
              The backend stores the new appointment date.
              Visit time selection is not available yet.
            </p>

            <div className="flex justify-end gap-2">

              <button
                type="button"
                disabled={savingId !== null}
                onClick={() =>
                  setIsRescheduleOpen(false)
                }
                className="px-4 py-2 rounded-xl bg-white border border-[#D8E6DA] font-semibold disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={savingId !== null}
                className="px-4 py-2 rounded-xl bg-[#007F68] text-white font-semibold disabled:opacity-50 cursor-pointer"
              >
                {savingId !== null
                  ? 'Saving...'
                  : 'Confirm Reschedule'}
              </button>

            </div>

          </form>
        </Modal>

      )}

    </div>
  );
}
