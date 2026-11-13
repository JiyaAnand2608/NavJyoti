
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/common/Card';

import {
  Users,
  Syringe,
  CalendarCheck,
  ClipboardCheck,
  ShieldCheck,
  Download,
  RefreshCw,
  AlertCircle,
  Activity,
  UserRoundCheck,
} from 'lucide-react';

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8000';

const TOKEN_KEY = 'navjyoti_access_token';

function MetricCard({ label, value, description, icon: Icon }) {
  return (
    <Card className="p-5 bg-[#FBF8F2] border-[#D8E6DA]">
      <div className="flex justify-between items-start gap-3">
        <div>
          <p className="text-xs font-medium text-[#294B57]">
            {label}
          </p>

          <div className="text-3xl font-bold text-[#103342] mt-2">
            {value}
          </div>

          <p className="text-[11px] text-[#294B57]/70 mt-2">
            {description}
          </p>
        </div>

        <div className="w-10 h-10 rounded-xl bg-[#DDF0E3] text-[#007F68] flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
}

export function SupervisorAnalyticsPage() {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnalytics = useCallback(
    async (signal) => {
      if (user?.role !== 'supervisor') {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const token = sessionStorage.getItem(TOKEN_KEY);

        if (!token) {
          throw new Error('Please sign in again.');
        }

        const response = await fetch(
          `${API_URL}/supervisor/dashboard`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal,
          }
        );

        const result = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            typeof result?.detail === 'string'
              ? result.detail
              : `Unable to load analytics (${response.status})`
          );
        }

        const requiredFields = [
          'total_children',
          'total_workers',
          'total_vaccinations',
          'completed_vaccinations',
          'pending_followups',
          'upcoming_appointments',
        ];

        const validResponse = requiredFields.every(
          (field) =>
            typeof result?.[field] === 'number' &&
            Number.isFinite(result[field]) &&
            result[field] >= 0
        );

        if (!validResponse) {
          throw new Error(
            'The backend returned an unexpected analytics response.'
          );
        }

        if (!signal?.aborted) {
          setStats(result);
        }
      } catch (err) {
        if (err.name === 'AbortError') return;

        setError(err.message || 'Unable to load analytics.');
        setStats(null);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [user?.role]
  );

  useEffect(() => {
    const controller = new AbortController();

    loadAnalytics(controller.signal);

    return () => controller.abort();
  }, [loadAnalytics, user?.id]);

  const handleExportCSV = () => {
    if (!stats) return;

    const headers = [
      'Metric',
      'Count',
    ];

    const rows = [
      ['Registered Children', stats.total_children],
      ['Registered Health Workers', stats.total_workers],
      ['Vaccination Records', stats.total_vaccinations],
      ['Completed Vaccination Records', stats.completed_vaccinations],
      ['Pending Follow-Ups', stats.pending_followups],
      ['Upcoming Appointments', stats.upcoming_appointments],
    ];

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\r\n');

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = `navjyoti_supervisor_summary_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  };

  if (user?.role !== 'supervisor') {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center bg-[#FBF8F2] border border-[#D8E6DA] rounded-2xl">
        <ShieldCheck className="w-10 h-10 mx-auto text-[#007F68] mb-3" />

        <h2 className="font-bold text-[#103342]">
          Supervisor Access Required
        </h2>

        <p className="text-xs text-[#294B57] mt-2">
          Sign in with an authorized Supervisor account.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-[#294B57]">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-1 mb-3 rounded-full bg-[#DDF0E3] border border-[#D8E6DA] text-[10px] text-[#007F68] font-bold uppercase tracking-wider">
            Supervisor Portal
          </span>

          <h1 className="text-2xl sm:text-3xl font-bold text-[#103342] font-serif">
            Supervisor & Health Authority Analytics
          </h1>

          <p className="text-xs sm:text-sm text-[#294B57] mt-2">
            Aggregate health records retrieved from NavJyoti's
            FastAPI and PostgreSQL backend.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => loadAnalytics()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-[#D8E6DA] text-[#007F68] text-xs font-semibold hover:bg-[#F0EBE1] disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={!stats || loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#007F68] text-white text-xs font-semibold hover:bg-[#005F52] disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export Aggregate CSV
          </button>
        </div>
      </div>

      {/* PRIVACY NOTICE */}
      <div className="p-4 rounded-2xl bg-[#DDF0E3]/70 text-xs text-[#005F52] border border-[#D8E6DA] flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 shrink-0" />

        <p>
          <strong>Aggregate reporting:</strong> This page displays
          overall counts without listing children's names or medical
          histories. Access permissions are checked by FastAPI.
          This prototype has not yet undergone a formal privacy or
          regulatory compliance audit.
        </p>
      </div>

      {/* ERROR */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2"
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div className="p-5 bg-[#FBF8F2] rounded-2xl border border-[#D8E6DA] text-xs">
          Loading PostgreSQL analytics...
        </div>
      )}

      {/* LIVE METRICS */}
      {!loading && stats && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">

            <MetricCard
              label="Registered Children"
              value={stats.total_children}
              description="Total children in the database"
              icon={Users}
            />

            <MetricCard
              label="Health Workers"
              value={stats.total_workers}
              description="Registered worker accounts"
              icon={UserRoundCheck}
            />

            <MetricCard
              label="Vaccination Records"
              value={stats.total_vaccinations}
              description="Stored vaccine records, not schedule coverage"
              icon={Syringe}
            />

            <MetricCard
              label="Completed Vaccination Records"
              value={stats.completed_vaccinations}
              description="Records marked administered"
              icon={ShieldCheck}
            />

            <MetricCard
              label="Pending Follow-Ups"
              value={stats.pending_followups}
              description="Follow-up tasks marked pending"
              icon={ClipboardCheck}
            />

            <MetricCard
              label="Upcoming Appointments"
              value={stats.upcoming_appointments}
              description="Future requested, approved, or rescheduled visits"
              icon={CalendarCheck}
            />

          </div>

          {/* RECORD SUMMARY */}
          <Card className="bg-[#FBF8F2] border-[#D8E6DA] overflow-hidden">
            <div className="p-5 border-b border-[#D8E6DA]">
              <h2 className="font-bold text-sm text-[#103342] font-serif">
                Database Record Summary
              </h2>

              <p className="text-xs text-[#294B57] mt-1">
                Current aggregate totals from the Supervisor API.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F0EBE1] text-[#294B57] uppercase">
                  <tr>
                    <th className="px-5 py-3">Metric</th>
                    <th className="px-5 py-3 text-right">Total</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#D8E6DA]">
                  {[
                    ['Children registered', stats.total_children],
                    ['Health workers registered', stats.total_workers],
                    ['Vaccination records', stats.total_vaccinations],
                    ['Completed vaccine records', stats.completed_vaccinations],
                    ['Pending follow-ups', stats.pending_followups],
                    ['Upcoming appointments', stats.upcoming_appointments],
                  ].map(([label, value]) => (
                    <tr key={label}>
                      <td className="px-5 py-3">{label}</td>
                      <td className="px-5 py-3 text-right font-bold text-[#103342]">
                        {value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* LIMITATIONS */}
          <Card className="p-5 bg-[#FBF8F2] border-[#D8E6DA]">
            <div className="flex items-start gap-3">
              <Activity className="w-5 h-5 text-[#007F68] shrink-0" />

              <div>
                <h2 className="font-bold text-sm text-[#103342]">
                  Reporting Scope
                </h2>

                <p className="text-xs text-[#294B57] mt-2 leading-relaxed">
                  These counts come from the database. They do not
                  establish vaccination coverage, clinical risk,
                  missed doses, or immunisation completion for
                  individual children.
                </p>

                <p className="text-xs text-[#294B57] mt-2 leading-relaxed">
                  Verified village-level comparisons and worker
                  workload breakdowns require additional backend
                  aggregate reporting endpoints.
                </p>
              </div>
            </div>
          </Card>
        </>
      )}

      {!loading && !stats && !error && (
        <p className="text-xs text-[#294B57]">
          No analytics data is available.
        </p>
      )}

      <p className="text-[11px] text-[#294B57]/70">
        NavJyoti hackathon prototype — use fictional test records only.
      </p>
    </div>
  );
}
