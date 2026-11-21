import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
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
} from 'lucide-react';

export function AuthorityProfilePage() {
  const { user } = useAuth();
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
      setError(err.message || 'Failed to retrieve supervisor profile.');
    } finally {
      setLoading(false);
    }
  }, []);

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
            <h1 className="text-2xl font-bold text-[#103342]">Authority Profile & Settings</h1>
          </div>
          <p className="text-xs text-[#294B57]/80 mt-1">
            Supervisory credential identification and jurisdiction access boundaries
          </p>
        </div>

        <Button onClick={fetchProfile} variant="outline" size="sm" disabled={loading} className="text-xs self-start sm:self-auto">
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
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
            Retry
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
              <Badge variant="teal">Supervisory Authority</Badge>
            </div>
            <p className="text-xs text-[#294B57]">
              {profile?.email || user?.email || 'supervisor@navjyoti.gov.in'}
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs text-[#294B57]">
              <MapPin className="w-3.5 h-3.5 text-[#007F68]" />
              <span>Assigned Jurisdiction: </span>
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
              <span className="text-xs text-[#294B57]/70 font-medium">Frontline Workers Overseen</span>
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
              <span className="text-xs text-[#294B57]/70 font-medium">Children in Jurisdiction</span>
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

      {/* Role Boundaries and Security Policy */}
      <Card className="p-6 bg-[#FBF8F2] border-[#D8E6DA] rounded-2xl space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#007F68]" />
          <h3 className="text-sm font-bold text-[#103342]">Authority Role Boundaries & Data Protection</h3>
        </div>

        <div className="space-y-3 text-xs text-[#294B57]">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#007F68] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#103342]">Jurisdiction-Scoped Queries Only</p>
              <p className="mt-0.5">
                Authorities are cryptographically restricted by backend policy to healthcare workers and registered children within their assigned territory. Attempts to query records outside your jurisdiction are rejected with HTTP 403.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#007F68] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#103342]">Minimum Necessary Access</p>
              <p className="mt-0.5">
                Authorities supervise operations, review worker performance, and monitor immunization coverage. Clinical editing of vaccines or direct modification of patient files is restricted to frontline medical workers to maintain clear chain-of-custody.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#007F68] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#103342]">Audit Trail Immutability</p>
              <p className="mt-0.5">
                Every record update produces an atomic audit log entry with previous and new values. Audit events cannot be modified or deleted by any user or administrator.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Security Credentials Card */}
      <Card className="p-6 bg-[#FBF8F2] border-[#D8E6DA] rounded-2xl">
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-5 h-5 text-[#103342]" />
          <h3 className="text-sm font-bold text-[#103342]">Authentication & Security</h3>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-3 bg-white rounded-xl border border-[#D8E6DA] flex items-center justify-between">
            <div>
              <span className="font-bold text-[#103342] block">Role-Based Access Control</span>
              <span className="text-[#294B57]/70 block mt-0.5">Enforced at FastAPI backend and React Router</span>
            </div>
            <Badge variant="teal">Active</Badge>
          </div>

          <div className="p-3 bg-white rounded-xl border border-[#D8E6DA] flex items-center justify-between">
            <div>
              <span className="font-bold text-[#103342] block">JWT Token Session</span>
              <span className="text-[#294B57]/70 block mt-0.5">Timezone-aware Bearer Token with HS256 signature</span>
            </div>
            <Badge variant="teal">Verified</Badge>
          </div>

          <div className="p-3 bg-white rounded-xl border border-[#D8E6DA] flex items-center justify-between">
            <div>
              <span className="font-bold text-[#103342] block">Password Security</span>
              <span className="text-[#294B57]/70 block mt-0.5">Argon2 Password Hashing standard</span>
            </div>
            <Badge variant="teal">Argon2id</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}
