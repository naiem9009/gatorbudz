"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Lock, CreditCard, Loader2, ArrowRight, Shield } from "lucide-react"
import { format } from "date-fns"
import BankAccountLinkerModern from "./bank-account-linker-modern"
import PaymentConfirmationModern from "./payment-confirmation-modern"

interface Invoice {
  id: string
  invoiceNumber: string
  total: number
  status: string
  issueDate: string
  dueDate: string
}

type PaymentStep = "invoice" | "account" | "review" | "success"

interface PaymentFlowModernProps {
  invoiceId: string
  onPaymentInitiated?: () => void
}

export default function PaymentFlowModern({ invoiceId, onPaymentInitiated }: PaymentFlowModernProps) {
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<PaymentStep>("invoice")
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<string>("")
  const [fundingSources, setFundingSources] = useState<any[]>([])

  useEffect(() => {
    fetchInvoice()
  }, [invoiceId])

  async function fetchInvoice() {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`)
      if (response.ok) {
        const data = await response.json()
        setInvoice(data)
      }
    } catch (error) {
      console.error("Error fetching invoice:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleBankLinked = async (sources: any[]) => {
    setFundingSources(sources)
    if (sources.length > 0) {
      setSelectedAccount(sources[0].id)
      setStep("review")
    }
  }

  const handlePayment = async () => {
    if (!selectedAccount || !invoice) return

    setPaymentLoading(true)
    try {
      const response = await fetch("/api/payments/dwolla/initiate-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: invoice.id,
          fundingSourceId: selectedAccount,
          amount: invoice.total,
        }),
      })

      if (response.ok) {
        setStep("success")
        setTimeout(() => {
          fetchInvoice()
          onPaymentInitiated?.()
        }, 3000)
      }
    } catch (error) {
      console.error("Payment error:", error)
    } finally {
      setPaymentLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  if (!invoice) return null

  const steps = [
    { key: "invoice", label: "Invoice", icon: CreditCard },
    { key: "account", label: "Link Account", icon: Lock },
    { key: "review", label: "Review", icon: Shield },
    { key: "success", label: "Complete", icon: CheckCircle2 },
  ]

  const currentStepIndex = steps.findIndex((s) => s.key === step)

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Complete Your Payment</h1>
          <p className="text-muted-foreground">Secure, fast, and transparent ACH transfers</p>
        </div>

        {/* Step Indicators */}
        <div className="mb-12">
          <div className="flex items-center justify-between gap-2">
            {steps.map((s, index) => {
              const StepIcon = s.icon
              const isCompleted = currentStepIndex > index
              const isCurrent = s.key === step

              return (
                <div key={s.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all mb-2 font-semibold text-sm ${
                        isCurrent
                          ? "bg-accent text-accent-foreground ring-2 ring-accent/30 scale-110"
                          : isCompleted
                            ? "bg-success text-success-foreground"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                    </div>
                    <p
                      className={`text-xs font-medium text-center ${isCurrent ? "text-accent font-bold" : "text-muted-foreground"}`}
                    >
                      {s.label}
                    </p>
                  </div>

                  {index < steps.length - 1 && (
                    <div className={`h-1 flex-1 mx-1 mb-6 transition-all ${isCompleted ? "bg-success" : "bg-muted"}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Step 1: Invoice Details */}
          {(step === "invoice" || step === "account" || step === "review" || step === "success") && (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl text-foreground">{invoice.invoiceNumber}</CardTitle>
                    <p className="text-muted-foreground text-sm mt-1">Invoice amount due</p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold text-accent">${invoice.total.toFixed(2)}</div>
                    <Badge className="mt-2 bg-success/20 text-success border-0">Pending</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-background/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Issued</p>
                    <p className="font-semibold text-sm">{format(new Date(invoice.issueDate), "MMM dd")}</p>
                  </div>
                  <div className="p-3 bg-background/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Due</p>
                    <p className="font-semibold text-sm">{format(new Date(invoice.dueDate), "MMM dd")}</p>
                  </div>
                  <div className="p-3 bg-background/50 rounded-lg col-span-2">
                    <p className="text-xs text-muted-foreground mb-1">Processing Time</p>
                    <p className="font-semibold text-sm">1-2 Business Days</p>
                  </div>
                </div>

                {step === "invoice" && (
                  <Button
                    onClick={() => setStep("account")}
                    className="w-full bg-accent text-accent-foreground hover:opacity-90 h-11 font-semibold text-base"
                  >
                    Proceed to Link Account <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 2: Link Bank Account */}
          {step === "account" && <BankAccountLinkerModern onAccountLinked={handleBankLinked} />}

          {/* Step 3: Review & Confirm */}
          {step === "review" && (
            <div className="space-y-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-success" />
                    Review Your Payment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Payment Summary */}
                  <div className="bg-gradient-to-br from-accent/5 to-accent/10 border border-accent/20 rounded-lg p-6 space-y-4">
                    <div className="flex justify-between items-center pb-4 border-b border-accent/20">
                      <span className="text-muted-foreground">Invoice Number</span>
                      <span className="font-semibold text-foreground">{invoice.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-accent/20">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="text-2xl font-bold text-accent">${invoice.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">From Account</span>
                      <span className="font-semibold text-foreground">
                        {fundingSources.find((f) => f.id === selectedAccount)?.accountName}
                      </span>
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="bg-success/5 border border-success/20 rounded-lg p-4 flex gap-3">
                    <Lock className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-foreground">Secure & Encrypted</p>
                      <p className="text-muted-foreground text-xs mt-1">
                        Your payment is protected by bank-grade encryption. No credentials are stored.
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={() => setStep("account")} className="flex-1 bg-transparent">
                      Back
                    </Button>
                    <Button
                      onClick={handlePayment}
                      disabled={paymentLoading}
                      className="flex-1 bg-accent text-accent-foreground hover:opacity-90 h-11 font-semibold"
                    >
                      {paymentLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing
                        </>
                      ) : (
                        <>
                          Confirm Payment <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 4: Success */}
          {step === "success" && invoice && (
            <PaymentConfirmationModern
              invoiceId={invoice.id}
              invoiceNumber={invoice.invoiceNumber}
              amount={invoice.total}
              bankAccount={fundingSources.find((f) => f.id === selectedAccount)?.accountName}
            />
          )}
        </div>
      </div>
    </div>
  )
}
