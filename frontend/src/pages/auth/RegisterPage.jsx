
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  SimulationBadge,
  SimulationBanner,
} from '../../components/common/SimulationBadge';
import {
  ArrowLeft,
  UserPlus,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { apiUrl } from '../../services/backendApi';

export function RegisterPage() {
  const { t, lang, setLang } = useLanguage();

  // Registration form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [selectedLanguage, setSelectedLanguage] = useState(
    lang || 'hi'
  );

  const [consent, setConsent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  // Register account using FastAPI and Neon PostgreSQL
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    // Form validation
    if (!cleanName) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    if (!cleanEmail) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg(
        'Your password must contain at least 8 characters.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (!consent) {
      setErrorMsg(
        'Please acknowledge that this is a demo prototype.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Send new user to the real backend
      const response = await fetch(
        apiUrl('/auth/register'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: cleanName,
            email: cleanEmail,
            password: password,
          }),
        }
      );

      const data = await response.json().catch(() => null);

      // Handle backend errors
      if (!response.ok) {
        let message = 'Registration failed. Please try again.';

        if (typeof data?.detail === 'string') {
          message = data.detail;
        } else if (Array.isArray(data?.detail)) {
          message = data.detail
            .map((item) => item.msg || 'Invalid input')
            .join(', ');
        }

        throw new Error(message);
      }

      // Registration succeeded in PostgreSQL
      if (selectedLanguage !== lang) {
        setLang(selectedLanguage);
      }

      // Clear passwords from the form
      setPassword('');
      setConfirmPassword('');

      setIsRegistered(true);
    } catch (error) {
      console.error('Registration failed:', error);

      if (error instanceof TypeError) {
        setErrorMsg(
          'Cannot connect to the server. Please check your internet connection and try again.'
        );
      } else {
        setErrorMsg(
          error.message || 'Something went wrong.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F1E9] flex flex-col justify-between p-4 sm:p-6 lg:p-8 text-[#294B57]">

      {/* Top Header */}
      <div className="max-w-md mx-auto w-full flex items-center justify-between">
        <Link
          to="/auth/login"
          className="flex items-center gap-1.5 text-xs font-semibold text-[#103342] hover:text-[#007F68]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Login</span>
        </Link>

        <SimulationBadge label="Hackathon Demo" />
      </div>

      {/* Main Container */}
      <div className="max-w-md mx-auto w-full my-auto py-6">

        <div className="bg-[#FBF8F2] rounded-[28px] border border-[#D8E6DA] p-6 sm:p-8 shadow-xs relative overflow-hidden">

          {/* Top Color Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#A8D5B5] via-[#007F68] to-[#F4B83F]" />

          {/* Heading */}
          <div className="text-center mb-6">

            <h1 className="text-2xl font-bold text-[#103342] font-serif">
              {t('auth.createAccountTitle') ||
                'Create Caregiver Account'}
            </h1>

            <p className="text-xs text-[#294B57] mt-1">
              {t('auth.createAccountSubtitle') ||
                "Sign up to track and organize your child's health journey"}
            </p>

          </div>

          {/* Successfully Registered */}
          {isRegistered ? (
            <div
              className="text-center py-6"
              role="status"
            >
              <div className="flex justify-center mb-4">
                <ShieldCheck className="w-14 h-14 text-[#007F68]" />
              </div>

              <h2 className="text-xl font-bold text-[#103342] mb-3">
                Account Created Successfully!
              </h2>

              <p className="text-sm text-[#294B57] mb-3">
                Your caregiver account has been saved
                through the NavJyoti backend to the
                online PostgreSQL database.
              </p>

              <p className="text-xs text-[#294B57] mb-6">
                You can now sign in using your
                registered email address and password.
              </p>

              <Link
                to="/auth/login"
                className="inline-flex items-center justify-center w-full py-3 rounded-full bg-[#007F68] hover:bg-[#005F52] text-white font-semibold text-sm"
              >
                Go to Sign In
              </Link>
            </div>
          ) : (
            <>
              {/* Demo Information */}
              <SimulationBanner
                title="Online Demo Registration"
                message="This form registers a caregiver account through the shared NavJyoti backend. No email verification or SMS service is enabled. Use fictional information only."
              />

              {/* Error Message */}
              {errorMsg && (
                <div
                  role="alert"
                  className="my-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Registration Form */}
              <form
                onSubmit={handleSubmit}
                className="space-y-4 text-xs mt-4"
              >

                {/* Full Name */}
                <div>
                  <label
                    htmlFor="caregiver-name"
                    className="block font-semibold text-[#103342] mb-1.5"
                  >
                    Caregiver Full Name
                  </label>

                  <input
                    id="caregiver-name"
                    type="text"
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sunita Demo"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8E6DA] bg-white text-[#103342] focus:outline-none focus:ring-2 focus:ring-[#007F68]"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label
                    htmlFor="caregiver-email"
                    className="block font-semibold text-[#103342] mb-1.5"
                  >
                    Email Address
                  </label>

                  <input
                    id="caregiver-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. parent@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8E6DA] bg-white text-[#103342] focus:outline-none focus:ring-2 focus:ring-[#007F68]"
                  />
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="caregiver-password"
                    className="block font-semibold text-[#103342] mb-1.5"
                  >
                    Password
                  </label>

                  <input
                    id="caregiver-password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8E6DA] bg-white text-[#103342] focus:outline-none focus:ring-2 focus:ring-[#007F68]"
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="caregiver-confirm-password"
                    className="block font-semibold text-[#103342] mb-1.5"
                  >
                    Confirm Password
                  </label>

                  <input
                    id="caregiver-confirm-password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                    placeholder="Enter password again"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8E6DA] bg-white text-[#103342] focus:outline-none focus:ring-2 focus:ring-[#007F68]"
                  />
                </div>

                {/* Preferred Language */}
                <div>
                  <label className="block font-semibold text-[#103342] mb-1.5">
                    Preferred Interface Language
                  </label>

                  <div className="grid grid-cols-2 gap-3">

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedLanguage('en')
                      }
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
                      onClick={() =>
                        setSelectedLanguage('hi')
                      }
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

                {/* Demo Acknowledgement */}
                <div className="pt-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">

                    <input
                      type="checkbox"
                      required
                      checked={consent}
                      onChange={(e) =>
                        setConsent(e.target.checked)
                      }
                      className="mt-0.5 rounded text-[#007F68] focus:ring-[#007F68] cursor-pointer"
                    />

                    <span className="text-[11px] text-[#294B57] leading-relaxed">
                      I understand NavJyoti is a hackathon
                      prototype and will use only
                      fictional information for testing.
                    </span>

                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-full bg-[#007F68] hover:bg-[#005F52] text-white font-semibold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  <UserPlus className="w-4 h-4" />

                  <span>
                    {isSubmitting
                      ? 'Creating Account...'
                      : 'Register & Continue'}
                  </span>
                </button>

              </form>

              {/* Sign In Link */}
              <div className="text-center mt-5 pt-4 border-t border-[#D8E6DA]/70 text-xs">

                <span className="text-[#294B57]">
                  Already registered?{' '}
                </span>

                <Link
                  to="/auth/login"
                  className="font-bold text-[#007F68] hover:underline"
                >
                  Sign in here
                </Link>

              </div>
            </>
          )}

        </div>
      </div>

      {/* Footer */}
      <div className="max-w-md mx-auto w-full text-center text-xs text-[#294B57]/70 py-4 border-t border-[#D8E6DA]/60">
        NavJyoti Healthcare Prototype • MoHFW UIP Aligned
      </div>

    </div>
  );
}
