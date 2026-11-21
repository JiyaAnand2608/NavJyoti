import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { backendApi } from '../../services/backendApi';
import { useLanguage } from '../../contexts/LanguageContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';

import {
  ClipboardList,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  Baby,
  Syringe,
  ShieldAlert,
  MapPin,
  User,
  ExternalLink,
} from 'lucide-react';

export function AuthorityChildRegistryPage() {
  const { t } = useLanguage();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [villageFilter, setVillageFilter] = useState('ALL');

  const fetchChildren = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await backendApi.getSupervisorChildren();
      setChildren(data || []);
    } catch (err) {
      setError(err.message || t('errors.serverError', 'Failed to load children registry from database.'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  const uniqueVillages = useMemo(() => {
    const set = new Set();
    children.forEach((c) => {
      if (c.village) set.add(c.village);
    });
    return Array.from(set);
  }, [children]);

  const filteredChildren = useMemo(() => {
    return children.filter((c) => {
      const matchesSearch =
        searchQuery === '' ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(c.id).includes(searchQuery) ||
        (c.assigned_worker_name && c.assigned_worker_name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === 'ALL' || c.vaccination_status === statusFilter;

      const matchesVillage =
        villageFilter === 'ALL' || c.village === villageFilter;

      return matchesSearch && matchesStatus && matchesVillage;
    });
  }, [children, searchQuery, statusFilter, villageFilter]);

  if (loading && children.length === 0) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <RefreshCw className="w-8 h-8 text-[#007F68] animate-spin mb-3" />
        <p className="text-sm font-medium text-[#103342]">{t('common.loading', 'Loading children registry...')}</p>
        <p className="text-xs text-[#294B57]/70 mt-1">{t('authority.childRegistrySub', 'Filtering by assigned jurisdiction from PostgreSQL')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-[#007F68]" />
            <h1 className="text-2xl font-bold text-[#103342]">{t('authority.childRegistryHeading', 'Child Healthcare Registry')}</h1>
          </div>
          <p className="text-xs text-[#294B57]/80 mt-1">
            {t('authority.childRegistrySub', 'Supervisory oversight of registered children and clinical milestones in your jurisdiction')}
          </p>
        </div>

        <Button onClick={fetchChildren} variant="outline" size="sm" disabled={loading} className="text-xs self-start sm:self-auto">
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> {t('authority.refreshBtn', 'Refresh Registry')}
        </Button>
      </div>

      {/* Error state with retry */}
      {error && (
        <Card className="p-4 bg-[#FDF8EF] border-[#E57373]/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#D9534F] shrink-0" />
            <p className="text-xs text-[#103342]">{error}</p>
          </div>
          <Button onClick={fetchChildren} variant="primary" size="sm" className="text-xs">
            {t('common.retry', 'Retry')}
          </Button>
        </Card>
      )}

      {/* Filters and Search */}
      <Card className="p-4 bg-[#FBF8F2] border-[#D8E6DA]">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#294B57]/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('authority.searchPlaceholder', 'Search child by name, ID, or assigned worker...')}
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#D8E6DA] rounded-xl text-xs text-[#103342] focus:outline-none focus:ring-2 focus:ring-[#007F68]"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-[#D8E6DA] rounded-xl px-3 py-2 text-xs text-[#103342] focus:outline-none focus:ring-2 focus:ring-[#007F68]"
            >
              <option value="ALL">{t('authority.filterAllStatuses', 'All Vaccination Statuses')}</option>
              <option value="Up to Date">{t('status.upToDate', 'Up to Date')}</option>
              <option value="Overdue">{t('status.overdue', 'Overdue')}</option>
              <option value="Pending">{t('status.pending', 'Pending')}</option>
            </select>

            {uniqueVillages.length > 0 && (
              <select
                value={villageFilter}
                onChange={(e) => setVillageFilter(e.target.value)}
                className="bg-white border border-[#D8E6DA] rounded-xl px-3 py-2 text-xs text-[#103342] focus:outline-none focus:ring-2 focus:ring-[#007F68]"
              >
                <option value="ALL">{t('authority.filterAllVillages', 'All Areas')}</option>
                {uniqueVillages.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </Card>

      {/* Children Table */}
      {filteredChildren.length === 0 ? (
        <Card className="p-12 bg-[#FBF8F2] border-[#D8E6DA] text-center rounded-2xl">
          <Baby className="w-12 h-12 text-[#294B57]/40 mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#103342]">{t('authority.emptyChildren', 'No Children Found')}</h3>
          <p className="text-xs text-[#294B57]/70 mt-1 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'ALL' || villageFilter !== 'ALL'
              ? t('authority.emptyChildren', 'No children match the active filters. Try adjusting your search query.')
              : t('authority.emptyChildren', 'No children are currently registered under workers in your jurisdiction.')}
          </p>
        </Card>
      ) : (
        <Card className="p-0 bg-[#FBF8F2] border-[#D8E6DA] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#EBF3ED] text-[#103342] border-b border-[#D8E6DA] font-semibold">
                <tr>
                  <th className="py-3 px-4">{t('authority.childInfo', 'Child Information')}</th>
                  <th className="py-3 px-4">{t('authority.ageGender', 'Age & Gender')}</th>
                  <th className="py-3 px-4">{t('authority.villageArea', 'Village / Area')}</th>
                  <th className="py-3 px-4">{t('authority.assignedWorker', 'Assigned Worker')}</th>
                  <th className="py-3 px-4 text-center">{t('authority.vaccineStatus', 'Vaccine Status')}</th>
                  <th className="py-3 px-4 text-center">{t('authority.doses', 'Doses')}</th>
                  <th className="py-3 px-4 text-center">{t('authority.followupsTab', 'Follow-ups')}</th>
                  <th className="py-3 px-4 text-right">{t('common.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8E6DA]/60">
                {filteredChildren.map((c) => (
                  <tr key={c.id} className="hover:bg-white/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-[#103342] text-sm">{c.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-[#294B57]/70 font-mono">
                            ID #{c.id}
                          </span>
                          {c.migration_status && (
                            <span className="text-[10px] bg-white border border-[#D8E6DA] px-1.5 py-0.2 rounded text-[#294B57]">
                              {c.migration_status === 'migrant' ? t('status.migrantInflow', 'Migrant') : t('status.resident', 'Resident')}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-[#294B57] whitespace-nowrap">
                      <p className="font-medium text-[#103342]">{c.age_display}</p>
                      <span className="text-[11px] text-[#294B57]/70">{c.gender || '—'}</span>
                    </td>

                    <td className="py-3.5 px-4 text-[#294B57] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#007F68]" />
                        <span>{c.village || '—'}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-[#103342] whitespace-nowrap">
                      {c.assigned_worker_name ? (
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#007F68]" />
                          <span className="font-semibold">{c.assigned_worker_name}</span>
                        </div>
                      ) : (
                        <span className="text-[#294B57]/50">{t('authority.unassigned', 'Unassigned')}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <Badge
                        variant={
                          c.vaccination_status === 'Up to Date'
                            ? 'upToDate'
                            : c.vaccination_status === 'Overdue'
                            ? 'overdue'
                            : 'dueSoon'
                        }
                        size="sm"
                      >
                        {c.vaccination_status === 'Up to Date'
                          ? t('status.upToDate', 'Up to Date')
                          : c.vaccination_status === 'Overdue'
                          ? t('status.overdue', 'Overdue')
                          : t('status.dueSoon', 'Pending')}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-center text-[#103342] font-semibold whitespace-nowrap">
                      {c.completed_doses} / {c.total_doses}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {c.pending_followups_count > 0 ? (
                        <Badge variant="dueSoon" size="sm">
                          {c.pending_followups_count} {t('common.pending', 'pending')}
                        </Badge>
                      ) : (
                        <span className="text-[#294B57]/50">0</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link to={`/supervisor/children/${c.id}`}>
                        <Button variant="outline" size="sm" className="text-xs">
                          {t('authority.inspect', 'Inspect')} <ExternalLink className="w-3 h-3 ml-1" />
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
