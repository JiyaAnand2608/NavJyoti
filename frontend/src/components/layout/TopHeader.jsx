import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import { useHealthData } from '../../contexts/HealthDataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOffline } from '../../contexts/OfflineContext';
import { SimulationBadge } from '../common/SimulationBadge';
import { Modal } from '../common/Modal';

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
  LogOut,
  AlertCircle,
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
  const { user, role, logout } = useAuth();
  const {
    activeChild,
    childrenList = [],
    setActiveChildId,
    notifications = [],
    appointments = [],
  } = useHealthData();
  const { lang, toggleLanguage, t } = useLanguage();
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const {
    isBrowserOnline,
    backendReachable,
    backendChecking,
    isSimulatedOffline,
    effectiveOffline,
    toggleOfflineMode,
    checkBackendHealth,
    lastSyncTime,
  } = useOffline();

  const navigate = useNavigate();

  const currentRole = user?.role || role;

  const isParent = currentRole === 'parent';
  const isWorker = currentRole === 'worker';
  const isSupervisor = currentRole === 'supervisor';

  const parentUnreadCount = (notifications || []).filter((n) => !n.read).length;
  const workerPendingAptCount = (appointments || []).filter((a) => a.status === 'requested').length;

  const profilePath = isParent
    ? '/parent/profile'
    : isWorker
      ? '/worker/profile'
      : isSupervisor
        ? '/supervisor/profile'
        : null;

  const notificationPath = isParent
    ? '/parent/reminders'
    : isWorker
      ? '/worker/appointments'
      : isSupervisor
        ? '/supervisor/alerts'
        : null;

  const userInitial =
    user?.name?.trim()?.charAt(0)?.toUpperCase() ||
    user?.email?.trim()?.charAt(0)?.toUpperCase() ||
    'N';

  const handleLogout = () => {
    logout();
    navigate('/auth/login', { replace: true });
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
        {isSupervisor ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#DDF0E3] border border-[#007F68]/30 text-xs sm:text-[13px]">
            <span className="text-[10px] uppercase font-bold text-white bg-[#007F68] px-2 py-0.5 rounded-md">{t('sidebar.supervisorRole', 'Authority')}</span>
            <ShieldCheck className="w-4 h-4 text-[#007F68]" />
            <span className="font-bold text-[#103342] truncate max-w-[140px] sm:max-w-xs">
              {typeof user?.jurisdiction === 'string' ? user.jurisdiction : (user?.jurisdiction?.district || user?.jurisdiction?.subCentre || t('authority.jurisdictionLabel', 'Assigned Jurisdiction'))}
            </span>
          </div>
        ) : isWorker ? (
          /* Health Worker Sub-centre badge */
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F0EBE1] border border-[#D8E6DA] text-xs sm:text-[13px]">
              <span className="text-[10.5px] uppercase font-bold text-[#007F68] bg-[#DDF0E3] px-2 py-0.5 rounded-md">{t('sidebar.workerRole', 'Worker')}</span>
              <Building2 className="w-4 h-4 text-[#007F68]" />
              <span className="font-bold text-[#103342]">
                {typeof user?.jurisdiction === 'object' ? user?.jurisdiction?.subCentre : (user?.jurisdiction || "Rampur Sub-Centre")}
              </span>
              <span className="text-[#A8D5B5]">|</span>
              <span className="text-[#294B57] font-medium">{typeof user?.jurisdiction === 'object' ? (user?.jurisdiction?.phc || "Bilaspur PHC") : "Sub-Centre"}</span>
            </div>
          </div>
        ) : (
          /* Parent child selector */
          childrenList && childrenList.length > 0 ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#DDF0E3] border border-[#D8E6DA] text-xs sm:text-[13px]">
                <Baby className="w-4 h-4 text-[#007F68]" />
                <span className="text-[#294B57] font-semibold">{t('common.child', 'Child')}:</span>
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
            <span className="text-[13px] text-[#294B57] font-medium">{t('parentDashboard.emptyStateSubtitle', 'No child linked yet')}</span>
          )
        )}
      </div>

      {/* RIGHT: Role Switcher, Offline Simulator, Language & Actions */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        <div className="hidden lg:block">
          <SimulationBadge label={t('common.simulatedFeature', 'Demo Simulation')} />
        </div>

        {/* Top-Bar Logout Option */}
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D8E6DA] bg-white hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-[#294B57] text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          title="Sign Out of NavJyoti"
        >
          <LogOut className="w-3.5 h-3.5 text-red-500" />
          <span className="hidden sm:inline">{t('common.logout', 'Logout')}</span>
        </button>

        {/* Network & Offline Status Indicator */}
        <button
          type="button"
          onClick={() => setShowNetworkModal(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
            isSimulatedOffline
              ? 'bg-[#FDF8EF] text-[#B87D14] border-[#F4B83F]/50 hover:bg-[#FCEFD9]'
              : !isBrowserOnline
              ? 'bg-[#FDECEC] text-[#D9534F] border-[#D9534F]/40 hover:bg-[#FBD5D5]'
              : backendReachable === false
              ? 'bg-[#FDF8EF] text-[#B87D14] border-[#F4B83F]/50 hover:bg-[#FCEFD9]'
              : 'bg-[#DDF0E3] text-[#007F68] border-[#A8D5B5] hover:bg-[#C8E6D2]'
          }`}
          title="Click to inspect Network Connectivity & Sync Status"
          aria-label="Network status"
        >
          {effectiveOffline ? (
            <WifiOff className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <Wifi className="w-3.5 h-3.5 shrink-0" />
          )}
          <span className="hidden sm:inline">
            {isSimulatedOffline
              ? 'Demo Offline'
              : !isBrowserOnline
              ? 'No Internet'
              : backendReachable === false
              ? 'Backend Down'
              : t('common.onlineMode', 'Online')}
          </span>
        </button>

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
            className="p-2 rounded-xl text-[#294B57] hover:bg-[#F0EBE1] border border-[#D8E6DA] bg-white relative transition-colors"
            title="View reminders"
            aria-label={`View reminders (${parentUnreadCount} unread)`}
          >
            <Bell className="w-4 h-4 text-[#007F68]" />
            {parentUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#E57373] text-white text-[10px] font-bold font-mono flex items-center justify-center shadow-xs">
                {parentUnreadCount > 9 ? '9+' : parentUnreadCount}
              </span>
            )}
          </Link>
        )}

        {/* WORKER APPOINTMENTS */}
        {isWorker && notificationPath && (
          <Link
            to={notificationPath}
            className="p-2 rounded-xl text-[#294B57] hover:bg-[#F0EBE1] border border-[#D8E6DA] bg-white relative transition-colors"
            title="View appointment requests"
            aria-label={`View appointment requests (${workerPendingAptCount} pending)`}
          >
            <CalendarCheck className="w-4 h-4 text-[#007F68]" />
            {workerPendingAptCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#F4B83F] text-[#103342] text-[10px] font-bold font-mono flex items-center justify-center shadow-xs">
                {workerPendingAptCount > 9 ? '9+' : workerPendingAptCount}
              </span>
            )}
          </Link>
        )}

        {/* SUPERVISOR ALERTS */}
        {isSupervisor && notificationPath && (
          <Link
            to={notificationPath}
            className="p-2 rounded-xl text-[#294B57] hover:bg-[#F0EBE1] border border-[#D8E6DA] bg-white relative"
            title="View jurisdiction alerts"
            aria-label="View jurisdiction alerts"
          >
            <Bell className="w-4 h-4 text-[#007F68]" />
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

      {/* Network Diagnostics & Offline Modal */}
      {showNetworkModal && (
        <Modal
          isOpen={showNetworkModal}
          onClose={() => setShowNetworkModal(false)}
          title="Network Connectivity & Data Synchronization"
        >
          <div className="space-y-4 text-xs text-[#294B57]">
            <div className="p-3 rounded-xl bg-[#EBF3ED] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#007F68] tracking-wider block">
                  Operational Mode
                </span>
                <span className="text-sm font-bold text-[#103342]">
                  {effectiveOffline ? 'Protected Read-Only Offline View' : 'Live Connected Session'}
                </span>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  effectiveOffline
                    ? 'bg-[#FEF9C3] text-[#A16207] border border-[#F4B83F]/50'
                    : 'bg-[#DDF0E3] text-[#007F68] border border-[#007F68]/30'
                }`}
              >
                {effectiveOffline ? 'Read-Only' : 'Synchronized'}
              </span>
            </div>

            {/* Diagnostic metrics */}
            <div className="space-y-2 border border-[#D8E6DA] rounded-xl p-3 bg-white">
              <div className="flex items-center justify-between py-1.5 border-b border-[#D8E6DA]/50">
                <span className="font-medium text-[#103342]">Browser Internet Status:</span>
                <span className={`font-semibold flex items-center gap-1.5 ${isBrowserOnline ? 'text-[#007F68]' : 'text-[#D9534F]'}`}>
                  {isBrowserOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                  {isBrowserOnline ? 'Online (navigator.onLine)' : 'Offline (Disconnected)'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-[#D8E6DA]/50">
                <span className="font-medium text-[#103342]">Backend Server Availability:</span>
                <span className={`font-semibold ${backendReachable ? 'text-[#007F68]' : backendChecking ? 'text-[#B87D14]' : 'text-[#D9534F]'}`}>
                  {backendChecking
                    ? 'Probing health...'
                    : backendReachable
                    ? 'Reachable & Verified (/health 200 OK)'
                    : 'Unreachable / Offline'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-[#D8E6DA]/50">
                <span className="font-medium text-[#103342]">Last Verified Sync:</span>
                <span className="font-mono text-[#103342]">
                  {lastSyncTime ? `${lastSyncTime} (Local)` : 'Active Session (Live Stream)'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="font-medium text-[#103342]">Offline Editing Status:</span>
                <span className="font-semibold text-[#103342]">Disabled (Read-Only to prevent conflicts)</span>
              </div>
            </div>

            {/* Outdated Advisory */}
            {effectiveOffline && (
              <div className="p-3 bg-[#FDF8EF] border border-[#F4B83F]/50 rounded-xl text-[11px] text-[#B87D14] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#B87D14] mt-0.5" />
                <div>
                  <strong className="block font-bold">Read-Only Advisory:</strong>
                  You are viewing authorized session records. To prevent clinical discrepancies and protect child immunisation records, write operations are restricted until live server connection is confirmed.
                </div>
              </div>
            )}

            {/* Presentation Field Simulation Control */}
            <div className="p-3 bg-[#F0EBE1] border border-[#D8E6DA] rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-[#103342] block">Field Offline Demonstration Mode</span>
                <span className="text-[11px] text-[#294B57]/70 block">
                  Simulate zero-connectivity sub-centre conditions for presentation
                </span>
              </div>
              <button
                type="button"
                onClick={toggleOfflineMode}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSimulatedOffline
                    ? 'bg-[#B87D14] text-white'
                    : 'bg-white border border-[#D8E6DA] text-[#103342] hover:bg-[#EAE5DC]'
                }`}
              >
                {isSimulatedOffline ? 'Resume Live' : 'Simulate Offline'}
              </button>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-[#D8E6DA]">
              <button
                type="button"
                onClick={checkBackendHealth}
                disabled={backendChecking}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#007F68] hover:underline cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${backendChecking ? 'animate-spin' : ''}`} /> Check Server Now
              </button>
              <button
                type="button"
                onClick={() => setShowNetworkModal(false)}
                className="px-4 py-1.5 rounded-xl bg-[#007F68] text-white text-xs font-semibold hover:bg-[#005F52] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </header>
  );
}
