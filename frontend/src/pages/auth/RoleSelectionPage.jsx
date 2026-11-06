import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Baby, Users, ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen bg-[#F5F1E9] flex flex-col justify-between p-4 sm:p-6 lg:p-8 text-[#294B57]">
      {/* Top bar */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white p-0.5 overflow-hidden border border-[#D8E6DA] shadow-2xs flex items-center justify-center">
            <img src="/logo.jpg" alt="NavJyoti" className="w-full h-full object-cover scale-115 object-center" />
          </div>
          <div>
            <span className="font-bold text-lg font-serif text-[#103342]">NavJyoti</span>
            <span className="block text-[9px] text-[#007F68] font-semibold uppercase tracking-wider">
              Child Health Support
            </span>
          </div>
        </Link>
        <SimulationBadge label="Prototype Portal Selection" />
      </div>

      {/* Main Choice Section */}
      <div className="max-w-3xl mx-auto w-full my-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#103342] font-serif">
            {t('auth.selectRoleTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-[#294B57] mt-2 max-w-md mx-auto">
            {t('auth.selectRoleSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Parent / Caregiver Card */}
          <div
            onClick={() => handleSelectRole('parent')}
            className="group p-6 rounded-3xl bg-[#FBF8F2] border-2 border-[#D8E6DA] hover:border-[#007F68] shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-[#DDF0E3] text-[#007F68] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <Baby className="w-7 h-7" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-[#103342]">{t('auth.parentRole')}</h3>
                <span className="px-2 py-0.5 rounded-full bg-[#DDF0E3] text-[#007F68] text-[10px] font-semibold">
                  Family
                </span>
              </div>
              <p className="text-xs text-[#294B57] leading-relaxed mb-6">
                {t('auth.parentDesc')}
              </p>
              <div className="space-y-1.5 text-[11px] text-[#294B57]/80 border-t border-[#D8E6DA]/70 pt-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#007F68]" />
                  <span>Demo Profile: Sunita Sharma (Aarav, 8m)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#007F68]" />
                  <span>Interactive UIP Immunisation Timeline</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[#D8E6DA]/70 flex items-center justify-between">
              <span className="text-xs font-bold text-[#007F68] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                Enter Parent Portal <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* Health Worker / Authority Card */}
          <div
            onClick={() => handleSelectRole('worker')}
            className="group p-6 rounded-3xl bg-[#103342] text-white border-2 border-[#103342] hover:border-[#F4B83F] shadow-md hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-white/10 text-[#F4B83F] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform border border-white/10">
                <Users className="w-7 h-7" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-white">{t('auth.workerRole')}</h3>
                <span className="px-2 py-0.5 rounded-full bg-white/15 text-[#F4B83F] text-[10px] font-semibold">
                  ASHA / ANM
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                {t('auth.workerDesc')}
              </p>
              <div className="space-y-1.5 text-[11px] text-slate-300 border-t border-white/10 pt-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F4B83F]" />
                  <span>Demo Profile: Rekha Devi (ANM, Bilaspur)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F4B83F]" />
                  <span>Red/Amber/Green Follow-up Priority Engine</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs font-bold text-[#F4B83F] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                Enter Worker Portal <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>

        {/* Alternate login link */}
        <div className="text-center mt-8 text-xs text-[#294B57]">
          Want to test custom phone number or ID?{' '}
          <Link to="/auth/login" className="font-semibold text-[#007F68] underline hover:text-[#005F52]">
            Go to Simulated Login & OTP Screen
          </Link>
        </div>
      </div>

      {/* Footer disclaimer */}
      <div className="text-center text-[11px] text-[#294B57]/70 py-2">
        NavJyoti Healthcare Platform • Healthy Children, Brighter Tomorrows
      </div>
    </div>
  );
}
