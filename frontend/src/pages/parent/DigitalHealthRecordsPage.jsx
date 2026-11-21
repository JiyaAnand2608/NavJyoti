import React, { useState } from 'react';
import { useHealthData } from '../../contexts/HealthDataContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';

import {
  Download,
  Printer,
  CheckCircle2,
  Activity,
  Calendar,
  Info,
  ShieldCheck,
  Syringe,
  Sparkles,
  ClipboardList,
  Clock,
  AlertTriangle,
  QrCode,
  UserCheck
} from 'lucide-react';

// Calculate completed months at the time of measurement
function calculateAgeMonths(dateOfBirth, measurementDate) {
  if (!dateOfBirth || !measurementDate) return null;

  const dob = new Date(`${dateOfBirth.slice(0, 10)}T00:00:00`);
  const measured = new Date(`${measurementDate.slice(0, 10)}T00:00:00`);

  if (
    Number.isNaN(dob.getTime()) ||
    Number.isNaN(measured.getTime()) ||
    measured < dob
  ) {
    return null;
  }

  let months =
    (measured.getFullYear() - dob.getFullYear()) * 12 +
    measured.getMonth() -
    dob.getMonth();

  if (measured.getDate() < dob.getDate()) {
    months -= 1;
  }

  return Math.max(0, months);
}

// Display missing values without inventing data
function displayValue(value, suffix = '') {
  if (value === null || value === undefined || value === '') {
    return 'Not recorded';
  }
  return `${value}${suffix}`;
}

