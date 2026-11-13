
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useHealthData } from '../../contexts/HealthDataContext';
import { Card } from '../../components/common/Card';

import {
  Users,
  Syringe,
  CalendarCheck,
  ChevronRight,
  ShieldAlert,
  Search,
  ArrowRight,
  ClipboardCheck,
  AlertCircle,
  Clock,
  FileText,
  LoaderCircle,
} from 'lucide-react';

function showValue(value, fallback = 'Not recorded') {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  return String(value);
}

function getChildAgeMonths(dateOfBirth) {
  if (!dateOfBirth) return null;

  const dob = new Date(`${String(dateOfBirth).slice(0, 10)}T00:00:00`);
  const today = new Date();

  if (Number.isNaN(dob.getTime()) || dob > today) {
    return null;
  }

  let months =
    (today.getFullYear() - dob.getFullYear()) * 12 +
    today.getMonth() -
    dob.getMonth();

  if (today.getDate() < dob.getDate()) {
    months -= 1;
  }

  return Math.max(0, months);
}

export function WorkerDashboardOverview() {
  const { user } = useAuth();

  const {
    childrenList = [],
    appointments = [],
    childrenLoading = false,
    childrenError = null,
  } = useHealthData();

  const [searchTerm, setSearchTerm] = useState('');

  // Only worker accounts should view this dashboard.
  if (!user || user.role !== 'worker') {
    return (
      <div className="p-8 text-center text-[#294B57]">
        <ShieldAlert className="w-10 h-10 mx-auto mb-3 text-[#B87D14]" />
        <h2 className="font-bold text-[#103342]">
          Worker Access Required
        </h2>
        <p className="text-xs mt-2">
          Please sign in using an authorized health worker account.
        </p>
      </div>
    );
  }

  // Children returned by the worker-specific FastAPI endpoint.
  const assignedChildren = childrenList;

  const assignedChildIds = new Set(
    assignedChildren.map((child) => String(child.id))
  );

  // Only appointments linked to the worker's assigned children.
  const assignedAppointments = appointments.filter((appointment) =>
    assignedChildIds.has(String(appointment.childId))
  );

  const pendingAppointments = assignedAppointments.filter(
    (appointment) => appointment.status === 'requested'
  );

  const approvedAppointments = assignedAppointments.filter(
    (appointment) =>
      appointment.status === 'approved' ||
      appointment.status === 'confirmed'
  );

  const totalChildren = assignedChildren.length;

  const totalVaccinationRecords = assignedChildren.reduce(
    (total, child) => total + (child.doses?.length || 0),
    0
  );

  const administeredVaccinationRecords = assignedChildren.reduce(
    (total, child) =>
      total +
      (child.doses?.filter(
        (dose) => dose.status === 'administered'
      ).length || 0),
    0
  );

  const filteredWorklist = assignedChildren.filter((child) => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return true;

    return [
      child.name,
      child.id,
      child.village,
      child.caregiverName,
    ].some((field) =>
      String(field ?? '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-[#294B57]">

      {/* WELCOME BANNER */}
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#F5F1E9] via-[#EBF4EE] to-[#E5F2E9] border border-[#D8E6DA] p-6 sm:p-7 shadow-sm">

        <svg
          className="absolute right-0 top-0 w-72 h-full pointer-events-none opacity-20"
          viewBox="0 0 280 160"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            d="M40 160 Q 140 60, 280 120 L 280 160 Z"
            fill="#007F68"
          />
          <circle cx="210" cy="50" r="28" fill="#F4B83F" />
        </svg>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">

          <div className="space-y-2">

            <span className="px-3 py-1 rounded-full bg-white/90 text-[10px] font-bold uppercase tracking-wider text-[#007F68] border border-[#D8E6DA]">
              Frontline Fieldwork Portal
            </span>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#103342] font-serif">
              Health Worker Overview
            </h1>

            <p className="text-sm text-[#294B57]">
              Welcome, <strong>{showValue(user.name, 'Health Worker')}</strong>
            </p>

            <p className="text-xs text-[#294B57]">
              Manage your assigned children and view recorded
              health activity.
            </p>

          </div>

          <Link
            to="/worker/registry"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#007F68] hover:bg-[#005F52] text-white font-semibold text-xs shadow-sm"
          >
            <Users className="w-4 h-4" />
            Assigned Children
            <ArrowRight className="w-4 h-4" />
          </Link>

        </div>
      </div>

      {/* LOADING / ERROR */}
      {childrenLoading && (
        <div className="p-4 bg-[#FBF8F2] border border-[#D8E6DA] rounded-xl flex items-center gap-3 text-xs">
          <LoaderCircle className="w-4 h-4 animate-spin text-[#007F68]" />
          Loading assigned children from FastAPI...
        </div>
      )}

      {childrenError && (
        <div
          role="alert"
          className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3 text-xs"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          Unable to load worker data: {childrenError}
        </div>
      )}

      {/* DASHBOARD SUMMARY */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <Link
          to="/worker/registry"
          className="p-4 rounded-2xl bg-[#FBF8F2] border border-[#D8E6DA] hover:border-[#007F68]"
        >
          <Users className="w-5 h-5 text-[#007F68] mb-2" />

          <span className="text-[11px] font-medium block">
            Assigned Children
          </span>

          <div className="text-2xl font-bold text-[#103342] mt-1">
            {childrenLoading ? '...' : totalChildren}
          </div>

          <p className="text-[10px] text-[#294B57]/70 mt-1">
            From worker-assigned records
          </p>
        </Link>

        <Link
          to="/worker/vaccinations"
          className="p-4 rounded-2xl bg-[#FBF8F2] border border-[#D8E6DA] hover:border-[#007F68]"
        >
          <Syringe className="w-5 h-5 text-[#007F68] mb-2" />

          <span className="text-[11px] font-medium block">
            Vaccination Records
          </span>

          <div className="text-2xl font-bold text-[#103342] mt-1">
            {childrenLoading ? '...' : totalVaccinationRecords}
          </div>

          <p className="text-[10px] text-[#294B57]/70 mt-1">
            {administeredVaccinationRecords} marked administered
          </p>
        </Link>

        <Link
          to="/worker/appointments"
          className="p-4 rounded-2xl bg-[#FBF8F2] border border-[#D8E6DA] hover:border-[#007F68]"
        >
          <Clock className="w-5 h-5 text-[#B87D14] mb-2" />

          <span className="text-[11px] font-medium block">
            Pending Visit Requests
          </span>

          <div className="text-2xl font-bold text-[#B87D14] mt-1">
            {childrenLoading ? '...' : pendingAppointments.length}
          </div>

          <p className="text-[10px] text-[#294B57]/70 mt-1">
            For assigned children
          </p>
        </Link>

        <Link
          to="/worker/appointments"
          className="p-4 rounded-2xl bg-[#FBF8F2] border border-[#D8E6DA] hover:border-[#007F68]"
        >
          <CalendarCheck className="w-5 h-5 text-[#007F68] mb-2" />

          <span className="text-[11px] font-medium block">
            Approved Visits
          </span>

          <div className="text-2xl font-bold text-[#007F68] mt-1">
            {childrenLoading ? '...' : approvedAppointments.length}
          </div>

          <p className="text-[10px] text-[#294B57]/70 mt-1">
            Worker-reviewed appointments
          </p>
        </Link>

      </div>

      {/* DEVELOPMENT NOTICE */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-[#FDF8EF] border border-[#F4B83F]/50 text-xs">

        <AlertCircle className="w-5 h-5 text-[#B87D14] shrink-0" />

        <div>
          <strong className="block text-[#103342] mb-1">
            Vaccination Schedule Not Verified
          </strong>

          <p className="text-[#294B57]">
            Counts describe stored vaccination records only.
            They do not establish full immunisation coverage
            or determine which children need catch-up doses.
            Appointment counts reflect records available in
            the current worker session.
          </p>
        </div>
      </div>

      {/* WORKLIST AND QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* CHILD WORKLIST */}
        <div className="lg:col-span-8">

          <Card className="bg-[#FBF8F2] border-[#D8E6DA] overflow-hidden">

            <div className="p-4 border-b border-[#D8E6DA] flex flex-col sm:flex-row sm:items-center justify-between gap-3">

              <div>
                <h2 className="font-bold text-sm text-[#103342] font-serif">
                  Assigned Child Records
                </h2>

                <p className="text-xs text-[#294B57] mt-1">
                  Children retrieved from the worker backend.
                </p>
              </div>

              <div className="relative w-full sm:w-60">

                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                  placeholder="Search child name or ID..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-xs text-[#103342] focus:outline-none focus:ring-2 focus:ring-[#007F68]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">

              <table className="w-full text-xs text-left">

                <thead className="bg-[#F0EBE1] border-b border-[#D8E6DA] text-[#294B57] uppercase">
                  <tr>
                    <th className="py-3 px-4">Child</th>
                    <th className="py-3 px-3">Age</th>
                    <th className="py-3 px-3">Recorded Doses</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#D8E6DA]/70">

                  {filteredWorklist.map((child) => {

                    const age = getChildAgeMonths(
                      child.dob || child.date_of_birth
                    );

                    const doses = child.doses || [];
                    const administered = doses.filter(
                      (dose) => dose.status === 'administered'
                    ).length;

                    return (
                      <tr
                        key={child.id}
                        className="hover:bg-[#F0EBE1]/40"
                      >

                        <td className="py-3 px-4">

                          <Link
                            to={`/worker/children/${child.id}`}
                            className="font-bold text-[#103342] hover:text-[#007F68] block"
                          >
                            {child.name}
                          </Link>

                          <span className="text-[10px] text-[#294B57]/70 font-mono">
                            ID: {child.id}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          {age === null
                            ? 'Not available'
                            : `${age} months`}
                        </td>

                        <td className="py-3 px-3">
                          <strong className="text-[#007F68]">
                            {administered}
                          </strong>
                          {' / '}
                          {doses.length} records
                        </td>

                        <td className="py-3 px-3">
                          <span className="inline-flex px-2.5 py-1 rounded-full bg-[#F0EBE1] text-[#294B57] text-[10px] font-semibold">
                            Schedule Unverified
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">

                          <Link
                            to={`/worker/children/${child.id}`}
                            className="text-[#007F68] font-bold hover:underline inline-flex items-center gap-1"
                          >
                            Review
                            <ChevronRight className="w-4 h-4" />
                          </Link>

                        </td>
                      </tr>
                    );
                  })}

                </tbody>

              </table>

            </div>

            {!childrenLoading &&
              !childrenError &&
              filteredWorklist.length === 0 && (
                <div className="p-8 text-center text-xs text-[#294B57]">
                  {searchTerm
                    ? 'No children match your search.'
                    : 'No children are assigned to this worker.'}
                </div>
              )}

            <div className="p-3 bg-[#F0EBE1]/60 border-t border-[#D8E6DA] text-center">

              <Link
                to="/worker/registry"
                className="text-xs font-semibold text-[#007F68] hover:underline"
              >
                View Full Child Registry
              </Link>

            </div>
          </Card>

        </div>

        {/* RIGHT PANEL */}
        <div className="lg:col-span-4 space-y-4">

          <Card className="p-5 bg-[#FBF8F2] border border-[#D8E6DA]">

            <h2 className="font-bold text-sm text-[#103342] font-serif mb-4">
              Frontline Field Actions
            </h2>

            <div className="space-y-3 text-xs">

              <Link
                to="/worker/vaccinations"
                className="p-3 rounded-xl bg-white border border-[#D8E6DA] hover:border-[#007F68] flex items-center gap-3"
              >
                <Syringe className="w-5 h-5 text-[#007F68]" />

                <div>
                  <strong className="block text-[#103342]">
                    Vaccination Management
                  </strong>

                  <span className="text-[11px] text-[#294B57]">
                    View recorded vaccine information
                  </span>
                </div>
              </Link>

              <Link
                to="/worker/appointments"
                className="p-3 rounded-xl bg-white border border-[#D8E6DA] hover:border-[#007F68] flex items-center gap-3"
              >
                <CalendarCheck className="w-5 h-5 text-[#007F68]" />

                <div>
                  <strong className="block text-[#103342]">
                    Appointment Requests
                  </strong>

                  <span className="text-[11px] text-[#294B57]">
                    Review parent visit requests
                  </span>
                </div>
              </Link>

              <Link
                to="/worker/priority"
                className="p-3 rounded-xl bg-white border border-[#D8E6DA] hover:border-[#007F68] flex items-center gap-3"
              >
                <ClipboardCheck className="w-5 h-5 text-[#007F68]" />

                <div>
                  <strong className="block text-[#103342]">
                    Priority Follow-ups
                  </strong>

                  <span className="text-[11px] text-[#294B57]">
                    View follow-up records
                  </span>
                </div>
              </Link>

              <Link
                to="/worker/registry"
                className="p-3 rounded-xl bg-white border border-[#D8E6DA] hover:border-[#007F68] flex items-center gap-3"
              >
                <FileText className="w-5 h-5 text-[#007F68]" />

                <div>
                  <strong className="block text-[#103342]">
                    Assigned Child Registry
                  </strong>

                  <span className="text-[11px] text-[#294B57]">
                    Open child profiles
                  </span>
                </div>
              </Link>

            </div>
          </Card>

          {/* PENDING APPOINTMENT PREVIEW */}
          <Card className="p-5 bg-[#FBF8F2] border border-[#D8E6DA]">

            <div className="flex items-center justify-between mb-3">

              <h2 className="font-bold text-sm text-[#103342] font-serif">
                Pending Visit Requests
              </h2>

              <Link
                to="/worker/appointments"
                className="text-xs text-[#007F68] font-semibold hover:underline"
              >
                View All
              </Link>
            </div>

            {pendingAppointments.length === 0 ? (
              <p className="text-xs text-[#294B57]">
                No pending requests are currently loaded
                for your assigned children.
              </p>
            ) : (
              <div className="space-y-3">

                {pendingAppointments.slice(0, 3).map(
                  (appointment) => {

                    const child = assignedChildren.find(
                      (item) =>
                        String(item.id) ===
                        String(appointment.childId)
                    );

                    return (
                      <div
                        key={appointment.id}
                        className="p-3 rounded-xl bg-white border border-[#D8E6DA] space-y-1"
                      >
                        <p className="font-bold text-xs text-[#103342]">
                          {showValue(
                            appointment.purpose ||
                            appointment.reason,
                            'Health Visit'
                          )}
                        </p>

                        <p className="text-[11px] text-[#294B57]">
                          Child: {child?.name || 'Assigned Child'}
                        </p>

                        <p className="text-[11px] text-[#294B57]">
                          Date: {showValue(appointment.requestedDate)}
                        </p>

                        <span className="text-[10px] text-[#B87D14] font-semibold">
                          Pending Worker Review
                        </span>
                      </div>
                    );
                  }
                )}

              </div>
            )}

          </Card>
        </div>
      </div>

      <p className="text-[11px] text-[#294B57]/70">
        NavJyoti development prototype. Use fictional records
        for hackathon demonstrations.
      </p>

    </div>
  );
}
