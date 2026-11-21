import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

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
  History,
} from 'lucide-react';

import clsx from 'clsx';

const parentPrimaryNav = [
  {
    name: 'Dashboard',
    translationKey: 'sidebar.dashboard',
    path: '/parent/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'My Children',
    translationKey: 'sidebar.myChildren',
    path: '/parent/children',
    icon: Baby,
  },
  {
    name: 'Vaccinations',
    translationKey: 'sidebar.vaccinations',
    path: '/parent/vaccines',
    icon: Syringe,
  },
  {
    name: 'Milestones',
    translationKey: 'sidebar.milestones',
    path: '/parent/milestones',
    icon: Activity,
  },
  {
    name: 'Health Records',
    translationKey: 'sidebar.healthRecords',
    path: '/parent/records',
    icon: FileText,
  },
  {
    name: 'Appointments',
    translationKey: 'sidebar.appointments',
    path: '/parent/appointments',
    icon: CalendarCheck,
  },
];

const parentSecondaryNav = [
  {
    name: 'Notifications',
    translationKey: 'sidebar.notifications',
    path: '/parent/reminders',
    icon: Bell,
  },
  {
    name: 'Help',
    translationKey: 'sidebar.help',
    path: '/parent/help',
    icon: HelpCircle,
  },
  {
    name: 'Settings',
    translationKey: 'sidebar.settings',
    path: '/parent/profile',
    icon: Settings,
  },
];

const workerPrimaryNav = [
  {
    name: 'Dashboard',
    translationKey: 'sidebar.dashboard',
    path: '/worker/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Child Registry',
    translationKey: 'sidebar.childRegistry',
    path: '/worker/registry',
    icon: ClipboardList,
  },
  {
    name: 'Vaccinations',
    translationKey: 'sidebar.vaccinations',
    path: '/worker/vaccinations',
    icon: Syringe,
  },
  {
    name: 'Follow-ups',
    translationKey: 'sidebar.followUps',
    path: '/worker/priority',
    icon: ShieldAlert,
  },
  {
    name: 'Appointments',
    translationKey: 'sidebar.appointments',
    path: '/worker/appointments',
    icon: CalendarCheck,
  },
];

const workerSecondaryNav = [
  {
    name: 'Messages',
    translationKey: 'sidebar.messages',
    path: '/worker/messages',
    icon: MessageSquare,
  },
  {
    name: 'QR Handoff',
    translationKey: 'sidebar.qrHandoff',
    path: '/worker/qr-handoff',
    icon: QrCode,
  },
  {
    name: 'Settings',
    translationKey: 'sidebar.settings',
    path: '/worker/profile',
    icon: Settings,
  },
];

const supervisorPrimaryNav = [
  {
    name: 'Dashboard',
    translationKey: 'sidebar.dashboard',
    path: '/supervisor/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Healthcare Workers',
    translationKey: 'sidebar.healthcareWorkers',
    path: '/supervisor/workers',
    icon: Users,
  },
  {
    name: 'Child Registry',
    translationKey: 'sidebar.childRegistry',
    path: '/supervisor/children',
    icon: ClipboardList,
  },
  {
    name: 'Vaccination Monitoring',
    translationKey: 'sidebar.vaccinationMonitoring',
    path: '/supervisor/vaccinations',
    icon: Syringe,
  },
  {
    name: 'Follow-Ups',
    translationKey: 'sidebar.followUps',
    path: '/supervisor/follow-ups',
    icon: ShieldAlert,
  },
  {
    name: 'Activity Logs',
    translationKey: 'sidebar.activityLogs',
    path: '/supervisor/audit-logs',
    icon: History,
  },
  {
    name: 'Reports & Analytics',
    translationKey: 'sidebar.reportsAnalytics',
    path: '/supervisor/reports',
    icon: BarChart3,
  },
  {
    name: 'Alerts',
    translationKey: 'sidebar.alerts',
    path: '/supervisor/alerts',
    icon: Bell,
  },
  {
    name: 'Profile / Settings',
    translationKey: 'sidebar.profileSettings',
    path: '/supervisor/profile',
    icon: Settings,
  },
];

