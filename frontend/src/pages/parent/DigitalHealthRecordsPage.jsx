
import React, { useState } from 'react';
import { useHealthData } from '../../contexts/HealthDataContext';
import { Card } from '../../components/common/Card';

import {
  Download,
  Printer,
  CheckCircle2,
  Activity,
  Calendar,
  Info,
  ShieldCheck,
} from 'lucide-react';

// Calculate completed months at the time of measurement
function calculateAgeMonths(dateOfBirth, measurementDate) {
  if (!dateOfBirth || !measurementDate) return null;

  const dob = new Date(`${dateOfBirth.slice(0, 10)}T00:00:00`);
  const measured = new Date(
    `${measurementDate.slice(0, 10)}T00:00:00`
  );

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
    childrenLoading,
    childrenError,
  } = useHealthData();

  const [activeTab, setActiveTab] = useState('pass');
  const [downloadNotice, setDownloadNotice] = useState(false);

  if (childrenLoading) {
    return (
      <div className="p-8 text-center text-[#294B57]">
        Loading health records...
      </div>
    );
  }

  if (childrenError) {
    return (
      <div className="p-8 text-center text-red-700">
        Unable to load health records: {childrenError}
      </div>
    );
  }

  if (!activeChild) {
    return (
      <div className="p-8 text-center text-[#294B57]">
        Please select a child to view health records.
      </div>
    );
  }

  const growthRecords = activeChild.growthRecords || [];
  const doses = activeChild.doses || [];
  const visitHistory = activeChild.visitHistory || [];

  const administeredDoses = doses.filter(
    (dose) => dose.status === 'administered'
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
            `Age: ${age === null ? 'Not available' : `${age} months (calculated)`}`,
            `Weight: ${displayValue(g.weightKg, ' kg')}`,
            `Height: ${displayValue(g.heightCm, ' cm')}`,
            `Head circumference: ${displayValue(g.headCircumferenceCm, ' cm')}`,
          ].join(' | ');
        }).join('\n')
      : 'No growth records available';

    const vaccineSummary = doses.length
      ? doses.map((d) => (
          `${displayValue(d.vaccineName || d.name)}: ` +
          `${displayValue(d.status)} ` +
          `(${displayValue(d.dateAdministered)})`
        )).join('\n')
      : 'No vaccination records available';

    const summary = `NAVJYOTI - DEVELOPMENT HEALTH RECORD
----------------------------------------
This is a development prototype, not an official
or clinically verified health record.

CHILD INFORMATION
Name: ${activeChild.name}
Child ID: ${activeChild.id}
Date of Birth: ${displayValue(childDob)}
Gender: ${displayValue(activeChild.gender)}
Blood Group: ${displayValue(activeChild.bloodGroup)}
Caregiver: ${displayValue(activeChild.caregiverName)}

VACCINATION DATABASE RECORDS
${vaccineSummary}

The complete vaccination schedule has not
been verified.

GROWTH MEASUREMENTS
${growthSummary}

Generated for development testing only.
Keep this file private.
`;

    const blob = new Blob([summary], {
      type: 'text/plain;charset=utf-8',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download =
      `navjyoti_health_record_${activeChild.id}.txt`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    setDownloadNotice(true);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-[#294B57]">

      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

        <div>
          <h1 className="text-2xl font-bold text-[#103342] font-serif">
            Digital Child Health Pass
          </h1>

          <p className="text-xs text-[#294B57]">
            Development record for {activeChild.name}
            {' '}(ID: {activeChild.id})
          </p>
        </div>

        <div className="flex items-center gap-2">

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FBF8F2] border border-[#D8E6DA] text-xs font-semibold text-[#103342] hover:bg-white cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#007F68]" />
            Download Summary
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#007F68] text-white text-xs font-semibold hover:bg-[#005F52] cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Pass
          </button>

        </div>
      </div>

      {/* DEVELOPMENT NOTICE */}
      <div className="p-4 rounded-xl bg-[#FDF8EF] border border-[#F4B83F]/60 text-xs text-[#294B57] flex gap-3">
        <Info className="w-5 h-5 text-[#B87D14] shrink-0" />

        <p>
          This is a development prototype, not an official
          verified health card. Only use fictional test data
          for hackathon demonstrations. Downloaded or printed
          records must be kept private.
        </p>
      </div>

      {downloadNotice && (
        <div className="p-3 rounded-xl bg-[#DDF0E3] border border-[#A8D5B5] text-xs text-[#005F52] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Development record summary exported.
        </div>
      )}

      {/* NAVIGATION TABS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#D8E6DA] text-xs font-semibold">

        <button
          type="button"
          onClick={() => setActiveTab('pass')}
          className={`py-3 px-4 border-b-2 cursor-pointer ${
            activeTab === 'pass'
              ? 'border-[#007F68] text-[#007F68]'
              : 'border-transparent text-[#294B57]'
          }`}
        >
          Digital Pass
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('growth')}
          className={`py-3 px-4 border-b-2 cursor-pointer ${
            activeTab === 'growth'
              ? 'border-[#007F68] text-[#007F68]'
              : 'border-transparent text-[#294B57]'
          }`}
        >
          Growth Trajectory ({growthRecords.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('visits')}
          className={`py-3 px-4 border-b-2 cursor-pointer ${
            activeTab === 'visits'
              ? 'border-[#007F68] text-[#007F68]'
              : 'border-transparent text-[#294B57]'
          }`}
        >
          Recorded Visits ({visitHistory.length})
        </button>

      </div>

      {/* DIGITAL PASS TAB */}
      {activeTab === 'pass' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          <div className="md:col-span-7">
            <Card className="p-6 bg-[#FBF8F2] border-2 border-[#D8E6DA]">

              <div className="flex items-center justify-between border-b border-[#D8E6DA] pb-4 mb-4">

                <div className="flex items-center gap-3">
                  <img
                    src="/logo.jpg"
                    alt="NavJyoti"
                    className="w-12 h-12 rounded-xl object-cover"
                  />

                  <div>
                    <h2 className="font-bold text-lg text-[#103342] font-serif">
                      NavJyoti Health Pass
                    </h2>

                    <p className="text-[10px] font-semibold text-[#007F68]">
                      Development Record
                    </p>
                  </div>
                </div>

                <span className="text-[10px] bg-[#F0EBE1] text-[#294B57] px-3 py-1 rounded-full">
                  Not Clinically Verified
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-white p-4 rounded-xl border border-[#D8E6DA]">

                <div>
                  <p className="text-[#294B57]/70">Child Name</p>
                  <p className="font-bold text-[#103342]">
                    {activeChild.name}
                  </p>
                </div>

                <div>
                  <p className="text-[#294B57]/70">Child ID</p>
                  <p className="font-bold text-[#103342]">
                    {activeChild.id}
                  </p>
                </div>

                <div>
                  <p className="text-[#294B57]/70">Date of Birth</p>
                  <p className="font-semibold">
                    {displayValue(childDob)}
                  </p>
                </div>

                <div>
                  <p className="text-[#294B57]/70">Gender</p>
                  <p className="font-semibold">
                    {displayValue(activeChild.gender)}
                  </p>
                </div>

                <div>
                  <p className="text-[#294B57]/70">Blood Group</p>
                  <p className="font-semibold">
                    {displayValue(activeChild.bloodGroup)}
                  </p>
                </div>

                <div>
                  <p className="text-[#294B57]/70">Caregiver</p>
                  <p className="font-semibold">
                    {displayValue(activeChild.caregiverName)}
                  </p>
                </div>

              </div>

              {/* VACCINATION SUMMARY */}
              <div className="mt-4 p-4 rounded-xl bg-[#DDF0E3] border border-[#A8D5B5]">

                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-[#007F68]" />

                  <h3 className="font-bold text-sm text-[#103342]">
                    Vaccination Database Summary
                  </h3>
                </div>

                <p className="text-xs text-[#294B57]">
                  {doses.length} recorded vaccination entries.
                  {' '}{administeredDoses.length} marked administered.
                </p>

                <p className="text-[11px] text-[#294B57] mt-2">
                  Full age-appropriate vaccination coverage
                  has not been verified.
                </p>

              </div>
            </Card>
          </div>

          {/* QR STATUS */}
          <div className="md:col-span-5">

            <Card className="p-6 bg-[#FBF8F2] border border-[#D8E6DA] h-full flex flex-col items-center justify-center text-center gap-4">

              <ShieldCheck className="w-12 h-12 text-[#007F68]" />

              <h3 className="font-bold text-lg text-[#103342] font-serif">
                Secure QR Access
              </h3>

              <p className="text-xs text-[#294B57]">
                QR record lookup is temporarily disabled
                until a secure, authenticated backend
                verification system is implemented.
              </p>

              <span className="px-4 py-2 bg-[#F0EBE1] rounded-full text-xs text-[#294B57] font-semibold">
                Coming Soon
              </span>

            </Card>
          </div>

        </div>
      )}

      {/* GROWTH TRAJECTORY TAB */}
      {activeTab === 'growth' && (

        <Card className="p-5 bg-[#FBF8F2] border-[#D8E6DA]">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">

            <div>
              <h3 className="font-bold text-sm text-[#103342] font-serif">
                Physical Growth Measurements
              </h3>

              <p className="text-xs text-[#294B57]">
                Measurements retrieved from your connected
                database. No values are estimated.
              </p>
            </div>

            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#DDF0E3] text-[#007F68] text-xs font-semibold">
              <Activity className="w-4 h-4" />
              {growthRecords.length} records
            </div>
          </div>

          {growthRecords.length === 0 ? (

            <div className="p-8 text-center text-xs text-[#294B57]">
              No growth records have been recorded yet.
            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full text-xs text-left">

                <thead className="bg-[#F0EBE1] border-b border-[#D8E6DA] text-[#294B57] uppercase">

                  <tr>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Age</th>
                    <th className="py-3 px-3">Weight</th>
                    <th className="py-3 px-3">Height</th>
                    <th className="py-3 px-3">Head Circ.</th>
                    <th className="py-3 px-3">Recorded By</th>
                  </tr>

                </thead>

                <tbody className="divide-y divide-[#D8E6DA]/70">

                  {growthRecords.map((g, index) => {

                    // Calculate the age using the real dates
                    const calculatedMonths = calculateAgeMonths(
                      childDob,
                      g.date
                    );

                    return (
                      <tr
                        key={g.id ?? index}
                        className="hover:bg-white/60"
                      >

                        <td className="py-3 px-3 font-mono font-semibold text-[#103342]">
                          {displayValue(g.date)}
                        </td>

                        <td className="py-3 px-3">
                          {calculatedMonths === null
                            ? 'Not available'
                            : `${calculatedMonths} months (calculated)`}
                        </td>

                        <td className="py-3 px-3 font-bold text-[#007F68]">
                          {displayValue(g.weightKg, ' kg')}
                        </td>

                        <td className="py-3 px-3">
                          {displayValue(g.heightCm, ' cm')}
                        </td>

                        <td className="py-3 px-3">
                          {displayValue(
                            g.headCircumferenceCm,
                            ' cm'
                          )}
                        </td>

                        <td className="py-3 px-3">
                          {displayValue(g.recordedBy)}
                        </td>

                      </tr>
                    );
                  })}

                </tbody>
              </table>

            </div>
          )}

          <p className="text-[11px] text-[#294B57]/70 mt-5">
            Age is calculated from the recorded date of birth
            and measurement date. Growth measurements themselves
            are unchanged. Clinical interpretation requires
            qualified health personnel.
          </p>

        </Card>
      )}

      {/* RECORDED VISITS TAB */}
      {activeTab === 'visits' && (

        <Card className="p-5 bg-[#FBF8F2] border-[#D8E6DA]">

          <h3 className="font-bold text-sm text-[#103342] font-serif mb-4">
            Recorded Clinical & Home Visits
          </h3>

          {visitHistory.length === 0 ? (

            <div className="p-8 text-center text-xs text-[#294B57]">
              No clinical visits recorded yet.
            </div>

          ) : (

            <div className="space-y-3">

              {visitHistory.map((visit, index) => (

                <div
                  key={visit.id ?? index}
                  className="p-4 rounded-xl bg-white border border-[#D8E6DA] flex items-start gap-3"
                >

                  <Calendar className="w-5 h-5 text-[#007F68]" />

                  <div className="flex-1 text-xs">

                    <h4 className="font-bold text-sm text-[#103342]">
                      {displayValue(visit.visitType)}
                    </h4>

                    <p className="text-[#294B57] mt-1">
                      {displayValue(visit.date)}
                    </p>

                    <p className="text-[#294B57] mt-1">
                      {displayValue(visit.notes)}
                    </p>

                    <p className="text-[#007F68] mt-2">
                      Provider: {displayValue(visit.provider)}
                    </p>

                  </div>

                </div>

              ))}

            </div>
          )}

        </Card>
      )}

    </div>
  );
}
