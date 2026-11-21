import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { backendApi } from '../services/backendApi';

const OfflineContext = createContext(null);

/**
 * ARCHITECTURAL NOTICE — FUTURE OFFLINE EDITING SPECIFICATION (Phase 4):
 * Full offline write-back, conflict resolution, and automatic database synchronization
 * require coordinated backend API contracts with Manan, including:
 * 1. Client-side encrypted SQLite / IndexedDB for sensitive clinical records (HIPAA/DISHA compliant).
 * 2. Immutable client-generated UUIDv4 keys to prevent sequence collisions.
 * 3. Cryptographic worker digital signature on offline-administered vaccine doses.
 * 4. Vector-clock / 3-way merge conflict resolution on child records.
 * 5. Batch reconciliation endpoints (/sync/batch) on the FastAPI backend with atomic rollback.
 * 
 * In this presentation release, offline operation is STRICTLY READ-ONLY for cached session records.
 * Write queues and fake background synchronizations are explicitly prohibited to prevent data corruption.
 */

export function OfflineProvider({ children }) {
  // 1. True browser connectivity status
  const [isBrowserOnline, setIsBrowserOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // 2. Verified backend availability status (null = probing, true = 200 OK, false = unreachable)
  const [backendReachable, setBackendReachable] = useState(null);
  const [backendChecking, setBackendChecking] = useState(false);

  // 3. User-controlled demonstration simulation mode (for presentation purposes)
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);

  // 4. Real sync timestamp (null initially — only set when actual backend API responds)
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // 5. Session-scoped authorized record cache (isolated by authenticated userId)
  const [sessionCacheUser, setSessionCacheUser] = useState(null);
  const [sessionCacheData, setSessionCacheData] = useState(null);

  // Function to probe actual backend health (does not spam)
  const checkBackendHealth = useCallback(async () => {
    if (!navigator.onLine || isSimulatedOffline) {
      setBackendReachable(false);
      return false;
    }

    setBackendChecking(true);
    try {
      const res = await backendApi.health();
      const isOk = Boolean(res && (res.status === 'healthy' || res.status === 'ok' || res.database));
      setBackendReachable(isOk);
      return isOk;
    } catch {
      setBackendReachable(false);
      return false;
    } finally {
      setBackendChecking(false);
    }
  }, [isSimulatedOffline]);

  // Listen for browser online / offline network events
  useEffect(() => {
    const handleOnline = () => {
      setIsBrowserOnline(true);
      checkBackendHealth();
    };

    const handleOffline = () => {
      setIsBrowserOnline(false);
      setBackendReachable(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial backend check on mount
    checkBackendHealth();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkBackendHealth]);

  // Toggle presentation offline simulator
  const toggleOfflineMode = useCallback(() => {
    setIsSimulatedOffline((prev) => {
      const next = !prev;
      if (next) {
        setBackendReachable(false);
      } else {
        // Re-checking when returning to live mode
        setTimeout(() => checkBackendHealth(), 100);
      }
      return next;
    });
  }, [checkBackendHealth]);

  // Record a genuine sync event with real timestamp
  const recordSuccessfulSync = useCallback((timestamp = null) => {
    const timeStr = timestamp || new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setLastSyncTime(timeStr);
    setBackendReachable(true);
  }, []);

  // Update session-scoped authorized cache
  const updateSessionCache = useCallback((userId, data) => {
    if (!userId) return;
    setSessionCacheUser(userId);
    setSessionCacheData(data);
  }, []);

  // Clear session cache on logout or role switch
  const clearSessionCache = useCallback(() => {
    setSessionCacheUser(null);
    setSessionCacheData(null);
    setLastSyncTime(null);
  }, []);

  // Determine overall effective offline state
  const effectiveOffline = !isBrowserOnline || isSimulatedOffline || backendReachable === false;

  // Determine specific human-readable network status
  let networkStatus = 'online';
  if (isSimulatedOffline) {
    networkStatus = 'simulated_offline';
  } else if (!isBrowserOnline) {
    networkStatus = 'browser_offline';
  } else if (backendReachable === false) {
    networkStatus = 'backend_unreachable';
  } else if (backendChecking) {
    networkStatus = 'checking';
  }

  // Outdated warning flag: active when running offline with pre-cached records
  const isOutdated = Boolean(effectiveOffline && lastSyncTime);

  return (
    <OfflineContext.Provider
      value={{
        // Network state
        isBrowserOnline,
        backendReachable,
        backendChecking,
        isSimulatedOffline,
        effectiveOffline,
        networkStatus,
        toggleOfflineMode,
        checkBackendHealth,

        // Sync metadata (Strictly verified, no fake counters or simulated write queues)
        lastSyncTime,
        recordSuccessfulSync,
        isOutdated,
        pendingSyncCount: 0,
        isSyncing: false,

        // Session-scoped cache management
        sessionCacheUser,
        sessionCacheData,
        updateSessionCache,
        clearSessionCache,

        // Architectural documentation reference
        isReadOnlyMode: effectiveOffline,
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
