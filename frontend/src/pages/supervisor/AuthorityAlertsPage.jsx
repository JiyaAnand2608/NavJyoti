import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { backendApi } from '../../services/backendApi';
import { useLanguage } from '../../contexts/LanguageContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';

import {
  Bell,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Clock,
  CheckCircle2,
  ExternalLink,
  Filter,
  ShieldAlert,
  Calendar,
  FileQuestion,
} from 'lucide-react';

export function AuthorityAlertsPage() {
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await backendApi.getSupervisorAlerts();
      setAlerts(data || []);
    } catch (err) {
      setError(err.message || t('errors.serverError', 'Failed to retrieve operational alerts.'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const filteredAlerts = useMemo(() => {
    if (severityFilter === 'ALL') return alerts;
    return alerts.filter((a) => a.severity === severityFilter);
  }, [alerts, severityFilter]);

  const highCount = alerts.filter((a) => a.severity === 'high').length;
  const mediumCount = alerts.filter((a) => a.severity === 'medium').length;

  if (loading && alerts.length === 0) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <RefreshCw className="w-8 h-8 text-[#007F68] animate-spin mb-3" />
        <p className="text-sm font-medium text-[#103342]">{t('common.loading', 'Scanning jurisdiction database for operational alerts...')}</p>
        <p className="text-xs text-[#294B57]/70 mt-1">{t('authority.alertsSub', 'Analyzing overdue follow-ups and priority cases')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#007F68]" />
            <h1 className="text-2xl font-bold text-[#103342]">{t('authority.alertsHeading', 'Operational Alerts')}</h1>
          </div>
          <p className="text-xs text-[#294B57]/80 mt-1">
            {t('authority.alertsSub', 'Automated health alerts computed dynamically from real patient and worker records')}
          </p>
        </div>

        <Button onClick={fetchAlerts} variant="outline" size="sm" disabled={loading} className="text-xs self-start sm:self-auto">
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> {t('authority.refreshBtn', 'Refresh Alerts')}
        </Button>
      </div>

      {/* Summary Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-white border border-[#D8E6DA] rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-[#294B57]/70 font-medium">{t('authority.activeAlerts', 'Total Active Alerts')}</span>
            <span className="text-xl font-bold text-[#103342] block mt-0.5">{alerts.length}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#DDF0E3] text-[#007F68] flex items-center justify-center font-bold">
            {alerts.length}
          </div>
        </div>

        <div className="p-4 bg-white border border-[#D8E6DA] rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-[#294B57]/70 font-medium">{t('authority.highSeverityFlagged', 'High Severity Flagged')}</span>
            <span className="text-xl font-bold text-[#D9534F] block mt-0.5">{highCount}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#FDECEC] text-[#D9534F] flex items-center justify-center font-bold">
            {highCount}
          </div>
        </div>

        <div className="p-4 bg-white border border-[#D8E6DA] rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-[#294B57]/70 font-medium">{t('authority.mediumPriorityAttention', 'Medium Priority Attention')}</span>
            <span className="text-xl font-bold text-[#B87D14] block mt-0.5">{mediumCount}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#FEF9C3] text-[#A16207] flex items-center justify-center font-bold">
            {mediumCount}
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <Card className="p-4 bg-[#FDF8EF] border-[#E57373]/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#D9534F] shrink-0" />
            <p className="text-xs text-[#103342]">{error}</p>
          </div>
          <Button onClick={fetchAlerts} variant="primary" size="sm" className="text-xs">
            {t('common.retry', 'Retry')}
          </Button>
        </Card>
      )}

      {/* Filter */}
      <Card className="p-3 bg-[#FBF8F2] border-[#D8E6DA] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#294B57]/60" />
          <span className="text-xs font-semibold text-[#103342]">{t('common.filter', 'Filter Severity')}:</span>
        </div>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="bg-white border border-[#D8E6DA] rounded-xl px-3 py-1.5 text-xs text-[#103342] focus:outline-none focus:ring-2 focus:ring-[#007F68]"
        >
          <option value="ALL">{t('authority.filterAllSeverities', 'All Severities')} ({alerts.length})</option>
          <option value="high">{t('authority.highSeverity', 'High Severity')} ({highCount})</option>
          <option value="medium">{t('authority.mediumSeverity', 'Medium Priority')} ({mediumCount})</option>
          <option value="low">{t('authority.lowSeverity', 'Low Priority')}</option>
        </select>
      </Card>

      {/* Alerts Feed */}
      {filteredAlerts.length === 0 ? (
        <Card className="p-12 bg-[#FBF8F2] border-[#D8E6DA] text-center rounded-2xl">
          <CheckCircle2 className="w-12 h-12 text-[#007F68] mx-auto mb-3 opacity-80" />
          <h3 className="text-base font-bold text-[#103342]">{t('authority.emptyAlerts', 'No Operational Alerts Detected')}</h3>
          <p className="text-xs text-[#294B57]/70 mt-1 max-w-sm mx-auto">
            {t('authority.emptyAlerts', 'All clinical follow-ups and patient records within your jurisdiction are currently up to date.')}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <Card
              key={alert.id}
              className={`p-4 border rounded-2xl transition-all ${
                alert.severity === 'high'
                  ? 'bg-[#FDF8F8] border-[#FBD5D5]'
                  : alert.severity === 'medium'
                  ? 'bg-[#FEFDF8] border-[#FEF08A]'
                  : 'bg-[#FBF8F2] border-[#D8E6DA]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      alert.severity === 'high'
                        ? 'bg-[#FDECEC] text-[#D9534F]'
                        : alert.severity === 'medium'
                        ? 'bg-[#FEF9C3] text-[#A16207]'
                        : 'bg-[#DDF0E3] text-[#007F68]'
                    }`}
                  >
                    {alert.alert_type === 'overdue_followup' ? (
                      <Clock className="w-5 h-5" />
                    ) : alert.alert_type === 'high_priority' ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : alert.alert_type === 'unresolved_appointment' ? (
                      <Calendar className="w-5 h-5" />
                    ) : (
                      <FileQuestion className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-[#103342]">{alert.title}</h4>
                      <Badge
                        variant={
                          alert.severity === 'high'
                            ? 'overdue'
                            : alert.severity === 'medium'
                            ? 'dueSoon'
                            : 'teal'
                        }
                        size="sm"
                      >
                        {alert.severity === 'high'
                          ? t('authority.highSeverity', 'HIGH')
                          : alert.severity === 'medium'
                          ? t('authority.mediumSeverity', 'MEDIUM')
                          : t('authority.lowSeverity', 'LOW')}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#294B57] mt-1">{alert.description}</p>
                    <div className="flex items-center gap-3 text-[11px] text-[#294B57]/60 mt-1.5">
                      <span>Detected: {new Date(alert.created_at).toLocaleDateString('en-IN')}</span>
                      {alert.due_date && <span>&bull; Due Date: {alert.due_date}</span>}
                    </div>
                  </div>
                </div>

                {alert.child_id && (
                  <Link to={`/supervisor/children/${alert.child_id}`} className="self-end sm:self-center">
                    <Button variant="outline" size="sm" className="text-xs">
                      {t('authority.inspect', 'Inspect Record')} <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
