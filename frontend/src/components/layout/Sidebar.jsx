
import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

import {
  LayoutDashboard,
  Syringe,
  Activity,
  FileText,
  CalendarCheck,
  Bell,
  HelpCircle,
  Settings,
  ClipboardList,
  ShieldAlert,
  MessageSquare,
  BarChart3,
  QrCode,
  LogOut,
  Baby,
  ShieldCheck,
  Users,
} from 'lucide-react';

import clsx from 'clsx';

const parentPrimaryNav = [
  {
    name: 'Dashboard',
    path: '/parent/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'My Children',
    path: '/parent/children',
    icon: Baby,
  },
  {
    name: 'Vaccinations',
    path: '/parent/vaccines',
    icon: Syringe,
  },
  {
    name: 'Milestones',
    path: '/parent/milestones',
    icon: Activity,
  },
  {
    name: 'Health Records',
    path: '/parent/records',
    icon: FileText,
  },
  {
    name: 'Appointments',
    path: '/parent/appointments',
    icon: CalendarCheck,
  },
];

const parentSecondaryNav = [
  {
    name: 'Notifications',
    path: '/parent/reminders',
    icon: Bell,
  },
  {
    name: 'Help',
    path: '/parent/help',
    icon: HelpCircle,
  },
  {
    name: 'Settings',
    path: '/parent/profile',
    icon: Settings,
  },
];

const workerPrimaryNav = [
  {
    name: 'Dashboard',
    path: '/worker/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Child Registry',
    path: '/worker/registry',
    icon: ClipboardList,
  },
  {
    name: 'Vaccinations',
    path: '/worker/vaccinations',
    icon: Syringe,
  },
  {
    name: 'Follow-ups',
    path: '/worker/priority',
    icon: ShieldAlert,
  },
  {
    name: 'Appointments',
    path: '/worker/appointments',
    icon: CalendarCheck,
  },
];

const workerSecondaryNav = [
  {
    name: 'Messages',
    path: '/worker/messages',
    icon: MessageSquare,
  },
  {
    name: 'QR Handoff',
    path: '/worker/qr-handoff',
    icon: QrCode,
  },
  {
    name: 'Settings',
    path: '/worker/profile',
    icon: Settings,
  },
];

// Only include supervisor routes already verified in the app.
const supervisorPrimaryNav = [
  {
    name: 'Health Analytics',
    path: '/supervisor/analytics',
    icon: BarChart3,
  },
];

const supervisorSecondaryNav = [];

const roleConfigurations = {
  parent: {
    portalName: 'Caregiver Portal',
    roleLabel: 'Parent / Caregiver',
    primaryNav: parentPrimaryNav,
    secondaryNav: parentSecondaryNav,
    icon: Baby,
  },

  worker: {
    portalName: 'Health Worker Portal',
    roleLabel: 'Health Worker',
    primaryNav: workerPrimaryNav,
    secondaryNav: workerSecondaryNav,
    icon: Users,
  },

  supervisor: {
    portalName: 'Supervisor Portal',
    roleLabel: 'Health Supervisor',
    primaryNav: supervisorPrimaryNav,
    secondaryNav: supervisorSecondaryNav,
    icon: ShieldCheck,
  },
};

function NavigationItem({ item, collapsed }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      title={collapsed ? item.name : undefined}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl',
          'text-xs font-medium transition-all group',
          isActive
            ? 'bg-[#DDF0E3] text-[#007F68] shadow-sm font-bold'
            : 'text-slate-300 hover:bg-white/10 hover:text-white'
        )
      }
    >
      <Icon className="w-4 h-4 shrink-0" />

      {!collapsed && (
        <span className="truncate">
          {item.name}
        </span>
      )}
    </NavLink>
  );
}

