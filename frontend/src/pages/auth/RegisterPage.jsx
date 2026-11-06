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
    <div className="min-h-screen bg-[#F5F1E9] flex flex-col justify-between p-4 sm:p-6 lg:p-8 text-[#294B57]">
      {/* Top Header */}
      <div className="max-w-md mx-auto w-full flex items-center justify-between">
        <Link to="/auth/login" className="flex items-center gap-1.5 text-xs font-semibold text-[#103342] hover:text-[#007F68]">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Login</span>
        </Link>
        <SimulationBadge label="Simulated Onboarding" />
      </div>

      {/* Main Container */}
      <div className="max-w-md mx-auto w-full my-auto py-6">
        <div className="bg-[#FBF8F2] rounded-[28px] border border-[#D8E6DA] p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#A8D5B5] via-[#007F68] to-[#F4B83F]" />

          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[#103342] font-serif">
              {t('auth.createAccountTitle')}
            </h1>
            <p className="text-xs text-[#294B57] mt-1">
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
              <label className="block font-semibold text-[#103342] mb-1">
                {t('auth.fullName')}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Geeta Devi"
                className="w-full px-3 py-2.5 rounded-xl border border-[#D8E6DA] bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#007F68]"
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block font-semibold text-[#103342] mb-1">
                {t('auth.phoneOrId')}
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98XXX XXXXX"
                className="w-full px-3 py-2.5 rounded-xl border border-[#D8E6DA] bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#007F68]"
              />
            </div>

            {/* Language Preference */}
            <div>
              <label className="block font-semibold text-[#103342] mb-1">
                {t('auth.preferredLanguage')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLanguage('en')}
                  className={`py-2 rounded-xl border font-semibold text-xs transition-all cursor-pointer ${
                    selectedLanguage === 'en'
                      ? 'bg-[#DDF0E3] border-[#007F68] text-[#007F68]'
                      : 'border-[#D8E6DA] text-[#294B57] bg-white'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLanguage('hi')}
                  className={`py-2 rounded-xl border font-semibold text-xs transition-all cursor-pointer ${
                    selectedLanguage === 'hi'
                      ? 'bg-[#DDF0E3] border-[#007F68] text-[#007F68]'
                      : 'border-[#D8E6DA] text-[#294B57] bg-white'
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
                  className="mt-0.5 rounded text-[#007F68] focus:ring-[#007F68]"
                />
                <span className="text-[11px] text-[#294B57] leading-relaxed">
                  {t('auth.consentText')}
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-full bg-[#007F68] text-white font-semibold text-xs hover:bg-[#005F52] transition-all shadow-xs cursor-pointer mt-2 disabled:opacity-50"
            >
              {isSubmitting ? "Creating Account..." : t('auth.createAccountBtn')}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-[#294B57]">
            {t('auth.haveAccount')}{' '}
            <Link to="/auth/login" className="font-semibold text-[#007F68] underline hover:text-[#005F52]">
              {t('auth.signInHere')}
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
