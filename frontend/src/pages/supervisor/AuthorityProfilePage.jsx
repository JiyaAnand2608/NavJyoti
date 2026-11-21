import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { backendApi } from '../../services/backendApi';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';

import {
  ShieldCheck,
  User,
  MapPin,
  Mail,
  Shield,
  Key,
  Lock,
  RefreshCw,
  AlertCircle,
  Users,
  ClipboardList,
  CheckCircle2,
  FileCheck2,
  LogOut,
} from 'lucide-react';

export function AuthorityProfilePage() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await backendApi.getSupervisorProfile();
      setProfile(data);
    } catch (err) {
      setError(err.message || t('errors.serverError', 'Failed to retrieve supervisor profile.'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#007F68]" />
            <h1 className="text-2xl font-bold text-[#103342]">{t('authority.profileHeading', 'Authority Profile & Settings')}</h1>
          </div>
          <p className="text-xs text-[#294B57]/80 mt-1">
            {t('authority.profileSub', 'Supervisory credential identification and jurisdiction access boundaries')}
          </p>
        </div>

        <Button onClick={fetchProfile} variant="outline" size="sm" disabled={loading} className="text-xs self-start sm:self-auto">
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> {t('common.refresh', 'Refresh')}
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <Card className="p-4 bg-[#FDF8EF] border-[#E57373]/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#D9534F] shrink-0" />
            <p className="text-xs text-[#103342]">{error}</p>
          </div>
          <Button onClick={fetchProfile} variant="primary" size="sm" className="text-xs">
            {t('common.retry', 'Retry')}
          </Button>
        </Card>
      )}

      {/* Profile Card */}
      <Card className="p-6 bg-[#FBF8F2] border-[#D8E6DA] rounded-2xl">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#103342] text-white text-2xl font-black flex items-center justify-center shrink-0 shadow-sm">
            {profile?.name?.charAt(0) || user?.name?.charAt(0) || 'S'}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#103342]">
                {profile?.name || user?.name || 'Healthcare Officer'}
              </h2>
              <Badge variant="teal">{t('sidebar.supervisorRole', 'Supervisory Authority')}</Badge>
            </div>
            <p className="text-xs text-[#294B57]">
              {profile?.email || user?.email || 'supervisor@navjyoti.gov.in'}
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs text-[#294B57]">
              <MapPin className="w-3.5 h-3.5 text-[#007F68]" />
              <span>{t('authority.jurisdictionLabel', 'Assigned Jurisdiction')}: </span>
              <span className="font-bold text-[#103342]">
                {profile?.jurisdiction || profile?.village || user?.jurisdiction || 'District Health Office'}
              </span>
            </div>
          </div>
        </div>

        {/* Supervision Jurisdiction Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-[#D8E6DA]">
          <div className="p-4 bg-white rounded-xl border border-[#D8E6DA] flex items-center justify-between">
            <div>
              <span className="text-xs text-[#294B57]/70 font-medium">{t('authority.supervisedWorkers', 'Frontline Workers Overseen')}</span>
              <span className="text-2xl font-black text-[#103342] block mt-1">
                {profile?.supervised_workers_count ?? 0}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#DDF0E3] text-[#007F68] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-[#D8E6DA] flex items-center justify-between">
            <div>
              <span className="text-xs text-[#294B57]/70 font-medium">{t('authority.registeredChildren', 'Children in Jurisdiction')}</span>
              <span className="text-2xl font-black text-[#103342] block mt-1">
                {profile?.supervised_children_count ?? 0}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#DDF0E3] text-[#007F68] flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
        </div>
      </Card>

      {/* Role Boundaries and Security Policy (Transparent, realistic, non-fabricated) */}
      <Card className="p-6 bg-[#FBF8F2] border-[#D8E6DA] rounded-2xl space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#007F68]" />
          <h3 className="text-sm font-bold text-[#103342]">{t('authority.roleBoundariesTitle', 'Authority Role Boundaries & Data Protection')}</h3>
        </div>

        <div className="space-y-3 text-xs text-[#294B57]">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#007F68] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#103342]">{t('authority.jurisdictionScopedTitle', 'Jurisdiction-Scoped Queries Only')}</p>
              <p className="mt-0.5">
                {t('authority.jurisdictionScopedDesc', 'Authorities are restricted by backend policy to healthcare workers and registered children within their assigned territory.')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#007F68] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#103342]">{t('authority.minNecessaryAccessTitle', 'Supervisory Oversight Only')}</p>
              <p className="mt-0.5">
                {t('authority.minNecessaryAccessDesc', 'Authorities supervise operations and monitor immunization coverage. Clinical editing is restricted to frontline medical workers to maintain chain-of-custody.')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#007F68] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#103342]">{t('authority.auditImmutabilityTitle', 'Audit Trail Logging')}</p>
              <p className="mt-0.5">
                {t('authority.auditImmutabilityDesc', 'Every clinical update produces an audit log entry with previous and new values for accountability.')}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Security Credentials Card */}
      <Card className="p-6 bg-[#FBF8F2] border-[#D8E6DA] rounded-2xl">
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-5 h-5 text-[#103342]" />
          <h3 className="text-sm font-bold text-[#103342]">{t('authority.authAndSecurity', 'Authentication & Security')}</h3>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-3 bg-white rounded-xl border border-[#D8E6DA] flex items-center justify-between">
            <div>
              <span className="font-bold text-[#103342] block">{t('authority.rbacTitle', 'Role-Based Access Control')}</span>
              <span className="text-[#294B57]/70 block mt-0.5">{t('authority.rbacDesc', 'Enforced at FastAPI backend and React Router')}</span>
            </div>
            <Badge variant="teal">{t('common.status', 'Active')}</Badge>
          </div>

          <div className="p-3 bg-white rounded-xl border border-[#D8E6DA] flex items-center justify-between">
            <div>
              <span className="font-bold text-[#103342] block">{t('authority.sessionTitle', 'Authentication Session')}</span>
              <span className="text-[#294B57]/70 block mt-0.5">{t('authority.sessionDesc', 'Timezone-aware Bearer Token security')}</span>
            </div>
            <Badge variant="teal">{t('common.status', 'Active')}</Badge>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-[#D8E6DA] flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#103342] block">{t('authority.activeSession', 'Active Session')}</span>
            <span className="text-[11px] text-[#294B57]/70 block">{t('common.logout', 'Terminate current Authority administrative session')}</span>
          </div>
          <Button
            onClick={() => {
              logout();
              navigate('/auth/login', { replace: true });
            }}
            variant="outline"
            size="sm"
            className="text-xs text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5" /> {t('authority.signOutBtn', 'Sign Out')}
          </Button>
        </div>
      </Card>
    </div>
  );
}
