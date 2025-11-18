"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, ShoppingCart, DollarSign, Clock } from 'lucide-react'
import DataTable from "@/components/admin/data-table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/orders")
      if (!response.ok) throw new Error("Failed to fetch orders")
      const data = await response.json()
      setOrders(data.orders)
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingStatus(orderId)
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error("Failed to update order")

      await fetchOrders()
      setSelectedOrder(null)
    } catch (error) {
      console.error("Error updating order:", error)
    } finally {
      setUpdatingStatus(null)
    }
  }

  const filteredOrders = orders.filter((o) => {
    const term = searchTerm.toLowerCase()
    const matchesCustomer =
      o.user?.email?.toLowerCase().includes(term) ||
      o.user?.name?.toLowerCase().includes(term) ||
      o.user?.company?.toLowerCase().includes(term)
    const matchesItem = Array.isArray(o.items)
      ? o.items.some((item: any) => item.product?.name?.toLowerCase().includes(term))
      : false
    return matchesCustomer || matchesItem
  })

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "PENDING").length,
    totalRevenue: orders.filter((o) => (o.status === "PAID" && o.status === "FULFILLED")).reduce((sum, o) => sum + (o.totalAmount ?? o.totalPrice ?? 0), 0),
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      APPROVED: "bg-accent/20 text-accent border-accent/30",
      REJECTED: "bg-red-500/20 text-red-400 border-red-500/30",
      FULFILLED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      PAID: "bg-green-500/20 text-green-400 border-green-500/30",
    }
    return colors[status] || colors.PENDING
  }

  const columns = [
    {
      key: "user",
      label: "Customer",
      render: (value: any, row: any) => (
        <div>
          <p className="font-semibold text-foreground">{value?.email || "Unknown"}</p>
          <p className="text-xs text-muted-foreground">{value?.company || "No company"}</p>
        </div>
      ),
    },
    {
      key: "items",
      label: "Items",
      render: (_: any, row: any) => {
        const first = row.items?.[0]
        if (!first) return "-"
        const remaining = Math.max(0, (row.items?.length || 0) - 1)
        const name = first.product?.name + ` - ${first.product.subcategory}` || "Product"
        return (
          <div>
            <p className="text-sm font-medium">{name}</p>
            {remaining > 0 && <p className="text-xs text-muted-foreground">+{remaining} more items</p>}
          </div>
        )
      },
    },
    {
      key: "itemCount",
      label: "Qty",
      render: (_: any, row: any) =>
        Array.isArray(row.items) ? row.items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) : 0,
    },
    {
      key: "totalPrice",
      label: "Amount",
      render: (_: any, row: any) => {
        const total = row.totalAmount ?? row.totalPrice ?? 0
        return <span className="font-semibold text-accent">${Number(total).toFixed(2)}</span>
      },
    },
    {
      key: "status",
      label: "Status",
      render: (value: any) => (
        <Badge variant="outline" className={getStatusColor(value)}>
          {value}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <ShoppingCart className="w-8 h-8 text-accent" />
            Orders
          </h1>
          <p className="text-muted-foreground mt-2">Manage customer orders and fulfillment</p>
        </div>

        {/* Order Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <ShoppingCart className="w-4 h-4" />
                Total Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">All orders</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Clock className="w-4 h-4 text-yellow-400" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-400">{stats.pending}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-green-400" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">${stats.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Table */}
      <DataTable
        title="All Orders"
        description={`Total: ${filteredOrders.length} orders`}
        columns={columns}
        data={filteredOrders}
        searchPlaceholder="Search by customer or product..."
        onSearch={setSearchTerm}
        actions={(row) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedOrder(row)}
            className="text-accent hover:bg-accent/10"
          >
            <Eye className="w-4 h-4" />
          </Button>
        )}
      />

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="bg-card border-border/50 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-accent">Order Details</DialogTitle>
            <DialogDescription>View and update order information</DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer & Order Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-primary/30 rounded-lg border border-border/30">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Customer</p>
                  <p className="text-foreground font-semibold">{selectedOrder.user?.email}</p>
                  {selectedOrder.user?.company && (
                    <p className="text-sm text-muted-foreground">{selectedOrder.user.company}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total</p>
                  <p className="text-2xl font-bold text-accent">
                    ${Number((selectedOrder.totalAmount ?? selectedOrder.totalPrice) || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3 font-semibold">Items</p>
                <div className="space-y-2 p-3 bg-primary/20 rounded-lg border border-border/30">
                  {selectedOrder.items?.map((item: any, idx: number) => (
                    <div key={item.id || idx} className="flex justify-between items-center text-sm pb-2 border-b border-border/20 last:border-b-0">
                      <span className="text-foreground">{item.product?.name + ` - ${item.product.subcategory}` || "Product"}</span>
                      <div className="flex gap-4 items-center">
                        <span className="text-muted-foreground">Qty: {item.quantity}</span>
                        <span className="font-semibold text-accent">${Number(item.totalPrice || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Update */}
              <div className="space-y-3 p-4 bg-primary/30 rounded-lg border border-border/30">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Update Status</p>
                <Select
                  value={selectedOrder.status}
                  onValueChange={(newStatus) => handleStatusUpdate(selectedOrder.id, newStatus)}
                  disabled={updatingStatus === selectedOrder.id}
                >
                  <SelectTrigger className="bg-primary/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="FULFILLED">Fulfilled</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Order Metadata */}
              {selectedOrder.notes && (
                <div className="p-3 bg-primary/20 rounded-lg border border-border/30">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2 font-semibold">Notes</p>
                  <p className="text-foreground text-sm">{selectedOrder.notes}</p>
                </div>
              )}

              <div className="text-xs text-muted-foreground space-y-1 p-3 bg-primary/20 rounded-lg">
                <p>Created: {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                <p>Updated: {new Date(selectedOrder.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
