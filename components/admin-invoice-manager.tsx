"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, Clock, AlertCircle, DollarSign, Search, Download, Mail, Plus, Trash2, Edit2 } from "lucide-react"
import { format } from "date-fns"

interface Invoice {
  id: string
  invoiceNumber: string
  total: number
  status: string
  issueDate: string
  dueDate: string
  user?: { id: string; email: string; company: string }
  payments?: any[]
  notes?: string
}

interface User {
  id: string
  email: string
  name?: string
  company?: string
}

interface Product {
  id: string
  name: string
  priceGold: number
  pricePlatinum: number
  priceDiamond: number
}

interface LineItem {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
}

export default function AdminInvoiceManager() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSendingReminder, setIsSendingReminder] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const [newInvoice, setNewInvoice] = useState({
    userId: "",
    dueDate: "",
    notes: "",
  })

  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [newLineItem, setNewLineItem] = useState({
    productId: "",
    quantity: 1,
    unitPrice: 0,
  })

  useEffect(() => {
    fetchInvoices()
    fetchUsers()
    fetchProducts()
  }, [])

  const fetchInvoices = async () => {
    try {
      const response = await fetch("/api/admin/invoices")
      if (!response.ok) {
        throw new Error(`Failed to fetch invoices: ${response.statusText}`)
      }
      const data = await response.json()
      setInvoices(data.invoices || data || [])
    } catch (error) {
      console.error("Failed to fetch invoices:", error)
      alert("Failed to load invoices")
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`)
      }
      const data = await response.json()
      setUsers(Array.isArray(data) ? data : data.users || [])
    } catch (error) {
      console.error("Failed to fetch users:", error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products")
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.statusText}`)
      }
      const data = await response.json()
      setProducts(Array.isArray(data) ? data : data.products || [])
    } catch (error) {
      console.error("Failed to fetch products:", error)
    }
  }

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setEditMode(true)
    setNewInvoice({
      userId: invoice.user?.id || "",
      dueDate: invoice.dueDate,
      notes: invoice.notes || "",
    })
    setLineItems([])
    setDialogOpen(true)
  }

  const addLineItem = () => {
    if (!newLineItem.productId) {
      alert("Please select a product")
      return
    }

    const selectedProduct = products.find((p) => p.id === newLineItem.productId)
    if (!selectedProduct) return

    const lineItem: LineItem = {
      id: `temp-${Date.now()}`,
      productId: newLineItem.productId,
      productName: selectedProduct.name,
      quantity: newLineItem.quantity,
      unitPrice: newLineItem.unitPrice || selectedProduct.priceGold,
    }

    setLineItems([...lineItems, lineItem])
    setNewLineItem({ productId: "", quantity: 1, unitPrice: 0 })
  }

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter((item) => item.id !== id))
  }

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  }

  const handleSaveInvoice = async () => {
    if (!newInvoice.userId || !newInvoice.dueDate) {
      alert("Please select a customer and due date")
      return
    }

    if (lineItems.length === 0 && !editMode) {
      alert("Please add at least one product to the invoice")
      return
    }

    setIsCreating(true)
    try {
      const total = calculateTotal() || selectedInvoice?.total || 0

      if (editMode && selectedInvoice) {
        const response = await fetch(`/api/admin/invoices/${selectedInvoice.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dueDate: newInvoice.dueDate,
            notes: newInvoice.notes,
            total: lineItems.length > 0 ? total : selectedInvoice.total,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error)
        }

        alert("Invoice updated successfully!")
        setEditMode(false)
      } else {
        const response = await fetch("/api/admin/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: newInvoice.userId,
            total,
            dueDate: newInvoice.dueDate,
            notes: newInvoice.notes,
            items: lineItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error)
        }

        alert("Invoice created successfully!")
      }

      // Reset form and close dialog
      setNewInvoice({ userId: "", dueDate: "", notes: "" })
      setLineItems([])
      setDialogOpen(false)
      setSelectedInvoice(null)

      // Refresh invoices list
      fetchInvoices()
    } catch (error) {
      console.error("Error saving invoice:", error)
      alert("Error saving invoice: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteInvoice = async (invoiceId: string) => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/invoices/${invoiceId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete invoice")
      }

      alert("Invoice deleted successfully!")
      setDeleteConfirm(null)
      fetchInvoices()
    } catch (error) {
      console.error("Error deleting invoice:", error)
      alert("Error deleting invoice")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSendReminder = async (invoiceId: string) => {
    setIsSendingReminder(true)
    try {
      const response = await fetch(`/api/admin/invoices/${invoiceId}/send-reminder`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to send reminder")
      }

      alert("Reminder sent successfully!")
    } catch (error) {
      console.error("Error sending reminder:", error)
      alert("Error sending reminder")
    } finally {
      setIsSendingReminder(false)
    }
  }

  const handleMarkAsPaid = async (invoiceId: string) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/admin/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "PAID",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to mark as paid")
      }

      alert("Invoice marked as paid!")
      setSelectedInvoice(null)
      fetchInvoices()
    } catch (error) {
      console.error("Error updating invoice:", error)
      alert("Error updating invoice")
    } finally {
      setIsUpdating(false)
    }
  }

  const filteredInvoices = invoices.filter((inv) => {
    if (filterStatus !== "all" && inv.status.toUpperCase() !== filterStatus.toUpperCase()) return false
    if (
      searchTerm &&
      !inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !inv.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !inv.user?.company?.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false
    }
    return true
  })

  const stats = {
    total: invoices.length,
    pending: invoices.filter((i) => i.status === "PENDING" || i.status === "DRAFT").length,
    paid: invoices.filter((i) => i.status === "PAID").length,
    overdue: invoices.filter((i) => i.status === "OVERDUE").length,
    totalAmount: invoices.reduce((sum, i) => sum + i.total, 0),
  }

  const statusConfig: Record<string, { icon: any; color: string }> = {
    DRAFT: { icon: Clock, color: "bg-gray-100 text-gray-700" },
    PENDING: { icon: AlertCircle, color: "bg-yellow-100 text-yellow-700" },
    PAID: { icon: CheckCircle2, color: "bg-green-100 text-green-700" },
    OVERDUE: { icon: Clock, color: "bg-red-100 text-red-700" },
  }

  if (loading) {
    return <div className="text-center py-12">Loading invoices...</div>
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">Total Invoices</p>
              <p className="text-3xl font-bold text-accent">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">Paid</p>
              <p className="text-3xl font-bold text-green-600">{stats.paid}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">Total Amount</p>
              <p className="text-3xl font-bold text-accent">${stats.totalAmount.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Create Button */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex-1 relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices, emails, companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog
              open={dialogOpen}
              onOpenChange={(open) => {
                setDialogOpen(open)
                if (!open) {
                  setEditMode(false)
                  setNewInvoice({ userId: "", dueDate: "", notes: "" })
                  setLineItems([])
                }
              }}
            >
              <DialogTrigger asChild>
                <Button className="bg-accent text-accent-foreground hover:opacity-90 w-full md:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Invoice
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editMode ? "Edit Invoice" : "Create New Invoice"}</DialogTitle>
                  <DialogDescription>
                    {editMode
                      ? "Update invoice details and dates"
                      : "Add products and create an invoice for a customer"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Customer Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Customer</label>
                    <Select
                      value={newInvoice.userId}
                      onValueChange={(value) => setNewInvoice({ ...newInvoice, userId: value })}
                      disabled={editMode}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.company || user.name || user.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Due Date Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Due Date</label>
                    <Input
                      type="date"
                      value={newInvoice.dueDate}
                      onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                    />
                  </div>

                  {/* Invoice Items Section - Only show for creation */}
                  {!editMode && (
                    <div className="space-y-3 border-t border-border pt-4">
                      <h3 className="font-semibold text-sm">Invoice Items</h3>

                      {/* Add Line Item Section */}
                      <div className="space-y-2 p-3 bg-muted rounded-lg">
                        <div className="grid grid-cols-3 gap-2">
                          <Select
                            value={newLineItem.productId}
                            onValueChange={(value) => {
                              const product = products.find((p) => p.id === value)
                              setNewLineItem({
                                ...newLineItem,
                                productId: value,
                                unitPrice: product?.priceGold || 0,
                              })
                            }}
                          >
                            <SelectTrigger className="text-xs">
                              <SelectValue placeholder="Product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Input
                            type="number"
                            min="1"
                            placeholder="Qty"
                            value={newLineItem.quantity}
                            onChange={(e) =>
                              setNewLineItem({ ...newLineItem, quantity: Number.parseInt(e.target.value) || 1 })
                            }
                            className="text-xs"
                          />

                          <div className="flex gap-2">
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Price"
                              value={newLineItem.unitPrice}
                              onChange={(e) =>
                                setNewLineItem({ ...newLineItem, unitPrice: Number.parseFloat(e.target.value) || 0 })
                              }
                              className="text-xs"
                            />
                            <Button onClick={addLineItem} size="sm" variant="outline" className="px-2 bg-transparent">
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Line Items List */}
                      {lineItems.length > 0 && (
                        <div className="space-y-2">
                          {lineItems.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-2 bg-muted/50 rounded border border-border text-xs"
                            >
                              <div className="flex-1">
                                <p className="font-medium">{item.productName}</p>
                                <p className="text-muted-foreground">
                                  {item.quantity} x ${item.unitPrice.toFixed(2)} = $
                                  {(item.quantity * item.unitPrice).toFixed(2)}
                                </p>
                              </div>
                              <Button
                                onClick={() => removeLineItem(item.id)}
                                size="sm"
                                variant="ghost"
                                className="px-2"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          ))}

                          {/* Total */}
                          <div className="flex justify-between items-center p-2 bg-accent/10 rounded font-semibold text-sm">
                            <span>Total:</span>
                            <span className="text-accent">${calculateTotal().toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Notes (Optional)</label>
                    <Input
                      placeholder="Invoice notes..."
                      value={newInvoice.notes}
                      onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                    />
                  </div>

                  {/* Save Invoice Button */}
                  <Button
                    onClick={handleSaveInvoice}
                    disabled={isCreating}
                    className="w-full bg-accent text-accent-foreground hover:opacity-90"
                  >
                    {isCreating ? "Saving..." : editMode ? "Update Invoice" : "Create Invoice"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Tabs value={filterStatus} onValueChange={setFilterStatus} className="w-full">
            <TabsList className="grid grid-cols-5 bg-muted w-full">
              <TabsTrigger value="all" className="text-xs">
                All
              </TabsTrigger>
              <TabsTrigger value="draft" className="text-xs">
                Draft
              </TabsTrigger>
              <TabsTrigger value="pending" className="text-xs">
                Pending
              </TabsTrigger>
              <TabsTrigger value="paid" className="text-xs">
                Paid
              </TabsTrigger>
              <TabsTrigger value="overdue" className="text-xs">
                Overdue
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>{filteredInvoices.length} invoices found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredInvoices.length > 0 ? (
              filteredInvoices.map((invoice) => {
                const config = statusConfig[invoice.status] || statusConfig.DRAFT
                const Icon = config.icon
                return (
                  <div key={invoice.id}>
                    <Dialog>
                      <DialogTrigger asChild>
                        <button
                          onClick={() => setSelectedInvoice(invoice)}
                          className="w-full p-4 rounded-lg border border-border hover:border-accent/50 hover:bg-card/50 transition text-left"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-foreground truncate">{invoice.invoiceNumber}</div>
                              <div className="text-sm text-muted-foreground">
                                {invoice.user?.company || invoice.user?.email}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Due: {format(new Date(invoice.dueDate), "MMM dd, yyyy")}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-accent mb-2">${invoice.total.toFixed(2)}</div>
                              <Badge className={`${config.color} border-0`}>
                                <Icon className="w-3 h-3 mr-1" />
                                {invoice.status}
                              </Badge>
                            </div>
                          </div>
                        </button>
                      </DialogTrigger>

                      {selectedInvoice?.id === invoice.id && (
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{invoice.invoiceNumber}</DialogTitle>
                            <DialogDescription>Invoice details and actions</DialogDescription>
                          </DialogHeader>

                          <div className="space-y-6">
                            {/* Invoice Details */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Amount</p>
                                <p className="text-2xl font-bold text-accent">${invoice.total.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Status</p>
                                <div className="mt-2">
                                  <Badge className={`${statusConfig[invoice.status]?.color || ""} border-0`}>
                                    {invoice.status}
                                  </Badge>
                                </div>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Issue Date</p>
                                <p className="font-semibold">{format(new Date(invoice.issueDate), "MMM dd, yyyy")}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Due Date</p>
                                <p className="font-semibold">{format(new Date(invoice.dueDate), "MMM dd, yyyy")}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-sm text-muted-foreground">Customer</p>
                                <p className="font-semibold">{invoice.user?.company || invoice.user?.email}</p>
                              </div>
                            </div>

                            <div className="flex gap-2 pt-4 border-t border-border flex-wrap">
                              <Button variant="outline" className="flex-1 bg-transparent" size="sm">
                                <Download className="w-4 h-4 mr-2" />
                                Export PDF
                              </Button>
                              <Button
                                variant="outline"
                                className="flex-1 bg-transparent"
                                size="sm"
                                onClick={() => handleSendReminder(invoice.id)}
                                disabled={isSendingReminder}
                              >
                                <Mail className="w-4 h-4 mr-2" />
                                {isSendingReminder ? "Sending..." : "Send Reminder"}
                              </Button>
                              <Button
                                variant="outline"
                                className="flex-1 bg-transparent"
                                size="sm"
                                onClick={() => handleEditInvoice(invoice)}
                              >
                                <Edit2 className="w-4 h-4 mr-2" />
                                Edit
                              </Button>
                              {invoice.status !== "PAID" && (
                                <Button
                                  className="flex-1 bg-accent text-accent-foreground hover:opacity-90"
                                  size="sm"
                                  onClick={() => handleMarkAsPaid(invoice.id)}
                                  disabled={isUpdating}
                                >
                                  <DollarSign className="w-4 h-4 mr-2" />
                                  {isUpdating ? "Updating..." : "Mark as Paid"}
                                </Button>
                              )}
                              <AlertDialog
                                open={deleteConfirm === invoice.id}
                                onOpenChange={(open) => setDeleteConfirm(open ? invoice.id : null)}
                              >
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="px-3"
                                  onClick={() => setDeleteConfirm(invoice.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete invoice {invoice.invoiceNumber}? This action
                                      cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <div className="flex gap-3">
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteInvoice(invoice.id)}
                                      disabled={isDeleting}
                                      className="bg-red-500"
                                    >
                                      {isDeleting ? "Deleting..." : "Delete"}
                                    </AlertDialogAction>
                                  </div>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </DialogContent>
                      )}
                    </Dialog>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-12 text-muted-foreground">No invoices found</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
