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
  const [village, setVillage] = useState('Rampur');
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

    const cleanPhone = phone.trim().replace(/\s/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number');
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
        village,
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
              {t('auth.createAccountTitle') || "Create Caregiver Account"}
            </h1>
            <p className="text-xs text-[#294B57] mt-1">
              {t('auth.createAccountSubtitle') || "Sign up to track and organize your child's health journey"}
            </p>
          </div>

          <SimulationBanner
            title="Demonstration Account Setup"
            message="No real SMS verification required in this prototype. Submitting creates a local demo profile immediately."
          />

          {errorMsg && (
            <div className="my-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs mt-4">
            <div>
              <label className="block font-semibold text-[#103342] mb-1.5">
                Caregiver Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sunita Sharma"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8E6DA] bg-white text-[#103342] focus:outline-none focus:ring-2 focus:ring-[#007F68]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#103342] mb-1.5">
                Mobile Number (for SMS reminders)
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8E6DA] bg-white text-[#103342] focus:outline-none focus:ring-2 focus:ring-[#007F68]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#103342] mb-1.5">
                Village / Ward
              </label>
              <select
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8E6DA] bg-white text-[#103342] focus:outline-none focus:ring-2 focus:ring-[#007F68]"
              >
                <option value="Rampur">Rampur (Bilaspur Sub-Centre)</option>
                <option value="Kalyanpur">Kalyanpur (Kalyanpur Sub-Centre)</option>
                <option value="Shivpur">Shivpur (Shivpur Sub-Centre)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#103342] mb-1.5">
                Preferred Interface Language
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedLanguage('en')}
                  className={`py-2 px-3 rounded-xl border font-semibold transition-all cursor-pointer ${
                    selectedLanguage === 'en'
                      ? 'bg-[#DDF0E3] border-[#007F68] text-[#005F52]'
                      : 'bg-white border-[#D8E6DA] text-[#294B57] hover:bg-[#F0EBE1]'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLanguage('hi')}
                  className={`py-2 px-3 rounded-xl border font-semibold transition-all cursor-pointer ${
                    selectedLanguage === 'hi'
                      ? 'bg-[#DDF0E3] border-[#007F68] text-[#005F52]'
                      : 'bg-white border-[#D8E6DA] text-[#294B57] hover:bg-[#F0EBE1]'
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
                  className="mt-0.5 rounded text-[#007F68] focus:ring-[#007F68] cursor-pointer"
                />
                <span className="text-[11px] text-[#294B57] leading-relaxed">
                  I agree to participate in the NavJyoti health support prototype and consent to receiving timely child vaccination reminders.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-full bg-[#007F68] hover:bg-[#005F52] text-white font-semibold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? "Creating Profile..." : "Register & Continue"}</span>
            </button>
          </form>

          <div className="text-center mt-5 pt-4 border-t border-[#D8E6DA]/70 text-xs">
            <span className="text-[#294B57]">Already registered? </span>
            <Link to="/auth/login" className="font-bold text-[#007F68] hover:underline">
              Sign in here
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-md mx-auto w-full text-center text-xs text-[#294B57]/70 py-4 border-t border-[#D8E6DA]/60">
        NavJyoti Healthcare Prototype • MoHFW UIP Aligned
      </div>
    </div>
  );
}
