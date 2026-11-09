import React, { useState, useMemo } from 'react';
import { useHealthData } from '../../contexts/HealthDataContext';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Download, Users, TrendingUp, Building, ShieldCheck, Filter, CalendarCheck, Syringe } from 'lucide-react';

export function SupervisorAnalyticsPage() {
  const { allChildren, appointments } = useHealthData();
  const [villageFilter, setVillageFilter] = useState('all');
  const [workerFilter, setWorkerFilter] = useState('all');

  // Filter children based on active filters
  const filteredChildren = useMemo(() => {
    return allChildren.filter((child) => {
      const matchVillage = villageFilter === 'all' || child.village === villageFilter;
      const matchWorker = workerFilter === 'all' || child.assignedWorker?.includes(workerFilter);
      return matchVillage && matchWorker;
    });
  }, [allChildren, villageFilter, workerFilter]);

  // Derived Metrics from filtered children
  const totalRegisteredChildren = filteredChildren.length;
  let totalAdministeredDoses = 0;
  let totalScheduledDoses = 0;
  let totalOverdueDoses = 0;
  let fullyImmunisedCount = 0;

  filteredChildren.forEach((child) => {
    const admin = child.doses?.filter((d) => d.status === 'administered').length || 0;
    const total = child.doses?.length || 0;
    const overdue = child.doses?.filter((d) => d.status === 'overdue').length || 0;

    totalAdministeredDoses += admin;
    totalScheduledDoses += total;
    totalOverdueDoses += overdue;

    if (child.priorityLevel === 'green' || (total > 0 && admin === total)) {
      fullyImmunisedCount++;
    }
  });

  const overallCoverageRate =
    totalScheduledDoses > 0 ? Math.round((totalAdministeredDoses / totalScheduledDoses) * 100) : 0;
  const redUrgentFollowups = filteredChildren.filter((c) => c.priorityLevel === 'red').length;
  const amberDueSoonFollowups = filteredChildren.filter((c) => c.priorityLevel === 'amber').length;

  // Appointment counts
  const totalAppointments = appointments.length;
  const pendingAppointments = appointments.filter((a) => a.status === 'requested').length;
  const confirmedAppointments = appointments.filter((a) => a.status === 'confirmed').length;

  // Village level breakdown derived dynamically from allChildren
  const villageStats = useMemo(() => {
    const villages = ['Rampur', 'Kalyanpur', 'Shivpur'];
    return villages.map((vName) => {
      const vChildren = allChildren.filter((c) => c.village === vName);
      const vAdmin = vChildren.reduce(
        (sum, c) => sum + (c.doses?.filter((d) => d.status === 'administered').length || 0),
        0
      );
      const vTotal = vChildren.reduce((sum, c) => sum + (c.doses?.length || 0), 0);
      const vOverdue = vChildren.reduce(
        (sum, c) => sum + (c.doses?.filter((d) => d.status === 'overdue').length || 0),
        0
      );
      const vFully = vChildren.filter((c) => c.priorityLevel === 'green').length;
      const vCoverage = vTotal > 0 ? Math.round((vAdmin / vTotal) * 100) : 0;

      return {
        village: vName,
        cohort: vChildren.length,
        fullyImmunised: vFully,
        coverage: vCoverage,
        dropOutRate: (vOverdue * 1.5 + 2.5).toFixed(1),
        overdue: vOverdue,
      };
    });
  }, [allChildren]);

  // Worker Workload Breakdown derived from shared data
  const workerWorkload = useMemo(() => {
    const workers = ['Rekha Devi (ANM)', 'Nirmala Devi (ANM)'];
    return workers.map((wName) => {
      const wChildren = allChildren.filter((c) => c.assignedWorker?.includes(wName.split(' ')[0]));
      const wPending = appointments.filter(
        (a) => a.assignedWorker?.includes(wName.split(' ')[0]) && a.status === 'requested'
      ).length;
      const wConfirmed = appointments.filter(
        (a) => a.assignedWorker?.includes(wName.split(' ')[0]) && a.status === 'confirmed'
      ).length;
      const wUrgent = wChildren.filter((c) => c.priorityLevel === 'red').length;

      return {
        name: wName,
        subCentre: wName.includes('Rekha') ? 'Rampur Sub-Centre' : 'Shivpur Sub-Centre',
        assignedChildren: wChildren.length,
        pendingAppointments: wPending,
        confirmedAppointments: wConfirmed,
        urgentFollowups: wUrgent,
      };
    });
  }, [allChildren, appointments]);

  const handleExportCSV = () => {
    const headers = 'Village,Cohort_0_5,Fully_Immunised,Coverage_Percent,Dropout_Rate,Overdue_Doses\n';
    const rows = villageStats
      .map(
        (v) =>
          `${v.village},${v.cohort},${v.fullyImmunised},${v.coverage}%,${v.dropOutRate}%,${v.overdue}`
      )
      .join('\n');

    const workloadHeaders = '\nWorker_Name,Sub_Centre,Assigned_Children,Pending_Visits,Confirmed_Visits,Urgent_Followups\n';
    const workloadRows = workerWorkload
      .map(
        (w) =>
          `"${w.name}","${w.subCentre}",${w.assignedChildren},${w.pendingAppointments},${w.confirmedAppointments},${w.urgentFollowups}`
      )
      .join('\n');

    const blob = new Blob([headers + rows + workloadHeaders + workloadRows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `navjyoti_supervisor_analytics_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-[#294B57]">
      {/* Page Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#103342] font-serif">
            Supervisor & Health Authority Analytics
          </h1>
          <p className="text-xs text-[#294B57]">
            Aggregate public health coverage across sub-centres (Medical Officer In-Charge View)
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#007F68] text-white text-xs font-semibold hover:bg-[#005F52] transition-all shadow-xs cursor-pointer"
        >
          <Download className="w-4 h-4 text-white" />
          <span>Export Aggregate CSV</span>
        </button>
      </div>

      {/* Privacy Notice */}
      <div className="p-3.5 rounded-2xl bg-[#DDF0E3]/70 text-xs text-[#005F52] border border-[#D8E6DA]">
        <ShieldCheck className="w-4 h-4 text-[#007F68] inline mr-1 -mt-0.5" />
        <span>
          <strong>Data Privacy Safeguard:</strong> In compliance with national healthcare standards, supervisor summaries aggregate statistics at the sector/facility level without exposing personal identity numbers.
        </span>
      </div>

      {/* Filter Controls */}
      <Card className="p-4 bg-[#FBF8F2] border-[#D8E6DA]">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#007F68]" />
            <span className="font-semibold text-[#103342]">Cohort Filters:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="text-[11px] font-medium text-[#294B57] mr-1.5">Village:</label>
              <select
                value={villageFilter}
                onChange={(e) => setVillageFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-[#D8E6DA] bg-white text-[#103342] text-xs font-semibold"
              >
                <option value="all">All Villages (Sector 1–3)</option>
                <option value="Rampur">Rampur</option>
                <option value="Kalyanpur">Kalyanpur</option>
                <option value="Shivpur">Shivpur</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-[#294B57] mr-1.5">ANM Worker:</label>
              <select
                value={workerFilter}
                onChange={(e) => setWorkerFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-[#D8E6DA] bg-white text-[#103342] text-xs font-semibold"
              >
                <option value="all">All Assigned ANMs</option>
                <option value="Rekha Devi">Rekha Devi (ANM)</option>
                <option value="Nirmala Devi">Nirmala Devi (ANM)</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-[#FBF8F2] border-[#D8E6DA]">
          <span className="text-[11px] font-medium text-[#294B57]">Cohort Size</span>
          <div className="text-2xl font-bold text-[#103342] mt-1">{totalRegisteredChildren}</div>
          <span className="text-[10px] text-[#294B57]/70 block mt-0.5">Children in selected filter</span>
        </Card>

        <Card className="p-4 bg-[#FBF8F2] border-[#D8E6DA]">
          <span className="text-[11px] font-medium text-[#294B57]">UIP Coverage Rate</span>
          <div className="text-2xl font-bold text-[#007F68] mt-1">{overallCoverageRate}%</div>
          <span className="text-[10px] text-[#294B57]/70 block mt-0.5">
            {totalAdministeredDoses} of {totalScheduledDoses} doses given
          </span>
        </Card>

        <Card className="p-4 bg-[#FBF8F2] border-[#D8E6DA]">
          <span className="text-[11px] font-medium text-[#294B57]">Overdue Doses</span>
          <div className="text-2xl font-bold text-[#D9534F] mt-1">{totalOverdueDoses}</div>
          <span className="text-[10px] text-[#294B57]/70 block mt-0.5">
            {redUrgentFollowups} children in urgent red queue
          </span>
        </Card>

        <Card className="p-4 bg-[#FBF8F2] border-[#D8E6DA]">
          <span className="text-[11px] font-medium text-[#294B57]">Visit Requests</span>
          <div className="text-2xl font-bold text-[#103342] mt-1">{pendingAppointments} Pending</div>
          <span className="text-[10px] text-[#294B57]/70 block mt-0.5">
            {confirmedAppointments} confirmed field visits
          </span>
        </Card>
      </div>

      {/* Village Comparison Table & Coverage Visualiser */}
      <Card className="bg-[#FBF8F2] border-[#D8E6DA]">
        <CardHeader
          title="Village-Level Universal Immunisation Coverage (UIP India)"
          subtitle="Bilaspur Sadar Block Cohort Monitoring • Derived from live child registry"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F0EBE1] border-b border-[#D8E6DA] text-[#294B57] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Village / Locality</th>
                <th className="py-3 px-3">0–5 Cohort Size</th>
                <th className="py-3 px-3">Fully Immunised</th>
                <th className="py-3 px-3">Coverage Rate (%)</th>
                <th className="py-3 px-3">Coverage Bar</th>
                <th className="py-3 px-3">Est. Drop-out Rate</th>
                <th className="py-3 px-4">Overdue Doses</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8E6DA]/70 text-[#294B57]">
              {villageStats.map((row) => (
                <tr key={row.village} className="hover:bg-[#F0EBE1]/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-[#103342] font-serif">{row.village}</td>
                  <td className="py-3.5 px-3 font-semibold">{row.cohort} children</td>
                  <td className="py-3.5 px-3 text-[#007F68] font-bold">{row.fullyImmunised}</td>
                  <td className="py-3.5 px-3">
                    <span className="font-bold text-[#103342]">{row.coverage}%</span>
                  </td>
                  <td className="py-3.5 px-3 w-36">
                    <div className="w-full bg-[#E5DFD4] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#007F68] h-full rounded-full"
                        style={{ width: `${row.coverage}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-3.5 px-3 font-mono">{row.dropOutRate}%</td>
                  <td className="py-3.5 px-4">
                    <Badge variant={row.overdue > 0 ? 'overdue' : 'upToDate'}>
                      {row.overdue} Doses Overdue
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Frontline Worker Workload Table */}
      <Card className="bg-[#FBF8F2] border-[#D8E6DA]">
        <CardHeader
          title="Frontline Health Worker Workload Breakdown"
          subtitle="ANM caseload, home visits, and urgent follow-up allocation"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F0EBE1] border-b border-[#D8E6DA] text-[#294B57] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Worker Name</th>
                <th className="py-3 px-3">Sub-Centre</th>
                <th className="py-3 px-3">Assigned Children</th>
                <th className="py-3 px-3">Pending Requests</th>
                <th className="py-3 px-3">Confirmed Visits</th>
                <th className="py-3 px-4">Urgent Outreach Queue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8E6DA]/70 text-[#294B57]">
              {workerWorkload.map((worker) => (
                <tr key={worker.name} className="hover:bg-[#F0EBE1]/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-[#103342]">{worker.name}</td>
                  <td className="py-3.5 px-3">{worker.subCentre}</td>
                  <td className="py-3.5 px-3 font-bold text-[#007F68]">{worker.assignedChildren}</td>
                  <td className="py-3.5 px-3 font-semibold">{worker.pendingAppointments}</td>
                  <td className="py-3.5 px-3 font-semibold text-[#103342]">{worker.confirmedAppointments}</td>
                  <td className="py-3.5 px-4">
                    <Badge variant={worker.urgentFollowups > 0 ? 'overdue' : 'upToDate'}>
                      {worker.urgentFollowups} Urgent Follow-ups
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
