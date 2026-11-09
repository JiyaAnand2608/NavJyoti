import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { SimulationBadge, SimulationBanner } from '../../components/common/SimulationBadge';
import { Modal } from '../../components/common/Modal';
import { Baby, Users, Building, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

export function LoginPage() {
  const { loginWithDemo, loginWithIdentifier, requestPasswordReset } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const intendedDestination = location.state?.from || null;
  const initialRole = location.state?.role || 'parent';

  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [identifier, setIdentifier] = useState(
    initialRole === 'parent'
      ? '+91 98765 43210'
      : initialRole === 'supervisor'
      ? 'MOIC-UP-BLS-1001'
      : 'ANM-UP-BLS-4019'
  );
  const [password, setPassword] = useState('demo123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password reset modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetFeedback, setResetFeedback] = useState('');

  const handleRoleTabChange = (role) => {
    setSelectedRole(role);
    setErrorMsg('');
    if (role === 'parent') {
      setIdentifier('+91 98765 43210');
    } else if (role === 'supervisor') {
      setIdentifier('MOIC-UP-BLS-1001');
    } else {
      setIdentifier('ANM-UP-BLS-4019');
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!identifier.trim()) {
      setErrorMsg('Please enter your registered mobile number or worker ID');
      return;
    }

    if (!password.trim()) {
      setErrorMsg('Please enter your password or demo PIN');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      loginWithIdentifier(identifier, selectedRole);
      setIsSubmitting(false);

      if (intendedDestination) {
        navigate(intendedDestination, { replace: true });
      } else {
        const targetPath =
          selectedRole === 'worker'
            ? '/worker/dashboard'
            : selectedRole === 'supervisor'
            ? '/supervisor/analytics'
            : '/parent/dashboard';
        navigate(targetPath, { replace: true });
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
        const targetPath =
          roleKey === 'worker'
            ? '/worker/dashboard'
            : roleKey === 'supervisor'
            ? '/supervisor/analytics'
            : '/parent/dashboard';
        navigate(targetPath, { replace: true });
      }
    }, 300);
  };

  const handlePasswordResetSubmit = (e) => {
    e.preventDefault();
    if (!resetIdentifier.trim()) return;
    const res = requestPasswordReset(resetIdentifier);
    setResetFeedback(res.message);
    setTimeout(() => {
      setIsResetModalOpen(false);
      setResetFeedback('');
      setResetIdentifier('');
    }, 3500);
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

      {/* Main Login Card */}
      <div className="max-w-md mx-auto w-full my-auto py-6">
        <div className="bg-[#FBF8F2] rounded-[28px] border border-[#D8E6DA] p-6 sm:p-8 shadow-xs relative overflow-hidden">
          {/* Subtle Top Accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#A8D5B5] via-[#007F68] to-[#F4B83F]" />

          {/* Role Tabs (3 Roles) */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#F0EBE1] border border-[#D8E6DA] mb-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleRoleTabChange('parent')}
              className={`py-2 px-1 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
                selectedRole === 'parent'
                  ? 'bg-white text-[#103342] shadow-2xs font-bold'
                  : 'text-[#294B57] hover:text-[#103342]'
              }`}
            >
              <Baby className="w-3.5 h-3.5 text-[#007F68]" />
              <span className="truncate">Parent</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleTabChange('worker')}
              className={`py-2 px-1 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
                selectedRole === 'worker'
                  ? 'bg-white text-[#103342] shadow-2xs font-bold'
                  : 'text-[#294B57] hover:text-[#103342]'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-[#007F68]" />
              <span className="truncate">Worker</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleTabChange('supervisor')}
              className={`py-2 px-1 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
                selectedRole === 'supervisor'
                  ? 'bg-white text-[#103342] shadow-2xs font-bold'
                  : 'text-[#294B57] hover:text-[#103342]'
              }`}
            >
              <Building className="w-3.5 h-3.5 text-[#007F68]" />
              <span className="truncate">Supervisor</span>
            </button>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[#103342] font-serif">
              {selectedRole === 'parent'
                ? "Caregiver Sign In"
                : selectedRole === 'supervisor'
                ? "Medical Officer Sign In"
                : "Health Worker Sign In"}
            </h1>
            <p className="text-xs text-[#294B57] mt-1">
              {selectedRole === 'parent'
                ? "Enter your registered mobile number and password"
                : selectedRole === 'supervisor'
                ? "Enter your MOIC authority credentials or use 1-click access"
                : "Enter your ANM / ASHA official worker ID"}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[#103342] mb-1.5">
                {selectedRole === 'parent'
                  ? "Mobile Number"
                  : selectedRole === 'supervisor'
                  ? "Officer ID or Mobile"
                  : "Worker ID or Mobile Number"}
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={
                  selectedRole === 'parent'
                    ? "+91 98765 43210"
                    : selectedRole === 'supervisor'
                    ? "MOIC-UP-BLS-1001"
                    : "ANM-UP-BLS-4019"
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8E6DA] bg-white text-[#103342] focus:outline-none focus:ring-2 focus:ring-[#007F68]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-semibold text-[#103342]">Password / Demo PIN</label>
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(true)}
                  className="text-[11px] text-[#007F68] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-[#D8E6DA] bg-white text-[#103342] focus:outline-none focus:ring-2 focus:ring-[#007F68]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-full bg-[#007F68] hover:bg-[#005F52] text-white font-semibold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isSubmitting ? "Authenticating..." : "Sign In"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-[#D8E6DA]" />
            <span className="text-[10px] uppercase font-bold text-[#294B57]/60">Or Instant Demo Access</span>
            <div className="flex-1 h-px bg-[#D8E6DA]" />
          </div>

          {/* 1-Click Demo Buttons */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handle1ClickDemo('parent')}
              className="w-full py-2.5 rounded-xl bg-[#DDF0E3] hover:bg-[#c9e8d3] text-[#005F52] text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Baby className="w-3.5 h-3.5 text-[#007F68]" />
              <span>1-Click Demo: Sunita Sharma (Parent)</span>
            </button>
            <button
              type="button"
              onClick={() => handle1ClickDemo('worker')}
              className="w-full py-2.5 rounded-xl bg-[#103342] hover:bg-[#0b242f] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-[#F4B83F]" />
              <span>1-Click Demo: Rekha Devi (ANM)</span>
            </button>
            <button
              type="button"
              onClick={() => handle1ClickDemo('supervisor')}
              className="w-full py-2 rounded-xl bg-white hover:bg-[#F0EBE1] text-[#103342] border border-[#D8E6DA] text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Building className="w-3.5 h-3.5 text-[#007F68]" />
              <span>1-Click Demo: Dr. Alok Verma (Supervisor / MOIC)</span>
            </button>
          </div>

          {/* Register Prompt */}
          {selectedRole === 'parent' && (
            <div className="text-center mt-5 pt-4 border-t border-[#D8E6DA]/70 text-xs">
              <span className="text-[#294B57]">New caregiver family? </span>
              <Link to="/auth/register" className="font-bold text-[#007F68] hover:underline">
                Create an account
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Password Reset Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Reset Password / Access PIN"
        subtitle="Simulated Prototype Password Recovery"
      >
        <form onSubmit={handlePasswordResetSubmit} className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-[#F0EBE1] border border-[#D8E6DA] text-[11px] text-[#294B57] leading-relaxed">
            <strong>Demonstration Notice:</strong> Real SMS/OTP password reset will be operational after live SMS gateway integration. For this demo, submit your identifier to test the flow.
          </div>

          <div>
            <label className="block font-semibold text-[#103342] mb-1">Registered Mobile Number or Worker ID</label>
            <input
              type="text"
              required
              value={resetIdentifier}
              onChange={(e) => setResetIdentifier(e.target.value)}
              placeholder="e.g. +91 98765 43210 or ANM ID"
              className="w-full px-3 py-2 rounded-xl border border-[#D8E6DA] bg-white text-[#103342] focus:ring-2 focus:ring-[#007F68]"
            />
          </div>

          {resetFeedback && (
            <div className="p-3 rounded-xl bg-[#DDF0E3] border border-[#A8D5B5] text-[#005F52] text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#007F68] shrink-0" />
              <span>{resetFeedback}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsResetModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-white border border-[#D8E6DA] text-[#103342] font-semibold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#007F68] hover:bg-[#005F52] text-white font-semibold text-xs cursor-pointer"
            >
              Dispatch Reset Link (Demo)
            </button>
          </div>
        </form>
      </Modal>

      {/* Footer */}
      <div className="max-w-md mx-auto w-full text-center text-xs text-[#294B57]/70 py-4 border-t border-[#D8E6DA]/60">
        Demo identities only • Zero live government databases accessed
      </div>
    </div>
  );
}
