import type { Role } from "@/lib/auth-context"

export const roleHierarchy: Record<Role, number> = {
  PUBLIC: 0,
  VERIFIED: 1,
  MANAGER: 2,
  ADMIN: 3,
}

export function hasRole(userRole: Role, requiredRole: Role): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

export function hasAnyRole(userRole: Role, requiredRoles: Role[]): boolean {
  return requiredRoles.some((role) => hasRole(userRole, role))
}

export const permissions = {
  viewProducts: ["PUBLIC", "VERIFIED", "MANAGER", "ADMIN"],
  viewPricing: ["VERIFIED", "MANAGER", "ADMIN"],
  submitOrder: ["VERIFIED", "MANAGER", "ADMIN"],
  viewOwnOrders: ["VERIFIED", "MANAGER", "ADMIN"],
  manageOrders: ["MANAGER", "ADMIN"],
  manageProducts: ["MANAGER", "ADMIN"],
  manageUsers: ["ADMIN"],
  manageInvoices: ["MANAGER", "ADMIN"],
  viewReports: ["MANAGER", "ADMIN"],
  systemSettings: ["ADMIN"],
}
