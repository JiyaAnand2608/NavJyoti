import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';
import { MobileNavDrawer } from './MobileNavDrawer';
import { useOffline } from '../../contexts/OfflineContext';
import { WifiOff, RefreshCw } from 'lucide-react';
import { KidzyChat } from '../kidzy/KidzyChat';

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const {
    effectiveOffline,
    isSimulatedOffline,
    isBrowserOnline,
    backendReachable,
    backendChecking,
    lastSyncTime,
    toggleOfflineMode,
    checkBackendHealth,
  } = useOffline();

  return (
    <div className="min-h-screen w-full flex bg-[#F5F1E9] text-[#294B57]">
      {/* Sidebar Navigation */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Mobile Drawer */}
      <MobileNavDrawer isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F5F1E9]">
        <TopHeader onOpenMobileNav={() => setMobileNavOpen(true)} />

        {/* Offline & Read-Only Banner alert */}
        {effectiveOffline && (
          <div className="bg-[#FDF8EF] border-b border-[#F4B83F]/50 px-4 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-[#103342]">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-[#B87D14] shrink-0" />
              <span className="font-bold">
                {isSimulatedOffline
                  ? 'Field Demo (Offline):'
                  : !isBrowserOnline
                  ? 'Offline Mode:'
                  : 'Backend Unreachable:'}
              </span>
              <span className="text-[#294B57]">
                Working in Read-Only Mode. Clinical dose recording is disabled offline to prevent record conflicts.
                {lastSyncTime ? ` (Cached at: ${lastSyncTime})` : ''}
              </span>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              {isSimulatedOffline ? (
                <button
                  type="button"
                  onClick={toggleOfflineMode}
                  className="px-2.5 py-1 rounded-lg bg-white border border-[#D8E6DA] text-[#103342] hover:bg-[#EAE5DC] font-semibold text-[11px] cursor-pointer"
                >
                  Resume Live
                </button>
              ) : (
                <button
                  type="button"
                  onClick={checkBackendHealth}
                  disabled={backendChecking}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#007F68] text-white font-medium text-[11px] hover:bg-[#005F52] cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${backendChecking ? 'animate-spin' : ''}`} />
                  Check Server
                </button>
              )}
            </div>
          </div>
        )}

        {/* Dynamic Nested Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-[#F5F1E9]">
          <Outlet />
        </main>
        <KidzyChat />
      </div>
    </div>
  );
}
