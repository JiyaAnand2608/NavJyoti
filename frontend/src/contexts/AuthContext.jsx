
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
  const [user, setUser] = useState(null);
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

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role ?? null,
        isAuthenticated: Boolean(user),
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
