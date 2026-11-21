import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { backendApi } from '../../services/backendApi';
import { useLanguage } from '../../contexts/LanguageContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';

import {
  History,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  Calendar,
  User,
  Baby,
  FileText,
  Clock,
  ArrowRight,
  Eye,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export function AuthorityAuditLogsPage() {
  const { t } = useLanguage();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (actionFilter !== 'ALL') params.action_type = actionFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const data = await backendApi.getSupervisorAuditLogs(params);
      setLogs(data || []);
    } catch (err) {
      setError(err.message || t('errors.serverError', 'Failed to retrieve audit trail records.'));
    } finally {
      setLoading(false);
    }
  }, [actionFilter, startDate, endDate, t]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        l.worker_name?.toLowerCase().includes(q) ||
        l.worker_id_code?.toLowerCase().includes(q) ||
        l.child_name?.toLowerCase().includes(q) ||
        (l.child_id && String(l.child_id).includes(q)) ||
        l.action_type?.toLowerCase().includes(q)
      );
    });
  }, [logs, searchQuery]);

  // Parse JSON previous and new values safely
  const parseJsonSafe = (str) => {
    if (!str) return null;
    try {
      return JSON.parse(str);
    } catch {
      return str;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-6 h-6 text-[#007F68]" />
            <h1 className="text-2xl font-bold text-[#103342]">{t('authority.auditLogsHeading', 'Patient Record Audit Trail')}</h1>
          </div>
          <p className="text-xs text-[#294B57]/80 mt-1">
            {t('authority.auditLogsSub', 'Server-authenticated clinical record change history within your jurisdiction')}
          </p>
        </div>

        <Button onClick={fetchLogs} variant="outline" size="sm" disabled={loading} className="text-xs self-start sm:self-auto">
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> {t('authority.refreshBtn', 'Refresh Trail')}
        </Button>
      </div>

      {/* Audit Notice Banner (Accurate, transparent, non-misleading) */}
      <Card className="p-4 bg-[#DDF0E3]/50 border-[#A8D5B5] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-[#007F68] shrink-0" />
          <p className="text-xs text-[#103342]">
            <span className="font-bold">{t('authority.auditTrailTitle', 'Audit Trail Notice')}:</span>{' '}
            {t('authority.auditTrailNotice', 'Operational change logs recorded by authorized health workers during vaccination and child care updates in this jurisdiction.')}
          </p>
        </div>
        <Badge variant="teal" size="sm" className="hidden sm:inline-flex">
          {t('status.normalPriority', 'Operational Log')}
        </Badge>
      </Card>

      {/* Error Banner */}
      {error && (
        <Card className="p-4 bg-[#FDF8EF] border-[#E57373]/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#D9534F] shrink-0" />
            <p className="text-xs text-[#103342]">{error}</p>
          </div>
          <Button onClick={fetchLogs} variant="primary" size="sm" className="text-xs">
            {t('common.retry', 'Retry')}
          </Button>
        </Card>
      )}

      {/* Filters Card */}
      <Card className="p-4 bg-[#FBF8F2] border-[#D8E6DA] space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#294B57]/50 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('authority.searchPlaceholder', 'Search worker, child, ID...')}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#D8E6DA] rounded-xl text-xs text-[#103342] focus:outline-none focus:ring-2 focus:ring-[#007F68]"
            />
          </div>

          {/* Action Filter */}
          <div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full bg-white border border-[#D8E6DA] rounded-xl px-3 py-1.5 text-xs text-[#103342] focus:outline-none focus:ring-2 focus:ring-[#007F68]"
            >
              <option value="ALL">{t('common.all', 'All Action Types')}</option>
              <option value="ADMINISTER_VACCINE">Administer Vaccine</option>
              <option value="COMPLETE_VACCINATION">Complete Vaccination</option>
              <option value="SCHEDULE_VACCINATION">Schedule Vaccination</option>
              <option value="CREATE_CHILD">Register Child</option>
              <option value="UPDATE_CHILD">Update Child Details</option>
              <option value="CREATE_FOLLOWUP">Create Follow-Up</option>
              <option value="UPDATE_FOLLOWUP">Update Follow-Up</option>
              <option value="RECORD_GROWTH">Record Growth</option>
              <option value="CREATE_APPOINTMENT">Create Appointment</option>
              <option value="UPDATE_APPOINTMENT">Update Appointment</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[#294B57]/70 whitespace-nowrap">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-white border border-[#D8E6DA] rounded-xl px-2 py-1.5 text-xs text-[#103342] focus:outline-none focus:ring-2 focus:ring-[#007F68]"
            />
          </div>

          {/* End Date */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[#294B57]/70 whitespace-nowrap">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-white border border-[#D8E6DA] rounded-xl px-2 py-1.5 text-xs text-[#103342] focus:outline-none focus:ring-2 focus:ring-[#007F68]"
            />
          </div>
        </div>
      </Card>

      {/* Logs Table */}
      {loading && logs.length === 0 ? (
        <div className="min-h-[30vh] flex flex-col items-center justify-center p-6 text-center">
          <RefreshCw className="w-8 h-8 text-[#007F68] animate-spin mb-3" />
          <p className="text-sm font-medium text-[#103342]">{t('common.loading', 'Fetching audit logs...')}</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <Card className="p-12 bg-[#FBF8F2] border-[#D8E6DA] text-center rounded-2xl">
          <History className="w-12 h-12 text-[#294B57]/40 mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#103342]">{t('authority.emptyAudit', 'No Audit Trail Records Found')}</h3>
          <p className="text-xs text-[#294B57]/70 mt-1 max-w-md mx-auto">
            {searchQuery || actionFilter !== 'ALL' || startDate || endDate
              ? t('authority.emptyAudit', 'No audit events match the specified search filters. Try clearing your filters.')
              : t('authority.emptyAudit', 'There are currently no recorded clinical modifications in this jurisdiction.')}
          </p>
        </Card>
      ) : (
        <Card className="p-0 bg-[#FBF8F2] border-[#D8E6DA] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#EBF3ED] text-[#103342] border-b border-[#D8E6DA] font-semibold">
                <tr>
                  <th className="py-3 px-4">{t('common.administeredDate', 'Date & Time (IST)')}</th>
                  <th className="py-3 px-4">{t('authority.assignedWorker', 'Authorized Worker')}</th>
                  <th className="py-3 px-4">{t('common.name', 'Patient / Child')}</th>
                  <th className="py-3 px-4">{t('authority.actionPerformed', 'Action Performed')}</th>
                  <th className="py-3 px-4">{t('authority.fieldsChanged', 'Fields Changed')}</th>
                  <th className="py-3 px-4 text-right">{t('common.actions', 'Details')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8E6DA]/60">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/70 transition-colors">
                    <td className="py-3 px-4 text-[#294B57] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#007F68]" />
                        <span>
                          {new Date(log.timestamp).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#DDF0E3] text-[#007F68] font-bold flex items-center justify-center shrink-0 text-xs">
                          {log.worker_name?.charAt(0) || 'W'}
                        </div>
                        <div>
                          <p className="font-bold text-[#103342]">{log.worker_name}</p>
                          {log.worker_id_code && (
                            <span className="text-[10px] text-[#007F68] font-mono">
                              {log.worker_id_code}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {log.child_name ? (
                        <div>
                          <p className="font-semibold text-[#103342]">{log.child_name}</p>
                          <span className="text-[10px] text-[#294B57]/60">ID #{log.child_id}</span>
                        </div>
                      ) : log.child_id ? (
                        <span className="font-mono text-[#294B57]">#{log.child_id}</span>
                      ) : (
                        <span className="text-[#294B57]/50">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge variant="teal" size="sm">
                        {log.action_type.replace(/_/g, ' ')}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 text-[#294B57] max-w-xs truncate">
                      {log.fields_changed || log.record_type}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Button
                        onClick={() => setSelectedLog(log)}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        <Eye className="w-3 h-3 mr-1 text-[#007F68]" /> {t('authority.viewChange', 'View Change')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Detailed Record Change Modal */}
      {selectedLog && (
        <Modal
          isOpen={Boolean(selectedLog)}
          onClose={() => setSelectedLog(null)}
          title={t('authority.changeDetails', 'Clinical Record Change Details')}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-[#EBF3ED] rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#007F68] tracking-wider block">
                  {t('authority.actionPerformed', 'Action Performed')}
                </span>
                <span className="text-sm font-bold text-[#103342]">
                  {selectedLog.action_type.replace(/_/g, ' ')}
                </span>
              </div>
              <Badge variant="teal">Record #{selectedLog.record_id || selectedLog.id}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-white border border-[#D8E6DA] rounded-xl">
                <span className="text-[#294B57]/70 block text-[11px]">{t('authority.assignedWorker', 'Performing Worker')}</span>
                <span className="font-bold text-[#103342] block mt-0.5">{selectedLog.worker_name}</span>
                {selectedLog.worker_id_code && (
                  <span className="text-[10px] text-[#007F68] font-mono block">
                    Staff Code: {selectedLog.worker_id_code}
                  </span>
                )}
              </div>

              <div className="p-2.5 bg-white border border-[#D8E6DA] rounded-xl">
                <span className="text-[#294B57]/70 block text-[11px]">{t('common.name', 'Affected Patient')}</span>
                <span className="font-bold text-[#103342] block mt-0.5">
                  {selectedLog.child_name || (selectedLog.child_id ? `Child #${selectedLog.child_id}` : 'General')}
                </span>
                {selectedLog.child_id && (
                  <span className="text-[10px] text-[#294B57]/70 block">
                    System ID: #{selectedLog.child_id}
                  </span>
                )}
              </div>
            </div>

            <div className="p-2.5 bg-white border border-[#D8E6DA] rounded-xl">
              <span className="text-[#294B57]/70 block text-[11px]">{t('common.administeredDate', 'Timestamp (UTC / Local)')}</span>
              <span className="font-semibold text-[#103342]">
                {new Date(selectedLog.timestamp).toISOString()} (UTC) &bull;{' '}
                {new Date(selectedLog.timestamp).toLocaleString('en-IN')} (IST)
              </span>
            </div>

            {/* Changed Values Comparison */}
            <div className="space-y-2 pt-2 border-t border-[#D8E6DA]">
              <span className="font-bold text-[#103342] block">{t('authority.fieldsChanged', 'Mutated Field Values')}:</span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Previous Values */}
                <div className="p-3 bg-[#FDF8EF] border border-[#F4B83F]/30 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-[#B87D14] uppercase tracking-wider block">
                    {t('authority.beforeValue', 'Previous Value')}
                  </span>
                  <pre className="font-mono text-[11px] text-[#103342] whitespace-pre-wrap overflow-x-auto">
                    {selectedLog.previous_values
                      ? JSON.stringify(parseJsonSafe(selectedLog.previous_values), null, 2)
                      : t('authority.initialOrUnchanged', 'None (Initial Creation)')}
                  </pre>
                </div>

                {/* Updated Values */}
                <div className="p-3 bg-[#DDF0E3] border border-[#007F68]/30 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-[#007F68] uppercase tracking-wider block">
                    {t('authority.afterValue', 'Updated Value')}
                  </span>
                  <pre className="font-mono text-[11px] text-[#103342] whitespace-pre-wrap overflow-x-auto">
                    {selectedLog.new_values
                      ? JSON.stringify(parseJsonSafe(selectedLog.new_values), null, 2)
                      : 'None'}
                  </pre>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#D8E6DA]">
              <Button onClick={() => setSelectedLog(null)} variant="primary" size="sm">
                {t('authority.closeView', 'Close View')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
