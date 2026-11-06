import React from 'react';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { BarChart3, Download, TrendingUp, Users, Building, ShieldCheck } from 'lucide-react';

export function SupervisorAnalyticsPage() {
  const villageStats = [
    { village: "Rampur", cohort: 184, fullyImmunised: 156, coverage: 84.8, dropOutRate: 3.2, overdue: 8 },
    { village: "Kalyanpur", cohort: 142, fullyImmunised: 108, coverage: 76.1, dropOutRate: 6.8, overdue: 14 },
    { village: "Shivpur", cohort: 98, fullyImmunised: 82, coverage: 83.7, dropOutRate: 4.1, overdue: 5 },
  ];

  const handleExportCSV = () => {
    const headers = "Village,Cohort_0_5,Fully_Immunised,Coverage_Percent,Dropout_Rate,Overdue_Count\n";
    const rows = villageStats.map(v => `${v.village},${v.cohort},${v.fullyImmunised},${v.coverage}%,${v.dropOutRate}%,${v.overdue}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `navjyoti_supervisor_coverage_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#103342] font-serif">
            Supervisor & Health Authority Analytics
          </h1>
          <p className="text-xs text-[#294B57]/80">
            Aggregate public health coverage across sub-centres (Medical Officer In-Charge View)
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#007F68] text-white text-xs font-semibold hover:bg-[#005F52] transition-all shadow-xs cursor-pointer"
        >
          <Download className="w-4 h-4 text-white" />
          <span>Export Aggregate CSV</span>
        </button>
      </div>

      <div className="p-3.5 rounded-xl bg-[#DDF0E3]/70 text-xs text-[#005F52] border border-[#D8E6DA]">
        <ShieldCheck className="w-4 h-4 text-[#007F68] inline mr-1 -mt-0.5" />
        <span>
          <strong>Data Privacy Safeguard:</strong> In compliance with healthcare standards, supervisor summaries aggregate statistics at the village/facility level and omit individual child identifiers.
        </span>
      </div>

      {/* Village Comparison Table */}
      <Card className="bg-[#FBF8F2] border border-[#D8E6DA]">
        <CardHeader
          title="Village-Level Universal Immunisation Coverage (UIP)"
          subtitle="Bilaspur Sadar Block Cohort Monitoring"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F0EBE1] border-b border-[#D8E6DA] text-[#294B57]/80 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Village / Locality</th>
                <th className="py-3 px-3">0–5 Cohort Size</th>
                <th className="py-3 px-3">Fully Immunised</th>
                <th className="py-3 px-3">Coverage Rate</th>
                <th className="py-3 px-3">Drop-out Rate (BCG to MR)</th>
                <th className="py-3 px-4">Admin Overdue Queue</th>
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
                  <td className="py-3.5 px-3 font-mono text-[#294B57]">{row.dropOutRate}%</td>
                  <td className="py-3.5 px-4">
                    <Badge variant={row.overdue > 10 ? 'overdue' : 'dueSoon'}>
                      {row.overdue} Children Pending Catch-up
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
