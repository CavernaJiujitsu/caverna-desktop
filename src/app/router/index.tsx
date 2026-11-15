/* eslint-disable react-refresh/only-export-components -- lazy route modules are not component exports */
import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthLayout } from '@/app/layouts/auth-layout'
import { ProtectedRoute } from '@/app/router/protected-route'
import { routes } from '@/app/router/routes'
import { LoadingState } from '@/shared/components/feedback/loading-state'
import { ErrorPage } from '@/shared/components/feedback/error-page'

const AcademiesPage = lazy(
  () => import('@/features/academies/pages/academies-page'),
)
const UnitsPage = lazy(() => import('@/features/academies/pages/units-page'))
const LoginPage = lazy(() => import('@/features/auth/pages/login-page'))
const PasswordRecoveryRequestPage = lazy(
  () => import('@/features/auth/pages/password-recovery-request-page'),
)
const PasswordResetPage = lazy(
  () => import('@/features/auth/pages/password-reset-page'),
)
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
const SchedulesPage = lazy(
  () => import('@/features/schedules/pages/schedules-page'),
)
const MembershipsPage = lazy(
  () => import('@/features/memberships/pages/memberships-page'),
)
const TeachersPage = lazy(
  () => import('@/features/teachers/pages/teachers-page'),
)
const TeacherDetailPage = lazy(
  () => import('@/features/teachers/pages/teacher-detail-page'),
)
const PlatformCavesPage = lazy(
  () => import('@/features/platform/pages/platform-caves-page'),
)
const PlatformCaveCreatePage = lazy(
  () => import('@/features/platform/pages/platform-cave-create-page'),
)
const CaveAdministratorsPage = lazy(
  () => import('@/features/platform/pages/cave-administrators-page'),
)
const PlatformCaveDetailPage = lazy(
  () => import('@/features/platform/pages/platform-cave-detail-page'),
)
const PlatformUsersPage = lazy(
  () => import('@/features/platform/pages/platform-users-page'),
)
const WorkoutsPage = lazy(
  () => import('@/features/workouts/pages/workouts-page'),
)
const NotFoundPage = lazy(
  () => import('@/shared/components/feedback/not-found-page'),
)

const loading = <LoadingState label="Carregando página" />
const wrap = (page: ReactNode) => <Suspense fallback={loading}>{page}</Suspense>

const trainingRoles = ['academy', 'teacher'] as const
const platformRoles = ['platform'] as const
const academyManagementRoles = ['platform', 'academy'] as const
const allManagementRoles = ['platform', 'academy', 'teacher'] as const

const developmentRoutes = import.meta.env.DEV
  ? [
      { path: 'preview/academies', element: wrap(<AcademiesPage />) },
      { path: 'preview/management', element: wrap(<ManagementPreviewPage />) },
      {
        path: 'preview/management/classes',
        element: wrap(<ClassesManagementPage />),
      },
      {
        path: 'preview/management/evaluations',
        element: wrap(<EvaluationsQueuePage />),
      },
    ]
  : []

export const router = createBrowserRouter([
  {
    path: routes.home,
    element: <AuthLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Navigate to={routes.login} replace /> },
      { path: 'login', element: wrap(<LoginPage />) },
      {
        path: 'password-recovery',
        element: wrap(<PasswordRecoveryRequestPage />),
      },
      {
        path: 'password-recovery/reset',
        element: wrap(<PasswordResetPage />),
      },
      { path: 'management', element: wrap(<ContextSelectionPage />) },
      { path: 'access-denied', element: wrap(<AccessDeniedPage />) },
      { path: 'session-expired', element: wrap(<SessionExpiredPage />) },
      ...developmentRoutes,
    ],
  },
  {
    path: routes.schedules,
    element: (
      <ProtectedRoute allowedContextRoles={[...trainingRoles]}>
        {wrap(<SchedulesPage />)}
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: routes.memberships,
    element: (
      <ProtectedRoute allowedContextRoles={[...academyManagementRoles]}>
        {wrap(<MembershipsPage />)}
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: routes.evaluations,
    element: (
      <ProtectedRoute allowedContextRoles={['academy', 'teacher']}>
        {wrap(<EvaluationsQueuePage />)}
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: routes.teachers,
    element: (
      <ProtectedRoute allowedContextRoles={[...academyManagementRoles]}>
        {wrap(<TeachersPage />)}
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: `${routes.teachers}/:teacherId`,
    element: (
      <ProtectedRoute allowedContextRoles={[...academyManagementRoles]}>
        {wrap(<TeacherDetailPage />)}
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: routes.platformCaves,
    element: (
      <ProtectedRoute allowedContextRoles={[...platformRoles]}>
        {wrap(<PlatformCavesPage />)}
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: routes.platformCavesCreate,
    element: (
      <ProtectedRoute allowedContextRoles={[...platformRoles]}>
        {wrap(<PlatformCaveCreatePage />)}
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: routes.caveAdministrators,
    element: (
      <ProtectedRoute allowedContextRoles={[...academyManagementRoles]}>
        {wrap(<CaveAdministratorsPage />)}
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: `${routes.platformCaves}/:caveId`,
    element: (
      <ProtectedRoute allowedContextRoles={[...platformRoles]}>
        {wrap(<PlatformCaveDetailPage />)}
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: routes.platformUsers,
    element: (
      <ProtectedRoute allowedContextRoles={[...platformRoles]}>
        {wrap(<PlatformUsersPage />)}
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: routes.workouts,
    element: (
      <ProtectedRoute allowedContextRoles={[...allManagementRoles]}>
        {wrap(<WorkoutsPage />)}
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: routes.academies,
    element: (
      <ProtectedRoute allowedContextRoles={['platform']}>
        {wrap(<AcademiesPage />)}
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: routes.units,
    element: (
      <ProtectedRoute allowedContextRoles={[...academyManagementRoles]}>
        {wrap(<UnitsPage />)}
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: routes.classes,
    element: <ProtectedRoute>{wrap(<ClassesManagementPage />)}</ProtectedRoute>,
    errorElement: <ErrorPage />,
  },
  { path: '/dashboard', element: <Navigate to={routes.management} replace /> },
  { path: '/home', element: <Navigate to={routes.home} replace /> },
  { path: '*', element: wrap(<NotFoundPage />) },
])
