
import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';

import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import { HealthDataProvider } from './contexts/HealthDataContext';
import { OfflineProvider } from './contexts/OfflineContext';
import { AppRoutes } from './routes/AppRoutes';

import { backendApi } from './services/backendApi';

export default function App() {

  useEffect(() => {
    backendApi.health()
      .then((data) => {
        console.log('NavJyoti Backend:', data);
      })
      .catch((error) => {
        console.error(
          'Backend connection failed:',
          error
        );
      });
  }, []);

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