export function DigitalHealthRecordsPage() {
  const {
    activeChild,
    appointments = [],
    childrenLoading,
    childrenError,
  } = useHealthData();

  const [activeTab, setActiveTab] = useState('pass'); // 'pass' | 'vaccinations' | 'growth' | 'milestones' | 'appointments' | 'followups'
  const [downloadNotice, setDownloadNotice] = useState(false);

  if (childrenLoading) {
    return (
      <div className="p-12 text-center text-[#294B57]">
        Loading verified health records...
      </div>
    );
  }

  if (childrenError) {
    return (
      <div className="p-8 text-center text-red-700 bg-red-50 rounded-2xl border border-red-200 max-w-lg mx-auto">
        Unable to load health records: {childrenError}
      </div>
    );
  }

  if (!activeChild) {
    return (
      <div className="p-12 text-center text-[#294B57] bg-[#FBF8F2] rounded-2xl border border-[#D8E6DA] max-w-lg mx-auto">
        Please select a child to view health records.
      </div>
    );
  }

  const growthRecords = activeChild.growthRecords || [];
  const doses = activeChild.doses || [];
  const milestones = activeChild.milestones || [];
  const visitHistory = activeChild.visitHistory || [];
  const childAppointments = appointments.filter(
    (a) => String(a.childId) === String(activeChild.id)
  );

  const administeredDoses = doses.filter(
    (dose) => dose.status === 'administered' || Boolean(dose.dateAdministered)
  );

  const childDob =
    activeChild.dob ||
    activeChild.date_of_birth ||
    null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const growthSummary = growthRecords.length
      ? growthRecords.map((g) => {
          const age = calculateAgeMonths(childDob, g.date);
          return [
            `Date: ${displayValue(g.date)}`,
            `Age: ${age === null ? 'Not available' : `${age} months`}`,
            `Weight: ${displayValue(g.weightKg, ' kg')}`,
            `Height: ${displayValue(g.heightCm, ' cm')}`,
            `Head circ: ${displayValue(g.headCircumferenceCm, ' cm')}`,
            `Recorded By: ${displayValue(g.recordedBy)}`,
          ].join(' | ');
        }).join('\n')
      : 'No growth records available';

    const vaccineSummary = doses.length
      ? doses.map((d) => (
          `- ${displayValue(d.vaccineName || d.name)}: ` +
          `${d.status === 'administered' || d.dateAdministered ? 'Administered' : 'Scheduled'} ` +
          `(Due: ${displayValue(d.dueDate)} | Given: ${displayValue(d.dateAdministered)} | Batch: ${displayValue(d.batch)})`
        )).join('\n')
      : 'No vaccination records available';

    const milestoneSummary = milestones.length
      ? milestones.map((m) => (
          `- [${displayValue(m.domain)}] ${displayValue(m.title || m.description)} ` +
          `(Observed: ${displayValue(m.observedDate)} | Status: ${displayValue(m.status)})`
        )).join('\n')
      : 'No developmental milestone records available';

    const appointmentSummary = childAppointments.length
      ? childAppointments.map((a) => (
          `- Date: ${displayValue(a.requestedDate || a.appointment_date)} | Purpose: ${displayValue(a.purpose || a.reason)} | Status: ${displayValue(a.status)}`
        )).join('\n')
      : 'No appointments recorded';

    const followUpSummary = activeChild.followUpNotes
      ? activeChild.followUpNotes
      : 'No field follow-up notes recorded.';

    const summary = `NAVJYOTI - DIGITAL HEALTH RECORD EXPORT
============================================================
Official Child Health Record Summary from NavJyoti
Jurisdiction: ${displayValue(activeChild.village)} (${displayValue(activeChild.subCentre)})
Generated: ${new Date().toISOString()}

1. CHILD DEMOGRAPHIC INFORMATION
------------------------------------------------------------
Child Name: ${activeChild.name}
Unique ID: ${activeChild.id}
Date of Birth: ${displayValue(childDob)}
Gender: ${displayValue(activeChild.gender)}
Blood Group: ${displayValue(activeChild.bloodGroup)}
Caregiver Name: ${displayValue(activeChild.caregiverName)}
Caregiver Phone: ${displayValue(activeChild.caregiverPhone)}
Migration Status: ${displayValue(activeChild.migrationStatus)}

2. VACCINATION HISTORY (${administeredDoses.length} Administered of ${doses.length} Stored)
------------------------------------------------------------
${vaccineSummary}

3. PHYSICAL GROWTH MEASUREMENTS (${growthRecords.length} Entries)
------------------------------------------------------------
${growthSummary}

4. DEVELOPMENTAL MILESTONES (${milestones.length} Recorded)
------------------------------------------------------------
${milestoneSummary}

5. APPOINTMENTS & CLINICAL VISITS (${childAppointments.length} Entries)
------------------------------------------------------------
${appointmentSummary}

6. FIELD OUTREACH & FOLLOW-UP NOTES
------------------------------------------------------------
${followUpSummary}

============================================================
Confidential Patient Health Record. Kept in compliance with
state immunization standards.
`;

    const blob = new Blob([summary], {
      type: 'text/plain;charset=utf-8',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `navjyoti_health_record_${activeChild.id}.txt`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
    setDownloadNotice(true);
    setTimeout(() => setDownloadNotice(false), 5000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-[#294B57]">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#103342] font-serif">
            Digital Health Records
          </h1>
          <p className="text-xs text-[#294B57] mt-0.5">
            Comprehensive digital records for {activeChild.name} (ID: {activeChild.id})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FBF8F2] border border-[#D8E6DA] text-xs font-semibold text-[#103342] hover:bg-white cursor-pointer shadow-2xs transition-colors"
          >
            <Download className="w-4 h-4 text-[#007F68]" />
            Download Summary (.txt)
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#007F68] text-white text-xs font-semibold hover:bg-[#005F52] cursor-pointer shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print Pass
          </button>
        </div>
      </div>

      {downloadNotice && (
        <div className="p-3.5 rounded-xl bg-[#DDF0E3] border border-[#A8D5B5] text-xs text-[#005F52] font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#007F68]" />
          <span>Complete health record summary exported successfully.</span>
        </div>
      )}

      {/* NAVIGATION TABS - 6 READABLE SECTIONS */}
      <div className="flex items-center gap-2 border-b border-[#D8E6DA] text-xs font-semibold overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('pass')}
          className={`py-3 px-4 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === 'pass'
              ? 'border-[#007F68] text-[#007F68]'
              : 'border-transparent text-[#294B57] hover:text-[#103342]'
          }`}
        >
          Digital Child Pass
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('vaccinations')}
          className={`py-3 px-4 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === 'vaccinations'
              ? 'border-[#007F68] text-[#007F68]'
              : 'border-transparent text-[#294B57] hover:text-[#103342]'
          }`}
        >
          Vaccination History ({doses.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('growth')}
          className={`py-3 px-4 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === 'growth'
              ? 'border-[#007F68] text-[#007F68]'
              : 'border-transparent text-[#294B57] hover:text-[#103342]'
          }`}
        >
          Growth Monitoring ({growthRecords.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('milestones')}
          className={`py-3 px-4 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === 'milestones'
              ? 'border-[#007F68] text-[#007F68]'
              : 'border-transparent text-[#294B57] hover:text-[#103342]'
          }`}
        >
          Milestones ({milestones.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('appointments')}
          className={`py-3 px-4 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === 'appointments'
              ? 'border-[#007F68] text-[#007F68]'
              : 'border-transparent text-[#294B57] hover:text-[#103342]'
          }`}
        >
          Appointments & Visits ({childAppointments.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('followups')}
          className={`py-3 px-4 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === 'followups'
              ? 'border-[#007F68] text-[#007F68]'
              : 'border-transparent text-[#294B57] hover:text-[#103342]'
          }`}
        >
          Follow-ups & Notes
        </button>
      </div>

      {/* SECTION 1: DIGITAL PASS TAB */}
      {activeTab === 'pass' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-7">
            <Card className="p-6 bg-[#FBF8F2] border-2 border-[#D8E6DA] space-y-4">
              <div className="flex items-center justify-between border-b border-[#D8E6DA] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#DDF0E3] text-[#007F68] flex items-center justify-center font-bold text-xl">
                    {activeChild.name[0]}
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-[#103342] font-serif">
                      NavJyoti Digital Child Pass
                    </h2>
                    <p className="text-[10px] font-semibold text-[#007F68]">
                      Universal Immunization Verification
                    </p>
                  </div>
                </div>

                <Badge variant="upToDate">Verified Profile</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-white p-4 rounded-xl border border-[#D8E6DA]">
                <div>
                  <p className="text-[#294B57]/70">Child Full Name</p>
                  <p className="font-bold text-[#103342] text-sm">{activeChild.name}</p>
                </div>

                <div>
                  <p className="text-[#294B57]/70">Unique Child ID</p>
                  <p className="font-mono font-bold text-[#007F68]">{activeChild.id}</p>
                </div>

                <div>
                  <p className="text-[#294B57]/70">Date of Birth</p>
                  <p className="font-semibold">{displayValue(childDob)}</p>
                </div>

                <div>
                  <p className="text-[#294B57]/70">Gender & Blood Group</p>
                  <p className="font-semibold">
                    {displayValue(activeChild.gender)} • {displayValue(activeChild.bloodGroup)}
                  </p>
                </div>

                <div>
                  <p className="text-[#294B57]/70">Caregiver</p>
                  <p className="font-semibold">{displayValue(activeChild.caregiverName)}</p>
                </div>

                <div>
                  <p className="text-[#294B57]/70">Caregiver Phone</p>
                  <p className="font-semibold font-mono">{displayValue(activeChild.caregiverPhone)}</p>
                </div>

                <div>
                  <p className="text-[#294B57]/70">Assigned Village</p>
                  <p className="font-semibold">{displayValue(activeChild.village)}</p>
                </div>

                <div>
                  <p className="text-[#294B57]/70">Sub-Centre / PHC</p>
                  <p className="font-semibold">{displayValue(activeChild.subCentre)}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#DDF0E3] border border-[#A8D5B5]">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-4 h-4 text-[#007F68]" />
                  <h3 className="font-bold text-xs text-[#103342]">
                    Immunization Status Summary
                  </h3>
                </div>
                <p className="text-xs text-[#294B57]">
                  {administeredDoses.length} of {doses.length} stored doses recorded as administered.
                </p>
              </div>
            </Card>
          </div>

          <div className="md:col-span-5">
            <Card className="p-6 bg-[#FBF8F2] border border-[#D8E6DA] h-full flex flex-col items-center justify-center text-center gap-3">
              <QrCode className="w-12 h-12 text-[#007F68]" />
              <h3 className="font-bold text-base text-[#103342] font-serif">
                Secure QR Health Pass
              </h3>
              <p className="text-xs text-[#294B57] leading-relaxed max-w-xs">
                Frontline ANMs can scan this pass across facilities to retrieve immunization history without exposing sensitive personal data in the QR URL.
              </p>
              <div className="p-2.5 bg-white rounded-xl border border-[#D8E6DA] text-[11px] font-mono text-[#007F68]">
                Token Ref: {activeChild.qrToken || `tok_nj_${activeChild.id}`}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* SECTION 2: VACCINATION HISTORY TAB */}
      {activeTab === 'vaccinations' && (
        <Card className="p-5 bg-[#FBF8F2] border-[#D8E6DA]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-bold text-sm text-[#103342] font-serif">
                Complete Vaccination History
              </h3>
              <p className="text-xs text-[#294B57]">
                Official immunizations recorded in the NavJyoti state registry
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="px-2.5 py-1 rounded-full bg-[#DDF0E3] text-[#007F68]">
                {administeredDoses.length} Administered
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[#FDF8EF] text-[#B87D14]">
                {doses.length - administeredDoses.length} Pending
              </span>
            </div>
          </div>

          {doses.length === 0 ? (
            <div className="p-10 text-center text-xs text-[#294B57]">
              No vaccination records on file for this child.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F0EBE1] border-b border-[#D8E6DA] text-[#294B57] uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Vaccine Name</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3">Administered Date</th>
                    <th className="py-2.5 px-3">Batch Number</th>
                    <th className="py-2.5 px-3">Facility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8E6DA]/70 text-[#294B57]">
                  {doses.map((dose) => {
                    const isDone = dose.status === 'administered' || Boolean(dose.dateAdministered);
                    return (
                      <tr key={dose.id} className="hover:bg-white/60">
                        <td className="py-3 px-3 font-bold text-[#103342]">
                          {displayValue(dose.vaccineName || dose.name)}
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant={isDone ? 'upToDate' : 'dueSoon'}>
                            {isDone ? 'Administered' : 'Scheduled Due'}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 font-mono">{displayValue(dose.dueDate)}</td>
                        <td className="py-3 px-3 font-mono text-[#007F68] font-semibold">
                          {displayValue(dose.dateAdministered, 'Pending')}
                        </td>
                        <td className="py-3 px-3 font-mono">{displayValue(dose.batch)}</td>
                        <td className="py-3 px-3">{displayValue(dose.facility)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* SECTION 3: GROWTH MONITORING TAB */}
      {activeTab === 'growth' && (
        <Card className="p-5 bg-[#FBF8F2] border-[#D8E6DA]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-bold text-sm text-[#103342] font-serif">
                Physical Growth & Anthropometric Monitoring
              </h3>
              <p className="text-xs text-[#294B57]">
                Measurements recorded at Village Health & Nutrition Days (VHND)
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DDF0E3] text-[#007F68] text-xs font-semibold">
              <Activity className="w-4 h-4" />
              <span>{growthRecords.length} Recorded Entries</span>
            </div>
          </div>

          {growthRecords.length === 0 ? (
            <div className="p-10 text-center text-xs text-[#294B57]">
              No growth measurements recorded yet for this child.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F0EBE1] border-b border-[#D8E6DA] text-[#294B57] uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Age (Calculated)</th>
                    <th className="py-2.5 px-3">Weight</th>
                    <th className="py-2.5 px-3">Height</th>
                    <th className="py-2.5 px-3">Head Circ.</th>
                    <th className="py-2.5 px-3">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8E6DA]/70 text-[#294B57]">
                  {growthRecords.map((g, index) => {
                    const calculatedMonths = calculateAgeMonths(childDob, g.date);
                    return (
                      <tr key={g.id ?? index} className="hover:bg-white/60">
                        <td className="py-3 px-3 font-mono font-semibold text-[#103342]">
                          {displayValue(g.date)}
                        </td>
                        <td className="py-3 px-3">
                          {calculatedMonths === null ? 'Not available' : `${calculatedMonths} months`}
                        </td>
                        <td className="py-3 px-3 font-bold text-[#007F68]">
                          {displayValue(g.weightKg, ' kg')}
                        </td>
                        <td className="py-3 px-3">{displayValue(g.heightCm, ' cm')}</td>
                        <td className="py-3 px-3">{displayValue(g.headCircumferenceCm, ' cm')}</td>
                        <td className="py-3 px-3">{displayValue(g.recordedBy)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* SECTION 4: DEVELOPMENTAL MILESTONES TAB */}
      {activeTab === 'milestones' && (
        <Card className="p-5 bg-[#FBF8F2] border-[#D8E6DA] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-[#103342] font-serif">
                Developmental Milestones & Checkpoints
              </h3>
              <p className="text-xs text-[#294B57]">
                Early childhood cognitive, motor, social, and language indicators
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DDF0E3] text-[#007F68] text-xs font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>{milestones.length} Observations</span>
            </div>
          </div>

          {milestones.length === 0 ? (
            <div className="p-10 text-center text-xs text-[#294B57]">
              No developmental milestone observations recorded yet for this child.
            </div>
          ) : (
            <div className="divide-y divide-[#D8E6DA]/70 text-xs">
              {milestones.map((m) => (
                <div key={m.id} className="py-3.5 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#DDF0E3] text-[#007F68] flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#103342]">
                          {m.title || m.description || 'Milestone Achievement'}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-[#007F68] bg-[#DDF0E3] px-2 py-0.5 rounded-full">
                          {m.domain || 'General'}
                        </span>
                      </div>
                      {m.notes && <p className="text-[#294B57] mt-1">{m.notes}</p>}
                      <p className="text-[11px] text-[#294B57]/70 font-mono mt-1">
                        Observed Date: {displayValue(m.observedDate)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="upToDate">{displayValue(m.status, 'Achieved')}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* SECTION 5: APPOINTMENTS & VISITS TAB */}
      {activeTab === 'appointments' && (
        <Card className="p-5 bg-[#FBF8F2] border-[#D8E6DA] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-[#103342] font-serif">
                Scheduled Appointments & Clinical Visits
              </h3>
              <p className="text-xs text-[#294B57]">
                Routine immunisation sessions, clinical visits, and caregiver appointments
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DDF0E3] text-[#007F68] text-xs font-semibold">
              <Calendar className="w-4 h-4" />
              <span>{childAppointments.length} Appointments</span>
            </div>
          </div>

          {childAppointments.length === 0 ? (
            <div className="p-10 text-center text-xs text-[#294B57]">
              No upcoming or historical appointments on record for this child.
            </div>
          ) : (
            <div className="space-y-3">
              {childAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-4 rounded-xl bg-white border border-[#D8E6DA] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-[#007F68] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-[#103342]">
                        {displayValue(apt.purpose || apt.reason)}
                      </h4>
                      <p className="text-[#294B57] mt-0.5">
                        Date: <strong>{displayValue(apt.requestedDate || apt.appointment_date)}</strong>{' '}
                        {apt.timeSlot && `• Time: ${apt.timeSlot}`}
                      </p>
                      <p className="text-[11px] text-[#294B57]/70 mt-0.5">
                        Facility: {displayValue(apt.facility || 'Sub-Centre')}
                      </p>
                    </div>
                  </div>
                  <Badge variant={apt.status === 'confirmed' ? 'upToDate' : 'dueSoon'}>
                    {displayValue(apt.status)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* SECTION 6: FOLLOW-UPS & FIELD NOTES TAB */}
      {activeTab === 'followups' && (
        <Card className="p-5 bg-[#FBF8F2] border-[#D8E6DA] space-y-4">
          <div>
            <h3 className="font-bold text-sm text-[#103342] font-serif">
              Field Follow-ups & ANM Outreach Observations
            </h3>
            <p className="text-xs text-[#294B57]">
              Observations recorded by assigned frontline healthcare workers during home visits
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#D8E6DA] text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#103342]">Follow-up Urgency Priority:</span>
              <Badge
                variant={
                  activeChild.priorityLevel === 'red'
                    ? 'overdue'
                    : activeChild.priorityLevel === 'amber'
                    ? 'dueSoon'
                    : 'upToDate'
                }
              >
                {activeChild.priorityLevel ? activeChild.priorityLevel.toUpperCase() : 'GREEN (NORMAL)'}
              </Badge>
            </div>
            <div className="pt-2 border-t border-[#D8E6DA]/70">
              <span className="font-semibold text-[#103342] block mb-1">Latest Outreach Notes:</span>
              <p className="text-[#294B57] leading-relaxed italic bg-[#FBF8F2] p-3 rounded-lg border border-[#D8E6DA]">
                {activeChild.followUpNotes
                  ? activeChild.followUpNotes
                  : 'No follow-up notes currently on file for this child. Up-to-date tracking.'}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