const supervisorSecondaryNav = [];

function NavigationItem({ item, collapsed }) {
  const { t } = useLanguage();
  const Icon = item.icon;
  const label = t(item.translationKey, item.name);

  return (
    <NavLink
      to={item.path}
      title={collapsed ? label : undefined}
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
          {label}
        </span>
      )}
    </NavLink>
  );
}

export function Sidebar({ collapsed = false, setCollapsed }) {
  const { user, role, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const currentRole = user?.role || role;
  const isWorker = currentRole === 'worker';
  const isSupervisor = currentRole === 'supervisor';
  const isParent = currentRole === 'parent';

  const homePath = isSupervisor
    ? '/supervisor/dashboard'
    : isWorker
      ? '/worker/dashboard'
      : '/parent/dashboard';

  const primaryNav = isSupervisor
    ? supervisorPrimaryNav
    : isWorker
    ? workerPrimaryNav
    : parentPrimaryNav;

  const secondaryNav = isSupervisor
    ? supervisorSecondaryNav
    : isWorker
    ? workerSecondaryNav
    : parentSecondaryNav;

  const portalName = isSupervisor
    ? t('sidebar.authorityPortal', 'Authority Portal')
    : isWorker
    ? t('sidebar.workerPortal', 'Health Worker Portal')
    : t('sidebar.caregiverPortal', 'Caregiver Portal');

  const roleLabel = isSupervisor
    ? t('sidebar.supervisorRole', 'Healthcare Supervisor')
    : isWorker
    ? t('sidebar.workerRole', 'Health Worker')
    : t('sidebar.parentRole', 'Parent / Caregiver');

  const RoleIcon = isSupervisor ? ShieldCheck : isWorker ? Users : Baby;

  const initials =
    user?.name?.trim()?.charAt(0)?.toUpperCase() ||
    user?.email?.trim()?.charAt(0)?.toUpperCase() ||
    'N';

  const handleLogout = () => {
    logout();
    navigate('/auth/login', { replace: true });
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
          to={homePath}
          className="flex items-center gap-3 overflow-hidden"
          title="Return to Portal Dashboard"
        >
          <div className="w-10 h-10 rounded-xl bg-white p-0.5 shrink-0 shadow-xs flex items-center justify-center overflow-hidden border border-[#D8E6DA]/50">
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
              <span className="text-[10px] text-[#A8D5B5] font-semibold tracking-wider uppercase block">
                {portalName}
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* NAVIGATION ITEMS */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        <div className="space-y-1">
          {primaryNav.map((item) => (
            <NavigationItem
              key={item.path}
              item={item}
              collapsed={collapsed}
            />
          ))}
        </div>

        {secondaryNav.length > 0 && (
          <div className="pt-4 border-t border-white/10 space-y-1">
            {secondaryNav.map((item) => (
              <NavigationItem
                key={item.path}
                item={item}
                collapsed={collapsed}
              />
            ))}
          </div>
        )}
      </div>

      {/* USER PROFILE & LOGOUT FOOTER */}
      <div className="p-3 border-t border-white/10 space-y-2">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5">
          <div className="w-8 h-8 rounded-full bg-[#DDF0E3] text-[#007F68] font-bold text-xs flex items-center justify-center shrink-0">
            {initials}
          </div>

          {!collapsed && (
            <div className="truncate flex-1 min-w-0">
              <span className="text-xs font-semibold text-white block truncate">
                {user?.name || user?.email || roleLabel}
              </span>
              <span className="text-[10px] text-slate-300 block truncate">
                {roleLabel}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-colors cursor-pointer"
          title={t('common.logout', 'Logout')}
        >
          <LogOut className="w-4 h-4 shrink-0 text-red-400" />
          {!collapsed && <span>{t('common.logout', 'Logout')}</span>}
        </button>
      </div>
    </aside>
  );
}
