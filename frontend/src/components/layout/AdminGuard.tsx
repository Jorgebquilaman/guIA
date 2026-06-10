import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

interface AdminGuardProps {
  children: ReactNode
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const user = useAuthStore((s) => s.user)

  if (user?.role !== 'Admin') {
    return <Navigate to="/app" replace />
  }

  return <>{children}</>
}
