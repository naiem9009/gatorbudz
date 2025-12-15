"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  Loader2,
  Lock,
  Shield,
  CreditCard,
  Wallet,
  LucideBanknote,
} from "lucide-react"
import { format } from "date-fns"
import BankAccountLinker from "./bank-account-linker"
import PaymentSuccessFlow from "./payment-success-flow"

interface Invoice {
  id: string
  invoiceNumber: string
  total: number
  status: string
  issueDate: string
  dueDate: string
  paymentMethod?: string
  paidAt?: string
  notes?: string
  order?: any
  payments?: any[]
}


interface InvoicePaymentFlowProps {
  invoiceId: string
}

export default function InvoicePaymentFlow({ invoiceId }: InvoicePaymentFlowProps) {
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"zelle" | "ach" | "wire">("zelle")
  const [selectedFundingSource, setSelectedFundingSource] = useState("")
  const [showLinkBank, setShowLinkBank] = useState(false)
  const [showSuccessFlow, setShowSuccessFlow] = useState(false)
  const [step, setStep] = useState(1)
  const [accountsFetched, setAccountsFetched] = useState(false)

  useEffect(() => {
    console.log("Fetching invoice with ID:", invoiceId)
    fetchInvoice()
  }, [invoiceId])

  async function fetchInvoice() {
    try {
      setLoading(true)
      console.log("Fetching invoice...")
      const response = await fetch(`/api/invoices/${invoiceId}`)
      if (response.ok) {
        const data = await response.json()
        console.log("Invoice data:", data)
        setInvoice(data)
      } else {
        console.error("Failed to fetch invoice, status:", response.status)
      }
    } catch (error) {
      console.error("Error fetching invoice:", error)
    } finally {
      setLoading(false)
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto" />
          <p className="text-gray-600">Loading invoice...</p>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-red-700">
            <AlertCircle className="w-6 h-6" />
            <p>Invoice not found</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const statusConfig: Record<string, { icon: any; color: string; label: string; bgColor: string }> = {
    DRAFT: { icon: Clock, color: "text-gray-700", label: "Draft", bgColor: "bg-gray-100" },
    PENDING: { icon: AlertTriangle, color: "text-yellow-700", label: "Pending Payment", bgColor: "bg-yellow-100" },
    PAID: { icon: CheckCircle2, color: "text-green-700", label: "Paid", bgColor: "bg-green-100" },
    OVERDUE: { icon: AlertCircle, color: "text-red-700", label: "Overdue", bgColor: "bg-red-100" },
  }

  const config = statusConfig[invoice.status] || statusConfig.DRAFT
  const StatusIcon = config.icon
  const isPaid = invoice.status === "PAID"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with Status */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text text-transparent">
                Secure Payment
              </h1>
              <p className="text-blue-100/70 mt-1">Complete your payment with ease and confidence</p>
            </div>
            <Badge className={`${config.bgColor} ${config.color} border-0 px-4 py-2 text-sm font-semibold`}>
              <StatusIcon className="w-4 h-4 mr-2 inline" />
              {config.label}
            </Badge>
          </div>
        </div>

        {/* Main Payment Card */}
        <Card className="border-0 shadow-2xl overflow-hidden bg-slate-800/50 backdrop-blur border border-slate-700/50">
          <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 px-8 py-8">
            <p className="text-blue-100 text-sm font-medium mb-2">Invoice Number</p>
            <h2 className="text-white text-3xl font-bold mb-6">{invoice.invoiceNumber}</h2>

            <div className="bg-white/10 backdrop-blur rounded-lg px-6 py-4 border border-white/20">
              <p className="text-blue-100 text-sm mb-2">Amount Due</p>
              <p className="text-white text-5xl font-bold">${invoice.total.toFixed(2)}</p>
            </div>
          </div>

          <CardContent className="pt-8 space-y-8">
            {/* Invoice Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border-l-4 border-blue-500 pl-4 bg-blue-500/5 py-3 px-3 rounded-r">
                <p className="text-slate-400 text-sm font-medium mb-1">Issue Date</p>
                <p className="text-white font-semibold text-lg">
                  {format(new Date(invoice.issueDate), "MMM dd, yyyy")}
                </p>
              </div>
              <div className="border-l-4 border-orange-500 pl-4 bg-orange-500/5 py-3 px-3 rounded-r">
                <p className="text-slate-400 text-sm font-medium mb-1">Due Date</p>
                <p className="text-white font-semibold text-lg">{format(new Date(invoice.dueDate), "MMM dd, yyyy")}</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4 bg-green-500/5 py-3 px-3 rounded-r">
                <p className="text-slate-400 text-sm font-medium mb-1">Status</p>
                <p className="text-white font-semibold text-lg">{config.label}</p>
              </div>
            </div>

            <div className="h-px bg-slate-700/50" />

            {/* Payment Section */}
            {!isPaid ? (
              <div className="space-y-6">
                {/* Payment Method Selector */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Select Payment Method</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => {
                        setPaymentMethod("zelle")
                        setStep(2)
                      }}
                      className={`p-6 rounded-xl border-2 transition-all ${
                        paymentMethod === "zelle"
                          ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20"
                          : "border-slate-600 bg-slate-700/30 hover:border-blue-400"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`p-3 rounded-lg ${paymentMethod === "zelle" ? "bg-blue-500" : "bg-slate-600"}`}
                        >
                          <Wallet
                            className={`w-6 h-6 ${paymentMethod === "zelle" ? "text-white" : "text-slate-300"}`}
                          />
                        </div>
                        <div className="text-left flex-1">
                          <h4 className="font-bold text-white">Zelle</h4>
                          <p className="text-sm text-slate-400 mt-1">Follow Instructions</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setPaymentMethod("ach")
                        setStep(2)
                      }}
                      className={`p-6 rounded-xl border-2 transition-all ${
                        paymentMethod === "ach"
                          ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20"
                          : "border-slate-600 bg-slate-700/30 hover:border-blue-400"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`p-3 rounded-lg ${paymentMethod === "ach" ? "bg-blue-500" : "bg-slate-600"}`}
                        >
                          <CreditCard
                            className={`w-6 h-6 ${paymentMethod === "ach" ? "text-white" : "text-slate-300"}`}
                          />
                        </div>
                        <div className="text-left flex-1">
                          <h4 className="font-bold text-white">ACH</h4>
                          <p className="text-sm text-slate-400 mt-1">Follow Instructions</p>
                        </div>
                      </div>
                    </button>


                    <button
                      onClick={() => {
                        setPaymentMethod("wire")
                        setStep(2)
                      }}
                      className={`p-6 rounded-xl border-2 transition-all ${
                        paymentMethod === "wire"
                          ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20"
                          : "border-slate-600 bg-slate-700/30 hover:border-blue-400"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`p-3 rounded-lg ${paymentMethod === "wire" ? "bg-blue-500" : "bg-slate-600"}`}
                        >
                          <LucideBanknote
                            className={`w-6 h-6 ${paymentMethod === "wire" ? "text-white" : "text-slate-300"}`}
                          />
                        </div>
                        <div className="text-left flex-1">
                          <h4 className="font-bold text-white">Wire</h4>
                          <p className="text-sm text-slate-400 mt-1">Follow Instructions</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>


                {paymentMethod === "zelle" && (
                  <div className="space-y-4 pt-4">
                    <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-xl p-6 space-y-4">
                      <div className="flex items-start gap-3">
                        <Clock className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-amber-200 text-lg">Manual Payment</h4>
                        </div>
                      </div>

                      <div className="bg-slate-700/50 rounded-lg p-4 space-y-3 text-sm">
                        <div className="flex justify-between border-b border-slate-600 pb-2">
                          <span className="text-slate-400 font-medium">Amount:</span>
                          <span className="font-bold text-white">${invoice.total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-600 pb-2">
                          <span className="text-slate-400 font-medium">Invoice #:</span>
                          <span className="font-bold text-white">{invoice.invoiceNumber}</span>
                        </div>
                        <p className="text-md text-slate-400 pt-2 font-bold">
                          support@smaugsvault.com
                        </p>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 h-12 text-base font-bold rounded-xl"
                      onClick={() => (window.location.href = `/api/invoices/${invoice.id}/download`)}
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Download Invoice Details
                    </Button>
                  </div>
                )}
                {paymentMethod === "wire" && (
                  <div className="space-y-4 pt-4">
                    <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-xl p-6 space-y-4">
                      <div className="flex items-start gap-3">
                        <Clock className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-amber-200 text-lg">Manual Payment</h4>
                        </div>
                      </div>

                      <div className="bg-slate-700/50 rounded-lg p-4 space-y-3 text-sm">
                        <div className="flex justify-between border-b border-slate-600 pb-2">
                          <span className="text-slate-400 font-medium">Amount:</span>
                          <span className="font-bold text-white">${invoice.total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-600 pb-2">
                          <span className="text-slate-400 font-medium">Invoice #:</span>
                          <span className="font-bold text-white">{invoice.invoiceNumber}</span>
                        </div>
                        <p className="text-xs text-slate-400 pt-2">
                          Bank Number: 485016575092
                        </p>
                        <p className="text-xs text-slate-400 pt-2">
                          Routing Number: 026009593
                        </p>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 h-12 text-base font-bold rounded-xl"
                      onClick={() => (window.location.href = `/api/invoices/${invoice.id}/download`)}
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Download Invoice Details
                    </Button>
                  </div>
                )}

                {/* ach Payment Method */}
                {paymentMethod === "ach" && (
                  <div className="space-y-4 pt-4">
                    <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-xl p-6 space-y-4">
                      <div className="flex items-start gap-3">
                        <Clock className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-amber-200 text-lg">Manual Payment</h4>
                        </div>
                      </div>

                      <div className="bg-slate-700/50 rounded-lg p-4 space-y-3 text-sm">
                        <div className="flex justify-between border-b border-slate-600 pb-2">
                          <span className="text-slate-400 font-medium">Amount:</span>
                          <span className="font-bold text-white">${invoice.total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-600 pb-2">
                          <span className="text-slate-400 font-medium">Invoice #:</span>
                          <span className="font-bold text-white">{invoice.invoiceNumber}</span>
                        </div>
                        <p className="text-xs text-slate-400 pt-2">
                          Bank Number: 485016575092
                        </p>
                        <p className="text-xs text-slate-400 pt-2">
                          Routing Number: 323070380
                        </p>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 h-12 text-base font-bold rounded-xl"
                      onClick={() => (window.location.href = `/api/invoices/${invoice.id}/download`)}
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Download Invoice Details
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              // Payment Confirmed
              <div className="text-center py-8 space-y-6">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center animate-bounce">
                    <CheckCircle2 className="w-10 h-10 text-green-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Payment Received!</h3>
                  <p className="text-slate-400 mt-2">Thank you for your payment.</p>
                  {invoice.paidAt && (
                    <p className="text-sm text-slate-500 mt-1">
                      Paid on {format(new Date(invoice.paidAt), "MMM dd, yyyy")}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  className="mx-auto bg-transparent border-slate-600 text-slate-200 hover:bg-slate-700/50"
                  onClick={() => (window.location.href = `/api/invoices/${invoice.id}/download`)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Receipt
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trust Badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/50 backdrop-blur rounded-lg p-4 border border-slate-700/50 text-center hover:border-blue-500/50 transition">
            <Shield className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white">SSL Encrypted</p>
            <p className="text-xs text-slate-400 mt-1">Bank-level security</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur rounded-lg p-4 border border-slate-700/50 text-center hover:border-blue-500/50 transition">
            <Lock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white">PCI Compliant</p>
            <p className="text-xs text-slate-400 mt-1">Secure transactions</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur rounded-lg p-4 border border-slate-700/50 text-center hover:border-green-500/50 transition">
            <CheckCircle2 className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white">Verified</p>
            <p className="text-xs text-slate-400 mt-1">Trusted partner</p>
          </div>
        </div>
      </div>
    </div>
  )
}
