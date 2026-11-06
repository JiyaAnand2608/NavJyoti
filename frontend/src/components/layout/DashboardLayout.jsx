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
    <div className="min-h-screen w-full flex bg-[#F5F1E9] text-[#294B57]">
      {/* Sidebar Navigation */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Mobile Drawer */}
      <MobileNavDrawer isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F5F1E9]">
        <TopHeader onOpenMobileNav={() => setMobileNavOpen(true)} />

        {/* Offline Banner alert if simulated offline mode is on */}
        {isSimulatedOffline && (
          <div className="bg-[#FDF8EF] border-b border-[#F4B83F]/40 px-4 py-2 flex items-center justify-between text-xs text-[#103342]">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-[#B87D14]" />
              <span className="font-semibold">Simulated Offline Mode Active:</span>
              <span className="text-[#294B57]">Changes are queued locally. Click 'Sync' to simulate synchronisation.</span>
            </div>
            <button
              onClick={triggerSimulatedSync}
              disabled={isSyncing}
              className="px-2.5 py-1 rounded bg-[#007F68] text-white font-medium text-[11px] hover:bg-[#005F52] cursor-pointer"
            >
              {isSyncing ? "Syncing..." : `Sync Now (${pendingSyncCount})`}
            </button>
          </div>
        )}

        {/* Dynamic Nested Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-[#F5F1E9]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
