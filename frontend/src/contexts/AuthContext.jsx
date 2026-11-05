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
          jurisdiction: existingSession.jurisdiction,
          isSimulated: true,
        });
      }
    }
    setIsLoading(false);
  }, []);

  // 1-Click Demo Login
  const loginWithDemo = (roleKey = 'parent') => {
    const accounts = getAccounts();
    const demoAccount = accounts.find((a) => a.role === (roleKey === 'worker' ? 'worker' : 'parent')) || DEFAULT_ACCOUNTS[0];

    saveSession(demoAccount);
    setUser(demoAccount);
    return demoAccount;
  };

  // Login with Mobile or Worker ID (Simulated OTP flow)
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
        name: role === 'parent' ? "Demo Caregiver" : "Demo Health Worker",
        phone: identifier,
        workerId: role === 'worker' ? identifier : undefined,
        village: "Rampur",
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

  // Explicit Logout: Clears active session ONLY. Saved child records are strictly preserved!
  const logout = () => {
    clearSession();
    setUser(null);
  };

  const switchRole = (newRole) => {
    loginWithDemo(newRole);
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
