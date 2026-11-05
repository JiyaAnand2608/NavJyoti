import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { SimulationBadge, SimulationBanner } from '../../components/common/SimulationBadge';
import { Baby, Users, ArrowRight, Phone, KeyRound, AlertCircle, Sparkles } from 'lucide-react';

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
    <div className="min-h-screen bg-[#FAFBF8] flex flex-col justify-between p-4 sm:p-6 lg:p-8 text-[#17394A]">
      {/* Top Header */}
      <div className="max-w-md mx-auto w-full flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-white p-1 border border-[#DCEFE5] shadow-2xs group-hover:scale-105 transition-transform">
            <img src="/logo.jpg" alt="NavJyoti" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="font-bold text-base font-serif text-[#17394A]">NavJyoti</span>
            <span className="block text-[8px] uppercase tracking-wider text-[#006B64] font-bold">
              Health Record Portal
            </span>
          </div>
        </Link>
        <SimulationBadge label="Prototype Auth" />
      </div>

      {/* Main Form Container */}
      <div className="max-w-md mx-auto w-full my-auto py-6">
        <div className="bg-white rounded-[28px] border border-[#DCEFE5] p-6 sm:p-8 shadow-xs relative overflow-hidden">
          {/* Subtle Sage Glow Header Accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#DCEFE5] via-[#006B64] to-[#F5C45E]" />

          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[#17394A] font-serif">
              {t('auth.loginTitle')}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
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
              className="w-full p-3 rounded-full bg-[#EAF7F0] hover:bg-[#DCEFE5] text-[#17394A] border border-[#CDE5D6] text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center gap-2.5">
                {selectedRole === 'parent' ? (
                  <Baby className="w-4 h-4 text-[#006B64]" />
                ) : (
                  <Users className="w-4 h-4 text-[#dfab3e]" />
                )}
                <span>
                  {selectedRole === 'parent' ? t('auth.tryDemoParent') : t('auth.tryDemoWorker')}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#006B64]" />
            </button>
          </div>

          <div className="relative my-5 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100" />
            </div>
            <span className="relative bg-white px-3 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Or Sign In with Mobile / ID
            </span>
          </div>

          {/* Role selector tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-full mb-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleRoleTabChange('parent')}
              className={`py-2 rounded-full transition-all cursor-pointer ${
                selectedRole === 'parent' ? 'bg-white text-[#17394A] shadow-2xs' : 'text-slate-500'
              }`}
            >
              Parent / Caregiver
            </button>
            <button
              type="button"
              onClick={() => handleRoleTabChange('worker')}
              className={`py-2 rounded-full transition-all cursor-pointer ${
                selectedRole === 'worker' ? 'bg-[#006B64] text-white shadow-2xs' : 'text-slate-500'
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
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
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
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#006B64]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-full bg-[#006B64] text-white font-semibold text-xs hover:bg-[#00544e] transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Sending..." : t('auth.sendOtp')}
              </button>
            </form>
          ) : (
            /* Step 2: 4-Digit Simulated Code */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-[10px]">Code sent to</span>
                  <span className="font-bold text-[#17394A]">{identifier}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="text-[11px] text-[#006B64] font-semibold underline cursor-pointer"
                >
                  Change
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
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
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm font-mono tracking-widest text-[#17394A] focus:outline-none focus:ring-2 focus:ring-[#006B64]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-full bg-[#006B64] text-white font-semibold text-xs hover:bg-[#00544e] transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Verifying..." : t('auth.verifyOtp')}
              </button>
            </form>
          )}

          {/* Registration Link */}
          <div className="mt-6 text-center text-xs text-slate-500">
            {t('auth.registerPrompt')}{' '}
            <Link to="/auth/register" className="font-semibold text-[#006B64] underline hover:text-[#00544e]">
              {t('auth.registerNow')}
            </Link>
          </div>
        </div>
      </div>

      <div className="text-center text-[11px] text-slate-400 py-2">
        NavJyoti Healthcare Prototype • BIOS Hackathon Challenge 03
      </div>
    </div>
  );
}
