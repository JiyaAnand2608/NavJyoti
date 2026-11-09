import React, { useState } from 'react';
import { useHealthData } from '../../contexts/HealthDataContext';
import { MILESTONE_DOMAINS, MILESTONE_SCHEDULE } from '../../data/milestoneSchedule';
import { Card, CardBody } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { CheckCircle2, Circle, Info, PlusCircle, Check, AlertCircle } from 'lucide-react';

export function DevelopmentalPage() {
  const { activeChild, recordMilestoneObservation } = useHealthData();
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [observationModalItem, setObservationModalItem] = useState(null);
  const [obsStatus, setObsStatus] = useState('recorded');
  const [obsNotes, setObsNotes] = useState('');
  const [feedback, setFeedback] = useState('');

  if (!activeChild) {
    return (
      <div className="p-8 text-center text-xs text-[#294B57]">
        No active child selected.
      </div>
    );
  }

  const childMilestones = activeChild.milestones || [];
  const recordedCount = childMilestones.filter((m) => m.status === 'recorded').length;

  const handleOpenObserveModal = (item) => {
    const existing = childMilestones.find((m) => m.milestoneId === item.id);
    setObservationModalItem(item);
    setObsStatus(existing ? existing.status : 'recorded');
    setObsNotes(existing ? existing.notes || '' : '');
  };

  const handleSaveObservation = (e) => {
    e.preventDefault();
    if (!observationModalItem) return;

    recordMilestoneObservation(activeChild.id, {
      milestoneId: observationModalItem.id,
      domain: observationModalItem.domain,
      title: observationModalItem.title,
      status: obsStatus,
      notes: obsNotes,
    });

    setObservationModalItem(null);
    setFeedback(`Observation recorded for "${observationModalItem.title}".`);
    setTimeout(() => setFeedback(''), 3500);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-[#294B57]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#103342] font-serif">
            Growth & Milestone Observations
          </h1>
          <p className="text-xs text-[#294B57]">
            Observational checklists for {activeChild.name} ({activeChild.ageMonths} Months Old)
          </p>
        </div>

        {/* Domain Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#FBF8F2] border border-[#D8E6DA] rounded-xl text-xs font-medium">
          <button
            onClick={() => setSelectedDomain('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              selectedDomain === 'all' ? 'bg-[#103342] text-white font-semibold' : 'text-[#294B57] hover:bg-[#F0EBE1]'
            }`}
          >
            All Domains
          </button>
          {MILESTONE_DOMAINS.map((dom) => (
            <button
              key={dom.id}
              onClick={() => setSelectedDomain(dom.id)}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                selectedDomain === dom.id ? 'bg-[#007F68] text-white font-semibold' : 'text-[#294B57] hover:bg-[#F0EBE1]'
              }`}
            >
              {dom.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-[#DDF0E3] border border-[#A8D5B5] text-xs text-[#005F52] font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#007F68] shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Non-Diagnostic Disclaimer Alert */}
      <div className="p-4 rounded-2xl bg-[#DDF0E3]/70 border border-[#A8D5B5] text-xs text-[#103342] flex items-start gap-3">
        <Info className="w-5 h-5 text-[#007F68] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block mb-0.5">Observational Guidance Only — Non-Diagnostic:</span>
          <span className="text-[#294B57]">
            Developmental milestones are natural behavioral observations intended to encourage parental awareness and timely guidance with ASHA workers. Children develop at individual paces; these checklists do not constitute a clinical medical diagnosis.
          </span>
        </div>
      </div>

      {/* 4 Domain Cards Overview with Progress Counts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {MILESTONE_DOMAINS.map((dom) => {
          const domObserved = childMilestones.filter((m) => m.domain === dom.id && m.status === 'recorded').length;
          return (
            <Card key={dom.id} className="p-4 bg-[#FBF8F2] border-[#D8E6DA] flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#007F68]">
                  Domain Benchmark
                </span>
                <h3 className="font-bold text-sm text-[#103342] mt-1">{dom.name}</h3>
                <p className="text-[11px] text-[#294B57] mt-1 leading-relaxed">
                  {dom.description}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-[#D8E6DA]/70 flex items-center justify-between text-xs font-semibold text-[#007F68]">
                <span>{domObserved} Checkpoints Noted</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Age Band Sections */}
      <div className="space-y-6">
        {MILESTONE_SCHEDULE.map((band) => (
          <Card key={band.ageBand} className="overflow-hidden bg-[#FBF8F2] border-[#D8E6DA]">
            <div className="bg-[#F0EBE1]/70 px-5 py-3 border-b border-[#D8E6DA] flex items-center justify-between">
              <span className="font-bold text-sm text-[#103342] font-serif">{band.ageBand}</span>
              <span className="text-[11px] text-[#294B57]">Early Childhood Observation</span>
            </div>
            <CardBody className="p-0">
              <div className="divide-y divide-[#D8E6DA]/70 text-xs">
                {band.items.map((item) => {
                  if (selectedDomain !== 'all' && item.domain !== selectedDomain) return null;
                  const logged = childMilestones.find((m) => m.milestoneId === item.id);
                  const isRecorded = logged?.status === 'recorded';

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleOpenObserveModal(item)}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F0EBE1]/40 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            isRecorded ? 'bg-[#DDF0E3] text-[#007F68]' : 'bg-[#F0EBE1] text-[#294B57]/50'
                          }`}
                        >
                          {isRecorded ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#103342]">{item.title}</span>
                            <span className="text-[10px] uppercase font-bold text-[#007F68] bg-[#DDF0E3] px-2 py-0.5 rounded-full">
                              {item.domain}
                            </span>
                          </div>
                          <p className="text-[#294B57] text-xs mt-0.5">{item.guidance}</p>
                          {logged?.notes && (
                            <p className="text-[11px] text-[#007F68] mt-1 font-medium">
                              Caregiver Observation: "{logged.notes}" ({logged.observedDate})
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="sm:text-right shrink-0">
                        {isRecorded ? (
                          <Badge variant="upToDate">Observed</Badge>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#007F68] hover:underline">
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>Log Observation</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Observation Modal */}
      {observationModalItem && (
        <Modal
          isOpen={!!observationModalItem}
          onClose={() => setObservationModalItem(null)}
          title="Log Milestone Observation"
          subtitle={observationModalItem.title}
        >
          <form onSubmit={handleSaveObservation} className="space-y-4 text-xs text-[#294B57]">
            <div className="p-3 rounded-xl bg-[#F0EBE1] border border-[#D8E6DA] text-xs">
              <span className="font-bold text-[#103342] block mb-1">Observation Guidance:</span>
              <span>{observationModalItem.guidance}</span>
            </div>

            <div>
              <label className="block font-semibold text-[#103342] mb-1.5">Observation Status</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setObsStatus('recorded')}
                  className={`py-2 px-3 rounded-xl border font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    obsStatus === 'recorded'
                      ? 'bg-[#DDF0E3] border-[#007F68] text-[#005F52]'
                      : 'bg-white border-[#D8E6DA] text-[#294B57]'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-[#007F68]" />
                  <span>Observed & Present</span>
                </button>
                <button
                  type="button"
                  onClick={() => setObsStatus('not_observed')}
                  className={`py-2 px-3 rounded-xl border font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    obsStatus === 'not_observed'
                      ? 'bg-[#FDF8EF] border-[#F4B83F] text-[#B87D14]'
                      : 'bg-white border-[#D8E6DA] text-[#294B57]'
                  }`}
                >
                  <Circle className="w-4 h-4 text-slate-400" />
                  <span>Not Observed Yet</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#103342] mb-1">
                Parent Notes / Context (Optional)
              </label>
              <textarea
                rows={3}
                value={obsNotes}
                onChange={(e) => setObsNotes(e.target.value)}
                placeholder="e.g. Sits steadily without cushions during playtime..."
                className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342] focus:ring-2 focus:ring-[#007F68]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setObservationModalItem(null)}
                className="px-4 py-2 rounded-xl bg-white border border-[#D8E6DA] text-[#103342] font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#007F68] text-white font-semibold text-xs hover:bg-[#005F52] cursor-pointer shadow-xs"
              >
                Save Observation
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
