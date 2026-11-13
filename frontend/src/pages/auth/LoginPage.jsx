
import React, { useState } from 'react';
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
} from 'lucide-react';

export function LoginPage() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const initialRole = location.state?.role || 'parent';

  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dashboardPaths = {
    parent: '/parent/dashboard',
    worker: '/worker/dashboard',
    supervisor: '/supervisor/analytics',
  };

  const handleRoleTabChange = (role) => {
    setSelectedRole(role);
    setErrorMsg('');
    setPassword('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Please enter your email and password.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Authenticate against FastAPI
      const user = await login(email.trim(), password);

      // Prevent role mismatch
      if (user.role !== selectedRole) {
        logout();
        throw new Error(
          `This account belongs to the ${user.role} role. Please select the correct role.`
        );
      }

      // Redirect to the authenticated user's dashboard
      navigate(dashboardPaths[user.role], {
        replace: true,
      });

    } catch (error) {
      setErrorMsg(
        error.message || 'Login failed. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F1E9] flex flex-col justify-between p-4 sm:p-6 lg:p-8 text-[#294B57]">

      {/* Header */}
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

        <span className="text-[10px] font-bold text-[#007F68]">
          Secure Login
        </span>
      </div>

      {/* Login card */}
      <div className="max-w-md mx-auto w-full my-auto py-6">
        <div className="bg-[#FBF8F2] rounded-[28px] border border-[#D8E6DA] p-6 sm:p-8 shadow-sm relative overflow-hidden">

          {/* Accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#A8D5B5] via-[#007F68] to-[#F4B83F]" />

          {/* Role selection */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#F0EBE1] border border-[#D8E6DA] mb-6 text-xs font-semibold">

            <button
              type="button"
              onClick={() => handleRoleTabChange('parent')}
              className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1 cursor-pointer ${
                selectedRole === 'parent'
                  ? 'bg-white text-[#103342] shadow-sm font-bold'
                  : 'text-[#294B57]'
              }`}
            >
              <Baby className="w-3.5 h-3.5" />
              Parent
            </button>

            <button
              type="button"
              onClick={() => handleRoleTabChange('worker')}
              className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1 cursor-pointer ${
                selectedRole === 'worker'
                  ? 'bg-white text-[#103342] shadow-sm font-bold'
                  : 'text-[#294B57]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Worker
            </button>

            <button
              type="button"
              onClick={() => handleRoleTabChange('supervisor')}
              className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1 cursor-pointer ${
                selectedRole === 'supervisor'
                  ? 'bg-white text-[#103342] shadow-sm font-bold'
                  : 'text-[#294B57]'
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
              Sign in using your registered email and password.
            </p>
          </div>

          {/* Error */}
          {errorMsg && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Real login form */}
          <form
            onSubmit={handleLoginSubmit}
            className="space-y-4 text-xs"
          >

            <div>
              <label
                htmlFor="login-email"
                className="block font-semibold text-[#103342] mb-1.5"
              >
                Email Address
              </label>

              <input
                id="login-email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your registered email"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8E6DA] bg-white text-[#103342] focus:outline-none focus:ring-2 focus:ring-[#007F68]"
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block font-semibold text-[#103342] mb-1.5"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-[#D8E6DA] bg-white text-[#103342] focus:outline-none focus:ring-2 focus:ring-[#007F68]"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-full bg-[#007F68] hover:bg-[#005F52] text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Registration */}
          {selectedRole === 'parent' && (
            <div className="text-center mt-5 pt-4 border-t border-[#D8E6DA] text-xs">
              <span className="text-[#294B57]">
                New caregiver family?{' '}
              </span>

              <Link
                to="/auth/register"
                className="font-bold text-[#007F68] hover:underline"
              >
                Create an account
              </Link>
            </div>
          )}

          <p className="text-center text-[11px] text-[#294B57] mt-5">
            Password recovery is not available yet.
            Contact your project administrator for test account assistance.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-md mx-auto w-full text-center text-xs text-[#294B57]/70 py-4 border-t border-[#D8E6DA]/60">
        NavJyoti Health Record Portal • Development Environment
      </div>
    </div>
  );
}
