import type { OrderStatus } from "@prisma/client"

export const orderStatusColors: Record<OrderStatus, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-600",
  APPROVED: "bg-blue-500/20 text-blue-600",
  REJECTED: "bg-red-500/20 text-red-600",
  FULFILLED: "bg-green-500/20 text-green-600",
}

export const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  FULFILLED: "Fulfilled",
}

export function canTransitionStatus(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ["APPROVED", "REJECTED"],
    APPROVED: ["FULFILLED", "REJECTED"],
    REJECTED: [],
    FULFILLED: [],
  }

  return validTransitions[currentStatus].includes(newStatus)
}
