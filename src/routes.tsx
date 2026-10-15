import React from 'react';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { OperationalLedgerPage } from './pages/OperationalLedgerPage';
import { ShopsPage } from './pages/ShopsPage';
import { PaymentMethodsPage } from './pages/PaymentMethodsPage';
import { SettlementsPage } from './pages/SettlementsPage';
import { PCManagementPage } from './pages/PCManagementPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { UsersPage } from './pages/UsersPage';
import { RequestsPage } from './pages/RequestsPage';
import { JobsPage } from './pages/JobsPage';
import { SupportPage } from './pages/SupportPage';
import { CMSPage } from './pages/CMSPage';
import { AdvertisementsPage } from './pages/AdvertisementsPage';
import { PromotionsPage } from './pages/PromotionsPage';
import { SettingsPage } from './pages/SettingsPage';
import { PublicInformationalPage } from './pages/PublicInformationalPage';
import { ProtectedRoute } from './components/common/ProtectedRoute';

export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  public?: boolean;
}

export const routes: RouteConfig[] = [
  {
    name: 'Login',
    path: '/login',
    element: <LoginPage />,
    public: true,
  },
  {
    name: 'Public Policy Page',
    path: '/pages/:slug',
    element: <PublicInformationalPage />,
    public: true,
  },
  {
    name: 'Root Redirect',
    path: '/',
    element: <Navigate to="/dashboard" replace />,
    public: true,
  },
  {
    name: 'Dashboard',
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    name: 'Operational Ledger',
    path: '/operational-ledger',
    element: (
      <ProtectedRoute>
        <OperationalLedgerPage />
      </ProtectedRoute>
    ),
  },
  {
    name: 'Shops & Shopkeepers',
    path: '/shops',
    element: (
      <ProtectedRoute>
        <ShopsPage />
      </ProtectedRoute>
    ),
  },
  {
    name: 'Payment Methods',
    path: '/payment-methods',
    element: (
      <ProtectedRoute>
        <PaymentMethodsPage />
      </ProtectedRoute>
    ),
  },
  {
    name: 'Settlements & Payouts',
    path: '/settlements',
    element: (
      <ProtectedRoute>
        <SettlementsPage />
      </ProtectedRoute>
    ),
  },
  {
    name: 'PC Management',
    path: '/pc-management',
    element: (
      <ProtectedRoute>
        <PCManagementPage />
      </ProtectedRoute>
    ),
  },
  {
    name: 'Subscription Plans',
    path: '/subscriptions',
    element: (
      <ProtectedRoute>
        <SubscriptionsPage />
      </ProtectedRoute>
    ),
  },
  {
    name: 'Users & Memberships',
    path: '/users',
    element: (
      <ProtectedRoute>
        <UsersPage />
      </ProtectedRoute>
    ),
  },
  {
    name: 'Application Requests',
    path: '/requests',
    element: (
      <ProtectedRoute>
        <RequestsPage />
      </ProtectedRoute>
    ),
  },
  {
    name: 'Jobs & Careers',
    path: '/jobs',
    element: (
      <ProtectedRoute>
        <JobsPage />
      </ProtectedRoute>
    ),
  },
  {
    name: 'Help & Support',
    path: '/support',
    element: (
      <ProtectedRoute>
        <SupportPage />
      </ProtectedRoute>
    ),
  },
  {
    name: 'Advertisements',
    path: '/advertisements',
    element: (
      <ProtectedRoute>
        <AdvertisementsPage />
      </ProtectedRoute>
    ),
  },
  {
    name: 'Content CMS',
    path: '/cms',
    element: (
      <ProtectedRoute>
        <CMSPage />
      </ProtectedRoute>
    ),
  },
  {
    name: 'Promotional Alerts & Notices',
    path: '/promotions',
    element: (
      <ProtectedRoute>
        <PromotionsPage />
      </ProtectedRoute>
    ),
  },
  {
    name: 'System Settings',
    path: '/settings',
    element: (
      <ProtectedRoute>
        <SettingsPage />
      </ProtectedRoute>
    ),
  },
];
