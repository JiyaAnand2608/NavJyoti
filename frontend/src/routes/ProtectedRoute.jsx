import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ allowedRoles = [] }) {
  const { role, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Prevent flash while restoring session from storage
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F1E9] text-[#103342]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#007F68] border-t-transparent animate-spin" />
          <span className="text-xs font-semibold text-[#294B57]/70">Restoring NavJyoti session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Preserve intended destination after login
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Check role authorization if specified
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    const fallbackPath =
      role === 'worker'
        ? '/worker/dashboard'
        : role === 'supervisor'
        ? '/supervisor/analytics'
        : '/parent/dashboard';
    return <Navigate to={fallbackPath} replace />;
  }

  return <Outlet />;
}
