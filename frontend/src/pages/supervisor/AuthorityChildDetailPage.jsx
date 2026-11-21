import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { backendApi } from '../../services/backendApi';
import { useLanguage } from '../../contexts/LanguageContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';

import {
  ArrowLeft,
  Baby,
  Syringe,
  CalendarCheck,
  ShieldAlert,
  ClipboardList,
  RefreshCw,
  AlertCircle,
  History,
  MapPin,
  User,
  HeartPulse,
  Activity,
  FileCheck2,
  Clock,
  ExternalLink,
} from 'lucide-react';

export function AuthorityChildDetailPage() {
  const { id } = useParams();
  const { t } = useLanguage();
  const [child, setChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('vaccines'); // 'vaccines' | 'followups' | 'growth' | 'appointments' | 'audit'

  const fetchChildDetail = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await backendApi.getSupervisorChildDetail(id);
      setChild(data);
    } catch (err) {
      setError(err.message || t('errors.serverError', 'Failed to retrieve child health record.'));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    fetchChildDetail();
  }, [fetchChildDetail]);

  if (loading && !child) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <RefreshCw className="w-8 h-8 text-[#007F68] animate-spin mb-3" />
        <p className="text-sm font-medium text-[#103342]">{t('common.loading', 'Retrieving child clinical records...')}</p>
        <p className="text-xs text-[#294B57]/70 mt-1">{t('authority.childHealthRecordSub', 'Verifying jurisdiction access permissions')}</p>
      </div>
    );
  }

  if (error && !child) {
    return (
      <div className="p-6 max-w-xl mx-auto text-center">
        <Card className="p-6 bg-[#FDF8EF] border-[#E57373]/30">
          <AlertCircle className="w-12 h-12 text-[#D9534F] mx-auto mb-3" />
          <h2 className="text-base font-bold text-[#103342]">{t('errors.recordNotFound', 'Record Not Found')}</h2>
          <p className="text-xs text-[#294B57] mt-1 mb-4">{error}</p>
          <div className="flex justify-center gap-3">
            <Link to="/supervisor/children">
              <Button variant="outline" size="sm" className="text-xs">
                {t('authority.backToRegistry', 'Back to Registry')}
              </Button>
            </Link>
            <Button onClick={fetchChildDetail} variant="primary" size="sm" className="text-xs">
              {t('common.retry', 'Retry')}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const completedCount = child?.vaccinations?.filter((v) => v.completed)?.length ?? 0;
  const totalCount = child?.vaccinations?.length ?? 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link to="/supervisor/children">
          <Button variant="outline" size="sm" className="text-xs">
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> {t('authority.backToRegistry', 'Back to Registry')}
          </Button>
        </Link>
        <span className="text-xs text-[#294B57]/50">/</span>
        <span className="text-xs font-semibold text-[#103342]">{t('authority.childHealthRecord', 'Child Health Record')}</span>
      </div>

      {/* Child Summary Card */}
      <Card className="p-6 bg-[#FBF8F2] border-[#D8E6DA] rounded-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#DDF0E3] text-[#007F68] flex items-center justify-center shrink-0 shadow-xs">
              <Baby className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#103342]">{child?.name}</h1>
                <Badge variant={child?.priority_level === 'red' ? 'overdue' : 'upToDate'} size="sm">
                  {child?.priority_level === 'red' ? t('status.highPriority', 'High Priority') : t('status.normalPriority', 'Normal')}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#294B57] mt-1.5">
                <span className="font-semibold text-[#103342]">{child?.age_display}</span>
                <span className="text-[#294B57]/60">&bull;</span>
                <span>{t('common.dob', 'DOB')}: {child?.date_of_birth}</span>
                <span className="text-[#294B57]/60">&bull;</span>
                <span>{child?.gender || '—'}</span>
                <span className="text-[#294B57]/60">&bull;</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#007F68]" />
                  {child?.village || t('common.village', 'Area N/A')}
                </span>
              </div>
            </div>
          </div>

          <Button onClick={fetchChildDetail} variant="outline" size="sm" disabled={loading} className="text-xs self-start sm:self-auto">
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> {t('common.refresh', 'Refresh')}
          </Button>
        </div>

        {/* Clinical Parameters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-[#D8E6DA]">
          <div className="p-3 bg-white rounded-xl border border-[#D8E6DA]">
            <span className="text-[11px] text-[#294B57]/70 block">Blood Group</span>
            <span className="text-sm font-bold text-[#103342] mt-0.5 block">
              {child?.blood_group || 'Not recorded'}
            </span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-[#D8E6DA]">
            <span className="text-[11px] text-[#294B57]/70 block">Birth Weight</span>
            <span className="text-sm font-bold text-[#103342] mt-0.5 block">
              {child?.birth_weight_kg ? `${child.birth_weight_kg} kg` : 'Not recorded'}
            </span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-[#D8E6DA]">
            <span className="text-[11px] text-[#294B57]/70 block">{t('common.caregiver', 'Caregiver')}</span>
            <span className="text-sm font-bold text-[#103342] mt-0.5 block">
              {child?.parent_name || 'Registered'}
            </span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-[#D8E6DA]">
            <span className="text-[11px] text-[#294B57]/70 block">{t('authority.assignedWorker', 'Assigned Worker')}</span>
            <span className="text-sm font-bold text-[#007F68] mt-0.5 block">
              {child?.assigned_worker_name || t('authority.unassigned', 'Unassigned')}
            </span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-[#D8E6DA]">
            <span className="text-[11px] text-[#294B57]/70 block">{t('authority.vaccinationHeading', 'Vaccine Progress')}</span>
            <span className="text-sm font-bold text-[#103342] mt-0.5 block">
              {completedCount} / {totalCount} {t('authority.doses', 'doses')}
            </span>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex border-b border-[#D8E6DA] gap-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('vaccines')}
          className={`pb-3 px-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'vaccines'
              ? 'border-[#007F68] text-[#007F68]'
              : 'border-transparent text-[#294B57]/70 hover:text-[#103342]'
          }`}
        >
          {t('sidebar.vaccinations', 'Vaccinations')} ({child?.vaccinations?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('followups')}
          className={`pb-3 px-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'followups'
              ? 'border-[#007F68] text-[#007F68]'
              : 'border-transparent text-[#294B57]/70 hover:text-[#103342]'
          }`}
        >
          {t('authority.followupsTab', 'Follow-Ups')} ({child?.follow_ups?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('growth')}
          className={`pb-3 px-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'growth'
              ? 'border-[#007F68] text-[#007F68]'
              : 'border-transparent text-[#294B57]/70 hover:text-[#103342]'
          }`}
        >
          {t('authority.growthRecordsTab', 'Growth Records')} ({child?.growth_records?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('appointments')}
          className={`pb-3 px-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'appointments'
              ? 'border-[#007F68] text-[#007F68]'
              : 'border-transparent text-[#294B57]/70 hover:text-[#103342]'
          }`}
        >
          {t('authority.appointmentsTab', 'Appointments')} ({child?.appointments?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 px-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'audit'
              ? 'border-[#007F68] text-[#007F68]'
              : 'border-transparent text-[#294B57]/70 hover:text-[#103342]'
          }`}
        >
          {t('authority.recordHistoryTab', 'Record Change History')} ({child?.audit_trail?.length || 0})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'vaccines' && (
        <Card className="p-0 bg-[#FBF8F2] border-[#D8E6DA] rounded-2xl overflow-hidden shadow-sm">
          {(!child?.vaccinations || child.vaccinations.length === 0) ? (
            <div className="p-8 text-center text-xs text-[#294B57]/70">
              {t('authority.noVaccinationsLogged', 'No vaccination records scheduled or administered for this child.')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#EBF3ED] text-[#103342] border-b border-[#D8E6DA] font-semibold">
                  <tr>
                    <th className="py-3 px-4">{t('authority.vaccinationHeading', 'Vaccine')}</th>
                    <th className="py-3 px-4">{t('common.dueDate', 'Due Date')}</th>
                    <th className="py-3 px-4">{t('common.administeredDate', 'Administered Date')}</th>
                    <th className="py-3 px-4">{t('common.batchNumber', 'Batch #')}</th>
                    <th className="py-3 px-4">{t('common.facility', 'Facility')}</th>
                    <th className="py-3 px-4">{t('common.administeredBy', 'Administered By')}</th>
                    <th className="py-3 px-4 text-center">{t('common.status', 'Status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8E6DA]/60">
                  {child.vaccinations.map((v) => (
                    <tr key={v.id} className="hover:bg-white/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-[#103342]">{v.vaccine_name}</td>
                      <td className="py-3 px-4 text-[#294B57]">{v.due_date}</td>
                      <td className="py-3 px-4 text-[#294B57]">{v.administered_date || '—'}</td>
                      <td className="py-3 px-4 font-mono text-[#294B57]">{v.batch_number || '—'}</td>
                      <td className="py-3 px-4 text-[#294B57]">{v.facility || '—'}</td>
                      <td className="py-3 px-4 text-[#103342]">{v.worker_name || '—'}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={v.completed ? 'upToDate' : 'dueSoon'} size="sm">
                          {v.completed ? t('common.completed', 'Completed') : t('common.pending', 'Pending')}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'followups' && (
        <Card className="p-0 bg-[#FBF8F2] border-[#D8E6DA] rounded-2xl overflow-hidden shadow-sm">
          {(!child?.follow_ups || child.follow_ups.length === 0) ? (
            <div className="p-8 text-center text-xs text-[#294B57]/70">
              {t('authority.noFollowupsLogged', 'No follow-up cases recorded for this child.')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#EBF3ED] text-[#103342] border-b border-[#D8E6DA] font-semibold">
                  <tr>
                    <th className="py-3 px-4">{t('common.dueDate', 'Due Date')}</th>
                    <th className="py-3 px-4">{t('common.notes', 'Reason / Notes')}</th>
                    <th className="py-3 px-4 text-center">{t('common.status', 'Status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8E6DA]/60">
                  {child.follow_ups.map((fu) => (
                    <tr key={fu.id} className="hover:bg-white/70 transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#103342]">{fu.due_date}</td>
                      <td className="py-3 px-4 text-[#294B57]">{fu.reason}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={fu.status === 'completed' ? 'upToDate' : 'dueSoon'} size="sm">
                          {fu.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'growth' && (
        <Card className="p-0 bg-[#FBF8F2] border-[#D8E6DA] rounded-2xl overflow-hidden shadow-sm">
          {(!child?.growth_records || child.growth_records.length === 0) ? (
            <div className="p-8 text-center text-xs text-[#294B57]/70">
              {t('authority.childHealthRecordSub', 'No growth measurements recorded for this child yet.')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#EBF3ED] text-[#103342] border-b border-[#D8E6DA] font-semibold">
                  <tr>
                    <th className="py-3 px-4">{t('common.administeredDate', 'Measurement Date')}</th>
                    <th className="py-3 px-4">Weight (kg)</th>
                    <th className="py-3 px-4">Height (cm)</th>
                    <th className="py-3 px-4">{t('common.administeredBy', 'Recorded By')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8E6DA]/60">
                  {child.growth_records.map((g) => (
                    <tr key={g.id} className="hover:bg-white/70 transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#103342]">{g.measurement_date}</td>
                      <td className="py-3 px-4 text-[#007F68] font-bold">{g.weight_kg} kg</td>
                      <td className="py-3 px-4 text-[#103342] font-medium">{g.height_cm} cm</td>
                      <td className="py-3 px-4 text-[#294B57]">Staff #{g.recorded_by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'appointments' && (
        <Card className="p-0 bg-[#FBF8F2] border-[#D8E6DA] rounded-2xl overflow-hidden shadow-sm">
          {(!child?.appointments || child.appointments.length === 0) ? (
            <div className="p-8 text-center text-xs text-[#294B57]/70">
              {t('authority.noAppointmentsLogged', 'No appointment history recorded for this child.')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#EBF3ED] text-[#103342] border-b border-[#D8E6DA] font-semibold">
                  <tr>
                    <th className="py-3 px-4">{t('common.dob', 'Appointment Date')}</th>
                    <th className="py-3 px-4">{t('common.notes', 'Reason')}</th>
                    <th className="py-3 px-4 text-center">{t('common.status', 'Status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8E6DA]/60">
                  {child.appointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-white/70 transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#103342]">{apt.appointment_date}</td>
                      <td className="py-3 px-4 text-[#294B57]">{apt.reason}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="teal" size="sm">
                          {apt.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'audit' && (
        <Card className="p-0 bg-[#FBF8F2] border-[#D8E6DA] rounded-2xl overflow-hidden shadow-sm">
          {(!child?.audit_trail || child.audit_trail.length === 0) ? (
            <div className="p-8 text-center text-xs text-[#294B57]/70">
              {t('authority.emptyAudit', 'No audit log entries recorded for this child yet.')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#EBF3ED] text-[#103342] border-b border-[#D8E6DA] font-semibold">
                  <tr>
                    <th className="py-3 px-4">{t('common.administeredDate', 'Timestamp')}</th>
                    <th className="py-3 px-4">{t('authority.assignedWorker', 'Worker')}</th>
                    <th className="py-3 px-4">{t('authority.actionPerformed', 'Action')}</th>
                    <th className="py-3 px-4">{t('authority.fieldsChanged', 'Fields Changed')}</th>
                    <th className="py-3 px-4">{t('authority.afterValue', 'New Values')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8E6DA]/60">
                  {child.audit_trail.map((l) => (
                    <tr key={l.id} className="hover:bg-white/70 transition-colors">
                      <td className="py-3 px-4 text-[#294B57] whitespace-nowrap">
                        {new Date(l.timestamp).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#103342] whitespace-nowrap">
                        {l.worker_name}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge variant="teal" size="sm">
                          {l.action_type.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-[#294B57]">
                        {l.fields_changed || l.record_type}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[#294B57] max-w-xs truncate">
                        {l.new_values || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
