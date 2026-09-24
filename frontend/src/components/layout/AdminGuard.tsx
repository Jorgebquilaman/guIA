import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { isAdminRole, isStaffRole } from '../../utils/roles'

interface AdminGuardProps {
  children: ReactNode
  /** Si es true, solo Admin (para Config. IA/Sitio/SMTP y Tipos de documento). Por defecto admite Admin + Curator. */
  adminOnly?: boolean
}

export default function AdminGuard({ children, adminOnly = false }: AdminGuardProps) {
  const user = useAuthStore((s) => s.user)
  const allowed = adminOnly ? isAdminRole(user?.role) : isStaffRole(user?.role)

  if (!allowed) {
    return <Navigate to="/app" replace />
  }

  return <>{children}</>
}
