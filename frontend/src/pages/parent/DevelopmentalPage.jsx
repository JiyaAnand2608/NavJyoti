import React, { useState } from 'react';
import { useHealthData } from '../../contexts/HealthDataContext';
import { MILESTONE_DOMAINS, MILESTONE_SCHEDULE } from '../../data/milestoneSchedule';
import { Card, CardBody } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { CheckCircle2, Info } from 'lucide-react';

export function DevelopmentalPage() {
  const { activeChild } = useHealthData();
  const [selectedDomain, setSelectedDomain] = useState('all');

  if (!activeChild) return null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-[#294B57]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#103342] font-serif">
            Growth & Milestone Observations
          </h1>
          <p className="text-xs text-[#294B57]">
            Observational checklists for {activeChild.name} ({activeChild.ageMonths} Months)
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

      {/* Non-Diagnostic Disclaimer Alert */}
      <div className="p-4 rounded-2xl bg-[#DDF0E3]/70 border border-[#A8D5B5] text-xs text-[#103342] flex items-start gap-3">
        <Info className="w-5 h-5 text-[#007F68] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block mb-0.5">Observational Guidance Only — Non-Diagnostic:</span>
          <span className="text-[#294B57]">
            Developmental milestones are natural behavioral observations intended to encourage parental engagement and timely discussion with ASHA workers. Children develop at individual paces; these checklists do not constitute a medical diagnosis.
          </span>
        </div>
      </div>

      {/* 4 Domain Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {MILESTONE_DOMAINS.map((dom) => (
          <Card key={dom.id} className="p-4 bg-[#FBF8F2] border-[#D8E6DA]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#007F68]">
              Domain Benchmark
            </span>
            <h3 className="font-bold text-sm text-[#103342] mt-1">{dom.name}</h3>
            <p className="text-[11px] text-[#294B57] mt-1 leading-relaxed">
              {dom.description}
            </p>
          </Card>
        ))}
      </div>

      {/* Age Band Sections */}
      <div className="space-y-6">
        {MILESTONE_SCHEDULE.map((band) => (
          <Card key={band.ageBand} className="overflow-hidden bg-[#FBF8F2] border-[#D8E6DA]">
            <div className="bg-[#F0EBE1]/70 px-5 py-3 border-b border-[#D8E6DA] flex items-center justify-between">
              <span className="font-bold text-sm text-[#103342] font-serif">{band.ageBand}</span>
              <span className="text-[11px] text-[#294B57]">Early Childhood Checklist</span>
            </div>
            <CardBody className="p-0">
              <div className="divide-y divide-[#D8E6DA]/70 text-xs">
                {band.items.map((item) => {
                  if (selectedDomain !== 'all' && item.domain !== selectedDomain) return null;
                  const logged = activeChild.milestones?.find((m) => m.milestoneId === item.id);

                  return (
                    <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F0EBE1]/40 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          logged?.status === 'recorded' ? 'bg-[#DDF0E3] text-[#007F68]' : 'bg-[#F0EBE1] text-[#294B57]/60'
                        }`}>
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#103342]">{item.title}</span>
                            <span className="text-[10px] uppercase tracking-wider text-[#294B57]/70 font-semibold">
                              ({item.domain})
                            </span>
                          </div>
                          <p className="text-[#294B57] text-[11px] mt-0.5">{item.guidance}</p>
                          {logged?.notes && (
                            <p className="text-[11px] text-[#007F68] mt-1 font-medium">
                              Caregiver Observation: "{logged.notes}" ({logged.observedDate})
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">
                        {logged?.status === 'recorded' ? (
                          <Badge variant="upToDate">Observed</Badge>
                        ) : logged?.status === 'needs_review' ? (
                          <Badge variant="overdue">Review with ANM</Badge>
                        ) : (
                          <Badge variant="default">Not Yet Observed</Badge>
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
    </div>
  );
}
