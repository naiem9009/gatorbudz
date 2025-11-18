"use client"

import { useState, useEffect } from "react"
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle, Download, Eye, Search, TrendingUp, DollarSign, Clock, ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import InvoicePaymentFlow from "@/components/invoice-payment-flow"
import Header from "@/components/header"

interface Invoice {
  id: string
  invoiceNumber: string
  total: number
  status: string
  issueDate: string
  dueDate: string
  paymentMethod?: string
  paidAt?: string
}

interface PaymentStats {
  totalPaid: number
  totalOutstanding: number
  totalOverdue: number
  invoiceCount: number
}

function InvoiceListLoadingState() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
      ))}
    </div>
  )
}

function InvoicePaymentContent() {
  const searchParams = useSearchParams()
  const selectedInvoiceId = searchParams.get("id")

  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [stats, setStats] = useState<PaymentStats>({
    totalPaid: 0,
    totalOutstanding: 0,
    totalOverdue: 0,
    invoiceCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("ALL")
  const [showPaymentFlow, setShowPaymentFlow] = useState(!!selectedInvoiceId)

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/invoices")
      const data = await response.json()

      if (data.invoices) {
        setInvoices(data.invoices)

        const paidTotal = data.invoices
          .filter((inv: Invoice) => inv.status === "PAID")
          .reduce((sum: number, inv: Invoice) => sum + inv.total, 0)

        const outstandingTotal = data.invoices
          .filter((inv: Invoice) => inv.status === "PENDING")
          .reduce((sum: number, inv: Invoice) => sum + inv.total, 0)

        const overdueTotal = data.invoices
          .filter((inv: Invoice) => inv.status === "OVERDUE")
          .reduce((sum: number, inv: Invoice) => sum + inv.total, 0)

        setStats({
          totalPaid: paidTotal,
          totalOutstanding: outstandingTotal,
          totalOverdue: overdueTotal,
          invoiceCount: data.invoices.length,
        })
      }
    } catch (error) {
      console.error("Failed to fetch invoices:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterStatus === "ALL" || invoice.status === filterStatus

    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800 border-green-200"
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "OVERDUE":
        return "bg-red-100 text-red-800 border-red-200"
      case "DRAFT":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const handleDownloadInvoice = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/download`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `invoice-${invoiceNumber}.html`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Failed to download invoice:", error)
    }
  }

  if (showPaymentFlow && selectedInvoiceId) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto p-6">
          <Button
            variant="outline"
            onClick={() => {
              setShowPaymentFlow(false)
              window.history.pushState({}, "", "/dashboard/invoices-payment")
            }}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Invoices
          </Button>
          <InvoicePaymentFlow
            invoiceId={selectedInvoiceId}
            onPaymentInitiated={() => {
              fetchInvoices()
              setShowPaymentFlow(false)
              window.history.pushState({}, "", "/dashboard/invoices-payment")
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <Header />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Total Paid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${stats.totalPaid.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Completed payments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Outstanding
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">${stats.totalOutstanding.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Pending payment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Overdue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">${stats.totalOverdue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Action required</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Total Invoices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{stats.invoiceCount}</div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>
        </div>

        {/* Invoices List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Your Invoices</CardTitle>
                <CardDescription>View and manage all your invoices</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1 md:flex-none">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search invoices..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-muted border-0"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32 bg-muted border-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="OVERDUE">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <InvoiceListLoadingState />
            ) : filteredInvoices.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">No invoices found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => (
                      <TableRow key={invoice.id} className="hover:bg-muted/50">
                        <TableCell className="font-semibold text-foreground">{invoice.invoiceNumber}</TableCell>
                        <TableCell className="font-semibold text-accent">${invoice.total.toFixed(2)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(invoice.issueDate), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(invoice.dueDate), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(invoice.status)} border`}>{invoice.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setShowPaymentFlow(true)
                                window.history.pushState({}, "", `/dashboard/invoices-payment?id=${invoice.id}`)
                              }}
                              className="text-accent hover:text-accent hover:bg-accent/10"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              // onClick={() => handleDownloadInvoice(invoice.id, invoice.invoiceNumber)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function InvoicePaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background p-8">
          <InvoiceListLoadingState />
        </div>
      }
    >
      <InvoicePaymentContent />
    </Suspense>
  )
}
