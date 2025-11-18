"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, CreditCard, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Invoice {
  id: string
  invoiceNumber: string
  total: number
  status: string
  issueDate: string
  dueDate: string
  stripeUrl?: string
}

export default function DashboardInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchInvoices()
  }, [])

  async function fetchInvoices() {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/invoices/list")

      if (!response.ok) {
        throw new Error("Failed to fetch invoices")
      }

      const json = await response.json()
      setInvoices(json.data || [])
    } catch (error) {
      console.error("Failed to fetch invoices:", error)
      setError("Failed to load invoices. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-500/10 text-yellow-700",
    PAID: "bg-green-500/10 text-green-700",
    OVERDUE: "bg-red-500/10 text-red-700",
    CANCELLED: "bg-gray-500/10 text-gray-700",
    DRAFT: "bg-gray-500/10 text-gray-700",
  }

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading invoices...</div>
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={fetchInvoices} className="mt-4 bg-transparent" variant="outline">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground mb-6">Your Invoices</h2>

      {invoices.length > 0 ? (
        <div className="space-y-3">
          {invoices.map((invoice) => {
            const isPaid = invoice.status === "PAID"
            return (
              <div
                key={invoice.id}
                className="bg-card border border-border p-4 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:border-accent transition"
              >
                <div className="flex-1">
                  <p className="font-medium text-foreground">{invoice.invoiceNumber}</p>
                  <p className="text-xs text-muted-foreground">Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-accent">${invoice.total.toFixed(2)}</p>
                    <Badge className={statusColors[invoice.status] || ""}>{invoice.status}</Badge>
                  </div>

                  <div className="flex gap-2">
                    {!isPaid && (
                      <Button
                        asChild
                        variant="default"
                        size="sm"
                        className="gap-2 bg-accent text-accent-foreground hover:opacity-90"
                      >
                        <a href={`/dashboard/invoices-payment?id=${invoice.id}`}>
                          <CreditCard size={16} />
                          Pay
                        </a>
                      </Button>
                    )}
                    {invoice.stripeUrl && (
                      <Button variant="outline" size="sm" className="bg-transparent gap-2" asChild>
                        <a href={invoice.stripeUrl} target="_blank" rel="noopener noreferrer">
                          View
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent gap-2"
                      onClick={() => (window.location.href = `/api/invoices/${invoice.id}/download`)}
                    >
                      <Download size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No invoices available</p>
        </div>
      )}
    </div>
  )
}
