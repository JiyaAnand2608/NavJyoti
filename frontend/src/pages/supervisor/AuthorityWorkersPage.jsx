import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { backendApi } from '../../services/backendApi';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';

import {
  Users,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  ClipboardList,
  Syringe,
  ShieldAlert,
  Clock,
  MapPin,
  Mail,
  UserCheck,
} from 'lucide-react';

export function AuthorityWorkersPage() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [villageFilter, setVillageFilter] = useState('ALL');

  const fetchWorkers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await backendApi.getSupervisorWorkers();
      setWorkers(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load healthcare workers list.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  const uniqueVillages = useMemo(() => {
    const villages = new Set();
    workers.forEach((w) => {
      if (w.village) villages.add(w.village);
      if (w.jurisdiction) villages.add(w.jurisdiction);
    });
    return Array.from(villages);
  }, [workers]);

  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      const matchesSearch =
        searchQuery === '' ||
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (w.worker_id && w.worker_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (w.email && w.email.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesVillage =
        villageFilter === 'ALL' ||
        w.village === villageFilter ||
        w.jurisdiction === villageFilter;

      return matchesSearch && matchesVillage;
    });
  }, [workers, searchQuery, villageFilter]);

  if (loading && workers.length === 0) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <RefreshCw className="w-8 h-8 text-[#007F68] animate-spin mb-3" />
        <p className="text-sm font-medium text-[#103342]">Loading healthcare workers...</p>
        <p className="text-xs text-[#294B57]/70 mt-1">Fetching jurisdiction roster from database</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-[#007F68]" />
            <h1 className="text-2xl font-bold text-[#103342]">Healthcare Workers</h1>
          </div>
          <p className="text-xs text-[#294B57]/80 mt-1">
            Frontline ANMs and ASHAs operating within your assigned jurisdiction
          </p>
        </div>

        <Button onClick={fetchWorkers} variant="outline" size="sm" disabled={loading} className="text-xs self-start sm:self-auto">
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Roster
        </Button>
      </div>

      {/* Error state with retry */}
      {error && (
        <Card className="p-4 bg-[#FDF8EF] border-[#E57373]/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-[#D9534F] shrink-0" />
            <p className="text-xs text-[#103342]">{error}</p>
          </div>
          <Button onClick={fetchWorkers} variant="primary" size="sm" className="text-xs">
            Retry
          </Button>
        </Card>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#294B57]/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by worker name, staff ID, or email..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#D8E6DA] rounded-xl text-xs text-[#103342] focus:outline-none focus:ring-2 focus:ring-[#007F68]"
          />
        </div>

        {uniqueVillages.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#294B57]/60 shrink-0" />
            <select
              value={villageFilter}
              onChange={(e) => setVillageFilter(e.target.value)}
              className="bg-white border border-[#D8E6DA] rounded-xl px-3 py-2 text-xs text-[#103342] focus:outline-none focus:ring-2 focus:ring-[#007F68]"
            >
              <option value="ALL">All Villages / Areas</option>
              {uniqueVillages.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredWorkers.length === 0 ? (
        <Card className="p-12 bg-[#FBF8F2] border-[#D8E6DA] text-center rounded-2xl">
          <Users className="w-12 h-12 text-[#294B57]/40 mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#103342]">No Healthcare Workers Found</h3>
          <p className="text-xs text-[#294B57]/70 mt-1 max-w-sm mx-auto">
            {searchQuery || villageFilter !== 'ALL'
              ? 'No workers match the current search filters. Try clearing your search query.'
              : 'There are currently no registered healthcare workers assigned to your jurisdiction.'}
          </p>
        </Card>
      ) : (
        /* Workers Table */
        <Card className="p-0 bg-[#FBF8F2] border-[#D8E6DA] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#EBF3ED] text-[#103342] border-b border-[#D8E6DA] font-semibold">
                <tr>
                  <th className="py-3 px-4">Worker Information</th>
                  <th className="py-3 px-4">Assigned Area</th>
                  <th className="py-3 px-4 text-center">Assigned Children</th>
                  <th className="py-3 px-4 text-center">Doses Logged</th>
                  <th className="py-3 px-4 text-center">Pending Follow-ups</th>
                  <th className="py-3 px-4">Last Activity</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8E6DA]/60">
                {filteredWorkers.map((w) => (
                  <tr key={w.id} className="hover:bg-white/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#DDF0E3] text-[#007F68] font-bold flex items-center justify-center shrink-0">
                          {w.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-[#103342] text-sm">{w.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {w.worker_id && (
                              <span className="text-[11px] font-mono text-[#007F68] font-medium">
                                {w.worker_id}
                              </span>
                            )}
                            {w.email && (
                              <span className="text-[11px] text-[#294B57]/70">
                                {w.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-[#294B57] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#007F68]" />
                        <span>{w.village || w.jurisdiction || 'Unassigned'}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Badge variant="teal" size="sm">
                        {w.assigned_children_count}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-center font-semibold text-[#103342]">
                      {w.vaccinations_recorded_count}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {w.pending_followups_count > 0 ? (
                        <Badge variant="dueSoon" size="sm">
                          {w.pending_followups_count}
                        </Badge>
                      ) : (
                        <span className="text-[#294B57]/50">0</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-[#294B57] whitespace-nowrap">
                      {w.last_activity ? (
                        <span title={new Date(w.last_activity).toLocaleString('en-IN')}>
                          {new Date(w.last_activity).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      ) : (
                        <span className="text-[#294B57]/50">No logs yet</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link to={`/supervisor/workers/${w.id}`}>
                        <Button variant="outline" size="sm" className="text-xs">
                          View Details <ChevronRight className="w-3.5 h-3.5 ml-1" />
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
