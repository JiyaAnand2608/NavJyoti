
import React from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import { useHealthData } from '../../contexts/HealthDataContext';
import { useLanguage } from '../../contexts/LanguageContext';

import {
  Menu,
  Languages,
  Baby,
  Building2,
  Bell,
  ShieldCheck,
  UserRound,
  CalendarCheck,
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
  const { user, role } = useAuth();

  const {
    activeChild,
    childrenList = [],
    setActiveChildId,
  } = useHealthData();

  const { lang, toggleLanguage } = useLanguage();

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

        {/* PARENT: ACTIVE CHILD */}
        {isParent && (
          <div className="flex items-center gap-2 min-w-0">

            {childrenList.length > 0 ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#DDF0E3] border border-[#D8E6DA] text-xs max-w-full">

                <Baby className="w-4 h-4 text-[#007F68] shrink-0" />

                <span className="text-[#294B57] font-medium hidden sm:inline">
                  Child:
                </span>

                <select
                  aria-label="Select child"
                  value={activeChild?.id ?? ''}
                  onChange={(event) =>
                    setActiveChildId(event.target.value)
                  }
                  className="bg-transparent font-bold text-[#103342] focus:outline-none cursor-pointer min-w-0 max-w-48"
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
            ) : (
              <span className="text-xs text-[#294B57] font-medium">
                No child linked yet
              </span>
            )}

          </div>
        )}

        {/* WORKER: ROLE OR VERIFIED JURISDICTION */}
        {isWorker && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F0EBE1] border border-[#D8E6DA] text-xs">

            <Building2 className="w-4 h-4 text-[#007F68] shrink-0" />

            <span className="font-bold text-[#103342] truncate">
              {user?.jurisdiction?.subCentre ||
                'Health Worker Portal'}
            </span>

            {user?.jurisdiction?.phc && (
              <>
                <span className="text-[#A8D5B5]">|</span>

                <span className="text-[#294B57] hidden sm:inline truncate">
                  {user.jurisdiction.phc}
                </span>
              </>
            )}

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

      {/* RIGHT: LANGUAGE + NAVIGATION */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">

        {/* PROTOTYPE LABEL */}
        <span className="hidden lg:inline-flex items-center px-3 py-1.5 rounded-xl bg-[#F0EBE1] border border-[#D8E6DA] text-[11px] font-semibold text-[#294B57]">
          Hackathon Prototype
        </span>

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
