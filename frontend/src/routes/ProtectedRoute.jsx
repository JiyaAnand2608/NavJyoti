
import React from 'react';
import {
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';

const ROLE_HOME_PATHS = {
  parent: '/parent/dashboard',
  worker: '/worker/dashboard',
  supervisor: '/supervisor/analytics',
};

export function ProtectedRoute({ allowedRoles = [] }) {
  const {
    user,
    isAuthenticated,
    isLoading,
  } = useAuth();

  const location = useLocation();

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
    return (
      <Navigate
        to="/auth/login"
        state={{ from: location }}
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

        <div className="max-w-md w-full bg-white border border-[#D8E6DA] rounded-2xl p-8 text-center">

          <h1 className="text-xl font-bold text-[#103342]">
            Account Role Not Recognised
          </h1>

          <p className="text-sm text-[#294B57] mt-3">
            Your account does not have a supported NavJyoti role.
            Please contact the application administrator.
          </p>

        </div>

      </div>
    );
  }

  // Allow access only to the specified account roles.
  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(currentRole)
  ) {
    return (
      <Navigate
        to={ROLE_HOME_PATHS[currentRole]}
        replace
      />
    );
  }

  return <Outlet />;
}
