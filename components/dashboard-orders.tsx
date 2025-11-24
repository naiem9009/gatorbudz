"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { FileText, CreditCard, Banknote, ExternalLink, Package } from "lucide-react"

interface OrderItem {
  id: string
  productId: string
  variantId?: string
  strain?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  notes?: string
  product?: {
    id: string
    name: string
    category: string
    weight?: string
    potency?: string
    slug: string
  }
}

interface Invoice {
  id: string
  invoiceNumber: string
  status: string
  total: number
  dueDate: string
  paymentMethod?: string
}

interface Order {
  id: string
  status: string
  totalPrice: number
  totalAmount?: number
  notes?: string
  createdAt: string
  items: OrderItem[]
  invoice?: Invoice
  orderId: string
}

export default function DashboardOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  async function fetchOrders() {
    try {
      const response = await fetch("/api/orders/list")
      const json = await response.json()
      setOrders(json.data || [])
    } catch (error) {
      console.error("Failed to fetch orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
    APPROVED: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    PAID: "bg-green-500/10 text-green-700 border-green-500/20",
    REJECTED: "bg-red-500/10 text-red-700 border-red-500/20",
    FULFILLED: "bg-purple-500/10 text-purple-700 border-purple-500/20",
  }

  const invoiceStatusColors: Record<string, string> = {
    PENDING: "bg-orange-500/10 text-orange-700 border-orange-500/20",
    PAID: "bg-green-500/10 text-green-700 border-green-500/20",
    OVERDUE: "bg-red-500/10 text-red-700 border-red-500/20",
    CANCELLED: "bg-gray-500/10 text-gray-700 border-gray-500/20",
  }

  // Helper function to format order title
  const getOrderTitle = (order: Order) => {
    const firstItem = order.items[0]
    if (!firstItem) return "Order"
    
    const remainingCount = Math.max(0, order.items.length - 1)
    const baseName = firstItem.product?.name || "Product"
    const strain = firstItem.strain ? ` - ${firstItem.strain}` : ""
    
    if (remainingCount > 0) {
      return `${baseName}${strain} + ${remainingCount} more`
    }
    
    return `${baseName}${strain}`
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-card border border-border p-6 rounded-lg h-32" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Your Orders</h2>
          <p className="text-muted-foreground mt-1">Manage and track your orders</p>
        </div>
        <Link href="/products">
          <Button className="bg-accent text-accent-foreground hover:text-white cursor-pointer">
            New Order
          </Button>
        </Link>
      </div>

      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => {
            const total = order.totalAmount ?? order.totalPrice
            const hasInvoice = order.status === "APPROVED" && order.invoice

            return (
              <div
                key={order.id}
                className="bg-card border border-border p-6 rounded-lg hover:border-accent/50 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3 flex-wrap">
                      <h3 className="font-bold text-foreground text-lg">
                        {getOrderTitle(order)}
                      </h3>
                      <Badge variant="outline" className={statusColors[order.status]}>
                        {order.status}
                      </Badge>
                      {hasInvoice && (
                        <Badge variant="outline" className={invoiceStatusColors[order.invoice!.status]}>
                          <FileText className="w-3 h-3 mr-1" />
                          Invoice: {order.invoice!.status}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span>Order #: {order.orderId}</span>
                      <span>•</span>
                      <span>Placed: {new Date(order.createdAt).toLocaleDateString()}</span>
                      {hasInvoice && (
                        <>
                          <span>•</span>
                          <span>Due: {new Date(order.invoice!.dueDate).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col gap-3 sm:items-center lg:items-end">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {order.items.length} {order.items.length === 1 ? "item" : "items"}
                      </p>
                      <p className="text-xl font-bold text-accent">${total.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Invoice Details */}
                {hasInvoice && (
                  <div className="mt-4 p-4 bg-muted/30 rounded-lg border">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Invoice #{order.invoice!.invoiceNumber}
                      </h4>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/invoices/${order.invoice!.invoiceNumber}`}>
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View Details
                          </Link>
                        </Button>
                        {order.invoice!.status === "PENDING" && (
                          <Button size="sm" asChild className="bg-green-600 hover:bg-green-700 text-white">
                            <Link href={`dashboard/invoices-payment?id=${order.invoice!.id}`}>
                              <CreditCard className="w-4 h-4 mr-1" />
                              Pay Invoice
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant="outline" className={`ml-2 ${invoiceStatusColors[order.invoice!.status]}`}>
                          {order.invoice!.status}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Amount:</span>
                        <span className="ml-2 font-semibold">${order.invoice!.total.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Due Date:</span>
                        <span className="ml-2">{new Date(order.invoice!.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Payment Method if already paid */}
                    {order.invoice!.status === "PAID" && order.invoice!.paymentMethod && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-sm font-medium text-foreground">
                          Paid with: {order.invoice!.paymentMethod}
                        </p>
                      </div>
                    )}

                    {/* Payment Methods Info for pending invoices */}
                    {order.invoice!.status === "PENDING" && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-sm font-medium text-foreground mb-2">Available Payment Methods:</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="bg-purple-500/10 text-purple-700">
                            <CreditCard className="w-3 h-3 mr-1" />
                            ACH Bank Transfer
                          </Badge>
                          <Badge variant="secondary" className="bg-green-500/10 text-green-700">
                            <Banknote className="w-3 h-3 mr-1" />
                            Manual Bank Transfer
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Order Items with Strain Information */}
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-foreground">
                            {item.product?.name || "Product"}
                          </span>
                          {item.strain && (
                            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-700">
                              {item.strain}
                            </Badge>
                          )}
                          <span className="text-muted-foreground text-sm">x {item.quantity}</span>
                        </div>
                        {/* Product details */}
                        {(item.product?.weight || item.product?.potency) && (
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            {item.product?.weight && <span>📦 {item.product.weight}</span>}
                            {item.product?.potency && <span>⚡ {item.product.potency}</span>}
                          </div>
                        )}
                        {item.notes && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Note: {item.notes}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-foreground">${item.totalPrice.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">
                          ${item.unitPrice.toFixed(2)} each
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {order.notes && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">Order Notes:</span> {order.notes}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Orders Yet</h3>
          <p className="text-muted-foreground mb-6">Start shopping to see your orders here</p>
          <Link href="/products">
            <Button className="bg-accent text-accent-foreground hover:opacity-90">
              Browse Products
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}