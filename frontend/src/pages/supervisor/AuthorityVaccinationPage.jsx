import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { backendApi } from '../../services/backendApi';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';

import {
  Syringe,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Baby,
} from 'lucide-react';

export function AuthorityVaccinationPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchVaccinations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await backendApi.getSupervisorVaccinations();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to retrieve vaccination monitoring records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVaccinations();
  }, [fetchVaccinations]);

  if (loading && !data) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <RefreshCw className="w-8 h-8 text-[#007F68] animate-spin mb-3" />
        <p className="text-sm font-medium text-[#103342]">Loading vaccination monitoring data...</p>
        <p className="text-xs text-[#294B57]/70 mt-1">Aggregating dose logs and overdue tracking from PostgreSQL</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6 max-w-xl mx-auto text-center">
        <Card className="p-6 bg-[#FDF8EF] border-[#E57373]/30">
          <AlertCircle className="w-12 h-12 text-[#D9534F] mx-auto mb-3" />
          <h2 className="text-base font-bold text-[#103342]">Vaccination Monitoring Unavailable</h2>
          <p className="text-xs text-[#294B57] mt-1 mb-4">{error}</p>
          <Button onClick={fetchVaccinations} variant="primary" size="sm" className="text-xs">
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  const maxTimeline = Math.max(...(data?.timeline?.map((t) => t.doses_administered) || [1]), 1);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Syringe className="w-6 h-6 text-[#007F68]" />
            <h1 className="text-2xl font-bold text-[#103342]">Vaccination Monitoring</h1>
          </div>
          <p className="text-xs text-[#294B57]/80 mt-1">
            Dose delivery tracking, overdue schedules, and frontline worker administration breakdown
          </p>
        </div>

        <Button onClick={fetchVaccinations} variant="outline" size="sm" disabled={loading} className="text-xs self-start sm:self-auto">
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Records
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-[#FBF8F2] border-[#D8E6DA] rounded-2xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-[#294B57]">Total Scheduled</p>
              <div className="text-3xl font-black text-[#103342] mt-2">
                {data?.total_scheduled ?? 0}
              </div>
              <p className="text-[11px] text-[#294B57]/70 mt-1">Recorded in database</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#DDF0E3] text-[#007F68] flex items-center justify-center shrink-0">
              <Syringe className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-[#FBF8F2] border-[#D8E6DA] rounded-2xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-[#294B57]">Completed Doses</p>
              <div className="text-3xl font-black text-[#007F68] mt-2">
                {data?.completed ?? 0}
              </div>
              <p className="text-[11px] text-[#294B57]/70 mt-1">Administered & verified</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#DDF0E3] text-[#007F68] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-[#FBF8F2] border-[#D8E6DA] rounded-2xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-[#294B57]">Pending Doses</p>
              <div className="text-3xl font-black text-[#B87D14] mt-2">
                {data?.pending ?? 0}
              </div>
              <p className="text-[11px] text-[#294B57]/70 mt-1">Upcoming within schedule</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#FEF9C3] text-[#A16207] flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-[#FBF8F2] border-[#D8E6DA] rounded-2xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-[#294B57]">Overdue Doses</p>
              <div className="text-3xl font-black text-[#D9534F] mt-2">
                {data?.overdue ?? 0}
              </div>
              <p className="text-[11px] text-[#294B57]/70 mt-1">Missed vaccination window</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#FDECEC] text-[#D9534F] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Grid: Administration Timeline & Worker Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline Chart */}
        <Card className="p-5 bg-[#FBF8F2] border-[#D8E6DA] rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[#007F68]" />
            <h3 className="text-sm font-bold text-[#103342]">Doses Administered Over Time</h3>
          </div>

          {(!data?.timeline || data.timeline.length === 0) ? (
            <div className="py-12 text-center text-xs text-[#294B57]/70">
              No historical dose administration records found.
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {data.timeline.map((item, idx) => {
                const percent = Math.round((item.doses_administered / maxTimeline) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-[#103342]">
                      <span>{item.month}</span>
                      <span className="font-bold">{item.doses_administered} doses</span>
                    </div>
                    <div className="w-full bg-[#E5ECE5] rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-[#007F68] h-2.5 rounded-full transition-all"
                        style={{ width: `${Math.max(percent, item.doses_administered > 0 ? 5 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Worker Performance Distribution */}
        <Card className="p-5 bg-[#FBF8F2] border-[#D8E6DA] rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#103342]" />
              <h3 className="text-sm font-bold text-[#103342]">Activity by Healthcare Worker</h3>
            </div>
            <Link to="/supervisor/workers">
              <Button variant="ghost" size="sm" className="text-xs">
                View All <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          {(!data?.worker_breakdown || data.worker_breakdown.length === 0) ? (
            <div className="py-12 text-center text-xs text-[#294B57]/70">
              No healthcare workers active in this jurisdiction yet.
            </div>
          ) : (
            <div className="space-y-3">
              {data.worker_breakdown.map((w) => (
                <div
                  key={w.worker_id}
                  className="p-3 bg-white rounded-xl border border-[#D8E6DA] flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-[#103342] text-xs">{w.worker_name}</p>
                    <span className="text-[10px] text-[#294B57]/70">
                      {w.village ? `${w.village} Area` : 'Area Not Assigned'} {w.worker_id_code && `• ${w.worker_id_code}`}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-[#007F68] block">
                      {w.completed_doses}
                    </span>
                    <span className="text-[10px] text-[#294B57]/70">doses logged</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Children Requiring Follow-Up Table */}
      <Card className="p-5 bg-[#FBF8F2] border-[#D8E6DA] rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#D9534F]" />
            <div>
              <h3 className="text-sm font-bold text-[#103342]">Children Requiring Follow-Up (Overdue Doses)</h3>
              <p className="text-[11px] text-[#294B57]/70">Eligible children who have exceeded their vaccine administration deadline</p>
            </div>
          </div>
        </div>

        {(!data?.children_requiring_followup || data.children_requiring_followup.length === 0) ? (
          <div className="py-8 text-center text-xs text-[#007F68] font-medium">
            <CheckCircle2 className="w-8 h-8 text-[#007F68] mx-auto mb-2 opacity-80" />
            No children are currently overdue for vaccinations in this jurisdiction!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#EBF3ED] text-[#103342] border-b border-[#D8E6DA] font-semibold">
                <tr>
                  <th className="py-3 px-4">Child Name</th>
                  <th className="py-3 px-4">Village / Area</th>
                  <th className="py-3 px-4">Assigned Worker</th>
                  <th className="py-3 px-4">Overdue Doses</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8E6DA]/60">
                {data.children_requiring_followup.map((ch) => (
                  <tr key={ch.child_id} className="hover:bg-white/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-[#103342]">
                      {ch.child_name}
                      <span className="block text-[10px] text-[#294B57]/70 font-normal">
                        Child #{ch.child_id}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#294B57]">{ch.village || 'N/A'}</td>
                    <td className="py-3 px-4 font-semibold text-[#103342]">
                      {ch.assigned_worker_name || 'Unassigned'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {ch.overdue_vaccines.map((v, i) => (
                          <Badge key={i} variant="overdue" size="sm">
                            {v}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link to={`/supervisor/children/${ch.child_id}`}>
                        <Button variant="outline" size="sm" className="text-xs">
                          Inspect <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
