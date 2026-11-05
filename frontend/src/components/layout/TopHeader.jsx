import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useHealthData } from '../../contexts/HealthDataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOffline } from '../../contexts/OfflineContext';
import { SimulationBadge } from '../common/SimulationBadge';
import {
  Menu,
  Languages,
  Wifi,
  WifiOff,
  RefreshCw,
  Baby,
  Building2,
  CheckCircle2,
  Bell,
  User,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function TopHeader({ onOpenMobileNav }) {
  const { role, user } = useAuth();
  const { activeChild, childrenList, setActiveChildId } = useHealthData();
  const { lang, toggleLanguage } = useLanguage();
  const { isSimulatedOffline, toggleOfflineMode, pendingSyncCount, triggerSimulatedSync, isSyncing } = useOffline();

  const isWorker = role === 'worker' || role === 'supervisor';

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile hamburger & Active Context */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileNav}
          className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Role context details */}
        {!isWorker ? (
          childrenList && childrenList.length > 0 ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#EAF5F8] border border-[#d5e5f0] text-xs">
                <Baby className="w-4 h-4 text-[#00524c]" />
                <span className="text-slate-500 font-medium">Child:</span>
                <select
                  value={activeChild?.id || ''}
                  onChange={(e) => setActiveChildId(e.target.value)}
                  className="bg-transparent font-bold text-[#17394A] focus:outline-none cursor-pointer"
                >
                  {childrenList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.ageMonths}m)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <span className="text-xs text-slate-500 font-medium">No child linked yet</span>
          )
        ) : (
          /* Health Worker Sub-centre badge */
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs">
              <Building2 className="w-4 h-4 text-[#17394A]" />
              <span className="font-bold text-[#17394A]">
                {user?.jurisdiction?.subCentre || "Rampur Sub-Centre"}
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-500">{user?.jurisdiction?.phc || "Bilaspur PHC"}</span>
            </div>
          </div>
        )}
      </div>

      {/* Right: Offline Simulator, Language & Actions */}
      <div className="flex items-center gap-2.5">
        <div className="hidden lg:block">
          <SimulationBadge label="Demo Simulation" />
        </div>

        {/* Offline Simulation Button */}
        <button
          onClick={toggleOfflineMode}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
            isSimulatedOffline
              ? 'bg-amber-100 text-amber-900 border-amber-300'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
          title={isSimulatedOffline ? "Switch to Online" : "Test Simulated Offline Mode"}
        >
          {isSimulatedOffline ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Offline</span>
            </>
          ) : (
            <>
              <Wifi className="w-3.5 h-3.5 text-[#00524c]" />
              <span className="hidden sm:inline">Online</span>
            </>
          )}
        </button>

        {/* Pending Sync trigger */}
        {isSimulatedOffline && (
          <button
            onClick={triggerSimulatedSync}
            disabled={isSyncing}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#00524c] text-white text-xs font-medium shadow-xs hover:bg-[#27756c] cursor-pointer"
            title="Simulate background sync with local queue"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="text-[11px]">Sync ({pendingSyncCount})</span>
          </button>
        )}

        {/* Language switch button */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#17394A] hover:bg-slate-50 transition-colors cursor-pointer"
          title="Switch Language (English / हिन्दी)"
        >
          <Languages className="w-3.5 h-3.5 text-[#00524c]" />
          <span>{lang === 'en' ? 'हिन्दी' : 'EN'}</span>
        </button>

        {/* Notification Bell */}
        <Link
          to={isWorker ? "/worker/appointments" : "/parent/reminders"}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 relative"
          title="Notifications & Alerts"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#F5C45E] ring-2 ring-white" />
        </Link>

        {/* Profile Link */}
        <Link
          to={isWorker ? "/worker/profile" : "/parent/profile"}
          className="w-8 h-8 rounded-full bg-[#E8F3EE] border border-[#00524c]/40 flex items-center justify-center text-xs font-bold text-[#00524c]"
          title="Profile & Settings"
        >
          {user?.name ? user.name[0] : (isWorker ? 'R' : 'S')}
        </Link>
      </div>
    </header>
  );
}
