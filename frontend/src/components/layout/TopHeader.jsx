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
  Bell,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function TopHeader({ onOpenMobileNav }) {
  const { role, user } = useAuth();
  const { activeChild, childrenList, setActiveChildId } = useHealthData();
  const { lang, toggleLanguage } = useLanguage();
  const { isSimulatedOffline, toggleOfflineMode, pendingSyncCount, triggerSimulatedSync, isSyncing } = useOffline();

  const isWorker = role === 'worker' || role === 'supervisor';

  return (
    <header className="sticky top-0 z-20 h-16 bg-[#FBF8F2]/95 backdrop-blur-md border-b border-[#D8E6DA] px-4 sm:px-6 flex items-center justify-between gap-4 transition-colors">
      {/* Left: Mobile hamburger & Active Context */}
      <div className="flex items-center gap-3">
        <button
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
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#DDF0E3] border border-[#D8E6DA] text-xs">
                <Baby className="w-4 h-4 text-[#007F68]" />
                <span className="text-[#294B57] font-medium">Child:</span>
                <select
                  value={activeChild?.id || ''}
                  onChange={(e) => setActiveChildId(e.target.value)}
                  className="bg-transparent font-bold text-[#103342] focus:outline-none cursor-pointer"
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
            <span className="text-xs text-[#294B57] font-medium">No child linked yet</span>
          )
        ) : (
          /* Health Worker Sub-centre badge */
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F0EBE1] border border-[#D8E6DA] text-xs">
              <Building2 className="w-4 h-4 text-[#007F68]" />
              <span className="font-bold text-[#103342]">
                {user?.jurisdiction?.subCentre || "Rampur Sub-Centre"}
              </span>
              <span className="text-[#A8D5B5]">|</span>
              <span className="text-[#294B57]">{user?.jurisdiction?.phc || "Bilaspur PHC"}</span>
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
            <span className="text-[11px]">Sync ({pendingSyncCount})</span>
          </button>
        )}

        {/* Language switch button */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D8E6DA] text-xs font-semibold text-[#103342] hover:bg-[#F0EBE1] transition-colors cursor-pointer bg-white"
          title="Switch Language (English / हिन्दी)"
        >
          <Languages className="w-3.5 h-3.5 text-[#007F68]" />
          <span>{lang === 'en' ? 'हिन्दी' : 'EN'}</span>
        </button>

        {/* Notification Bell */}
        <Link
          to={isWorker ? "/worker/appointments" : "/parent/reminders"}
          className="p-2 rounded-xl text-[#294B57] hover:bg-[#F0EBE1] border border-[#D8E6DA] relative bg-white"
          title="Notifications & Alerts"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#F4B83F] ring-2 ring-white" />
        </Link>

        {/* Profile Link */}
        <Link
          to={isWorker ? "/worker/profile" : "/parent/profile"}
          className="w-8 h-8 rounded-full bg-[#DDF0E3] border border-[#007F68]/40 flex items-center justify-center text-xs font-bold text-[#007F68] shadow-2xs hover:scale-105 transition-transform"
          title="Profile & Settings"
        >
          {user?.name ? user.name[0] : (isWorker ? 'R' : 'S')}
        </Link>
      </div>
    </header>
  );
}
