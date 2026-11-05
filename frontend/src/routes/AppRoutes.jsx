import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layout
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';

// Public pages
import { LandingPage } from '../pages/public/LandingPage';
import { QrLookupPage } from '../pages/public/QrLookupPage';

// Auth pages
import { RoleSelectionPage } from '../pages/auth/RoleSelectionPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { JurisdictionVerifyPage } from '../pages/auth/JurisdictionVerifyPage';

// Parent pages
import { ParentDashboardHome } from '../pages/parent/ParentDashboardHome';
import { MyChildrenPage } from '../pages/parent/MyChildrenPage';
import { VaccinationTrackerPage } from '../pages/parent/VaccinationTrackerPage';
import { DevelopmentalPage } from '../pages/parent/DevelopmentalPage';
import { DigitalHealthRecordsPage } from '../pages/parent/DigitalHealthRecordsPage';
import { RemindersPage } from '../pages/parent/RemindersPage';
import { ParentAppointmentsPage } from '../pages/parent/ParentAppointmentsPage';
import { HelpSupportPage } from '../pages/parent/HelpSupportPage';
import { ParentProfilePage } from '../pages/parent/ParentProfilePage';

// Worker pages
import { WorkerDashboardOverview } from '../pages/worker/WorkerDashboardOverview';
import { ChildRegistryPage } from '../pages/worker/ChildRegistryPage';
import { ChildDetailPage } from '../pages/worker/ChildDetailPage';
import { VaccinationMgmtPage } from '../pages/worker/VaccinationMgmtPage';
import { PriorityFollowUpPage } from '../pages/worker/PriorityFollowUpPage';
import { WorkerAppointmentsPage } from '../pages/worker/WorkerAppointmentsPage';
import { CommunicationCenterPage } from '../pages/worker/CommunicationCenterPage';
import { QrHandoffPage } from '../pages/worker/QrHandoffPage';
import { WorkerProfilePage } from '../pages/worker/WorkerProfilePage';

// Supervisor
import { SupervisorAnalyticsPage } from '../pages/supervisor/SupervisorAnalyticsPage';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/records/lookup/:qrToken" element={<QrLookupPage />} />

      {/* Auth & Onboarding */}
      <Route path="/auth/select-role" element={<RoleSelectionPage />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/register" element={<RegisterPage />} />
      <Route path="/auth/jurisdiction" element={<JurisdictionVerifyPage />} />

      {/* Protected Parent Routes */}
      <Route element={<ProtectedRoute allowedRoles={['parent']} />}>
        <Route path="/parent" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/parent/dashboard" replace />} />
          <Route path="dashboard" element={<ParentDashboardHome />} />
          <Route path="children" element={<MyChildrenPage />} />
          <Route path="vaccines" element={<VaccinationTrackerPage />} />
          <Route path="milestones" element={<DevelopmentalPage />} />
          <Route path="records" element={<DigitalHealthRecordsPage />} />
          <Route path="reminders" element={<RemindersPage />} />
          <Route path="appointments" element={<ParentAppointmentsPage />} />
          <Route path="help" element={<HelpSupportPage />} />
          <Route path="profile" element={<ParentProfilePage />} />
        </Route>
      </Route>

      {/* Protected Health Worker Routes */}
      <Route element={<ProtectedRoute allowedRoles={['worker', 'supervisor']} />}>
        <Route path="/worker" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/worker/dashboard" replace />} />
          <Route path="dashboard" element={<WorkerDashboardOverview />} />
          <Route path="registry" element={<ChildRegistryPage />} />
          <Route path="children/:id" element={<ChildDetailPage />} />
          <Route path="vaccinations" element={<VaccinationMgmtPage />} />
          <Route path="priority" element={<PriorityFollowUpPage />} />
          <Route path="appointments" element={<WorkerAppointmentsPage />} />
          <Route path="messages" element={<CommunicationCenterPage />} />
          <Route path="qr-handoff" element={<QrHandoffPage />} />
          <Route path="profile" element={<WorkerProfilePage />} />
        </Route>
      </Route>

      {/* Protected Supervisor Analytics Route */}
      <Route element={<ProtectedRoute allowedRoles={['worker', 'supervisor']} />}>
        <Route path="/supervisor" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/supervisor/analytics" replace />} />
          <Route path="analytics" element={<SupervisorAnalyticsPage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
