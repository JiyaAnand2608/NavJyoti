import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import { useHealthData } from '../../contexts/HealthDataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOffline } from '../../contexts/OfflineContext';
import { SimulationBadge } from '../common/SimulationBadge';

import {
  Menu,
  Languages,
  Baby,
  Building2,
  Bell,
  ShieldCheck,
  CalendarCheck,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';

function getAgeMonths(dateOfBirth) {
  if (!dateOfBirth) return null;

  const dob = new Date(
    `${String(dateOfBirth).slice(0, 10)}T00:00:00`
  );

  const today = new Date();

  if (Number.isNaN(dob.getTime()) || dob > today) {
    return null;
  }

  let months =
    (today.getFullYear() - dob.getFullYear()) * 12 +
    today.getMonth() -
    dob.getMonth();

  if (today.getDate() < dob.getDate()) {
    months -= 1;
  }

  return Math.max(0, months);
}

export function TopHeader({ onOpenMobileNav }) {
  const { user, role, switchRole } = useAuth();
  const {
    activeChild,
    childrenList = [],
    setActiveChildId,
  } = useHealthData();
  const { lang, toggleLanguage } = useLanguage();
  const {
    isSimulatedOffline,
    toggleOfflineMode,
    pendingSyncCount = 0,
    triggerSimulatedSync,
    isSyncing = false,
  } = useOffline();

  const navigate = useNavigate();

  const currentRole = user?.role || role;

  const isParent = currentRole === 'parent';
  const isWorker = currentRole === 'worker';
  const isSupervisor = currentRole === 'supervisor';

  const profilePath = isParent
    ? '/parent/profile'
    : isWorker
      ? '/worker/profile'
      : null;

  const notificationPath = isParent
    ? '/parent/reminders'
    : isWorker
      ? '/worker/appointments'
      : null;

  const userInitial =
    user?.name?.trim()?.charAt(0)?.toUpperCase() ||
    user?.email?.trim()?.charAt(0)?.toUpperCase() ||
    'N';

  const handleRoleSwitch = () => {
    if (isWorker) {
      switchRole('parent');
      navigate('/auth/login?role=parent', {
        state: { role: 'parent', from: '/parent/dashboard' },
      });
    } else {
      switchRole('worker');
      navigate('/auth/login?role=worker', {
        state: { role: 'worker', from: '/worker/dashboard' },
      });
    }
  };

  return (
    <header className="sticky top-0 z-20 h-16 bg-[#FBF8F2]/95 backdrop-blur-md border-b border-[#D8E6DA] px-4 sm:px-6 flex items-center justify-between gap-4 transition-colors">
      {/* LEFT: MOBILE MENU + ROLE CONTEXT */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="md:hidden p-2 rounded-xl text-[#103342] hover:bg-[#F0EBE1] cursor-pointer"
          aria-label="Open mobile navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Role context details */}
        {!isWorker ? (
          childrenList && childrenList.length > 0 ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#DDF0E3] border border-[#D8E6DA] text-xs sm:text-[13px]">
                <Baby className="w-4 h-4 text-[#007F68]" />
                <span className="text-[#294B57] font-semibold">Child:</span>
                <select
                  value={activeChild?.id || ''}
                  onChange={(e) => setActiveChildId(e.target.value)}
                  className="bg-transparent font-bold text-[#103342] focus:outline-none cursor-pointer text-xs sm:text-[13px]"
                >
                  {childrenList.map((child) => {
                    const ageMonths = getAgeMonths(
                      child.dob || child.date_of_birth
                    );

                    return (
                      <option key={child.id} value={child.id}>
                        {child.name}
                        {ageMonths !== null
                          ? ` (${ageMonths}m)`
                          : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          ) : (
            <span className="text-[13px] text-[#294B57] font-medium">No child linked yet</span>
          )
        ) : (
          /* Health Worker Sub-centre badge */
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F0EBE1] border border-[#D8E6DA] text-xs sm:text-[13px]">
              <span className="text-[10.5px] uppercase font-bold text-[#007F68] bg-[#DDF0E3] px-2 py-0.5 rounded-md">Worker</span>
              <Building2 className="w-4 h-4 text-[#007F68]" />
              <span className="font-bold text-[#103342]">
                {user?.jurisdiction?.subCentre || "Rampur Sub-Centre"}
              </span>
              <span className="text-[#A8D5B5]">|</span>
              <span className="text-[#294B57] font-medium">{user?.jurisdiction?.phc || "Bilaspur PHC"}</span>
            </div>
          </div>
        )}

        {/* SUPERVISOR */}
        {isSupervisor && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F0EBE1] border border-[#D8E6DA] text-xs">
            <ShieldCheck className="w-4 h-4 text-[#007F68]" />
            <span className="font-bold text-[#103342]">
              Supervisor Portal
            </span>
          </div>
        )}
      </div>

      {/* RIGHT: Role Switcher, Offline Simulator, Language & Actions */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        <div className="hidden lg:block">
          <SimulationBadge label="Demo Simulation" />
        </div>

        {/* Top-Bar Role Switcher Option */}
        <button
          onClick={handleRoleSwitch}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#007F68]/30 bg-[#E8F5E9] hover:bg-[#DDF0E3] text-[#007F68] text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          title={isWorker ? "Switch to Parent Portal (Authentication Required)" : "Switch to Worker Portal (Authentication Required)"}
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#007F68]" />
          <span>{isWorker ? "Switch to Parent" : "Switch to Worker"}</span>
        </button>

        {/* Offline Simulation Button */}
        <button
          onClick={toggleOfflineMode}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
            isSimulatedOffline
              ? 'bg-[#FDF8EF] text-[#B87D14] border-[#F4B83F]/50'
              : 'bg-[#F0EBE1] text-[#294B57] border-[#D8E6DA] hover:bg-[#EAE5DC]'
          }`}
          title={isSimulatedOffline ? "Switch to Online" : "Test Simulated Offline Mode"}
        >
          {isSimulatedOffline ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-[#B87D14]" />
              <span className="hidden sm:inline">Offline</span>
            </>
          ) : (
            <>
              <Wifi className="w-3.5 h-3.5 text-[#007F68]" />
              <span className="hidden sm:inline">Online</span>
            </>
          )}
        </button>

        {/* Pending Sync trigger */}
        {isSimulatedOffline && (
          <button
            onClick={triggerSimulatedSync}
            disabled={isSyncing}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#007F68] text-white text-xs font-medium shadow-xs hover:bg-[#005F52] cursor-pointer"
            title="Simulate background sync with local queue"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="text-xs font-semibold">Sync ({pendingSyncCount})</span>
          </button>
        )}

        {/* LANGUAGE SWITCHER */}
        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-[#D8E6DA] text-xs font-semibold text-[#103342] hover:bg-[#F0EBE1] transition-colors cursor-pointer bg-white"
          title="Switch language"
          aria-label="Switch language"
        >
          <Languages className="w-4 h-4 text-[#007F68]" />
          <span>
            {lang === 'en' ? 'हिन्दी' : 'EN'}
          </span>
        </button>

        {/* PARENT NOTIFICATIONS */}
        {isParent && notificationPath && (
          <Link
            to={notificationPath}
            className="p-2 rounded-xl text-[#294B57] hover:bg-[#F0EBE1] border border-[#D8E6DA] bg-white"
            title="View reminders"
            aria-label="View reminders"
          >
            <Bell className="w-4 h-4" />
          </Link>
        )}

        {/* WORKER APPOINTMENTS */}
        {isWorker && notificationPath && (
          <Link
            to={notificationPath}
            className="p-2 rounded-xl text-[#294B57] hover:bg-[#F0EBE1] border border-[#D8E6DA] bg-white"
            title="View appointment requests"
            aria-label="View appointment requests"
          >
            <CalendarCheck className="w-4 h-4" />
          </Link>
        )}

        {/* USER PROFILE */}
        {profilePath ? (
          <Link
            to={profilePath}
            className="w-8 h-8 rounded-full bg-[#DDF0E3] border border-[#007F68]/40 flex items-center justify-center text-xs font-bold text-[#007F68] shadow-sm hover:scale-105 transition-transform"
            title="Profile & Settings"
            aria-label="Profile & Settings"
          >
            {userInitial}
          </Link>
        ) : (
          <div
            className="w-8 h-8 rounded-full bg-[#DDF0E3] border border-[#007F68]/40 flex items-center justify-center text-xs font-bold text-[#007F68]"
            title={user?.name || 'Supervisor account'}
            aria-label="Signed-in supervisor"
          >
            {userInitial}
          </div>
        )}
      </div>
    </header>
  );
}
