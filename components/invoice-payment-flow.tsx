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

interface LinkedAccount {
  id: string
  accountName: string
  bankName: string
  accountMask: string
  verificationStatus: string
}

interface InvoicePaymentFlowProps {
  invoiceId: string
  onPaymentInitiated?: () => void
}

export default function InvoicePaymentFlow({ invoiceId, onPaymentInitiated }: InvoicePaymentFlowProps) {
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"dwolla" | "manual">("dwolla")
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([])
  const [selectedFundingSource, setSelectedFundingSource] = useState("")
  const [showLinkBank, setShowLinkBank] = useState(false)
  const [showSuccessFlow, setShowSuccessFlow] = useState(false)
  const [step, setStep] = useState(1)
  const [accountsFetched, setAccountsFetched] = useState(false)

  useEffect(() => {
    console.log("[v0] Fetching invoice with ID:", invoiceId)
    fetchInvoice()
  }, [invoiceId])

  useEffect(() => {
    if (paymentMethod === "dwolla" && !accountsFetched) {
      fetchLinkedAccounts()
    }
  }, [paymentMethod, accountsFetched])

  async function fetchInvoice() {
    try {
      setLoading(true)
      console.log("[v0] Fetching invoice...")
      const response = await fetch(`/api/invoices/${invoiceId}`)
      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Invoice data:", data)
        setInvoice(data)
      } else {
        console.error("[v0] Failed to fetch invoice, status:", response.status)
      }
    } catch (error) {
      console.error("[v0] Error fetching invoice:", error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchLinkedAccounts() {
    try {
      console.log("[v0] Fetching linked accounts...")
      const response = await fetch("/api/payments/dwolla/funding-sources")
      const data = await response.json()
      const accounts = data.fundingSources || []
      console.log("[v0] Linked accounts:", accounts)

      const formattedAccounts = accounts.map((source: any) => ({
        id: source.id,
        accountName: source.accountName,
        bankName: source.bankName,
        accountMask: source.accountMask,
        verificationStatus: source.verified ? "VERIFIED" : "PENDING",
      }))

      setLinkedAccounts(formattedAccounts)

      if (formattedAccounts.length === 0) {
        setShowLinkBank(true)
      } else {
        setShowLinkBank(false)
      }

      setAccountsFetched(true)
    } catch (error) {
      console.error("[v0] Failed to fetch linked accounts:", error)
      setShowLinkBank(true)
      setAccountsFetched(true)
    }
  }

  const handleAccountLinked = (accounts: LinkedAccount[]) => {
    console.log("[v0] Account linked - accounts:", accounts)
    setLinkedAccounts(accounts)
    if (accounts.length > 0) {
      console.log("[v0] Setting first account as selected:", accounts[0].id)
      setShowLinkBank(false)
      setSelectedFundingSource(accounts[0].id)
      setPaymentMethod("dwolla")
      setStep(2)
    } else {
      console.log("[v0] No accounts returned from linker")
      setShowLinkBank(true)
    }
  }

  const handlePaymentWithDwolla = async () => {
    if (!selectedFundingSource || !invoice) {
      alert("Please select a funding source")
      return
    }

    setPaymentLoading(true)
    try {
      const response = await fetch("/api/payments/dwolla/initiate-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: invoice.id,
          fundingSourceId: selectedFundingSource,
          amount: invoice.total,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setShowSuccessFlow(true)
        setTimeout(() => {
          fetchInvoice()
          onPaymentInitiated?.()
        }, 3000)
      } else {
        alert(data.error || "Payment failed")
      }
    } catch (error) {
      console.error("[v0] Payment error:", error)
      alert("Failed to process payment")
    } finally {
      setPaymentLoading(false)
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

  if (showSuccessFlow) {
    return (
      <PaymentSuccessFlow
        invoiceId={invoice.id}
        amount={invoice.total}
        invoiceNumber={invoice.invoiceNumber}
        bankAccount={
          selectedFundingSource ? linkedAccounts.find((f) => f.id === selectedFundingSource)?.accountName : undefined
        }
        transferDate={new Date().toISOString()}
      />
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => {
                        setPaymentMethod("dwolla")
                        setStep(2)
                      }}
                      className={`p-6 rounded-xl border-2 transition-all ${
                        paymentMethod === "dwolla"
                          ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20"
                          : "border-slate-600 bg-slate-700/30 hover:border-blue-400"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`p-3 rounded-lg ${paymentMethod === "dwolla" ? "bg-blue-500" : "bg-slate-600"}`}
                        >
                          <Wallet
                            className={`w-6 h-6 ${paymentMethod === "dwolla" ? "text-white" : "text-slate-300"}`}
                          />
                        </div>
                        <div className="text-left flex-1">
                          <h4 className="font-bold text-white">ACH Transfer</h4>
                          <p className="text-sm text-slate-400 mt-1">Fastest & most secure</p>
                          <p className="text-xs text-green-400 font-medium mt-2">✓ Instant confirmation</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setPaymentMethod("manual")
                        setStep(2)
                      }}
                      className={`p-6 rounded-xl border-2 transition-all ${
                        paymentMethod === "manual"
                          ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20"
                          : "border-slate-600 bg-slate-700/30 hover:border-blue-400"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`p-3 rounded-lg ${paymentMethod === "manual" ? "bg-blue-500" : "bg-slate-600"}`}
                        >
                          <CreditCard
                            className={`w-6 h-6 ${paymentMethod === "manual" ? "text-white" : "text-slate-300"}`}
                          />
                        </div>
                        <div className="text-left flex-1">
                          <h4 className="font-bold text-white">Manual Payment</h4>
                          <p className="text-sm text-slate-400 mt-1">Wire or bank transfer</p>
                          <p className="text-xs text-blue-400 font-medium mt-2">✓ 1-2 business days</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* ACH Transfer Method */}
                {paymentMethod === "dwolla" && (
                  <div className="space-y-4 pt-4">
                    <h3 className="text-lg font-bold text-white">Link Bank Account</h3>

                    {linkedAccounts.length > 0 && !showLinkBank ? (
                      <div className="space-y-4">
                        <label className="block text-sm font-semibold text-slate-200">Select Your Bank Account</label>
                        <div className="space-y-3">
                          {linkedAccounts.map((source) => (
                            <button
                              key={source.id}
                              onClick={() => setSelectedFundingSource(source.id)}
                              className={`w-full p-5 rounded-xl border-2 transition-all text-left ${
                                selectedFundingSource === source.id
                                  ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10"
                                  : "border-slate-600 bg-slate-700/30 hover:border-blue-400"
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <div
                                  className={`p-3 rounded-lg ${selectedFundingSource === source.id ? "bg-blue-500" : "bg-slate-600"}`}
                                >
                                  <Wallet
                                    className={`w-5 h-5 ${selectedFundingSource === source.id ? "text-white" : "text-slate-300"}`}
                                  />
                                </div>
                                <div className="flex-1">
                                  <p className="font-bold text-white">{source.accountName}</p>
                                  <p className="text-sm text-slate-400">
                                    {source.bankName} • ••••{source.accountMask}
                                  </p>
                                </div>
                                <div
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                    selectedFundingSource === source.id
                                      ? "border-blue-500 bg-blue-500"
                                      : "border-slate-500"
                                  }`}
                                >
                                  {selectedFundingSource === source.id && (
                                    <div className="w-2 h-2 bg-white rounded-full" />
                                  )}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex gap-3">
                          <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-blue-200 text-sm">Bank-Level Security</p>
                            <p className="text-xs text-blue-300/80 mt-1">
                              Your bank details are encrypted and never stored on our servers.
                            </p>
                          </div>
                        </div>

                        <Button
                          onClick={handlePaymentWithDwolla}
                          disabled={paymentLoading || !selectedFundingSource}
                          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 h-14 text-lg font-bold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {paymentLoading ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Processing Payment...
                            </>
                          ) : (
                            <>
                              <Lock className="w-5 h-5 mr-2" />
                              Pay ${invoice.total.toFixed(2)} Securely
                            </>
                          )}
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => {
                            console.log("[v0] Add Different Account clicked")
                            setShowLinkBank(true)
                            setSelectedFundingSource("")
                          }}
                          className="w-full h-12 text-base font-semibold rounded-xl border-slate-600 bg-slate-700/30 text-slate-200 hover:bg-slate-600/50"
                        >
                          + Add Different Account
                        </Button>
                      </div>
                    ) : showLinkBank ? (
                      <BankAccountLinker onAccountLinked={handleAccountLinked} />
                    ) : null}
                  </div>
                )}

                {/* Manual Payment Method */}
                {paymentMethod === "manual" && (
                  <div className="space-y-4 pt-4">
                    <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-xl p-6 space-y-4">
                      <div className="flex items-start gap-3">
                        <Clock className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-amber-200 text-lg">Manual Payment</h4>
                          <p className="text-sm text-amber-300/80 mt-1">
                            Complete payment through bank transfer. Typically takes 1-2 business days.
                          </p>
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
                          Please contact our support team at support@example.com for complete wire transfer details.
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
