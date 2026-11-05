import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { SimulationBadge, SimulationBanner } from '../../components/common/SimulationBadge';
import { ArrowLeft, UserPlus, ShieldCheck, AlertCircle } from 'lucide-react';

export function RegisterPage() {
  const { registerCaregiver } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(lang || 'hi');
  const [consent, setConsent] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }

    if (!phone.trim()) {
      setErrorMsg('Please enter a valid mobile number');
      return;
    }

    if (!consent) {
      setErrorMsg('Please accept the consent acknowledgement to proceed');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      registerCaregiver({
        name,
        phone,
        language: selectedLanguage,
        consent,
      });

      if (selectedLanguage !== lang) {
        setLang(selectedLanguage);
      }

      setIsSubmitting(false);
      navigate('/parent/dashboard', { replace: true });
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#FAFBF8] flex flex-col justify-between p-4 sm:p-6 lg:p-8 text-[#17394A]">
      {/* Top Header */}
      <div className="max-w-md mx-auto w-full flex items-center justify-between">
        <Link to="/auth/login" className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#006B64]">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Login</span>
        </Link>
        <SimulationBadge label="Simulated Onboarding" />
      </div>

      {/* Main Container */}
      <div className="max-w-md mx-auto w-full my-auto py-6">
        <div className="bg-white rounded-[28px] border border-[#DCEFE5] p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#DCEFE5] via-[#006B64] to-[#F5C45E]" />

          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[#17394A] font-serif">
              {t('auth.createAccountTitle')}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {t('auth.createAccountSubtitle')}
            </p>
          </div>

          <SimulationBanner
            title="Demonstration Registration"
            message="This creates a persistent caregiver account in your browser session. In production, this binds securely with state public health systems."
          />

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Caregiver Name */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {t('auth.fullName')}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Geeta Devi"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#006B64]"
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {t('auth.phoneOrId')}
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98XXX XXXXX"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#006B64]"
              />
            </div>

            {/* Language Preference */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {t('auth.preferredLanguage')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLanguage('en')}
                  className={`py-2 rounded-xl border font-semibold text-xs transition-all cursor-pointer ${
                    selectedLanguage === 'en'
                      ? 'bg-[#EAF7F0] border-[#006B64] text-[#006B64]'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLanguage('hi')}
                  className={`py-2 rounded-xl border font-semibold text-xs transition-all cursor-pointer ${
                    selectedLanguage === 'hi'
                      ? 'bg-[#EAF7F0] border-[#006B64] text-[#006B64]'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  हिंदी (Hindi)
                </button>
              </div>
            </div>

            {/* Consent Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 rounded text-[#006B64] focus:ring-[#006B64]"
                />
                <span className="text-[11px] text-slate-600 leading-relaxed">
                  {t('auth.consentText')}
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-full bg-[#006B64] text-white font-semibold text-xs hover:bg-[#00544e] transition-all shadow-xs cursor-pointer mt-2 disabled:opacity-50"
            >
              {isSubmitting ? "Creating Account..." : t('auth.createAccountBtn')}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-500">
            {t('auth.haveAccount')}{' '}
            <Link to="/auth/login" className="font-semibold text-[#006B64] underline hover:text-[#00544e]">
              {t('auth.signInHere')}
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
