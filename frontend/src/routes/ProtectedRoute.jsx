import React from 'react';
import { Navigate, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert, ArrowRight, LogOut, Home, LayoutDashboard, ShieldCheck } from 'lucide-react';

const ROLE_HOME_PATHS = {
  parent: '/parent/dashboard',
  worker: '/worker/dashboard',
  supervisor: '/supervisor/dashboard',
};

const ROLE_DISPLAY_NAMES = {
  parent: 'Parent / Caregiver',
  worker: 'Health Worker (ANM / ASHA)',
  supervisor: 'Authority / Medical Officer (MOIC)',
};

export function ProtectedRoute({ allowedRoles = [] }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Wait until authentication has finished restoring
  // the session from the backend.
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F1E9] text-[#103342]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#007F68] border-t-transparent animate-spin" />
          <span className="text-xs font-semibold text-[#294B57]/70">
            Restoring NavJyoti session...
          </span>
        </div>
      </div>
    );
  }

  // A session must contain both an authenticated state
  // and a user account returned by the authentication flow.
  if (!isAuthenticated || !user) {
    const isSupervisorRoute = allowedRoles.includes('supervisor');
    const isWorkerRoute = allowedRoles.includes('worker');
    const requiredRole = isSupervisorRoute ? 'supervisor' : isWorkerRoute ? 'worker' : 'parent';
    return (
      <Navigate
        to={`/auth/login?role=${requiredRole}`}
        state={{ role: requiredRole, from: location.pathname + (location.search || '') }}
        replace
      />
    );
  }

  // Read the role from the authenticated user.
  const currentRole = user.role;

  // Refuse access if the account has an unrecognised role.
  if (!ROLE_HOME_PATHS[currentRole]) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F1E9] px-4">
        <div className="max-w-md w-full bg-white border border-[#D8E6DA] rounded-3xl p-8 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-[#103342] font-serif">
            Account Role Not Recognised
          </h1>
          <p className="text-xs sm:text-sm text-[#294B57] mt-3 leading-relaxed">
            Your authenticated account does not have a recognized NavJyoti role.
            Please sign out and sign in with a registered account.
          </p>
          <button
            onClick={() => {
              logout();
              navigate('/auth/login', { replace: true });
            }}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#007F68] text-white text-xs font-semibold hover:bg-[#005F52] transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Return to Sign In</span>
          </button>
        </div>
      </div>
    );
  }

  // Enforce Role Isolation:
  // If authenticated user's role is not in allowedRoles,
  // display a proper "Access Denied / Unauthorized Access" screen instead of a silent redirect.
  if (allowedRoles.length > 0 && !allowedRoles.includes(currentRole)) {
    const currentRoleLabel = ROLE_DISPLAY_NAMES[currentRole] || currentRole.toUpperCase();
    const allowedRolesLabel = allowedRoles
      .map((r) => ROLE_DISPLAY_NAMES[r] || r.toUpperCase())
      .join(' or ');
    const myDashboardPath = ROLE_HOME_PATHS[currentRole] || '/';

    const handleSignOutAndSwitch = () => {
      logout();
      const targetRole = allowedRoles[0] || 'parent';
      navigate(`/auth/login?role=${targetRole}`, {
        state: { role: targetRole, from: location.pathname + (location.search || '') },
        replace: true,
      });
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F1E9] px-4 py-8 text-[#294B57]">
        <div className="max-w-lg w-full bg-[#FBF8F2] border-2 border-[#D8E6DA] rounded-3xl p-6 sm:p-8 shadow-sm">
          {/* Header Icon */}
          <div className="flex items-center gap-3 pb-5 border-b border-[#D8E6DA]/70">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-red-600 bg-red-100/60 px-2.5 py-0.5 rounded-full">
                HTTP 403 Forbidden
              </span>
              <h1 className="text-xl font-bold text-[#103342] font-serif mt-1">
                Access Denied / Restricted Portal
              </h1>
            </div>
          </div>

          {/* Details */}
          <div className="py-5 space-y-3.5 text-xs sm:text-[13px]">
            <p className="text-[#294B57] leading-relaxed">
              You are currently signed in as <strong className="text-[#103342]">{user.name || user.email || 'Current User'}</strong> with the role:
            </p>

            <div className="p-3 rounded-xl bg-white border border-[#D8E6DA] flex items-center justify-between">
              <span className="font-semibold text-[#103342]">Your Signed-In Role:</span>
              <span className="px-2.5 py-1 rounded-full bg-[#DDF0E3] text-[#007F68] font-bold text-xs">
                {currentRoleLabel}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-red-50/60 border border-red-200/60 text-[#103342]">
              <span className="font-semibold block text-red-700 mb-1">Restricted Route:</span>
              <p className="text-xs text-[#294B57]">
                This portal requires <strong className="text-[#103342]">{allowedRolesLabel}</strong> credentials. NavJyoti enforces strict role-based access control to ensure patient privacy and clinical record separation.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => navigate(myDashboardPath, { replace: true })}
              className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#007F68] hover:bg-[#005F52] text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4 text-[#F4B83F]" />
              <span>Return to My Dashboard</span>
            </button>

            <button
              onClick={handleSignOutAndSwitch}
              className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-white hover:bg-red-50 text-[#103342] hover:text-red-700 border border-[#D8E6DA] hover:border-red-200 font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign In as Different Role</span>
            </button>
          </div>

          {/* Home Link */}
          <div className="mt-5 pt-4 border-t border-[#D8E6DA]/60 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-[#007F68] hover:underline font-semibold"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Back to Public Home</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
