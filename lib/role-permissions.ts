export type Role = "PUBLIC" | "VERIFIED" | "MANAGER" | "ADMIN"
export type Tier = "GOLD" | "PLATINUM" | "DIAMOND"

export const roleHierarchy: Record<Role, number> = {
  PUBLIC: 0,
  VERIFIED: 1,
  MANAGER: 2,
  ADMIN: 3,
}

export function hasRole(userRole: Role, requiredRole: Role): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

export function hasPermission(userRole: Role, action: string): boolean {
  const permissions: Record<Role, string[]> = {
    PUBLIC: ["view_products", "view_categories"],
    VERIFIED: ["view_products", "view_categories", "create_order", "view_own_orders", "upload_documents"],
    MANAGER: [
      "view_products",
      "view_categories",
      "create_order",
      "view_own_orders",
      "upload_documents",
      "view_all_orders",
      "update_order_status",
      "view_customers",
      "manage_customers",
      "view_reports",
    ],
    ADMIN: ["*"], // Admin has all permissions
  }

  if (permissions[userRole]?.includes("*")) return true
  return permissions[userRole]?.includes(action) || false
}
