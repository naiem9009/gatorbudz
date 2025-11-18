"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Eye, Truck } from "lucide-react"

const orders = [
  { id: "ORD-001", customer: "John Doe", amount: "$450.00", status: "Pending", date: "2024-10-28", items: 3 },
  { id: "ORD-002", customer: "Jane Smith", amount: "$320.00", status: "Processing", date: "2024-10-27", items: 2 },
  { id: "ORD-003", customer: "Bob Johnson", amount: "$680.00", status: "Shipped", date: "2024-10-26", items: 5 },
  { id: "ORD-004", customer: "Alice Brown", amount: "$240.00", status: "Delivered", date: "2024-10-25", items: 1 },
  { id: "ORD-005", customer: "Charlie Wilson", amount: "$560.00", status: "Pending", date: "2024-10-24", items: 4 },
]

const statusColors: Record<string, string> = {
  Pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  Processing: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  Shipped: "bg-purple-500/10 text-purple-500 border-purple-500/30",
  Delivered: "bg-green-500/10 text-green-500 border-green-500/30",
}

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredOrders = orders.filter(
    (order) =>
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Orders Management</h1>
          <p className="text-muted-foreground mt-2">Track and manage customer orders</p>
        </div>
        <Button className="bg-accent text-accent-foreground hover:opacity-90 gap-2">
          <Plus className="w-4 h-4" />
          New Order
        </Button>
      </div>

      {/* Search */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by order ID or customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background border-border"
            />
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>Total: {filteredOrders.length} orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-foreground">Order ID</TableHead>
                  <TableHead className="text-foreground">Customer</TableHead>
                  <TableHead className="text-foreground">Items</TableHead>
                  <TableHead className="text-foreground">Amount</TableHead>
                  <TableHead className="text-foreground">Status</TableHead>
                  <TableHead className="text-foreground">Date</TableHead>
                  <TableHead className="text-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id} className="border-border hover:bg-muted/50">
                    <TableCell className="text-foreground font-medium">{order.id}</TableCell>
                    <TableCell className="text-muted-foreground">{order.customer}</TableCell>
                    <TableCell className="text-muted-foreground">{order.items} items</TableCell>
                    <TableCell className="text-foreground font-medium">{order.amount}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[order.status]}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{order.date}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" className="text-accent hover:bg-accent/10">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-accent hover:bg-accent/10">
                          <Truck className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
