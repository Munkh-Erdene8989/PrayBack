import { UserRole } from '@/types'

export function checkRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole)
}

export function isSuperAdmin(userRole: UserRole): boolean {
  return userRole === 'superadmin'
}

export function isTenantAdmin(userRole: UserRole): boolean {
  return userRole === 'tenant_admin'
}

export function isCustomer(userRole: UserRole): boolean {
  return userRole === 'customer'
}

export function canAccessTenantData(userRole: UserRole, requestedTenantId: string, userTenantId?: string): boolean {
  if (userRole === 'superadmin') return true
  if (userRole === 'tenant_admin' && userTenantId === requestedTenantId) return true
  return false
}
