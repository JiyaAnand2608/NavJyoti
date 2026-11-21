import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  X,
  LogOut,
  LayoutDashboard,
  Baby,
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
  Users,
  History,
} from 'lucide-react';

export function MobileNavDrawer({ isOpen, onClose }) {
  const { user, role, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const currentRole = user?.role || role;

  const parentNav = [
    { name: "Dashboard", translationKey: "sidebar.dashboard", path: "/parent/dashboard", icon: LayoutDashboard },
    { name: "My Children", translationKey: "sidebar.myChildren", path: "/parent/children", icon: Baby },
    { name: "Vaccinations", translationKey: "sidebar.vaccinations", path: "/parent/vaccines", icon: Syringe },
    { name: "Milestones", translationKey: "sidebar.milestones", path: "/parent/milestones", icon: Activity },
    { name: "Health Records", translationKey: "sidebar.healthRecords", path: "/parent/records", icon: FileText },
    { name: "Appointments", translationKey: "sidebar.appointments", path: "/parent/appointments", icon: CalendarCheck },
    { name: "Notifications", translationKey: "sidebar.notifications", path: "/parent/reminders", icon: Bell },
    { name: "Help", translationKey: "sidebar.help", path: "/parent/help", icon: HelpCircle },
    { name: "Settings", translationKey: "sidebar.settings", path: "/parent/profile", icon: Settings },
  ];

  const workerNav = [
    { name: "Dashboard", translationKey: "sidebar.dashboard", path: "/worker/dashboard", icon: LayoutDashboard },
    { name: "Child Registry", translationKey: "sidebar.childRegistry", path: "/worker/registry", icon: ClipboardList },
    { name: "Vaccinations", translationKey: "sidebar.vaccinations", path: "/worker/vaccinations", icon: Syringe },
    { name: "Follow-ups", translationKey: "sidebar.followUps", path: "/worker/priority", icon: ShieldAlert },
    { name: "Appointments", translationKey: "sidebar.appointments", path: "/worker/appointments", icon: CalendarCheck },
    { name: "Messages", translationKey: "sidebar.messages", path: "/worker/messages", icon: MessageSquare },
    { name: "QR Handoff", translationKey: "sidebar.qrHandoff", path: "/worker/qr-handoff", icon: QrCode },
    { name: "Settings", translationKey: "sidebar.settings", path: "/worker/profile", icon: Settings },
  ];

  const supervisorNav = [
    { name: "Dashboard", translationKey: "sidebar.dashboard", path: "/supervisor/dashboard", icon: LayoutDashboard },
    { name: "Healthcare Workers", translationKey: "sidebar.healthcareWorkers", path: "/supervisor/workers", icon: Users },
    { name: "Child Registry", translationKey: "sidebar.childRegistry", path: "/supervisor/children", icon: ClipboardList },
    { name: "Vaccination Monitoring", translationKey: "sidebar.vaccinationMonitoring", path: "/supervisor/vaccinations", icon: Syringe },
    { name: "Follow-Ups", translationKey: "sidebar.followUps", path: "/supervisor/follow-ups", icon: ShieldAlert },
    { name: "Activity Logs", translationKey: "sidebar.activityLogs", path: "/supervisor/audit-logs", icon: History },
    { name: "Reports & Analytics", translationKey: "sidebar.reportsAnalytics", path: "/supervisor/reports", icon: BarChart3 },
    { name: "Alerts", translationKey: "sidebar.alerts", path: "/supervisor/alerts", icon: Bell },
    { name: "Profile / Settings", translationKey: "sidebar.profileSettings", path: "/supervisor/profile", icon: Settings },
  ];

  const navItems = currentRole === 'supervisor' ? supervisorNav : currentRole === 'worker' ? workerNav : parentNav;
  const homePath = currentRole === 'supervisor' ? "/supervisor/dashboard" : currentRole === 'worker' ? "/worker/dashboard" : "/parent/dashboard";
  const portalName = currentRole === 'supervisor'
    ? t('sidebar.authorityPortal', 'Authority Portal')
    : currentRole === 'worker'
    ? t('sidebar.workerPortal', 'Health Worker Portal')
    : t('sidebar.caregiverPortal', 'Caregiver Portal');

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/auth/login', { replace: true });
  };

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="fixed inset-0 bg-[#103342]/60 backdrop-blur-xs" onClick={onClose} />
      <div className="fixed inset-y-0 left-0 w-72 bg-[#103342] text-white p-5 flex flex-col justify-between shadow-2xl">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <Link
              to={homePath}
              onClick={onClose}
              className="flex items-center gap-3 group"
              title="Return to Portal Dashboard"
            >
              <div className="w-9 h-9 rounded-xl bg-white p-0.5 overflow-hidden flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <img
                  src="/logo.jpg"
                  alt="NavJyoti"
                  className="w-full h-full object-cover scale-115 object-center"
                />
              </div>
              <div>
                <span className="font-bold text-base font-serif">NavJyoti</span>
                <span className="block text-[10px] text-[#A8D5B5] font-semibold uppercase">
                  {portalName}
                </span>
              </div>
            </Link>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-300 hover:bg-white/10 cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Links */}
          <nav className="mt-4 space-y-1 overflow-y-auto max-h-[65vh]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const label = t(item.translationKey, item.name);
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive ? 'bg-[#007F68] text-white font-semibold' : 'text-slate-300 hover:bg-white/10'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 space-y-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/20 text-red-200 text-xs font-semibold hover:bg-red-500/30 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t('common.logout', 'Logout')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
