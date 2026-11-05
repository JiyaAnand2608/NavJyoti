import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import { HealthDataProvider } from './contexts/HealthDataContext';
import { OfflineProvider } from './contexts/OfflineContext';
import { AppRoutes } from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <HealthDataProvider>
            <OfflineProvider>
              <AppRoutes />
            </OfflineProvider>
          </HealthDataProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
