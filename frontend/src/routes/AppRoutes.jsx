import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layout
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { DocumentMeta } from '../components/common/DocumentMeta';

// Public pages
import { LandingPage } from '../pages/public/LandingPage';
import { QrLookupPage } from '../pages/public/QrLookupPage';
import { NotFoundPage } from '../pages/public/NotFoundPage';

// Authentication pages
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

// Health Worker pages
import { WorkerDashboardOverview } from '../pages/worker/WorkerDashboardOverview';
import { ChildRegistryPage } from '../pages/worker/ChildRegistryPage';
import { ChildDetailPage } from '../pages/worker/ChildDetailPage';
import { VaccinationMgmtPage } from '../pages/worker/VaccinationMgmtPage';
import { PriorityFollowUpPage } from '../pages/worker/PriorityFollowUpPage';
import { WorkerAppointmentsPage } from '../pages/worker/WorkerAppointmentsPage';
import { CommunicationCenterPage } from '../pages/worker/CommunicationCenterPage';
import { QrHandoffPage } from '../pages/worker/QrHandoffPage';
import { WorkerProfilePage } from '../pages/worker/WorkerProfilePage';

// Supervisor pages
import { AuthorityDashboardPage } from '../pages/supervisor/AuthorityDashboardPage';
import { AuthorityWorkersPage } from '../pages/supervisor/AuthorityWorkersPage';
import { AuthorityWorkerDetailPage } from '../pages/supervisor/AuthorityWorkerDetailPage';
import { AuthorityChildRegistryPage } from '../pages/supervisor/AuthorityChildRegistryPage';
import { AuthorityChildDetailPage } from '../pages/supervisor/AuthorityChildDetailPage';
import { AuthorityVaccinationPage } from '../pages/supervisor/AuthorityVaccinationPage';
import { AuthorityFollowUpsPage } from '../pages/supervisor/AuthorityFollowUpsPage';
import { AuthorityAuditLogsPage } from '../pages/supervisor/AuthorityAuditLogsPage';
import { AuthorityReportsPage } from '../pages/supervisor/AuthorityReportsPage';
import { AuthorityAlertsPage } from '../pages/supervisor/AuthorityAlertsPage';
import { AuthorityProfilePage } from '../pages/supervisor/AuthorityProfilePage';
import { SupervisorAnalyticsPage } from '../pages/supervisor/SupervisorAnalyticsPage';

export function AppRoutes() {
  return (
    <>
      <DocumentMeta />
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/records/lookup/:qrToken" element={<QrLookupPage />} />

        {/* AUTHENTICATION ROUTES */}
        <Route path="/auth/select-role" element={<RoleSelectionPage />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route path="/auth/jurisdiction" element={<JurisdictionVerifyPage />} />

        {/* ==========================================
            PARENT ROUTES
            Only authenticated parents can access.
        ========================================== */}
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

        {/* ==========================================
            HEALTH WORKER ROUTES
            Only authenticated workers can access.
        ========================================== */}
        <Route element={<ProtectedRoute allowedRoles={['worker']} />}>
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

        {/* ==========================================
            AUTHORITY / SUPERVISOR ROUTES
            Only authenticated supervisors can access.
        ========================================== */}
        <Route element={<ProtectedRoute allowedRoles={['supervisor']} />}>
          <Route path="/supervisor" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/supervisor/dashboard" replace />} />
            <Route path="dashboard" element={<AuthorityDashboardPage />} />
            <Route path="workers" element={<AuthorityWorkersPage />} />
            <Route path="workers/:id" element={<AuthorityWorkerDetailPage />} />
            <Route path="children" element={<AuthorityChildRegistryPage />} />
            <Route path="children/:id" element={<AuthorityChildDetailPage />} />
            <Route path="vaccinations" element={<AuthorityVaccinationPage />} />
            <Route path="follow-ups" element={<AuthorityFollowUpsPage />} />
            <Route path="audit-logs" element={<AuthorityAuditLogsPage />} />
            <Route path="reports" element={<AuthorityReportsPage />} />
            <Route path="analytics" element={<SupervisorAnalyticsPage />} />
            <Route path="alerts" element={<AuthorityAlertsPage />} />
            <Route path="profile" element={<AuthorityProfilePage />} />
          </Route>
        </Route>

        {/* Fallback to custom 404 Not Found Page */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
