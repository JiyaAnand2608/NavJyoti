import React, { createContext, useContext, useState } from 'react';

const OfflineContext = createContext(null);

export function OfflineProvider({ children }) {
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
  const [pendingSyncQueue, setPendingSyncQueue] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(() => new Date().toLocaleTimeString());

  const toggleOfflineMode = () => {
    setIsSimulatedOffline((prev) => !prev);
  };

  const queueOfflineAction = (action) => {
    setPendingSyncQueue((prev) => [
      ...prev,
      {
        id: `offline_act_${Date.now()}`,
        timestamp: new Date().toISOString(),
        action,
      },
    ]);
  };

  const triggerSimulatedSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setPendingSyncQueue([]);
      setIsSyncing(false);
      setLastSyncTime(new Date().toLocaleTimeString());
    }, 1200);
  };

  return (
    <OfflineContext.Provider
      value={{
        isSimulatedOffline,
        toggleOfflineMode,
        pendingSyncCount: pendingSyncQueue.length,
        queueOfflineAction,
        triggerSimulatedSync,
        isSyncing,
        lastSyncTime,
        isSimulated: true,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}
