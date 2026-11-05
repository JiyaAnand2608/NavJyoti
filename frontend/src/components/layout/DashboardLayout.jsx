import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';
import { MobileNavDrawer } from './MobileNavDrawer';
import { useOffline } from '../../contexts/OfflineContext';
import { WifiOff } from 'lucide-react';

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { isSimulatedOffline, pendingSyncCount, triggerSimulatedSync, isSyncing } = useOffline();

  return (
    <div className="min-h-screen flex bg-[#FAFBF8] text-[#17394A]">
      {/* Fixed Navy Sidebar */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Mobile Drawer */}
      <MobileNavDrawer isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopHeader onOpenMobileNav={() => setMobileNavOpen(true)} />

        {/* Offline Banner alert if simulated offline mode is on */}
        {isSimulatedOffline && (
          <div className="bg-amber-100/90 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-amber-700" />
              <span className="font-semibold">Simulated Offline Mode Active:</span>
              <span>Changes are queued locally. Click 'Sync' to simulate synchronisation.</span>
            </div>
            <button
              onClick={triggerSimulatedSync}
              disabled={isSyncing}
              className="px-2.5 py-1 rounded bg-amber-800 text-white font-medium text-[11px] hover:bg-amber-900 cursor-pointer"
            >
              {isSyncing ? "Syncing..." : `Sync Now (${pendingSyncCount})`}
            </button>
          </div>
        )}

        {/* Dynamic Nested Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
