import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { backendApi } from '../services/backendApi';
import {
  getAccounts,
  findAccountByPhoneOrId,
  DEFAULT_ACCOUNTS,
} from '../services/storage';

const AuthContext = createContext(null);
const TOKEN_KEY = 'navjyoti_access_token';
const DEMO_USER_KEY = 'navjyoti_demo_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore and verify login after refreshing the page
  useEffect(() => {
    let active = true;

    async function restoreSession() {
      const token = sessionStorage.getItem(TOKEN_KEY);

      if (token) {
        try {
          const profile = await backendApi.getProfile(token);
          if (active) {
            setUser(profile);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          sessionStorage.removeItem(TOKEN_KEY);
        }
      }

      // Check demo user session if present
      const savedDemo = sessionStorage.getItem(DEMO_USER_KEY);
      if (savedDemo) {
        try {
          const parsed = JSON.parse(savedDemo);
          if (active && parsed) {
            setUser(parsed);
            setIsLoading(false);
            return;
          }
        } catch (e) {
          sessionStorage.removeItem(DEMO_USER_KEY);
        }
      }

      if (active) {
        setUser(null);
        setIsLoading(false);
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  // Real email and password login via FastAPI backend
  const login = useCallback(async (email, password) => {
    const result = await backendApi.login(email.trim(), password);
    const token = result.access_token;

    // Verify token before accepting the session
    const profile = await backendApi.getProfile(token);

    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.removeItem(DEMO_USER_KEY);
    setUser(profile);

    return profile;
  }, []);

  // Register a real parent account via FastAPI backend
  const register = useCallback(
    async ({ name, email, password }) => {
      if (!name || !email || !password) {
        throw new Error('Name, email and password are required.');
      }

      const newUser = await backendApi.register(
        name.trim(),
        email.trim(),
        password
      );

      await login(email, password);
      return newUser;
    },
    [login]
  );

  // Login with identifier (email or phone)
  const loginWithIdentifier = async (
    identifier,
    role = 'parent',
    password
  ) => {
    if (identifier?.includes('@') && password) {
      const profile = await login(identifier, password);
      if (profile.role !== role && !(role === 'worker' && profile.role === 'supervisor')) {
        sessionStorage.removeItem(TOKEN_KEY);
        setUser(null);
        throw new Error(`This account belongs to the ${profile.role} role. Please select the correct portal.`);
      }
      return profile;
    }

    // Demo/prototype fallback
    const accounts = getAccounts();
    const existing = findAccountByPhoneOrId(identifier, role) || accounts.find(a => a.role === role);
    const demoAcc = existing || {
      id: `usr_${role}_${Date.now()}`,
      role: role,
      name: role === 'parent' ? "Sunita Sharma" : "Rekha Devi",
      email: `${role}@navjyoti.gov.in`,
      phone: identifier || "+91 98765 43210",
      village: "Rampur",
      district: "Bilaspur Sadar",
      state: "Uttar Pradesh",
      isSimulated: true,
    };
    sessionStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoAcc));
    setUser(demoAcc);
    return demoAcc;
  };

  // 1-Click Demo Login fallback
  const loginWithDemo = useCallback((roleKey = 'parent') => {
    const accounts = getAccounts();
    const targetRole = roleKey === 'supervisor' ? 'supervisor' : roleKey === 'worker' ? 'worker' : 'parent';
    const demoAccount = accounts.find((a) => a.role === targetRole) || DEFAULT_ACCOUNTS.find((a) => a.role === targetRole) || {
      id: `usr_${targetRole}_demo`,
      role: targetRole,
      name: targetRole === 'parent' ? "Sunita Sharma" : "Rekha Devi",
      email: `${targetRole}@navjyoti.gov.in`,
      phone: "+91 98765 43210",
      isSimulated: true,
    };
    sessionStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoAccount));
    setUser(demoAccount);
    return demoAccount;
  }, []);

  const registerCaregiver = useCallback(async (data) => {
    if (data.email && data.password) {
      return register(data);
    }
    return loginWithDemo('parent');
  }, [register, loginWithDemo]);

  const updateProfile = useCallback(async (patchData) => {
    if (!user) return null;
    const updated = { ...user, ...patchData };
    setUser(updated);
    if (sessionStorage.getItem(DEMO_USER_KEY)) {
      sessionStorage.setItem(DEMO_USER_KEY, JSON.stringify(updated));
    }
    return updated;
  }, [user]);

  const requestPasswordReset = useCallback(async (identifier) => {
    return {
      success: true,
      message: `Password reset instructions sent to ${identifier}.`,
    };
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(DEMO_USER_KEY);
    setUser(null);
  }, []);

  const switchRole = useCallback((newRole) => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(DEMO_USER_KEY);
    setUser(null);
  }, []);

  const isRoleAuthenticated = useCallback((requiredRole) => {
    if (!user) return false;
    if (requiredRole === 'worker' || requiredRole === 'supervisor') {
      return user.role === 'worker' || user.role === 'supervisor';
    }
    return user.role === requiredRole;
  }, [user]);

  const parentUser = user?.role === 'parent' ? user : null;
  const workerUser = (user?.role === 'worker' || user?.role === 'supervisor') ? user : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role ?? null,
        isAuthenticated: Boolean(user),
        parentUser,
        workerUser,
        isRoleAuthenticated,
        isLoading,

        login,
        register,

        loginWithIdentifier,
        loginWithDemo,
        registerCaregiver,

        updateProfile,
        requestPasswordReset,
        logout,
        switchRole,

        isSimulated: !sessionStorage.getItem(TOKEN_KEY),
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
