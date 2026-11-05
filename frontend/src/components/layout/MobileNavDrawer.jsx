import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  X,
  LogOut,
  RefreshCw,
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
} from 'lucide-react';

export function MobileNavDrawer({ isOpen, onClose }) {
  const { user, role, logout, switchRole } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const isWorker = role === 'worker' || role === 'supervisor';

  const parentNav = [
    { name: "Dashboard", path: "/parent/dashboard", icon: LayoutDashboard },
    { name: "My Children", path: "/parent/children", icon: Baby },
    { name: "Vaccinations", path: "/parent/vaccines", icon: Syringe },
    { name: "Milestones", path: "/parent/milestones", icon: Activity },
    { name: "Health Records", path: "/parent/records", icon: FileText },
    { name: "Appointments", path: "/parent/appointments", icon: CalendarCheck },
    { name: "Notifications", path: "/parent/reminders", icon: Bell },
    { name: "Help", path: "/parent/help", icon: HelpCircle },
    { name: "Settings", path: "/parent/profile", icon: Settings },
  ];

  const workerNav = [
    { name: "Dashboard", path: "/worker/dashboard", icon: LayoutDashboard },
    { name: "Child Registry", path: "/worker/registry", icon: ClipboardList },
    { name: "Vaccinations", path: "/worker/vaccinations", icon: Syringe },
    { name: "Follow-ups", path: "/worker/priority", icon: ShieldAlert },
    { name: "Appointments", path: "/worker/appointments", icon: CalendarCheck },
    { name: "Messages", path: "/worker/messages", icon: MessageSquare },
    { name: "Reports", path: "/supervisor/analytics", icon: BarChart3 },
    { name: "QR Handoff", path: "/worker/qr-handoff", icon: QrCode },
    { name: "Settings", path: "/worker/profile", icon: Settings },
  ];

  const navItems = isWorker ? workerNav : parentNav;

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/');
  };

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />
      <div className="fixed inset-y-0 left-0 w-72 bg-[#17394A] text-white p-5 flex flex-col justify-between shadow-2xl">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white p-1">
                <img src="/logo.jpg" alt="NavJyoti" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="font-bold text-base font-serif">NavJyoti</span>
                <span className="block text-[10px] text-[#00524c] font-semibold uppercase">
                  {isWorker ? "Worker Portal" : "Parent Portal"}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg text-slate-300 hover:bg-white/10 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Links */}
          <nav className="mt-4 space-y-1 overflow-y-auto max-h-[65vh]">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive ? 'bg-[#00524c] text-white font-semibold' : 'text-slate-300 hover:bg-white/10'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 space-y-2">
          <button
            onClick={() => {
              switchRole(isWorker ? 'parent' : 'worker');
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/10 text-xs font-medium hover:bg-white/15 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Switch to {isWorker ? 'Parent Portal' : 'Worker Portal'}</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-red-500/20 text-red-200 text-xs font-medium hover:bg-red-500/30 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
