import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { backendApi } from '../../services/backendApi';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';

import {
  ArrowLeft,
  Users,
  Syringe,
  CalendarCheck,
  ShieldAlert,
  ClipboardList,
  RefreshCw,
  AlertCircle,
  History,
  MapPin,
  Mail,
  Phone,
  FileCheck2,
  Clock,
  ExternalLink,
} from 'lucide-react';

export function AuthorityWorkerDetailPage() {
  const { id } = useParams();
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('children'); // 'children' | 'vaccinations' | 'followups' | 'appointments' | 'audit'

  const fetchWorkerDetail = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await backendApi.getSupervisorWorkerDetail(id);
      setWorker(data);
    } catch (err) {
      setError(err.message || 'Failed to load worker details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchWorkerDetail();
  }, [fetchWorkerDetail]);

  if (loading && !worker) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <RefreshCw className="w-8 h-8 text-[#007F68] animate-spin mb-3" />
        <p className="text-sm font-medium text-[#103342]">Loading healthcare worker profile...</p>
        <p className="text-xs text-[#294B57]/70 mt-1">Retrieving assigned children and clinical records</p>
      </div>
    );
  }

  if (error && !worker) {
    return (
      <div className="p-6 max-w-xl mx-auto text-center">
        <Card className="p-6 bg-[#FDF8EF] border-[#E57373]/30">
          <AlertCircle className="w-12 h-12 text-[#D9534F] mx-auto mb-3" />
          <h2 className="text-base font-bold text-[#103342]">Worker Profile Unavailable</h2>
          <p className="text-xs text-[#294B57] mt-1 mb-4">{error}</p>
          <div className="flex justify-center gap-3">
            <Link to="/supervisor/workers">
              <Button variant="outline" size="sm" className="text-xs">
                Back to Workers
              </Button>
            </Link>
            <Button onClick={fetchWorkerDetail} variant="primary" size="sm" className="text-xs">
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link to="/supervisor/workers">
          <Button variant="outline" size="sm" className="text-xs">
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Directory
          </Button>
        </Link>
        <span className="text-xs text-[#294B57]/50">/</span>
        <span className="text-xs font-semibold text-[#103342]">Worker Profile</span>
      </div>

      {/* Profile Overview Card */}
      <Card className="p-6 bg-[#FBF8F2] border-[#D8E6DA] rounded-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#DDF0E3] text-[#007F68] text-xl font-bold flex items-center justify-center shrink-0 shadow-xs">
              {worker?.name?.charAt(0) || 'W'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#103342]">{worker?.name}</h1>
                <Badge variant="teal" size="sm">Frontline Staff</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#294B57] mt-1.5">
                {worker?.worker_id && (
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-[#D8E6DA] text-[#007F68] font-bold">
                    {worker.worker_id}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#007F68]" />
                  {worker?.village || worker?.jurisdiction || 'Area Not Available'}
                </span>
                {worker?.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-[#007F68]" />
                    {worker.email}
                  </span>
                )}
                {worker?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[#007F68]" />
                    {worker.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <Button onClick={fetchWorkerDetail} variant="outline" size="sm" disabled={loading} className="text-xs self-start sm:self-auto">
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#D8E6DA]">
          <div className="p-3 bg-white rounded-xl border border-[#D8E6DA]">
            <span className="text-[11px] text-[#294B57]/70 block">Assigned Children</span>
            <span className="text-xl font-black text-[#103342] mt-0.5 block">
              {worker?.assigned_children?.length ?? 0}
            </span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-[#D8E6DA]">
            <span className="text-[11px] text-[#294B57]/70 block">Vaccinations Recorded</span>
            <span className="text-xl font-black text-[#007F68] mt-0.5 block">
              {worker?.vaccination_activities?.length ?? 0}
            </span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-[#D8E6DA]">
            <span className="text-[11px] text-[#294B57]/70 block">Follow-Up Actions</span>
            <span className="text-xl font-black text-[#B87D14] mt-0.5 block">
              {worker?.follow_ups?.length ?? 0}
            </span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-[#D8E6DA]">
            <span className="text-[11px] text-[#294B57]/70 block">Audit Trail Entries</span>
            <span className="text-xl font-black text-[#103342] mt-0.5 block">
              {worker?.recent_record_updates?.length ?? 0}
            </span>
          </div>
        </div>
      </Card>

      {/* Detail Tabs */}
      <div className="flex border-b border-[#D8E6DA] gap-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('children')}
          className={`pb-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'children'
              ? 'border-[#007F68] text-[#007F68]'
              : 'border-transparent text-[#294B57]/70 hover:text-[#103342]'
          }`}
        >
          Assigned Children ({worker?.assigned_children?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('vaccinations')}
          className={`pb-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'vaccinations'
              ? 'border-[#007F68] text-[#007F68]'
              : 'border-transparent text-[#294B57]/70 hover:text-[#103342]'
          }`}
        >
          Vaccination Log ({worker?.vaccination_activities?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('followups')}
          className={`pb-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'followups'
              ? 'border-[#007F68] text-[#007F68]'
              : 'border-transparent text-[#294B57]/70 hover:text-[#103342]'
          }`}
        >
          Follow-Ups ({worker?.follow_ups?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('appointments')}
          className={`pb-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'appointments'
              ? 'border-[#007F68] text-[#007F68]'
              : 'border-transparent text-[#294B57]/70 hover:text-[#103342]'
          }`}
        >
          Appointments ({worker?.appointments?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'audit'
              ? 'border-[#007F68] text-[#007F68]'
              : 'border-transparent text-[#294B57]/70 hover:text-[#103342]'
          }`}
        >
          Audit History ({worker?.recent_record_updates?.length || 0})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'children' && (
        <Card className="p-0 bg-[#FBF8F2] border-[#D8E6DA] rounded-2xl overflow-hidden shadow-sm">
          {(!worker?.assigned_children || worker.assigned_children.length === 0) ? (
            <div className="p-8 text-center text-xs text-[#294B57]/70">
              No children are currently assigned to this worker.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#EBF3ED] text-[#103342] border-b border-[#D8E6DA] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Child Name</th>
                    <th className="py-3 px-4">Date of Birth</th>
                    <th className="py-3 px-4">Gender</th>
                    <th className="py-3 px-4">Village</th>
                    <th className="py-3 px-4 text-center">Priority</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8E6DA]/60">
                  {worker.assigned_children.map((ch) => (
                    <tr key={ch.id} className="hover:bg-white/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-[#103342]">{ch.name}</td>
                      <td className="py-3 px-4 text-[#294B57]">{ch.date_of_birth}</td>
                      <td className="py-3 px-4 text-[#294B57]">{ch.gender || 'Not specified'}</td>
                      <td className="py-3 px-4 text-[#294B57]">{ch.village || 'N/A'}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={ch.priority_level === 'red' ? 'overdue' : 'upToDate'}
                          size="sm"
                        >
                          {ch.priority_level || 'Normal'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link to={`/supervisor/children/${ch.id}`}>
                          <Button variant="ghost" size="sm" className="text-xs">
                            Inspect Records <ExternalLink className="w-3 h-3 ml-1" />
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
      )}

      {activeTab === 'vaccinations' && (
        <Card className="p-0 bg-[#FBF8F2] border-[#D8E6DA] rounded-2xl overflow-hidden shadow-sm">
          {(!worker?.vaccination_activities || worker.vaccination_activities.length === 0) ? (
            <div className="p-8 text-center text-xs text-[#294B57]/70">
              No vaccination records logged by this worker.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#EBF3ED] text-[#103342] border-b border-[#D8E6DA] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Vaccine Name</th>
                    <th className="py-3 px-4">Child ID</th>
                    <th className="py-3 px-4">Administered Date</th>
                    <th className="py-3 px-4">Batch #</th>
                    <th className="py-3 px-4">Facility</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8E6DA]/60">
                  {worker.vaccination_activities.map((vac) => (
                    <tr key={vac.id} className="hover:bg-white/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-[#103342]">{vac.vaccine_name}</td>
                      <td className="py-3 px-4 text-[#294B57]">Child #{vac.child_id}</td>
                      <td className="py-3 px-4 text-[#294B57]">{vac.administered_date || 'Scheduled'}</td>
                      <td className="py-3 px-4 font-mono text-[#294B57]">{vac.batch_number || 'N/A'}</td>
                      <td className="py-3 px-4 text-[#294B57]">{vac.facility || 'N/A'}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={vac.completed ? 'upToDate' : 'dueSoon'} size="sm">
                          {vac.completed ? 'Completed' : 'Pending'}
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
          {(!worker?.follow_ups || worker.follow_ups.length === 0) ? (
            <div className="p-8 text-center text-xs text-[#294B57]/70">
              No follow-up cases recorded by this worker.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#EBF3ED] text-[#103342] border-b border-[#D8E6DA] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Child ID</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Clinical Reason</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8E6DA]/60">
                  {worker.follow_ups.map((fu) => (
                    <tr key={fu.id} className="hover:bg-white/70 transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#103342]">Child #{fu.child_id}</td>
                      <td className="py-3 px-4 text-[#294B57]">{fu.due_date}</td>
                      <td className="py-3 px-4 text-[#103342]">{fu.reason}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={fu.status === 'completed' ? 'upToDate' : 'dueSoon'}
                          size="sm"
                        >
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

      {activeTab === 'appointments' && (
        <Card className="p-0 bg-[#FBF8F2] border-[#D8E6DA] rounded-2xl overflow-hidden shadow-sm">
          {(!worker?.appointments || worker.appointments.length === 0) ? (
            <div className="p-8 text-center text-xs text-[#294B57]/70">
              No appointments scheduled for this worker's assigned children.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#EBF3ED] text-[#103342] border-b border-[#D8E6DA] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Child ID</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8E6DA]/60">
                  {worker.appointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-white/70 transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#103342]">Child #{apt.child_id}</td>
                      <td className="py-3 px-4 text-[#294B57]">{apt.appointment_date}</td>
                      <td className="py-3 px-4 text-[#103342]">{apt.reason}</td>
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
          {(!worker?.recent_record_updates || worker.recent_record_updates.length === 0) ? (
            <div className="p-8 text-center text-xs text-[#294B57]/70">
              No audit trail events generated by this worker yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#EBF3ED] text-[#103342] border-b border-[#D8E6DA] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Child Record</th>
                    <th className="py-3 px-4">Fields Affected</th>
                    <th className="py-3 px-4">New Values</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8E6DA]/60">
                  {worker.recent_record_updates.map((l) => (
                    <tr key={l.id} className="hover:bg-white/70 transition-colors">
                      <td className="py-3 px-4 text-[#294B57] whitespace-nowrap">
                        {new Date(l.timestamp).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge variant="teal" size="sm">
                          {l.action_type.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-[#103342] font-medium whitespace-nowrap">
                        {l.child_name || (l.child_id ? `Child #${l.child_id}` : 'N/A')}
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
