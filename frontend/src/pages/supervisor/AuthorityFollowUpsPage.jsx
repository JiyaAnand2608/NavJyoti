import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { backendApi } from '../../services/backendApi';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';

import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Calendar,
  Clock,
  User,
  MapPin,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export function AuthorityFollowUpsPage() {
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchFollowUps = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await backendApi.getSupervisorFollowUps();
      setFollowUps(data || []);
    } catch (err) {
      setError(err.message || 'Failed to retrieve follow-up cases.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFollowUps();
  }, [fetchFollowUps]);

  const filteredFollowUps = useMemo(() => {
    return followUps.filter((fu) => {
      const matchesSearch =
        searchQuery === '' ||
        fu.child_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(fu.child_id).includes(searchQuery) ||
        (fu.assigned_worker_name && fu.assigned_worker_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (fu.reason && fu.reason.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesStatus = true;
      if (statusFilter === 'OVERDUE') {
        matchesStatus = fu.is_overdue;
      } else if (statusFilter === 'PENDING') {
        matchesStatus = fu.status === 'pending' && !fu.is_overdue;
      } else if (statusFilter === 'COMPLETED') {
        matchesStatus = fu.status === 'completed' || fu.status === 'resolved';
      }

      return matchesSearch && matchesStatus;
    });
  }, [followUps, searchQuery, statusFilter]);

  const overdueCount = followUps.filter((f) => f.is_overdue).length;
  const pendingCount = followUps.filter((f) => f.status === 'pending').length;

  if (loading && followUps.length === 0) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <RefreshCw className="w-8 h-8 text-[#007F68] animate-spin mb-3" />
        <p className="text-sm font-medium text-[#103342]">Loading follow-up cases...</p>
        <p className="text-xs text-[#294B57]/70 mt-1">Checking overdue clinical milestones from database</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-[#007F68]" />
            <h1 className="text-2xl font-bold text-[#103342]">Clinical Follow-Ups</h1>
          </div>
          <p className="text-xs text-[#294B57]/80 mt-1">
            Supervisory monitoring of high-priority cases, dropouts, and frontline worker follow-up actions
          </p>
        </div>

        <Button onClick={fetchFollowUps} variant="outline" size="sm" disabled={loading} className="text-xs self-start sm:self-auto">
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Cases
        </Button>
      </div>

      {/* Quick Summary Pill Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-white border border-[#D8E6DA] rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-[#294B57]/70 font-medium">Total Cases</span>
            <span className="text-xl font-bold text-[#103342] block mt-0.5">{followUps.length}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#DDF0E3] text-[#007F68] flex items-center justify-center font-bold">
            {followUps.length}
          </div>
        </div>

        <div className="p-4 bg-white border border-[#D8E6DA] rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-[#294B57]/70 font-medium">Pending Follow-ups</span>
            <span className="text-xl font-bold text-[#B87D14] block mt-0.5">{pendingCount}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#FEF9C3] text-[#A16207] flex items-center justify-center font-bold">
            {pendingCount}
          </div>
        </div>

        <div className="p-4 bg-white border border-[#D8E6DA] rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-[#294B57]/70 font-medium">Overdue Cases</span>
            <span className="text-xl font-bold text-[#D9534F] block mt-0.5">{overdueCount}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#FDECEC] text-[#D9534F] flex items-center justify-center font-bold">
            {overdueCount}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="p-4 bg-[#FDF8EF] border-[#E57373]/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#D9534F] shrink-0" />
            <p className="text-xs text-[#103342]">{error}</p>
          </div>
          <Button onClick={fetchFollowUps} variant="primary" size="sm" className="text-xs">
            Retry
          </Button>
        </Card>
      )}

      {/* Filters */}
      <Card className="p-4 bg-[#FBF8F2] border-[#D8E6DA]">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#294B57]/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by child, worker name, or reason..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#D8E6DA] rounded-xl text-xs text-[#103342] focus:outline-none focus:ring-2 focus:ring-[#007F68]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#294B57]/60 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-[#D8E6DA] rounded-xl px-3 py-2 text-xs text-[#103342] focus:outline-none focus:ring-2 focus:ring-[#007F68]"
            >
              <option value="ALL">All Follow-Up Statuses</option>
              <option value="OVERDUE">Overdue Cases ({overdueCount})</option>
              <option value="PENDING">Active Pending</option>
              <option value="COMPLETED">Resolved / Completed</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Follow-ups List */}
      {filteredFollowUps.length === 0 ? (
        <Card className="p-12 bg-[#FBF8F2] border-[#D8E6DA] text-center rounded-2xl">
          <CheckCircle2 className="w-12 h-12 text-[#007F68] mx-auto mb-3 opacity-80" />
          <h3 className="text-base font-bold text-[#103342]">No Follow-Up Cases Found</h3>
          <p className="text-xs text-[#294B57]/70 mt-1 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'ALL'
              ? 'No cases match your active filter settings.'
              : 'There are currently no active or overdue follow-up cases recorded in your jurisdiction.'}
          </p>
        </Card>
      ) : (
        <Card className="p-0 bg-[#FBF8F2] border-[#D8E6DA] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#EBF3ED] text-[#103342] border-b border-[#D8E6DA] font-semibold">
                <tr>
                  <th className="py-3 px-4">Patient / Child</th>
                  <th className="py-3 px-4">Assigned Area</th>
                  <th className="py-3 px-4">Assigned Worker</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Clinical Reason</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8E6DA]/60">
                {filteredFollowUps.map((fu) => (
                  <tr key={fu.id} className="hover:bg-white/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#103342]">
                      {fu.child_name}
                      <span className="block text-[10px] text-[#294B57]/70 font-normal">
                        Child #{fu.child_id}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-[#294B57] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#007F68]" />
                        <span>{fu.village || 'N/A'}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-[#103342] whitespace-nowrap">
                      {fu.assigned_worker_name || 'Unassigned'}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#294B57]" />
                        <span className={fu.is_overdue ? 'font-bold text-[#D9534F]' : 'text-[#294B57]'}>
                          {fu.due_date}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-[#103342] max-w-xs">
                      {fu.reason}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <Badge
                        variant={
                          fu.is_overdue
                            ? 'overdue'
                            : fu.status === 'completed' || fu.status === 'resolved'
                            ? 'upToDate'
                            : 'dueSoon'
                        }
                        size="sm"
                      >
                        {fu.is_overdue ? 'Overdue' : fu.status}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link to={`/supervisor/children/${fu.child_id}`}>
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
        </Card>
      )}
    </div>
  );
}
