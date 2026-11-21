/* eslint-disable react-refresh/only-export-components -- lazy route modules are not component exports */
import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthLayout } from '@/app/layouts/auth-layout'
import { ProtectedRoute } from '@/app/router/protected-route'
import { routeContextRoles, routes } from '@/app/router/routes'
import { LoadingState } from '@/shared/components/feedback/loading-state'
import { ErrorPage } from '@/shared/components/feedback/error-page'

const UnitsPage = lazy(() => import('@/features/academies/pages/units-page'))
const LoginPage = lazy(() => import('@/features/auth/pages/login-page'))
const PasswordRecoveryRequestPage = lazy(
  () => import('@/features/auth/pages/password-recovery-request-page'),
)
const PasswordResetPage = lazy(
  () => import('@/features/auth/pages/password-reset-page'),
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
const PractitionerCreatePage = lazy(
  () => import('@/features/practitioners/pages/practitioner-create-page'),
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
const CatalogPage = lazy(() => import('@/features/belts/pages/catalog-page'))
const TrainingsPage = lazy(
  () => import('@/features/trainings/pages/trainings-page'),
)
const NotFoundPage = lazy(
  () => import('@/shared/components/feedback/not-found-page'),
)

const loading = <LoadingState label="Carregando página" />
const wrap = (page: ReactNode) => <Suspense fallback={loading}>{page}</Suspense>

export const router = createBrowserRouter([
  {
    path: routes.graduationCatalog,
    element: (
      <ProtectedRoute allowedContextRoles={[...routeContextRoles.graduationCatalog]}>
        {wrap(<CatalogPage />)}
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
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
    ],
  },
  {
    path: routes.schedules,
    element: (
      <ProtectedRoute allowedContextRoles={[...routeContextRoles.schedules]}>
        {wrap(<SchedulesPage />)}
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: routes.memberships,
    element: (
      <ProtectedRoute allowedContextRoles={[...routeContextRoles.memberships]}>
        {wrap(<MembershipsPage />)}
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: routes.practitionersCreate,
    element: (
      <ProtectedRoute
        allowedContextRoles={[...routeContextRoles.practitionersCreate]}
      >
        {wrap(<PractitionerCreatePage />)}
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: routes.evaluations,
    element: (
      <ProtectedRoute allowedContextRoles={[...routeContextRoles.evaluations]}>
        {wrap(<EvaluationsQueuePage />)}
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: routes.teachers,
    element: (
      <ProtectedRoute allowedContextRoles={[...routeContextRoles.teachers]}>
        {wrap(<TeachersPage />)}
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: `${routes.teachers}/:teacherId`,
    element: (
      <ProtectedRoute allowedContextRoles={[...routeContextRoles.teachers]}>
        {wrap(<TeacherDetailPage />)}
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: routes.platformCaves,
    element: (
      <ProtectedRoute
        allowedContextRoles={[...routeContextRoles.platformCaves]}
      >
        {wrap(<PlatformCavesPage />)}
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: routes.platformCavesCreate,
    element: (
      <ProtectedRoute
        allowedContextRoles={[...routeContextRoles.platformCavesCreate]}
      >
        {wrap(<PlatformCaveCreatePage />)}
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: routes.caveAdministrators,
    element: (
      <ProtectedRoute
        allowedContextRoles={[...routeContextRoles.caveAdministrators]}
      >
        {wrap(<CaveAdministratorsPage />)}
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: `${routes.platformCaves}/:caveId`,
    element: (
      <ProtectedRoute
        allowedContextRoles={[...routeContextRoles.platformCaves]}
      >
        {wrap(<PlatformCaveDetailPage />)}
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: routes.platformUsers,
    element: (
      <ProtectedRoute
        allowedContextRoles={[...routeContextRoles.platformUsers]}
      >
        {wrap(<PlatformUsersPage />)}
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: routes.trainings,
    element: (
      <ProtectedRoute allowedContextRoles={[...routeContextRoles.trainings]}>
        {wrap(<TrainingsPage />)}
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: routes.units,
    element: (
      <ProtectedRoute allowedContextRoles={[...routeContextRoles.units]}>
        {wrap(<UnitsPage />)}
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: routes.classes,
    element: (
      <ProtectedRoute allowedContextRoles={[...routeContextRoles.classes]}>
        {wrap(<ClassesManagementPage />)}
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  { path: '/dashboard', element: <Navigate to={routes.management} replace /> },
  { path: '/home', element: <Navigate to={routes.home} replace /> },
  {
    path: '/teacher/dashboard',
    element: <Navigate to={routes.classes} replace />,
  },
  { path: '*', element: wrap(<NotFoundPage />) },
])
