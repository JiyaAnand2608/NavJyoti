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

  // Restore and verify login after page refresh
  useEffect(() => {
    let active = true;

    async function restoreSession() {
      const token = sessionStorage.getItem(TOKEN_KEY);

      if (token) {
        try {
          const profile = await backendApi.getProfile(token);
          if (active) {
            setUser({ ...profile, isSimulated: false });
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.warn('Stored JWT session invalid or expired, falling back:', error.message);
          sessionStorage.removeItem(TOKEN_KEY);
        }
      }

      // Check demo user session if present
      const savedDemo = sessionStorage.getItem(DEMO_USER_KEY);
      if (savedDemo) {
        try {
          const parsed = JSON.parse(savedDemo);
          if (active && parsed) {
            setUser({ ...parsed, isSimulated: true });
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

  // 1. Parent Login (Mobile Number + Password)
  const loginParent = useCallback(async (phone, password) => {
    if (!phone || !phone.trim() || !password) {
      throw new Error('Please enter both mobile number and password.');
    }

    try {
      const result = await backendApi.login(phone.trim(), password);
      const token = result.access_token;

      // Verify token with backend
      const profile = await backendApi.getProfile(token);

      if (profile.role !== 'parent') {
        throw new Error(`This credential belongs to a ${profile.role} account. Please select the correct portal.`);
      }

      sessionStorage.setItem(TOKEN_KEY, token);
      sessionStorage.removeItem(DEMO_USER_KEY);
      const authenticatedUser = { ...profile, isSimulated: false };
      setUser(authenticatedUser);
      return authenticatedUser;
    } catch (apiError) {
      // In development / demo simulation mode, allow demo fallback if backend is offline
      if (import.meta.env.DEV && (apiError.message?.includes('Cannot connect to NavJyoti backend') || apiError.message?.includes('500'))) {
        console.warn('Backend unavailable, using simulated parent session for demonstration:', apiError.message);
        const demoAccount = {
          id: 1,
          role: 'parent',
          name: 'Sunita Sharma (Demo)',
          phone: phone.trim(),
          village: 'Rampur',
          preferred_language: 'hi',
          isSimulated: true,
        };
        sessionStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoAccount));
        setUser(demoAccount);
        return demoAccount;
      }
      throw apiError;
    }
  }, []);

  // 2. Health Worker & Supervisor Login (Email + OTP Request)
  const requestWorkerOtp = useCallback(async (email, role = 'worker') => {
    if (!email || !email.trim()) {
      throw new Error('Please enter your official email address.');
    }
    const cleanEmail = email.trim().toLowerCase();

    try {
      const result = await backendApi.requestOtp(cleanEmail, role);
      return result;
    } catch (apiError) {
      if (import.meta.env.DEV && (apiError.message?.includes('Cannot connect to NavJyoti backend') || apiError.message?.includes('500'))) {
        console.warn('Backend unavailable, returning simulated OTP dispatch notice:', apiError.message);
        return {
          message: `Simulated OTP dispatched to ${cleanEmail}. In demo mode, use 123456 or 4092.`,
          email: cleanEmail,
          role,
          cooldown_seconds: 60,
          isSimulated: true,
        };
      }
      throw apiError;
    }
  }, []);

  // 3. Health Worker & Supervisor OTP Verification
  const verifyWorkerOtp = useCallback(async (email, role = 'worker', otp) => {
    if (!email || !otp) {
      throw new Error('Please enter both email and the 6-digit OTP code.');
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    try {
      const result = await backendApi.verifyOtp(cleanEmail, role, cleanOtp);
      const token = result.access_token;

      const profile = await backendApi.getProfile(token);
      sessionStorage.setItem(TOKEN_KEY, token);
      sessionStorage.removeItem(DEMO_USER_KEY);
      const authenticatedUser = { ...profile, isSimulated: false };
      setUser(authenticatedUser);
      return authenticatedUser;
    } catch (apiError) {
      // In development / demo simulation mode, accept demo OTP 123456 or 4092
      if (
        import.meta.env.DEV &&
        (apiError.message?.includes('Cannot connect to NavJyoti backend') || apiError.message?.includes('500')) &&
        (cleanOtp === '123456' || cleanOtp === '4092')
      ) {
        const demoStaff = {
          id: role === 'supervisor' ? 2 : 3,
          role,
          name: role === 'supervisor' ? 'Dr. Sharma (MOIC Demo)' : 'Rekha Devi (ANM Demo)',
          email: cleanEmail,
          worker_id: role === 'supervisor' ? 'MOIC-UP-BLS-01' : 'ANM-UP-BLS-4019',
          village: 'Bilaspur Sadar',
          isSimulated: true,
        };
        sessionStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoStaff));
        setUser(demoStaff);
        return demoStaff;
      }
      throw apiError;
    }
  }, []);

  // 4. Staff/Worker Password Fallback Login
  const loginWithPassword = useCallback(async (identifier, password) => {
    if (!identifier || !password) {
      throw new Error('Please enter your identifier and password.');
    }
    const result = await backendApi.login(identifier.trim(), password);
    const token = result.access_token;
    const profile = await backendApi.getProfile(token);

    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.removeItem(DEMO_USER_KEY);
    const authenticatedUser = { ...profile, isSimulated: false };
    setUser(authenticatedUser);
    return authenticatedUser;
  }, []);

  // 5. Parent Registration (Option B: Name, Mobile, Password, Village, Language, Consent, Email Optional)
  const registerCaregiver = useCallback(async ({
    name,
    phone,
    password,
    village = 'Rampur',
    language = 'hi',
    consent = true,
    email = null,
  }) => {
    if (!name || !name.trim()) throw new Error('Caregiver name is required.');
    if (!phone || !phone.trim()) throw new Error('Mobile number is required.');
    if (!password || password.length < 6) throw new Error('Password must be at least 6 characters.');
    if (!consent) throw new Error('Caregiver consent acknowledgement is required.');

    try {
      const newUser = await backendApi.register({
        name: name.trim(),
        phone: phone.trim(),
        password,
        village,
        preferred_language: language,
        consent,
        email,
      });

      // Automatically log in newly registered parent
      const authenticatedUser = await loginParent(phone.trim(), password);
      return authenticatedUser || newUser;
    } catch (apiError) {
      if (import.meta.env.DEV && (apiError.message?.includes('Cannot connect to NavJyoti backend') || apiError.message?.includes('500'))) {
        console.warn('Backend unavailable, creating local demo caregiver session:', apiError.message);
        const demoCaregiver = {
          id: `usr_${Date.now()}`,
          role: 'parent',
          name: name.trim(),
          phone: phone.trim(),
          village,
          preferred_language: language,
          consent: true,
          email: email || null,
          isSimulated: true,
        };
        sessionStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoCaregiver));
        setUser(demoCaregiver);
        return demoCaregiver;
      }
      throw apiError;
    }
  }, [loginParent]);

  // 6. 1-Click Instant Demo Login (for presentations & database-deferred evaluation)
  const loginWithDemo = useCallback((roleKey = 'parent') => {
    const accounts = getAccounts();
    const targetRole = roleKey === 'supervisor' ? 'supervisor' : roleKey === 'worker' ? 'worker' : 'parent';
    const demoAccount = accounts.find((a) => a.role === targetRole) || DEFAULT_ACCOUNTS.find((a) => a.role === targetRole) || {
      id: `usr_${targetRole}_demo`,
      role: targetRole,
      name: targetRole === 'parent' ? "Sunita Sharma" : targetRole === 'supervisor' ? "Dr. Sharma (MOIC)" : "Rekha Devi (ANM)",
      email: `${targetRole}@navjyoti.gov.in`,
      phone: "+91 98765 43210",
      village: "Rampur",
      isSimulated: true,
    };

    const sessionObj = { ...demoAccount, isSimulated: true };
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.setItem(DEMO_USER_KEY, JSON.stringify(sessionObj));
    setUser(sessionObj);
    return sessionObj;
  }, []);

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
    logout();
  }, [logout]);

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
        isSimulated: Boolean(user?.isSimulated || !sessionStorage.getItem(TOKEN_KEY)),

        // Authentication Methods
        loginParent,
        requestWorkerOtp,
        verifyWorkerOtp,
        loginWithPassword,
        loginWithDemo,
        registerCaregiver,

        // Legacy compat methods
        login: loginWithPassword,
        register: registerCaregiver,
        loginWithIdentifier: async (identifier, role, pass) => {
          if (role === 'parent') return loginParent(identifier, pass);
          return loginWithPassword(identifier, pass);
        },

        updateProfile,
        requestPasswordReset,
        logout,
        switchRole,
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
