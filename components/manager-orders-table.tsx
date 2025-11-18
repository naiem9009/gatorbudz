"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface OrderItem {
  id: string
  productId: string
  quantity: number
  unitPrice: number
  totalPrice: number
  product?: { name: string; category: string }
}

interface Order {
  id: string
  user: { email: string; name: string | null; company: string | null }
  items: OrderItem[]
  totalPrice: number
  totalAmount?: number
  status: string
  createdAt: string
  notes?: string
}

export default function ManagerOrdersTable() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [statusFilter])

  async function fetchOrders() {
    setLoading(true)
    try {
      const params = statusFilter !== "all" ? `?status=${statusFilter}` : ""
      const res = await fetch(`/api/orders/list${params}`)
      const json = await res.json()
      setOrders(json.data || [])
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    setUpdatingId(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}/update-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        fetchOrders()
      }
    } catch (error) {
      console.error("Error updating order:", error)
    } finally {
      setUpdatingId(null)
    }
  }

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-500/10 text-yellow-700",
    APPROVED: "bg-blue-500/10 text-blue-700",
    REJECTED: "bg-red-500/10 text-red-700",
    FULFILLED: "bg-green-500/10 text-green-700",
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Orders</CardTitle>
        <CardDescription>Manage and process customer orders</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Filter */}
        <div className="w-full md:w-48">
          <label className="text-sm font-medium text-foreground mb-2 block">Filter by Status</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="FULFILLED">Fulfilled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => {
                  const firstItem = order.items[0]
                  const remainingCount = Math.max(0, order.items.length - 1)
                  const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0)
                  const total = order.totalAmount ?? order.totalPrice

                  return (
                    <TableRow key={order.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">{order.id.slice(0, 8)}...</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{order.user.name || order.user.email}</p>
                          <p className="text-xs text-muted-foreground">{order.user.company}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">
                            {firstItem?.product?.name
                              ? remainingCount > 0
                                ? `${firstItem.product.name} + ${remainingCount} more`
                                : firstItem.product.name
                              : "-"}
                          </p>
                          {firstItem?.product?.category && (
                            <p className="text-xs text-muted-foreground">{firstItem.product.category}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{totalQty}</TableCell>
                      <TableCell className="text-right font-semibold">${total.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[order.status] || ""}>{order.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Select
                          value={order.status}
                          onValueChange={(status) => updateOrderStatus(order.id, status)}
                          disabled={updatingId === order.id}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="APPROVED">Approve</SelectItem>
                            <SelectItem value="REJECTED">Reject</SelectItem>
                            <SelectItem value="FULFILLED">Fulfill</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
