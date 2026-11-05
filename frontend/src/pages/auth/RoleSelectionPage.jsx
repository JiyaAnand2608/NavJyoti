import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Baby, Users, ArrowRight, ShieldCheck, Heart, Sparkles, Building2 } from 'lucide-react';
import { SimulationBadge } from '../../components/common/SimulationBadge';

export function RoleSelectionPage() {
  const { switchRole, loginWithDemo } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSelectRole = (roleKey) => {
    loginWithDemo(roleKey);
    navigate(roleKey === 'worker' ? '/worker/dashboard' : '/parent/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#FAFBF8] flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top bar */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-white p-1 border border-slate-200 shadow-2xs">
            <img src="/logo.jpg" alt="NavJyoti" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="font-bold text-lg font-serif text-[#17394A]">NavJyoti</span>
            <span className="block text-[9px] text-[#00524c] font-semibold uppercase tracking-wider">
              Child Health Support
            </span>
          </div>
        </Link>
        <SimulationBadge label="Prototype Portal Selection" />
      </div>

      {/* Main Choice Section */}
      <div className="max-w-3xl mx-auto w-full my-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#17394A] font-serif">
            {t('auth.selectRoleTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md mx-auto">
            {t('auth.selectRoleSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Parent / Caregiver Card */}
          <div
            onClick={() => handleSelectRole('parent')}
            className="group p-6 rounded-3xl bg-white border-2 border-slate-200 hover:border-[#00524c] shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-[#E8F3EE] text-[#00524c] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <Baby className="w-7 h-7" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-[#17394A]">{t('auth.parentRole')}</h3>
                <span className="px-2 py-0.5 rounded-full bg-[#E8F3EE] text-[#00524c] text-[10px] font-semibold">
                  Family
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                {t('auth.parentDesc')}
              </p>
              <div className="space-y-1.5 text-[11px] text-slate-500 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00524c]" />
                  <span>Demo Profile: Sunita Sharma (Aarav, 8m)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00524c]" />
                  <span>Interactive UIP Immunisation Timeline</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-[#00524c] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                Enter Parent Portal <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* Health Worker / Authority Card */}
          <div
            onClick={() => handleSelectRole('worker')}
            className="group p-6 rounded-3xl bg-[#17394A] text-white border-2 border-[#17394A] hover:border-[#F5C45E] shadow-md hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-white/10 text-[#F5C45E] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform border border-white/10">
                <Users className="w-7 h-7" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-white">{t('auth.workerRole')}</h3>
                <span className="px-2 py-0.5 rounded-full bg-white/15 text-[#F5C45E] text-[10px] font-semibold">
                  ASHA / ANM
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                {t('auth.workerDesc')}
              </p>
              <div className="space-y-1.5 text-[11px] text-slate-300 border-t border-white/10 pt-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F5C45E]" />
                  <span>Demo Profile: Rekha Devi (ANM, Bilaspur)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F5C45E]" />
                  <span>Red/Amber/Green Follow-up Priority Engine</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs font-bold text-[#F5C45E] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                Enter Worker Portal <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>

        {/* Alternate login link */}
        <div className="text-center mt-8 text-xs text-slate-500">
          Want to test custom phone number or ID?{' '}
          <Link to="/auth/login" className="font-semibold text-[#17394A] underline hover:text-[#00524c]">
            Go to Simulated Login & OTP Screen
          </Link>
        </div>
      </div>

      {/* Footer disclaimer */}
      <div className="text-center text-[11px] text-slate-400 py-2">
        NavJyoti Prototype • Aligned with Ministry of Health & Family Welfare Universal Immunisation Programme
      </div>
    </div>
  );
}
