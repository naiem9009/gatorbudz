"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Mail, Phone } from "lucide-react"

const customers = [
  { id: 1, name: "John Doe", email: "john@example.com", phone: "+1-555-0101", orders: 5, status: "Active" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", phone: "+1-555-0102", orders: 12, status: "Active" },
  { id: 3, name: "Bob Johnson", email: "bob@example.com", phone: "+1-555-0103", orders: 3, status: "Inactive" },
  { id: 4, name: "Alice Brown", email: "alice@example.com", phone: "+1-555-0104", orders: 8, status: "Active" },
]

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Customers</h1>
        <p className="text-muted-foreground mt-2">View and manage customer information</p>
      </div>

      {/* Search */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background border-border"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
          <CardDescription>Total: {filteredCustomers.length} customers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-foreground">Name</TableHead>
                  <TableHead className="text-foreground">Email</TableHead>
                  <TableHead className="text-foreground">Phone</TableHead>
                  <TableHead className="text-foreground">Orders</TableHead>
                  <TableHead className="text-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} className="border-border hover:bg-muted/50">
                    <TableCell className="text-foreground font-medium">{customer.name}</TableCell>
                    <TableCell className="text-muted-foreground flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {customer.email}
                    </TableCell>
                    <TableCell className="text-muted-foreground flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {customer.phone}
                    </TableCell>
                    <TableCell className="text-foreground font-medium">{customer.orders}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          customer.status === "Active"
                            ? "bg-green-500/10 text-green-500 border-green-500/30"
                            : "bg-muted text-muted-foreground border-border"
                        }
                      >
                        {customer.status}
                      </Badge>
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
