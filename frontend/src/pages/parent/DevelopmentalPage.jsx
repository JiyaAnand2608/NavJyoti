
import React, { useState } from 'react';
import { useHealthData } from '../../contexts/HealthDataContext';
import {
  MILESTONE_DOMAINS,
  MILESTONE_SCHEDULE,
} from '../../data/milestoneSchedule';
import { Card, CardBody } from '../../components/common/Card';
import {
  CheckCircle2,
  Circle,
  Info,
  ClipboardList,
  Calendar,
  AlertCircle,
} from 'lucide-react';

function displayValue(value) {
  if (value === null || value === undefined || value === '') {
    return 'Not recorded';
  }

  return String(value);
}

function getStatusLabel(status) {
  if (status === 'recorded' || status === 'observed') {
    return 'Observed';
  }

  if (status === 'not_observed') {
    return 'Not observed';
  }

  return status
    ? status.replaceAll('_', ' ')
    : 'Status not recorded';
}

export function DevelopmentalPage() {
  const {
    activeChild,
    childrenLoading,
    childrenError,
  } = useHealthData();

  const [selectedDomain, setSelectedDomain] = useState('all');

  // Loading state
  if (childrenLoading) {
    return (
      <div className="p-8 text-center text-sm text-[#294B57]">
        Loading developmental observations...
      </div>
    );
  }

  // Backend error state
  if (childrenError) {
    return (
      <div className="p-6 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span>
          Unable to load observations: {childrenError}
        </span>
      </div>
    );
  }

  // No selected child
  if (!activeChild) {
    return (
      <div className="p-8 text-center text-sm text-[#294B57]">
        No active child selected.
        Please select a child in My Children.
      </div>
    );
  }

  // Records retrieved through HealthDataContext
  const childMilestones = activeChild.milestones || [];

  const recordedCount = childMilestones.filter(
    (item) =>
      item.status === 'recorded' ||
      item.status === 'observed'
  ).length;

  const filteredObservations =
    selectedDomain === 'all'
      ? childMilestones
      : childMilestones.filter(
          (item) => item.domain === selectedDomain
        );

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-[#294B57]">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#103342] font-serif">
            Growth & Milestone Observations
          </h1>

          <p className="text-xs text-[#294B57] mt-1">
            Developmental observations for {activeChild.name}
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#DDF0E3] border border-[#A8D5B5] text-[#005F52] text-xs font-semibold">
          <ClipboardList className="w-4 h-4" />
          {childMilestones.length} Database Records
        </div>
      </div>

      {/* INFORMATION NOTICE */}
      <div className="p-4 rounded-2xl bg-[#DDF0E3]/70 border border-[#A8D5B5] text-xs text-[#103342] flex items-start gap-3">
        <Info className="w-5 h-5 text-[#007F68] shrink-0 mt-0.5" />

        <div>
          <span className="font-bold block mb-1">
            Developmental Guidance — Non-Diagnostic
          </span>

          <p className="text-[#294B57] leading-relaxed">
            Milestones describe developmental observations.
            Children develop at different paces, and these
            checklists are not medical diagnoses.

            Recorded observations are retrieved from the
            NavJyoti backend. The reference checklist below
            does not determine whether your child has achieved
            a milestone.
          </p>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <Card className="p-5 bg-[#FBF8F2] border-[#D8E6DA]">
          <p className="text-xs font-semibold text-[#294B57]">
            Total Database Records
          </p>

          <h2 className="text-3xl font-bold text-[#103342] mt-2">
            {childMilestones.length}
          </h2>

          <p className="text-[11px] text-[#294B57] mt-2">
            Entries saved in the backend
          </p>
        </Card>

        <Card className="p-5 bg-[#FBF8F2] border-[#D8E6DA]">
          <p className="text-xs font-semibold text-[#294B57]">
            Marked Observed
          </p>

          <h2 className="text-3xl font-bold text-[#007F68] mt-2">
            {recordedCount}
          </h2>

          <p className="text-[11px] text-[#294B57] mt-2">
            Recorded observations, not clinical assessments
          </p>
        </Card>

        <Card className="p-5 bg-[#FBF8F2] border-[#D8E6DA]">
          <p className="text-xs font-semibold text-[#294B57]">
            Schedule Status
          </p>

          <h2 className="text-base font-bold text-[#103342] mt-3">
            Not Clinically Verified
          </h2>

          <p className="text-[11px] text-[#294B57] mt-2">
            Reference milestones are not automatically marked
            complete.
          </p>
        </Card>
      </div>

      {/* DOMAIN FILTER */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#FBF8F2] border border-[#D8E6DA] rounded-xl text-xs font-medium w-fit">

        <button
          type="button"
          onClick={() => setSelectedDomain('all')}
          className={`px-3 py-2 rounded-lg cursor-pointer ${
            selectedDomain === 'all'
              ? 'bg-[#103342] text-white font-semibold'
              : 'text-[#294B57] hover:bg-[#F0EBE1]'
          }`}
        >
          All Domains
        </button>

        {MILESTONE_DOMAINS.map((domain) => (
          <button
            key={domain.id}
            type="button"
            onClick={() => setSelectedDomain(domain.id)}
            className={`px-3 py-2 rounded-lg cursor-pointer ${
              selectedDomain === domain.id
                ? 'bg-[#007F68] text-white font-semibold'
                : 'text-[#294B57] hover:bg-[#F0EBE1]'
            }`}
          >
            {domain.name}
          </button>
        ))}

      </div>

      {/* DATABASE RECORDS */}
      <section className="space-y-4">

        <div>
          <h2 className="text-lg font-bold text-[#103342] font-serif">
            Recorded Milestone Observations
          </h2>

          <p className="text-xs text-[#294B57] mt-1">
            Observations retrieved from PostgreSQL through FastAPI.
          </p>
        </div>

        {filteredObservations.length === 0 ? (

          <Card className="p-8 bg-[#FBF8F2] border-[#D8E6DA]">
            <div className="text-center space-y-3">

              <ClipboardList className="w-10 h-10 text-[#007F68] mx-auto" />

              <h3 className="font-bold text-[#103342]">
                No Recorded Observations
              </h3>

              <p className="text-xs text-[#294B57] max-w-md mx-auto">
                No observations are available for the selected
                domain. An authorized health worker can record
                observations through NavJyoti.
              </p>

            </div>
          </Card>

        ) : (

          <div className="space-y-3">

            {filteredObservations.map((milestone, index) => {

              const observed =
                milestone.status === 'recorded' ||
                milestone.status === 'observed';

              return (
                <Card
                  key={milestone.id ?? index}
                  className="p-4 bg-[#FBF8F2] border-[#D8E6DA]"
                >

                  <div className="flex items-start gap-3">

                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      observed
                        ? 'bg-[#DDF0E3] text-[#007F68]'
                        : 'bg-[#F0EBE1] text-[#294B57]'
                    }`}>
                      {observed
                        ? <CheckCircle2 className="w-5 h-5" />
                        : <Circle className="w-5 h-5" />}
                    </div>

                    <div className="flex-1 space-y-2">

                      <div className="flex flex-wrap items-center justify-between gap-2">

                        <h3 className="font-bold text-sm text-[#103342]">
                          {displayValue(milestone.title)}
                        </h3>

                        <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${
                          observed
                            ? 'bg-[#DDF0E3] text-[#005F52]'
                            : 'bg-[#F0EBE1] text-[#294B57]'
                        }`}>
                          {getStatusLabel(milestone.status)}
                        </span>

                      </div>

                      <p className="text-xs text-[#294B57]">
                        Domain: {displayValue(milestone.domain)}
                      </p>

                      <p className="text-xs text-[#294B57] flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#007F68]" />
                        Observation Date: {displayValue(milestone.observedDate)}
                      </p>

                      {milestone.notes &&
                        milestone.notes !== milestone.title && (
                          <p className="text-xs text-[#294B57] bg-white p-3 rounded-xl border border-[#D8E6DA]">
                            {milestone.notes}
                          </p>
                        )}

                    </div>
                  </div>

                </Card>
              );
            })}

          </div>
        )}

      </section>

      {/* REFERENCE MILESTONE SCHEDULE */}
      <section className="space-y-4">

        <div>
          <h2 className="text-lg font-bold text-[#103342] font-serif">
            Developmental Milestone Reference
          </h2>

          <p className="text-xs text-[#294B57] mt-1">
            Educational checklist only. These items are not
            automatically linked to the database records.
          </p>
        </div>

        {MILESTONE_SCHEDULE.map((band) => {

          const visibleItems = band.items.filter(
            (item) =>
              selectedDomain === 'all' ||
              item.domain === selectedDomain
          );

          if (visibleItems.length === 0) return null;

          return (
            <Card
              key={band.ageBand}
              className="overflow-hidden bg-[#FBF8F2] border-[#D8E6DA]"
            >

              <div className="bg-[#F0EBE1]/70 px-5 py-3 border-b border-[#D8E6DA] flex items-center justify-between gap-3">

                <h3 className="font-bold text-sm text-[#103342] font-serif">
                  {band.ageBand}
                </h3>

                <span className="text-[11px] text-[#294B57]">
                  Reference Only
                </span>

              </div>

              <CardBody className="p-0">

                <div className="divide-y divide-[#D8E6DA]/70">

                  {visibleItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 flex items-start justify-between gap-4"
                    >

                      <div className="space-y-2">

                        <div className="flex items-center gap-2">

                          <Circle className="w-4 h-4 text-[#294B57]/50 shrink-0" />

                          <span className="font-bold text-sm text-[#103342]">
                            {item.title}
                          </span>

                        </div>

                        <p className="text-xs text-[#294B57] pl-6">
                          {item.guidance}
                        </p>

                        <p className="text-[11px] text-[#007F68] pl-6">
                          Domain: {item.domain}
                        </p>

                      </div>

                      <span className="shrink-0 rounded-full bg-[#DDF0E3] text-[#005F52] px-3 py-1 text-[10px] font-semibold">
                        Reference
                      </span>

                    </div>
                  ))}

                </div>

              </CardBody>
            </Card>
          );
        })}

      </section>

      {/* FOOTER NOTICE */}
      <div className="p-4 rounded-xl bg-[#F0EBE1] border border-[#D8E6DA] text-xs text-[#294B57]">
        <strong>NavJyoti Development Notice:</strong>{' '}
        Parents can view recorded observations on this page.
        Creating new milestone records is currently restricted
        to authorized health workers by the FastAPI backend.
      </div>

    </div>
  );
}
