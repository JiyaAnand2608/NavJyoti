import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Baby, Users, ShieldCheck, ArrowRight, Building } from 'lucide-react';
import { SimulationBadge } from '../../components/common/SimulationBadge';

export function RoleSelectionPage() {
  const { switchRole, loginWithDemo } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSelectRole = (roleKey) => {
    loginWithDemo(roleKey);
    if (roleKey === 'supervisor') {
      navigate('/supervisor/analytics');
    } else if (roleKey === 'worker') {
      navigate('/worker/dashboard');
    } else {
      navigate('/parent/dashboard');
    }
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
      <div className="max-w-5xl mx-auto w-full my-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#103342] font-serif">
            {t('auth.selectRoleTitle') || "Choose Your Portal"}
          </h1>
          <p className="text-xs sm:text-sm text-[#294B57] mt-2 max-w-md mx-auto">
            {t('auth.selectRoleSubtitle') || "Select your role to access your dedicated health dashboard"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Parent / Caregiver Card */}
          <div
            onClick={() => handleSelectRole('parent')}
            className="group p-6 rounded-3xl bg-[#FBF8F2] border-2 border-[#D8E6DA] hover:border-[#007F68] shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-[#DDF0E3] text-[#007F68] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <Baby className="w-7 h-7" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-[#103342]">{t('auth.parentRole') || "Parent / Caregiver"}</h3>
                <span className="px-2 py-0.5 rounded-full bg-[#DDF0E3] text-[#007F68] text-[10px] font-semibold">
                  Family
                </span>
              </div>
              <p className="text-xs text-[#294B57] leading-relaxed">
                {t('auth.parentDesc') || "Track your child's immunisations, developmental observations, and coordinate ANM visits."}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[#D8E6DA]/70 flex items-center justify-between text-xs font-bold text-[#007F68]">
              <span>Enter Parent Portal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Health Worker Card */}
          <div
            onClick={() => handleSelectRole('worker')}
            className="group p-6 rounded-3xl bg-[#FBF8F2] border-2 border-[#D8E6DA] hover:border-[#007F68] shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-[#103342] text-[#F4B83F] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <Users className="w-7 h-7" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-[#103342]">{t('auth.workerRole') || "Health Worker"}</h3>
                <span className="px-2 py-0.5 rounded-full bg-[#F0EBE1] text-[#103342] text-[10px] font-semibold">
                  ASHA / ANM
                </span>
              </div>
              <p className="text-xs text-[#294B57] leading-relaxed">
                {t('auth.workerDesc') || "For ASHA, ANM, and medical staff to manage child registries, record doses, and organise follow-ups."}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[#D8E6DA]/70 flex items-center justify-between text-xs font-bold text-[#007F68]">
              <span>Enter Worker Portal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Supervisor / Authority Card */}
          <div
            onClick={() => handleSelectRole('supervisor')}
            className="group p-6 rounded-3xl bg-[#FBF8F2] border-2 border-[#D8E6DA] hover:border-[#007F68] shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-[#007F68] text-white flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <Building className="w-7 h-7" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-[#103342]">Supervisor / MOIC</h3>
                <span className="px-2 py-0.5 rounded-full bg-[#DDF0E3] text-[#007F68] text-[10px] font-semibold">
                  Authority
                </span>
              </div>
              <p className="text-xs text-[#294B57] leading-relaxed">
                Block & District analytics for Medical Officers, aggregate UIP coverage rates, drop-out monitoring, and CSV reporting.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[#D8E6DA]/70 flex items-center justify-between text-xs font-bold text-[#007F68]">
              <span>Enter Supervisor Analytics</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link
            to="/auth/login"
            className="text-xs font-semibold text-[#007F68] hover:underline"
          >
            Already have specific login credentials? Sign in here →
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-5xl mx-auto w-full text-center text-xs text-[#294B57]/70 py-4 border-t border-[#D8E6DA]/60">
        NavJyoti Healthcare Prototype • Aligned with Ministry of Health and Family Welfare (MoHFW) UIP standards
      </div>
    </div>
  );
}
