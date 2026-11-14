
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';

import { backendApi } from '../services/backendApi';

const AuthContext = createContext(null);

const TOKEN_KEY = 'navjyoti_access_token';

export function AuthProvider({ children }) {
  const location = useLocation();

  const [parentUser, setParentUser] = useState(null);
  const [workerUser, setWorkerUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore and verify login after refreshing the page
  useEffect(() => {
    let active = true;

    async function restoreSession() {
      const token = sessionStorage.getItem(TOKEN_KEY);

      if (!token) {
        if (active) setIsLoading(false);
        return;
      }

      try {
        const profile = await backendApi.getProfile(token);

        if (active) {
          setUser(profile);
        }
      } catch (error) {
        sessionStorage.removeItem(TOKEN_KEY);

        if (active) {
          setUser(null);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  // Real email and password login
  const login = useCallback(async (email, password) => {
    const result = await backendApi.login(
      email.trim(),
      password
    );

    const token = result.access_token;

    // Verify token before accepting the session
    const profile = await backendApi.getProfile(token);

    sessionStorage.setItem(TOKEN_KEY, token);
    setUser(profile);

    return profile;
  }, []);

  // Register a real parent account
  const register = useCallback(
    async ({ name, email, password }) => {
      if (!name || !email || !password) {
        throw new Error(
          'Name, email and password are required.'
        );
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

  // Compatibility method for existing login components
  const loginWithIdentifier = async (
    identifier,
    role = 'parent',
    password
  ) => {
    if (!identifier?.includes('@') || !password) {
      throw new Error(
        'Please use your email address and password.'
      );
    }

    const profile = await login(identifier, password);

    if (profile.role !== role) {
      sessionStorage.removeItem(TOKEN_KEY);
      setUser(null);

      throw new Error(
        'This account does not have the selected role.'
      );
    }

    return profile;
  };

  // Compatibility method for parent registration
  const registerCaregiver = async (data) => {
    return register(data);
  };

  // Demo authentication is disabled for real accounts
  const loginWithDemo = () => {
    throw new Error(
      'Demo login is disabled. Please log in with a registered account.'
    );
  // Initialize storage & restore persistent demo sessions on mount
  useEffect(() => {
    initializeStorage();
    const accounts = getAccounts();

    const parentSess = getParentSession();
    if (parentSess) {
      const matched = accounts.find((a) => a.id === parentSess.userId);
      setParentUser(matched || { ...parentSess, id: parentSess.userId });
    }

    const workerSess = getWorkerSession();
    if (workerSess) {
      const matched = accounts.find((a) => a.id === workerSess.userId);
      setWorkerUser(matched || { ...workerSess, id: workerSess.userId });
    }

    setIsLoading(false);
  }, []);

  // Determine active context based on current route
  const isWorkerRoute = location.pathname.startsWith('/worker') || location.pathname.startsWith('/supervisor');
  const isParentRoute = location.pathname.startsWith('/parent');

  const activeUser = isWorkerRoute ? workerUser : (isParentRoute ? parentUser : (parentUser || workerUser));

  // Role authentication validator
  const isRoleAuthenticated = (requiredRole) => {
    if (requiredRole === 'worker' || requiredRole === 'supervisor') {
      return !!workerUser && (workerUser.role === 'worker' || workerUser.role === 'supervisor');
    }
    if (requiredRole === 'parent') {
      return !!parentUser && parentUser.role === 'parent';
    }
    return false;
  };

  // 1-Click Demo Login for any role (parent, worker, supervisor)
  const loginWithDemo = (roleKey = 'parent') => {
    const accounts = getAccounts();
    const targetRole = roleKey === 'supervisor' ? 'supervisor' : roleKey === 'worker' ? 'worker' : 'parent';
    const demoAccount = accounts.find((a) => a.role === targetRole) || DEFAULT_ACCOUNTS.find((a) => a.role === targetRole) || DEFAULT_ACCOUNTS[0];

    saveSession(demoAccount);
    if (targetRole === 'parent') {
      setParentUser(demoAccount);
    } else {
      setWorkerUser(demoAccount);
    }
    return demoAccount;
  };

  // Login with Mobile or Worker ID with credentials validation
  const loginWithIdentifier = (identifier, role = 'parent') => {
    const existing = findAccountByPhoneOrId(identifier, role);

    let activeAccount;
    if (existing) {
      if (role && existing.role !== role) {
        throw new Error(`This identifier is registered as a ${existing.role}. Please select the ${existing.role} login option.`);
      }
      activeAccount = existing;
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
      activeAccount = newAcc;
    }

    saveSession(activeAccount);
    if (role === 'parent') {
      setParentUser(activeAccount);
    } else {
      setWorkerUser(activeAccount);
    }
    return activeAccount;
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
    setParentUser(newAccount);
    return newAccount;
  };

  // Update profile
  const updateProfile = (patchData) => {
    if (!activeUser) return null;
    const updated = { ...activeUser, ...patchData };
    createOrUpdateAccount(updated);
    saveSession(updated);
    if (updated.role === 'parent') {
      setParentUser(updated);
    } else {
      setWorkerUser(updated);
    }
    return updated;
  };

  const switchRole = () => {
    throw new Error(
      'Your role is assigned by the backend. Log in with an authorized account.'
    );
  };

  // Profile editing needs its own backend endpoint
  const updateProfile = async () => {
    throw new Error(
      'Profile editing is not connected yet.'
    );
  };

  // Password recovery needs a real backend workflow
  const requestPasswordReset = async () => {
    throw new Error(
      'Password recovery is not available yet.'
    );
  };

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);
  // Explicit Logout: Clears active session for the role
  const logout = (specificRole) => {
    const roleToLogout = specificRole || (isWorkerRoute ? 'worker' : 'parent');
    if (roleToLogout === 'worker' || roleToLogout === 'supervisor') {
      clearWorkerSession();
      setWorkerUser(null);
    } else {
      clearParentSession();
      setParentUser(null);
    }
  };

  // When switching roles, clear the target role's session to require fresh authentication
  const switchRole = (newRole) => {
    if (newRole === 'worker' || newRole === 'supervisor') {
      clearWorkerSession();
      setWorkerUser(null);
    } else {
      clearParentSession();
      setParentUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role ?? null,
        isAuthenticated: Boolean(user),
        user: activeUser,
        role: activeUser ? activeUser.role : null,
        parentUser,
        workerUser,
        isAuthenticated: isWorkerRoute ? (!!workerUser) : (isParentRoute ? (!!parentUser) : (!!parentUser || !!workerUser)),
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

        isSimulated: false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider'
    );
  }

  return context;
}
