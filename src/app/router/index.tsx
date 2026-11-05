/* eslint-disable react-refresh/only-export-components -- lazy route modules are not component exports */
import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthLayout } from '@/app/layouts/auth-layout'
import { DashboardLayout } from '@/app/layouts/dashboard-layout'
import { ProtectedRoute } from '@/app/router/protected-route'
import { routes } from '@/app/router/routes'
import { LoadingState } from '@/shared/components/feedback/loading-state'
import { ErrorPage } from '@/shared/components/feedback/error-page'

const AcademiesPage = lazy(
  () => import('@/features/academies/pages/academies-page'),
)
const LoginPage = lazy(() => import('@/features/auth/pages/login-page'))
const ManagementPreviewPage = lazy(
  () => import('@/features/management/pages/management-preview-page'),
)
const ClassesManagementPage = lazy(
  () => import('@/features/classes/pages/classes-management-page'),
)
const EvaluationsQueuePage = lazy(
  () => import('@/features/evaluations/pages/evaluations-queue-page'),
)
const AccessDeniedPage = lazy(
  () => import('@/features/management/pages/access-denied-page'),
)
const SessionExpiredPage = lazy(
  () => import('@/features/auth/pages/session-expired-page'),
)
const ContextSelectionPage = lazy(
  () => import('@/features/management/pages/context-selection-page'),
)
const NotFoundPage = lazy(
  () => import('@/shared/components/feedback/not-found-page'),
)

const loading = <LoadingState label="Loading page" />
const wrap = (page: ReactNode) => <Suspense fallback={loading}>{page}</Suspense>

export const router = createBrowserRouter([
  {
    path: routes.home,
    element: <AuthLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Navigate to={routes.login} replace /> },
      { path: 'login', element: wrap(<LoginPage />) },
      { path: 'access-denied', element: wrap(<AccessDeniedPage />) },
      { path: 'session-expired', element: wrap(<SessionExpiredPage />) },
      { path: 'management', element: wrap(<ContextSelectionPage />) },
      { path: 'preview/academies', element: wrap(<AcademiesPage demo />) },
      { path: 'preview/management', element: wrap(<ManagementPreviewPage />) },
      { path: 'preview/management/classes', element: wrap(<ClassesManagementPage />) },
      { path: 'preview/management/evaluations', element: wrap(<EvaluationsQueuePage />) },
    ],
  },
  {
    element: <DashboardLayout />,
    errorElement: <ErrorPage />,
    children: [
      { path: 'dashboard', element: <ProtectedRoute /> },
      { path: 'academies', element: <ProtectedRoute /> },
    ],
  },
  { path: '/home', element: <Navigate to={routes.home} replace /> },
  { path: '*', element: wrap(<NotFoundPage />) },
])
