"use client"

import { useEffect, useState } from "react"
import { Select } from "@/components/ui/select"

interface OrderItem {
  id: string
  productId: string
  quantity: number
  unitPrice: number
  totalPrice: number
  notes?: string
  product?: {
    id: string
    name: string
    category?: string
  }
}

interface Order {
  id: string
  status: string
  totalPrice: number
  totalAmount?: number
  createdAt: string
  notes?: string
  user: {
    id: string
    email: string
    name: string
    company: string
  }
  items: OrderItem[]
}

export default function ManagerOrdersTab() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("ALL")

  useEffect(() => {
    fetchOrders()
  }, [statusFilter])

  const fetchOrders = async () => {
    try {
      const url = new URL("/api/order-requests", window.location.origin)
      if (statusFilter !== "ALL") {
        url.searchParams.set("status", statusFilter)
      }

      const response = await fetch(url.toString())
      const data = await response.json()
      setOrders(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Failed to fetch orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/order-requests/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        await fetchOrders()
      }
    } catch (error) {
      console.error("Failed to update order:", error)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading orders...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 mb-6">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <option value="ALL">All Orders</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="FULFILLED">Fulfilled</option>
        </Select>
      </div>

      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => {
            const firstItem = order.items[0]
            const remainingCount = Math.max(0, order.items.length - 1)
            const total = order.totalAmount ?? order.totalPrice

            return (
              <div key={order.id} className="bg-card border border-border p-6 rounded-lg">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground text-lg">
                      {firstItem?.product?.name
                        ? remainingCount > 0
                          ? `${firstItem.product.name} + ${remainingCount} more`
                          : firstItem.product.name
                        : "Order"}
                    </h3>
                    <p className="text-sm text-muted-foreground">{order.user.company || order.user.email}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-xl font-bold text-accent">${total.toFixed(2)}</p>
                    </div>

                    <Select value={order.status} onValueChange={(value) => handleStatusChange(order.id, value)}>
                      <option value="PENDING">Pending</option>
                      <option value="APPROVED">Approved</option>
                      <option value="REJECTED">Rejected</option>
                      <option value="FULFILLED">Fulfilled</option>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground border-t border-border pt-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span>
                        {item.product?.name || "Product"} x {item.quantity}
                      </span>
                      <span className="font-medium text-foreground">${item.totalPrice.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground mt-4">
                  Ordered on {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No orders found</p>
        </div>
      )}
    </div>
  )
}
