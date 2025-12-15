"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, ShoppingCart, DollarSign, Clock, Package, ArrowLeft } from 'lucide-react'
import DataTable from "@/components/admin/data-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
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
    } catch (error) {
      console.error("Error updating order:", error)
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleViewOrder = (orderId: string) => {
    router.push(`/admin-dashboard/orders/${orderId}`)
  }

  const filteredOrders = orders.filter((o) => {
    const term = searchTerm.toLowerCase()
    const matchesCustomer =
      o.user?.email?.toLowerCase().includes(term) ||
      o.user?.name?.toLowerCase().includes(term) ||
      o.user?.company?.toLowerCase().includes(term)
    const matchesItem = Array.isArray(o.items)
      ? o.items.some((item: any) => 
          item.product?.name?.toLowerCase().includes(term) ||
          item.strain?.toLowerCase().includes(term)
        )
      : false
    return matchesCustomer || matchesItem
  })

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "PENDING").length,
    totalRevenue: orders.filter((o) => (o.status === "PAID" || o.status === "FULFILLED")).reduce((sum, o) => sum + (o.totalAmount ?? o.totalPrice ?? 0), 0),
    totalItems: orders.reduce((sum, order) => sum + (order.items?.reduce((itemSum: number, item: any) => itemSum + (item.quantity || 0), 0) || 0), 0),
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
          <p className="text-xs text-muted-foreground">{value?.name || "Unknown"}</p>
          <p className="text-xs text-muted-foreground capitalize">{value?.tier?.toLowerCase() || "unknown"} tier</p>
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
        const productName = first.product?.name || "Product"
        const strain = first.strain || first.product?.subcategory || ""
        
        return (
          <div>
            <p className="text-sm font-medium">{productName}</p>
            <div className="flex items-center gap-1 mt-1">
              {strain && (
                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-700">
                  {strain}
                </Badge>
              )}
              {remaining > 0 && (
                <Badge variant="secondary" className="text-xs">
                  +{remaining} more
                </Badge>
              )}
            </div>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <Package className="w-4 h-4 text-blue-400" />
                Total Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-400">{stats.totalItems}</div>
              <p className="text-xs text-muted-foreground mt-1">Units ordered</p>
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
              <p className="text-xs text-muted-foreground mt-1">Paid & fulfilled</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Table */}
      <DataTable
        title="All Orders"
        description={`Total: ${filteredOrders.length} orders, ${stats.totalItems} items`}
        columns={columns}
        data={filteredOrders}
        searchPlaceholder="Search by customer, product, or strain..."
        onSearch={setSearchTerm}
        actions={(row) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewOrder(row.id)}
            className="text-accent hover:bg-accent/10"
          >
            <Eye className="w-4 h-4" />
          </Button>
        )}
      />
    </div>
  )
}