export function Sidebar({ collapsed = false, setCollapsed }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  // Use the authenticated account role.
  // Do not allow demo role switching from the sidebar.
  const currentRole = user?.role || role;

  const configuration = roleConfigurations[currentRole];

  const primaryNav = configuration?.primaryNav || [];
  const secondaryNav = configuration?.secondaryNav || [];

  const portalName =
    configuration?.portalName || 'NavJyoti Portal';

  const roleLabel =
    configuration?.roleLabel || 'Account';

  const RoleIcon =
    configuration?.icon || ShieldCheck;

  const displayName =
    user?.name ||
    user?.email ||
    'Signed-in User';

  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/', { replace: true });
    }
  };

  return (
    <aside
      className={clsx(
        'hidden md:flex flex-col h-screen sticky top-0',
        'bg-[#103342] text-white z-30',
        'transition-all duration-300',
        'border-r border-[#005F52]/30 shadow-lg',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* BRAND HEADER */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">

        <Link
          to="/"
          className="flex items-center gap-3 overflow-hidden"
        >
          <div className="w-10 h-10 rounded-xl bg-white p-0.5 shrink-0 shadow-sm flex items-center justify-center overflow-hidden border border-[#D8E6DA]/50">

            <img
              src="/logo.jpg"
              alt="NavJyoti"
              className="w-full h-full object-cover object-center"
            />

          </div>

          {!collapsed && (
            <div className="truncate">

              <span className="text-lg font-bold font-serif tracking-tight text-white block">
                NavJyoti
              </span>

              <span className="block text-[9.5px] uppercase tracking-wider text-[#A8D5B5] font-semibold">
                {portalName}
              </span>

            </div>
          )}
        </Link>
      </div>

      {/* AUTHENTICATED ROLE INDICATOR */}
      {!collapsed && (
        <div className="px-3 pt-3">

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">

            <div className="w-8 h-8 rounded-lg bg-[#007F68]/30 text-[#A8D5B5] flex items-center justify-center shrink-0">
              <RoleIcon className="w-4 h-4" />
            </div>

            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 block">
                Signed in as
              </span>

              <span className="text-xs font-semibold text-white block truncate">
                {roleLabel}
              </span>
            </div>

          </div>
        </div>
      )}

      {/* NAVIGATION */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">

        {primaryNav.length > 0 && (
          <>
            {!collapsed && (
              <div className="text-[10px] uppercase font-bold tracking-wider text-[#A8D5B5]/80 px-3 pb-1">
                Primary
              </div>
            )}

            {primaryNav.map((item) => (
              <NavigationItem
                key={item.path}
                item={item}
                collapsed={collapsed}
              />
            ))}
          </>
        )}

        {secondaryNav.length > 0 && (
          <>
            {!collapsed && (
              <div className="pt-4 text-[10px] uppercase font-bold tracking-wider text-[#A8D5B5]/80 px-3 pb-1 border-t border-white/10 mt-3">
                Secondary
              </div>
            )}

            {secondaryNav.map((item) => (
              <NavigationItem
                key={item.path}
                item={item}
                collapsed={collapsed}
              />
            ))}
          </>
        )}

        {!configuration && (
          <div className="px-3 py-4 text-xs text-slate-300">
            No navigation is available for this account role.
          </div>
        )}

      </nav>

      {/* FOOTER / USER PROFILE */}
      <div className="p-3 border-t border-white/10 bg-[#005F52]/20">

        {!collapsed ? (
          <div className="space-y-3">

            <div className="flex items-center gap-3">

              <div className="w-8 h-8 rounded-full bg-[#007F68] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                {initials || 'N'}
              </div>

              <div className="truncate flex-1">

                <p className="text-xs font-semibold text-white truncate">
                  {displayName}
                </p>

                <p className="text-[10px] text-slate-300 truncate">
                  {roleLabel}
                </p>

              </div>

            </div>

            <div className="flex items-center gap-1">

              <Link
                to="/"
                className="flex-1 text-center py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-medium transition-colors"
                title="Return to Public Landing Page"
              >
                Home
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 text-[11px] font-medium transition-colors flex items-center justify-center cursor-pointer"
                title="Sign out of active session"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>

            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">

            <div
              className="w-8 h-8 rounded-full bg-[#007F68] text-white flex items-center justify-center font-bold text-xs"
              title={displayName}
            >
              {initials || 'N'}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>

          </div>
        )}
      </div>
    </aside>
  );
}
