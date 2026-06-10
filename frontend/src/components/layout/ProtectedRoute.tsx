import type { ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

interface ProtectedRouteProps {
  requireAdmin?: boolean
  children?: ReactNode
}

function ProtectedRoute({ requireAdmin = false, children }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requireAdmin && user?.role !== 'Admin') {
    return <Navigate to="/" replace />
  }

  return children ? <>{children}</> : <Outlet />
}

export default ProtectedRoute
