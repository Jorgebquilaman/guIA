export const isStaffRole = (role?: string | null): boolean =>
  role === 'Admin' || role === 'Curator'

export const isAdminRole = (role?: string | null): boolean =>
  role === 'Admin'
