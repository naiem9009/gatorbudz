"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, ShoppingCart, DollarSign, Package, Calendar, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.orderId as string

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/orders/${orderId}`)
      if (!response.ok) throw new Error("Failed to fetch order")
      const data = await response.json()
      setOrder(data.order)
    } catch (error) {
      console.error("Error fetching order:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setUpdatingStatus(true)
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error("Failed to update order")

      await fetchOrder()
    } catch (error) {
      console.error("Error updating order:", error)
    } finally {
      setUpdatingStatus(false)
    }
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

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-foreground mb-2">Order Not Found</h2>
          <p className="text-muted-foreground mb-4">The order you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/admin-dashboard/orders")}>
            Go Back to Orders
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push("/admin-dashboard/orders")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>
        
        <div className="flex items-center gap-4">
          <Badge variant="outline" className={getStatusColor(order.status) + " text-sm px-3 py-1"}>
            {order.status}
          </Badge>
          <p className="text-sm text-muted-foreground">
            Order #{order.orderId || order.id.slice(0, 8)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Order Items ({order.items?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items?.map((item: any, idx: number) => (
                  <div key={item.id || idx} className="p-4 bg-primary/20 rounded-lg border border-border/30">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-1">
                          {item.product?.name || "Product"}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                          {item.strain && (
                            <Badge variant="outline" className="bg-green-500/10 text-green-700">
                              {item.strain}
                            </Badge>
                          )}
                          <Badge variant="secondary">
                            {item.quantity} unit{item.quantity > 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          {item.product?.weight && (
                            <span className="flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              {item.product.weight}
                            </span>
                          )}
                          {item.product?.potency && (
                            <span className="flex items-center gap-1">
                              ⚡ {item.product.potency}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-accent">
                          ${Number(item.totalPrice || 0).toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ${Number(item.unitPrice || 0).toFixed(2)} each
                        </p>
                      </div>
                    </div>
                    {item.notes && (
                      <div className="mt-3 p-3 bg-primary/30 rounded text-sm">
                        <p className="font-medium text-muted-foreground mb-1">Notes:</p>
                        <p className="text-foreground">{item.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Order Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-primary/20 rounded-lg">
                  <p className="text-foreground whitespace-pre-wrap">{order.notes}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">
                    ${Number(order.totalAmount ?? order.totalPrice ?? 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold text-accent">
                    ${Number(order.totalAmount ?? order.totalPrice ?? 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                <p className="font-semibold text-foreground">{order.user?.email}</p>
              </div>
              {order.user?.name && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Name</p>
                  <p className="font-semibold text-foreground">{order.user.name}</p>
                </div>
              )}
              {order.user?.company && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Company</p>
                  <p className="font-semibold text-foreground">{order.user.company}</p>
                </div>
              )}
              {order.user?.tier && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tier</p>
                  <Badge variant="outline" className="capitalize">
                    {order.user.tier.toLowerCase()}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Update */}
          <Card>
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={order.status}
                onValueChange={handleStatusUpdate}
                disabled={updatingStatus}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved & Send Invoice</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="FULFILLED">Fulfilled</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                Updating status will notify the customer if applicable.
              </p>
            </CardContent>
          </Card>

          {/* Order Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Order Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm font-medium">
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Updated</span>
                <span className="text-sm font-medium">
                  {new Date(order.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground">
                  Last updated: {new Date(order.updatedAt).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}