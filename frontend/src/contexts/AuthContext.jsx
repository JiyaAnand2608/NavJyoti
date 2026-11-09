import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  initializeStorage,
  getSession,
  saveSession,
  clearSession,
  getAccounts,
  findAccountByPhoneOrId,
  createOrUpdateAccount,
  DEFAULT_ACCOUNTS,
} from '../services/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize storage & restore persistent demo session on mount
  useEffect(() => {
    initializeStorage();
    const existingSession = getSession();

    if (existingSession) {
      // Find full profile from persistent accounts
      const accounts = getAccounts();
      const matched = accounts.find((a) => a.id === existingSession.userId);

      if (matched) {
        setUser(matched);
      } else {
        // Fallback to session details
        setUser({
          id: existingSession.userId,
          role: existingSession.role,
          name: existingSession.name,
          phone: existingSession.phone,
          workerId: existingSession.workerId,
          designation: existingSession.designation,
          jurisdiction: existingSession.jurisdiction,
          isSimulated: true,
        });
      }
    }
    setIsLoading(false);
  }, []);

  // 1-Click Demo Login for any role (parent, worker, supervisor)
  const loginWithDemo = (roleKey = 'parent') => {
    const accounts = getAccounts();
    const targetRole = roleKey === 'supervisor' ? 'supervisor' : roleKey === 'worker' ? 'worker' : 'parent';
    const demoAccount = accounts.find((a) => a.role === targetRole) || DEFAULT_ACCOUNTS.find((a) => a.role === targetRole) || DEFAULT_ACCOUNTS[0];

    saveSession(demoAccount);
    setUser(demoAccount);
    return demoAccount;
  };

  // Login with Mobile or Worker ID
  const loginWithIdentifier = (identifier, role = 'parent') => {
    const existing = findAccountByPhoneOrId(identifier, role);

    let activeUser;
    if (existing) {
      activeUser = existing;
    } else {
      // Create new persistent demo account
      const newAcc = {
        id: `usr_${role}_${Date.now()}`,
        role: role,
        name: role === 'parent' ? "Demo Caregiver" : role === 'supervisor' ? "Dr. Demo Supervisor" : "Demo Health Worker",
        phone: identifier,
        workerId: role !== 'parent' ? identifier : undefined,
        village: "Rampur",
        district: "Bilaspur Sadar",
        state: "Uttar Pradesh",
        linkedChildIds: [],
        createdAt: new Date().toISOString(),
        isSimulated: true,
      };
      createOrUpdateAccount(newAcc);
      activeUser = newAcc;
    }

    saveSession(activeUser);
    setUser(activeUser);
    return activeUser;
  };

  // Simplified Parent Registration
  const registerCaregiver = ({ name, phone, language = 'en', consent = true }) => {
    const newAccount = {
      id: `usr_parent_${Date.now()}`,
      role: 'parent',
      name: name.trim(),
      phone: phone.trim(),
      language,
      consent,
      village: "Rampur",
      district: "Bilaspur Sadar",
      state: "Uttar Pradesh",
      linkedChildIds: [],
      createdAt: new Date().toISOString(),
      isSimulated: true,
    };

    createOrUpdateAccount(newAccount);
    saveSession(newAccount);
    setUser(newAccount);
    return newAccount;
  };

  // Update profile
  const updateProfile = (patchData) => {
    if (!user) return null;
    const updated = { ...user, ...patchData };
    createOrUpdateAccount(updated);
    saveSession(updated);
    setUser(updated);
    return updated;
  };

  // Request password reset (simulated)
  const requestPasswordReset = (identifier) => {
    return {
      success: true,
      message: `Demo notice: Simulated reset instructions dispatched for ${identifier}. Non-operational until backend integration.`,
    };
  };

  // Explicit Logout: Clears active session ONLY. Saved child records and accounts are strictly preserved!
  const logout = () => {
    clearSession();
    setUser(null);
  };

  const switchRole = (newRole) => {
    return loginWithDemo(newRole);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        isAuthenticated: !!user,
        isLoading,
        loginWithDemo,
        loginWithIdentifier,
        registerCaregiver,
        updateProfile,
        requestPasswordReset,
        logout,
        switchRole,
        isSimulated: true,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
