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
      { index: true, element: wrap(<AcademiesPage demo />) },
      { path: 'login', element: wrap(<LoginPage />) },
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
