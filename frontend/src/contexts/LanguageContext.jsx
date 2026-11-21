import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations } from '../data/translations';

const LanguageContext = createContext(null);
const STORAGE_KEY = 'navjyoti_lang';

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'hi' || stored === 'en') return stored;
    } catch {
      // localStorage may fail in restricted browser environments
    }
    return 'en';
  });

  const setLang = useCallback((newLang) => {
    const valid = newLang === 'hi' ? 'hi' : 'en';
    setLangState(valid);
    try {
      localStorage.setItem(STORAGE_KEY, valid);
    } catch {
      // ignore
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = valid;
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLangState((prev) => {
      const next = prev === 'en' ? 'hi' : 'en';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore
      }
      if (typeof document !== 'undefined') {
        document.documentElement.lang = next;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const t = useCallback((path, fallbackStr) => {
    if (!path) return fallbackStr || '';
    const keys = String(path).split('.');

    // Try current language
    let current = translations[lang] || translations.en;
    let found = true;
    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key];
      } else {
        found = false;
        break;
      }
    }

    if (found && current !== undefined) {
      return current;
    }

    // Fallback to English dictionary
    let fallback = translations.en;
    let fallbackFound = true;
    for (const fKey of keys) {
      if (fallback && fallback[fKey] !== undefined) {
        fallback = fallback[fKey];
      } else {
        fallbackFound = false;
        break;
      }
    }

    if (fallbackFound && fallback !== undefined) {
      return fallback;
    }

    return fallbackStr !== undefined ? fallbackStr : path;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
