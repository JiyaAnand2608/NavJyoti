import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { backendApi } from '../../services/backendApi';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';

import {
  Users,
  Syringe,
  CalendarCheck,
  ShieldAlert,
  ClipboardList,
  RefreshCw,
  AlertCircle,
  Activity,
  History,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export function AuthorityDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await backendApi.getSupervisorDashboard();
      setStats(data);
    } catch (err) {
      setError(err.message || 'Failed to load supervisor dashboard from database.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading && !stats) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <RefreshCw className="w-8 h-8 text-[#007F68] animate-spin mb-3" />
        <p className="text-sm font-medium text-[#103342]">Connecting to PostgreSQL database...</p>
        <p className="text-xs text-[#294B57]/70 mt-1">Retrieving jurisdiction statistics and worker logs</p>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card className="p-6 bg-[#FDF8EF] border-[#E57373]/30 text-center">
          <AlertCircle className="w-12 h-12 text-[#D9534F] mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#103342]">Unable to Load Authority Dashboard</h2>
          <p className="text-xs text-[#294B57] mt-2 mb-4">{error}</p>
          <Button onClick={fetchDashboard} variant="primary" size="md">
            <RefreshCw className="w-4 h-4 mr-2" /> Try Again
          </Button>
        </Card>
      </div>
    );
  }

  const kpis = [
    {
      label: 'Supervised Workers',
      value: stats?.total_workers ?? 0,
      sub: 'Frontline healthcare workers',
      icon: Users,
      color: 'bg-[#DDF0E3] text-[#007F68]',
      link: '/supervisor/workers',
    },
    {
      label: 'Registered Children',
      value: stats?.total_children ?? 0,
      sub: 'In assigned jurisdiction',
      icon: ClipboardList,
      color: 'bg-[#DDF0E3] text-[#007F68]',
      link: '/supervisor/children',
    },
    {
      label: 'Completed Doses',
      value: stats?.completed_vaccinations ?? 0,
      sub: `Out of ${stats?.total_vaccinations ?? 0} scheduled records`,
      icon: Syringe,
      color: 'bg-[#E0F2FE] text-[#0284C7]',
      link: '/supervisor/vaccinations',
    },
    {
      label: 'Pending Follow-Ups',
      value: stats?.pending_followups ?? 0,
      sub: stats?.overdue_followups ? `${stats.overdue_followups} overdue cases` : 'All on track',
      icon: ShieldAlert,
      color: stats?.overdue_followups ? 'bg-[#FDECEC] text-[#D9534F]' : 'bg-[#FEF9C3] text-[#A16207]',
      link: '/supervisor/follow-ups',
    },
  ];

  const maxTrend = Math.max(...(stats?.vaccination_trends?.map((t) => t.completed) || [1]), 1);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#103342] to-[#005F52] text-white p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-[#A8D5B5]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A8D5B5]">
              Authority Supervision Portal
            </span>
          </div>
          <h1 className="text-2xl font-bold">Health Authority Overview</h1>
          <p className="text-xs text-white/80 mt-1 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-[#A8D5B5]" />
            Jurisdiction: <span className="font-semibold text-[#A8D5B5]">{stats?.jurisdiction || user?.jurisdiction || 'Assigned District'}</span>
            <span className="text-white/40">|</span>
            Supervisor: <span className="font-semibold text-white">{user?.name || 'Healthcare Officer'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={fetchDashboard}
            variant="outline"
            size="sm"
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          <Link to="/supervisor/reports">
            <Button variant="gold" size="sm" className="text-xs">
              Generate Report
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Link key={idx} to={kpi.link} className="group">
              <Card className="p-5 bg-[#FBF8F2] border-[#D8E6DA] hover:border-[#007F68] hover:shadow-md transition-all rounded-2xl h-full flex flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-[#294B57]">{kpi.label}</p>
                    <div className="text-3xl font-black text-[#103342] mt-2 group-hover:text-[#007F68] transition-colors">
                      {kpi.value}
                    </div>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${kpi.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-[#D8E6DA]/50 flex items-center justify-between text-xs text-[#294B57]/80">
                  <span className="truncate">{kpi.sub}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#294B57]/50 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Operations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Activity Trends Chart */}
        <div className="lg:col-span-2">
          <Card className="p-5 bg-[#FBF8F2] border-[#D8E6DA] rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#007F68]" />
                <h3 className="text-sm font-bold text-[#103342]">Vaccination Activity (Past 6 Months)</h3>
              </div>
              <Badge variant="teal">PostgreSQL Records</Badge>
            </div>

            {(!stats?.vaccination_trends || stats.vaccination_trends.length === 0) ? (
              <div className="py-12 text-center text-xs text-[#294B57]/70">
                No historical vaccination records recorded in this jurisdiction yet.
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {stats.vaccination_trends.map((item, index) => {
                  const percent = Math.round((item.completed / maxTrend) * 100);
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-[#103342]">
                        <span>{item.month}</span>
                        <span>{item.completed} doses</span>
                      </div>
                      <div className="w-full bg-[#E5ECE5] rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-[#007F68] h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(percent, item.completed > 0 ? 5 : 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Operational Status Breakdown */}
        <div>
          <Card className="p-5 bg-[#FBF8F2] border-[#D8E6DA] rounded-2xl h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-[#103342]" />
                <h3 className="text-sm font-bold text-[#103342]">Case Follow-Up Status</h3>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-white rounded-xl border border-[#D8E6DA] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#B87D14]" />
                    <span className="text-xs font-medium text-[#103342]">Pending Follow-Ups</span>
                  </div>
                  <span className="text-sm font-bold text-[#103342]">
                    {stats?.followup_status_breakdown?.pending ?? 0}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#D8E6DA] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#D9534F]" />
                    <span className="text-xs font-medium text-[#103342]">Overdue Cases</span>
                  </div>
                  <span className="text-sm font-bold text-[#D9534F]">
                    {stats?.followup_status_breakdown?.overdue ?? 0}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#D8E6DA] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#007F68]" />
                    <span className="text-xs font-medium text-[#103342]">Completed / Resolved</span>
                  </div>
                  <span className="text-sm font-bold text-[#007F68]">
                    {stats?.followup_status_breakdown?.completed ?? 0}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#D8E6DA] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CalendarCheck className="w-4 h-4 text-[#0284C7]" />
                    <span className="text-xs font-medium text-[#103342]">Upcoming Appointments</span>
                  </div>
                  <span className="text-sm font-bold text-[#0284C7]">
                    {stats?.upcoming_appointments ?? 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#D8E6DA]">
              <Link to="/supervisor/alerts">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-[#B87D14]" /> View Operational Alerts
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Worker Activity Audit Feed */}
      <Card className="p-5 bg-[#FBF8F2] border-[#D8E6DA] rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#007F68]" />
            <div>
              <h3 className="text-sm font-bold text-[#103342]">Recent Healthcare Worker Activity</h3>
              <p className="text-[11px] text-[#294B57]/70">Directly recorded in the patient record audit trail</p>
            </div>
          </div>
          <Link to="/supervisor/audit-logs">
            <Button variant="ghost" size="sm" className="text-xs">
              View Complete Audit Trail <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        {(!stats?.recent_activity || stats.recent_activity.length === 0) ? (
          <div className="py-8 text-center text-xs text-[#294B57]/70">
            No worker clinical activity has been recorded in this jurisdiction yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#D8E6DA] text-[#294B57] font-semibold">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Worker</th>
                  <th className="py-2.5 px-3">Child / Record</th>
                  <th className="py-2.5 px-3">Action Type</th>
                  <th className="py-2.5 px-3">Fields Changed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8E6DA]/50">
                {stats.recent_activity.map((act) => (
                  <tr key={act.id} className="hover:bg-white/60 transition-colors">
                    <td className="py-2.5 px-3 text-[#294B57] whitespace-nowrap">
                      {new Date(act.timestamp).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#103342] whitespace-nowrap">
                      {act.worker_name}
                      {act.worker_id_code && (
                        <span className="block text-[10px] text-[#294B57]/60 font-normal">
                          {act.worker_id_code}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-[#103342] font-medium whitespace-nowrap">
                      {act.child_name || (act.child_id ? `Child #${act.child_id}` : 'General')}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <Badge variant="teal" size="sm">
                        {act.action_type.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-[#294B57] max-w-xs truncate">
                      {act.fields_changed || act.record_type}
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
