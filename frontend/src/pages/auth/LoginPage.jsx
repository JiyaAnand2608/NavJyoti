import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { SimulationBadge, SimulationBanner } from '../../components/common/SimulationBadge';
import { Baby, Users, ArrowRight, Phone, KeyRound, AlertCircle } from 'lucide-react';

export function LoginPage() {
  const { loginWithDemo, loginWithIdentifier } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const intendedDestination = location.state?.from || null;
  const initialRole = location.state?.role || 'parent';

  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [identifier, setIdentifier] = useState(initialRole === 'parent' ? '+91 98765 43210' : 'ANM-UP-BLS-4019');
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('4092');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRoleTabChange = (role) => {
    setSelectedRole(role);
    setErrorMsg('');
    setOtpSent(false);
    setIdentifier(role === 'parent' ? '+91 98765 43210' : 'ANM-UP-BLS-4019');
  };

  const handleSendOtp = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!identifier.trim()) {
      setErrorMsg('Please enter your registered mobile number or ID');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setOtpSent(true);
    }, 400);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (otpValue.trim().length !== 4) {
      setErrorMsg('Please enter a valid 4-digit verification code');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      loginWithIdentifier(identifier, selectedRole);
      setIsSubmitting(false);

      if (intendedDestination) {
        navigate(intendedDestination, { replace: true });
      } else {
        navigate(selectedRole === 'worker' ? '/worker/dashboard' : '/parent/dashboard', { replace: true });
      }
    }, 400);
  };

  const handle1ClickDemo = (roleKey) => {
    setIsSubmitting(true);
    setTimeout(() => {
      loginWithDemo(roleKey);
      setIsSubmitting(false);

      if (intendedDestination) {
        navigate(intendedDestination, { replace: true });
      } else {
        navigate(roleKey === 'worker' ? '/worker/dashboard' : '/parent/dashboard', { replace: true });
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#F5F1E9] flex flex-col justify-between p-4 sm:p-6 lg:p-8 text-[#294B57]">
      {/* Top Header */}
      <div className="max-w-md mx-auto w-full flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-white p-0.5 overflow-hidden border border-[#D8E6DA] shadow-2xs group-hover:scale-105 transition-transform flex items-center justify-center">
            <img src="/logo.jpg" alt="NavJyoti" className="w-full h-full object-cover scale-115 object-center" />
          </div>
          <div>
            <span className="font-bold text-lg font-serif text-[#103342]">NavJyoti</span>
            <span className="block text-[8.5px] uppercase tracking-wider text-[#007F68] font-bold">
              Health Record Portal
            </span>
          </div>
        </Link>
        <SimulationBadge label="Prototype Auth" />
      </div>

      {/* Main Form Container */}
      <div className="max-w-md mx-auto w-full my-auto py-6">
        <div className="bg-[#FBF8F2] rounded-[28px] border border-[#D8E6DA] p-6 sm:p-8 shadow-xs relative overflow-hidden">
          {/* Subtle Sage Glow Header Accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#A8D5B5] via-[#007F68] to-[#F4B83F]" />

          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[#103342] font-serif">
              {t('auth.loginTitle')}
            </h1>
            <p className="text-xs text-[#294B57] mt-1">
              {t('auth.loginSubtitle')}
            </p>
          </div>

          <SimulationBanner
            title="Simulated Authentication Environment"
            message="This is a prototype demonstration. Click 'Try Demo Account' below for instant evaluation."
          />

          {/* 1-Click Quick Demo Action */}
          <div className="mb-5">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handle1ClickDemo(selectedRole)}
              className="w-full p-3 rounded-full bg-[#DDF0E3] hover:bg-[#C7E4CD] text-[#103342] border border-[#D8E6DA] text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center gap-2.5">
                {selectedRole === 'parent' ? (
                  <Baby className="w-4 h-4 text-[#007F68]" />
                ) : (
                  <Users className="w-4 h-4 text-[#005F52]" />
                )}
                <span>
                  {selectedRole === 'parent' ? t('auth.tryDemoParent') : t('auth.tryDemoWorker')}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#007F68]" />
            </button>
          </div>

          <div className="relative my-5 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#D8E6DA]" />
            </div>
            <span className="relative bg-[#FBF8F2] px-3 text-[10px] text-[#294B57] uppercase tracking-wider font-semibold">
              Or Sign In with Mobile / ID
            </span>
          </div>

          {/* Role selector tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#F0EBE1] border border-[#D8E6DA] rounded-full mb-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleRoleTabChange('parent')}
              className={`py-2 rounded-full transition-all cursor-pointer ${
                selectedRole === 'parent' ? 'bg-white text-[#103342] shadow-2xs font-bold' : 'text-[#294B57]'
              }`}
            >
              Parent / Caregiver
            </button>
            <button
              type="button"
              onClick={() => handleRoleTabChange('worker')}
              className={`py-2 rounded-full transition-all cursor-pointer ${
                selectedRole === 'worker' ? 'bg-[#007F68] text-white shadow-2xs font-bold' : 'text-[#294B57]'
              }`}
            >
              Health Worker
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Step 1: Mobile Number */}
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#103342] mb-1.5">
                  {selectedRole === 'parent' ? t('auth.phoneOrId') : t('auth.workerIdentifier')}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={selectedRole === 'parent' ? "+91 98765 43210" : "ANM-UP-BLS-4019"}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#D8E6DA] bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#007F68]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-full bg-[#007F68] text-white font-semibold text-xs hover:bg-[#005F52] transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Sending..." : t('auth.sendOtp')}
              </button>
            </form>
          ) : (
            /* Step 2: 4-Digit Simulated Code */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3 rounded-xl bg-[#F0EBE1] border border-[#D8E6DA] text-xs flex items-center justify-between">
                <div>
                  <span className="text-[#294B57] block text-[10px]">Code sent to</span>
                  <span className="font-bold text-[#103342]">{identifier}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="text-[11px] text-[#007F68] font-semibold underline cursor-pointer"
                >
                  Change
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#103342] mb-1.5">
                  {t('auth.enterOtp')} (Pre-filled for demo)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#D8E6DA] bg-white text-sm font-mono tracking-widest text-[#103342] focus:outline-none focus:ring-2 focus:ring-[#007F68]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-full bg-[#007F68] text-white font-semibold text-xs hover:bg-[#005F52] transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Verifying..." : t('auth.verifyOtp')}
              </button>
            </form>
          )}

          {/* Registration Link */}
          <div className="mt-6 text-center text-xs text-[#294B57]">
            {t('auth.registerPrompt')}{' '}
            <Link to="/auth/register" className="font-semibold text-[#007F68] underline hover:text-[#005F52]">
              {t('auth.registerNow')}
            </Link>
          </div>
        </div>
      </div>

      <div className="text-center text-[11px] text-[#294B57]/70 py-2">
        NavJyoti Healthcare Platform • Healthy Children, Brighter Tomorrows
      </div>
    </div>
  );
}
