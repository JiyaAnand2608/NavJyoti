import React, { useState, useEffect, useCallback } from 'react';
import { backendApi } from '../../services/backendApi';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';

import {
  BarChart3,
  Download,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Users,
  Syringe,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';

export function AuthorityReportsPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await backendApi.getSupervisorReports();
      setReport(data);
    } catch (err) {
      setError(err.message || 'Failed to aggregate authority reports.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleDownloadCsv = async () => {
    setExporting(true);
    try {
      const blob = await backendApi.downloadSupervisorReportsCsv();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `navjyoti_authority_report_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  if (loading && !report) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <RefreshCw className="w-8 h-8 text-[#007F68] animate-spin mb-3" />
        <p className="text-sm font-medium text-[#103342]">Generating supervisory analytics report...</p>
        <p className="text-xs text-[#294B57]/70 mt-1">Aggregating real operational database records</p>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="p-6 max-w-xl mx-auto text-center">
        <Card className="p-6 bg-[#FDF8EF] border-[#E57373]/30">
          <AlertCircle className="w-12 h-12 text-[#D9534F] mx-auto mb-3" />
          <h2 className="text-base font-bold text-[#103342]">Report Generation Failed</h2>
          <p className="text-xs text-[#294B57] mt-1 mb-4">{error}</p>
          <Button onClick={fetchReports} variant="primary" size="sm" className="text-xs">
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  const maxTrend = Math.max(...(report?.trends?.map((t) => t.completed_doses) || [1]), 1);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#007F68]" />
            <h1 className="text-2xl font-bold text-[#103342]">Reports & Analytics</h1>
          </div>
          <p className="text-xs text-[#294B57]/80 mt-1">
            Aggregate clinical oversight and worker performance data for {report?.jurisdiction || 'your jurisdiction'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button onClick={fetchReports} variant="outline" size="sm" disabled={loading} className="text-xs">
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button
            onClick={handleDownloadCsv}
            variant="gold"
            size="sm"
            disabled={exporting}
            className="text-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            {exporting ? 'Exporting...' : 'Export Aggregate CSV'}
          </Button>
        </div>
      </div>

      {/* Aggregate Overview Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-[#FBF8F2] border-[#D8E6DA] rounded-2xl">
          <span className="text-[11px] font-semibold text-[#294B57] block">Supervised Workers</span>
          <span className="text-2xl font-black text-[#103342] mt-1 block">
            {report?.total_workers ?? 0}
          </span>
          <span className="text-[10px] text-[#294B57]/70 mt-0.5 block">Frontline healthcare cadre</span>
        </Card>

        <Card className="p-4 bg-[#FBF8F2] border-[#D8E6DA] rounded-2xl">
          <span className="text-[11px] font-semibold text-[#294B57] block">Registered Children</span>
          <span className="text-2xl font-black text-[#103342] mt-1 block">
            {report?.total_children ?? 0}
          </span>
          <span className="text-[10px] text-[#294B57]/70 mt-0.5 block">Under local oversight</span>
        </Card>

        <Card className="p-4 bg-[#FBF8F2] border-[#D8E6DA] rounded-2xl">
          <span className="text-[11px] font-semibold text-[#294B57] block">Completed Doses</span>
          <span className="text-2xl font-black text-[#007F68] mt-1 block">
            {report?.completed_vaccinations ?? 0}
          </span>
          <span className="text-[10px] text-[#294B57]/70 mt-0.5 block">
            Out of {report?.total_vaccinations ?? 0} scheduled
          </span>
        </Card>

        <Card className="p-4 bg-[#FBF8F2] border-[#D8E6DA] rounded-2xl">
          <span className="text-[11px] font-semibold text-[#294B57] block">Pending Follow-ups</span>
          <span className="text-2xl font-black text-[#B87D14] mt-1 block">
            {report?.pending_followups ?? 0}
          </span>
          <span className="text-[10px] text-[#294B57]/70 mt-0.5 block">
            {report?.overdue_vaccinations ?? 0} overdue doses
          </span>
        </Card>
      </div>

      {/* Grid: Worker Performance & Monthly Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Worker Performance Table */}
        <div className="lg:col-span-2">
          <Card className="p-5 bg-[#FBF8F2] border-[#D8E6DA] rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-[#007F68]" />
              <h3 className="text-sm font-bold text-[#103342]">Healthcare Worker Performance</h3>
            </div>

            {(!report?.worker_performance || report.worker_performance.length === 0) ? (
              <div className="py-8 text-center text-xs text-[#294B57]/70">
                No worker performance records found for this jurisdiction.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#EBF3ED] text-[#103342] border-b border-[#D8E6DA] font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Worker Name</th>
                      <th className="py-2.5 px-3 text-center">Assigned Children</th>
                      <th className="py-2.5 px-3 text-center">Doses Administered</th>
                      <th className="py-2.5 px-3 text-center">Pending Follow-ups</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D8E6DA]/60">
                    {report.worker_performance.map((w) => (
                      <tr key={w.worker_id} className="hover:bg-white/70">
                        <td className="py-2.5 px-3 font-bold text-[#103342]">
                          {w.worker_name}
                          {w.worker_id_code && (
                            <span className="block text-[10px] font-mono text-[#007F68] font-normal">
                              {w.worker_id_code}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-semibold text-[#103342]">
                          {w.assigned_children}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-[#007F68]">
                          {w.completed_vaccinations}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={
                              w.pending_followups > 0 ? 'font-bold text-[#B87D14]' : 'text-[#294B57]/60'
                            }
                          >
                            {w.pending_followups}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Trend Bar */}
        <div>
          <Card className="p-5 bg-[#FBF8F2] border-[#D8E6DA] rounded-2xl h-full">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-[#007F68]" />
              <h3 className="text-sm font-bold text-[#103342]">Dose Activity Trends</h3>
            </div>

            {(!report?.trends || report.trends.length === 0) ? (
              <div className="py-8 text-center text-xs text-[#294B57]/70">
                No trend data available.
              </div>
            ) : (
              <div className="space-y-3">
                {report.trends.map((t, i) => {
                  const pct = Math.round((t.completed_doses / maxTrend) * 100);
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs text-[#103342]">
                        <span className="font-medium">{t.month}</span>
                        <span className="font-bold">{t.completed_doses} doses</span>
                      </div>
                      <div className="w-full bg-[#E5ECE5] rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-[#007F68] h-2 rounded-full"
                          style={{ width: `${Math.max(pct, t.completed_doses > 0 ? 5 : 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
