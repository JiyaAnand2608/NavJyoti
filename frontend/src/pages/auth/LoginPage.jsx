import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

import {
  Baby,
  Users,
  Building,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  KeyRound,
  Mail,
  Phone,
  Lock,
  RefreshCw,
  CheckCircle2,
  Loader2,
  Sparkles,
} from 'lucide-react';

export function LoginPage() {
  const {
    loginParent,
    requestWorkerOtp,
    verifyWorkerOtp,
    loginWithPassword,
    loginWithDemo,
    logout,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const queryRole = searchParams.get('role');
  const intendedDestination = location.state?.from || null;
  const initialRole = location.state?.role || queryRole || 'parent';

  const [selectedRole, setSelectedRole] = useState(initialRole);

  // Parent Credentials State
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Worker/Supervisor OTP Credentials State
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpNotice, setOtpNotice] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [usePasswordMode, setUsePasswordMode] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dashboardPaths = {
    parent: '/parent/dashboard',
    worker: '/worker/dashboard',
    supervisor: '/supervisor/dashboard',
  };

  // Sync selected role when query params or navigation state change
  useEffect(() => {
    const qRole = new URLSearchParams(location.search).get('role');
    const target = location.state?.role || qRole;
    if (target && (target === 'parent' || target === 'worker' || target === 'supervisor')) {
      handleRoleTabChange(target);
    }
  }, [location.search, location.state]);

  // OTP Resend Cooldown Countdown Timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleRoleTabChange = (role) => {
    setSelectedRole(role);
    setErrorMsg('');
    setOtpNotice('');
    setPassword('');
    setOtp('');
    setOtpSent(false);
    setUsePasswordMode(true);
  };

  const handleFillDemoCreds = () => {
    setErrorMsg('');
    if (selectedRole === 'parent') {
      setPhone('9876543210');
      setPassword('NavJyoti@123');
    } else if (selectedRole === 'worker') {
      setEmail('worker.demo@navjyoti.test');
      setPassword('NavJyoti@123');
      setUsePasswordMode(true);
    } else if (selectedRole === 'supervisor') {
      setEmail('supervisor.demo@navjyoti.test');
      setPassword('NavJyoti@123');
      setUsePasswordMode(true);
    }
  };

  // 1. Handle Parent Mobile + Password Login
  const handleParentLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!phone.trim() || !password) {
      setErrorMsg('Please enter both your mobile number and password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await loginParent(phone.trim(), password);

      let dest = intendedDestination;
      if (dest && dest.startsWith('/parent')) {
        navigate(dest, { replace: true });
      } else {
        navigate('/parent/dashboard', { replace: true });
      }
    } catch (error) {
      setErrorMsg(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Handle Worker/Supervisor Request OTP
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setOtpNotice('');

    if (!email.trim()) {
      setErrorMsg('Please enter your official email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await requestWorkerOtp(email.trim(), selectedRole);
      setOtpSent(true);
      setCooldown(result.cooldown_seconds || 60);
      setOtpNotice(result.message || `Verification code has been dispatched to ${email.trim()}`);
    } catch (error) {
      setErrorMsg(error.message || 'Failed to dispatch verification code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Handle Worker/Supervisor Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!otp.trim() || otp.trim().length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await verifyWorkerOtp(email.trim(), selectedRole, otp.trim());

      const targetPath = selectedRole === 'supervisor' ? '/supervisor/dashboard' : '/worker/dashboard';
      let dest = intendedDestination;
      if (dest && (dest.startsWith('/worker') || dest.startsWith('/supervisor'))) {
        navigate(dest, { replace: true });
      } else {
        navigate(targetPath, { replace: true });
      }
    } catch (error) {
      setErrorMsg(error.message || 'Verification failed. Please check the code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Handle Staff Password Login Fallback
  const handleStaffPasswordLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await loginWithPassword(email.trim(), password);

      if (user.role !== selectedRole) {
        logout();
        throw new Error(`This account belongs to the ${user.role} role. Please select the correct portal.`);
      }

      const targetPath = selectedRole === 'supervisor' ? '/supervisor/dashboard' : '/worker/dashboard';
      navigate(targetPath, { replace: true });
    } catch (error) {
      setErrorMsg(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. 1-Click Instant Demo Login (Authenticates against PostgreSQL with seamless offline fallback)
  const handleQuickDemoLogin = async (role) => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const demoUser = await loginWithDemo(role);
      const targetPath = dashboardPaths[demoUser.role] || '/parent/dashboard';
      navigate(targetPath, { replace: true });
    } catch (error) {
      setErrorMsg(error.message || 'Demo login failed. Please check connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col justify-between p-4 sm:p-6 lg:p-8 text-[#294B57] bg-cover bg-center bg-no-repeat bg-[#F5F1E9]"
      style={{
        backgroundImage: `url('/assets/Sage%20Arcs%20and%20Gentle%20Wellness%20Motifs.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Top Header */}
      <div className="max-w-md mx-auto w-full flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-white p-0.5 overflow-hidden border border-[#D8E6DA] shadow-sm flex items-center justify-center">
            <img
              src="/logo.jpg"
              alt="NavJyoti"
              className="w-full h-full object-cover"
            />
          </div>

          <div>
            <span className="font-bold text-lg font-serif text-[#103342]">
              NavJyoti
            </span>
            <span className="block text-[8.5px] uppercase tracking-wider text-[#007F68] font-bold">
              Health Record Portal
            </span>
          </div>
        </Link>

        <span className="text-[10px] font-bold text-[#007F68] bg-[#DDF0E3] px-2.5 py-1 rounded-full border border-[#A8D5B5]">
          Phase 3 Integrated
        </span>
      </div>

      {/* Login card */}
      <div className="max-w-md mx-auto w-full my-auto py-6">
        <div className="bg-[#FBF8F2] rounded-[28px] border border-[#D8E6DA] p-6 sm:p-8 shadow-sm relative overflow-hidden">
          {/* Accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#A8D5B5] via-[#007F68] to-[#F4B83F]" />

          {/* Role selection tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#F0EBE1] border border-[#D8E6DA] mb-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleRoleTabChange('parent')}
              className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all ${
                selectedRole === 'parent'
                  ? 'bg-white text-[#103342] shadow-sm font-bold'
                  : 'text-[#294B57] hover:text-[#103342]'
              }`}
            >
              <Baby className="w-3.5 h-3.5" />
              Parent
            </button>

            <button
              type="button"
              onClick={() => handleRoleTabChange('worker')}
              className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all ${
                selectedRole === 'worker'
                  ? 'bg-white text-[#103342] shadow-sm font-bold'
                  : 'text-[#294B57] hover:text-[#103342]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Worker
            </button>

            <button
              type="button"
              onClick={() => handleRoleTabChange('supervisor')}
              className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all ${
                selectedRole === 'supervisor'
                  ? 'bg-white text-[#103342] shadow-sm font-bold'
                  : 'text-[#294B57] hover:text-[#103342]'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              Supervisor
            </button>
          </div>

          {/* Heading */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[#103342] font-serif">
              {selectedRole === 'parent'
                ? 'Caregiver Sign In'
                : selectedRole === 'worker'
                ? 'Health Worker Sign In'
                : 'Medical Officer Sign In'}
            </h1>
            <p className="text-xs text-[#294B57] mt-1">
              {selectedRole === 'parent'
                ? 'Sign in using your registered mobile number and password'
                : usePasswordMode
                ? 'Sign in using your registered staff email and password'
                : 'Secure single-use OTP verification dispatched to your email'}
            </p>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {otpNotice && (
            <div
              role="status"
              className="mb-4 p-3 rounded-xl bg-[#DDF0E3] border border-[#A8D5B5] text-[#005F52] text-xs flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#007F68]" />
              <span>{otpNotice}</span>
            </div>
          )}

          {/* ----------------- PARENT LOGIN FORM ----------------- */}
          {selectedRole === 'parent' && (
            <form onSubmit={handleParentLogin} className="space-y-4 text-xs">
              <div>
                <label
                  htmlFor="parent-phone"
                  className="block font-semibold text-[#103342] mb-1.5"
                >
                  Registered Mobile Number
                </label>
                <div className="relative">
                  <input
                    id="parent-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210 or +91 98765 43210"
                    className="w-full px-3.5 py-2.5 pl-9 rounded-xl border border-[#D8E6DA] bg-white text-[#103342] focus:outline-none focus:ring-2 focus:ring-[#007F68]"
                  />
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#294B57]/50" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="parent-password"
                    className="block font-semibold text-[#103342]"
                  >
                    Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    id="parent-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your account password"
                    className="w-full px-3.5 py-2.5 pl-9 pr-10 rounded-xl border border-[#D8E6DA] bg-white text-[#103342] focus:outline-none focus:ring-2 focus:ring-[#007F68]"
                  />
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#294B57]/50" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#294B57]/60 hover:text-[#103342] cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleFillDemoCreds}
                  className="text-[11px] text-[#007F68] font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Fill Demo Account (9876543210 / NavJyoti@123)</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-full bg-[#007F68] hover:bg-[#005F52] text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In as Parent</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* --------- WORKER / SUPERVISOR AUTHENTICATION FORM --------- */}
          {selectedRole !== 'parent' && (
            <div>
              {/* Mode Selector: Email + Password vs Email OTP */}
              <div className="flex rounded-xl bg-[#F0EBE1] p-1 mb-4 border border-[#D8E6DA]">
                <button
                  type="button"
                  onClick={() => {
                    setUsePasswordMode(true);
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    usePasswordMode
                      ? 'bg-white text-[#103342] shadow-sm font-bold'
                      : 'text-[#294B57] hover:text-[#103342]'
                  }`}
                >
                  Email & Password Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUsePasswordMode(false);
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    !usePasswordMode
                      ? 'bg-white text-[#103342] shadow-sm font-bold'
                      : 'text-[#294B57] hover:text-[#103342]'
                  }`}
                >
                  Email OTP Login
                </button>
              </div>

              {!usePasswordMode ? (
                // OTP Workflow
                <div className="space-y-4 text-xs">
                  <div>
                    <label
                      htmlFor="staff-email"
                      className="block font-semibold text-[#103342] mb-1.5"
                    >
                      Official Government / NavJyoti Email
                    </label>
                    <div className="relative">
                      <input
                        id="staff-email"
                        type="email"
                        required
                        disabled={otpSent && isSubmitting}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={
                          selectedRole === 'supervisor'
                            ? 'supervisor.demo@navjyoti.test'
                            : 'worker.demo@navjyoti.test'
                        }
                        className="w-full px-3.5 py-2.5 pl-9 rounded-xl border border-[#D8E6DA] bg-white text-[#103342] focus:outline-none focus:ring-2 focus:ring-[#007F68] disabled:bg-gray-100"
                      />
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#294B57]/50" />
                    </div>
                  </div>

                  {!otpSent ? (
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      disabled={isSubmitting}
                      className="w-full py-3 rounded-full bg-[#007F68] hover:bg-[#005F52] text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Dispatching OTP...</span>
                        </>
                      ) : (
                        <>
                          <KeyRound className="w-4 h-4" />
                          <span>Send 6-Digit OTP Code</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label
                            htmlFor="staff-otp"
                            className="block font-semibold text-[#103342]"
                          >
                            Enter 6-Digit Verification Code
                          </label>
                          {cooldown > 0 ? (
                            <span className="text-[11px] text-[#294B57]/70 font-mono">
                              Resend in {cooldown}s
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={handleRequestOtp}
                              disabled={isSubmitting}
                              className="text-[11px] text-[#007F68] font-bold hover:underline cursor-pointer flex items-center gap-1"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Resend OTP</span>
                            </button>
                          )}
                        </div>
                        <input
                          id="staff-otp"
                          type="text"
                          maxLength={6}
                          required
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                          placeholder="••••••"
                          className="w-full px-3.5 py-3 rounded-xl border border-[#007F68] bg-white text-[#103342] text-center font-mono text-lg tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-[#007F68]"
                          autoFocus
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting || otp.length !== 6}
                        className="w-full py-3 rounded-full bg-[#007F68] hover:bg-[#005F52] text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Verifying Code...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Verify Code & Sign In</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                // Email + Password Mode
                <form onSubmit={handleStaffPasswordLogin} className="space-y-4 text-xs">
                  <div>
                    <label
                      htmlFor="staff-pwd-email"
                      className="block font-semibold text-[#103342] mb-1.5"
                    >
                      {selectedRole === 'worker' ? 'Health Worker Email' : 'Supervisor / MOIC Email'}
                    </label>
                    <div className="relative">
                      <input
                        id="staff-pwd-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={
                          selectedRole === 'supervisor'
                            ? 'supervisor.demo@navjyoti.test'
                            : 'worker.demo@navjyoti.test'
                        }
                        className="w-full px-3.5 py-2.5 pl-9 rounded-xl border border-[#D8E6DA] bg-white text-[#103342] focus:outline-none focus:ring-2 focus:ring-[#007F68]"
                      />
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#294B57]/50" />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="staff-password"
                      className="block font-semibold text-[#103342] mb-1.5"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="staff-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="NavJyoti@123"
                        className="w-full px-3.5 py-2.5 pl-9 pr-10 rounded-xl border border-[#D8E6DA] bg-white text-[#103342] focus:outline-none focus:ring-2 focus:ring-[#007F68]"
                      />
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#294B57]/50" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#294B57]/60 hover:text-[#103342] cursor-pointer"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={handleFillDemoCreds}
                      className="text-[11px] text-[#007F68] font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>
                        Fill Demo (
                        {selectedRole === 'supervisor'
                          ? 'supervisor.demo@navjyoti.test'
                          : 'worker.demo@navjyoti.test'}
                        )
                      </span>
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-full bg-[#007F68] hover:bg-[#005F52] text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Signing In...</span>
                      </>
                    ) : (
                      <>
                        <span>
                          {selectedRole === 'worker'
                            ? 'Sign In as Health Worker'
                            : 'Sign In as Supervisor'}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* 1-Click Demo Login Button (Database-Deferred Fallback) */}
          <div className="mt-5 pt-4 border-t border-[#D8E6DA]">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin(selectedRole)}
              className="w-full py-2.5 px-3 rounded-xl bg-[#F0EBE1] hover:bg-[#E8E2D5] text-[#103342] text-xs font-semibold border border-[#D8E6DA] flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#007F68]" />
              <span>1-Click Demo Access ({selectedRole === 'parent' ? 'Caregiver' : selectedRole === 'worker' ? 'ANM Worker' : 'Supervisor'})</span>
            </button>
          </div>

          {/* Registration link for parents */}
          {selectedRole === 'parent' && (
            <div className="text-center mt-4 text-xs">
              <span className="text-[#294B57]">New to NavJyoti? </span>
              <Link
                to="/auth/register"
                className="font-bold text-[#007F68] hover:underline"
              >
                Create caregiver account
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-md mx-auto w-full text-center text-xs text-[#294B57]/70 py-4 border-t border-[#D8E6DA]/60">
        NavJyoti Healthcare Platform • Ministry of Health & Family Welfare Aligned
      </div>
    </div>
  );
}
