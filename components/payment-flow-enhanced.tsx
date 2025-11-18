"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertCircle, Lock, DollarSign, Loader2, ArrowRight } from "lucide-react"
import { format } from "date-fns"
import BankAccountLinkerV2 from "./bank-account-linker-v2"
import PaymentConfirmation from "./payment-confirmation"

interface Invoice {
  id: string
  invoiceNumber: string
  total: number
  status: string
  issueDate: string
  dueDate: string
  paidAt?: string
  payments?: any[]
}

type PaymentStep = "review" | "bank" | "confirm" | "success"

interface PaymentFlowEnhancedProps {
  invoiceId: string
  onPaymentInitiated?: () => void
}

export default function PaymentFlowEnhanced({ invoiceId, onPaymentInitiated }: PaymentFlowEnhancedProps) {
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<PaymentStep>("review")
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
      setStep("confirm")
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

  if (!invoice) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5" />
            <p>Invoice not found</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const stepConfig = [
    { key: "review", label: "Review Invoice", icon: DollarSign, description: "Verify the amount and details" },
    { key: "bank", label: "Link Bank", icon: Lock, description: "Connect your bank account securely" },
    { key: "confirm", label: "Confirm Payment", icon: CheckCircle2, description: "Review and confirm the transfer" },
    { key: "success", label: "Done", icon: CheckCircle2, description: "Payment initiated successfully" },
  ]

  const currentStepIndex = stepConfig.findIndex((s) => s.key === step)

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Vertical Step Progress */}
        <div className="lg:col-span-1">
          <div className="space-y-4 sticky top-8">
            {stepConfig.map((s, index) => {
              const StepIcon = s.icon
              const isCompleted = currentStepIndex > index
              const isCurrent = s.key === step

              return (
                <div key={s.key} className="flex gap-4 relative">
                  {/* Vertical connector line */}
                  {index < stepConfig.length - 1 && (
                    <div
                      className={`absolute left-6 top-12 bottom-0 w-1 transition-all ${
                        isCompleted ? "bg-success" : "bg-muted"
                      }`}
                    />
                  )}

                  {/* Step indicator */}
                  <div className="flex-shrink-0">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm transition-all relative z-10 ${
                        isCurrent
                          ? "bg-accent text-accent-foreground ring-4 ring-accent/20 shadow-lg"
                          : isCompleted
                            ? "bg-success text-success-foreground"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                    </div>
                  </div>

                  {/* Step label */}
                  <div className="flex-1 pt-2">
                    <p
                      className={`font-semibold text-sm transition-colors ${
                        isCurrent ? "text-foreground" : isCompleted ? "text-success" : "text-muted-foreground"
                      }`}
                    >
                      {s.label}
                    </p>
                    <p className={`text-xs mt-1 ${isCurrent ? "text-foreground/70" : "text-muted-foreground"}`}>
                      {s.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Step Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Review Invoice */}
          {(step === "review" || step === "bank" || step === "confirm" || step === "success") && (
            <Card className="border-2 border-accent/20 bg-gradient-to-br from-card to-card/50">
              <CardHeader>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">{invoice.invoiceNumber}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">Invoice ready for payment</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Amount Display */}
                <div className="bg-background/50 rounded-xl p-6 border border-border">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-2">
                    Amount Due
                  </p>
                  <p className="text-5xl font-bold text-accent">${invoice.total.toFixed(2)}</p>
                </div>

                {/* Invoice Details Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-background/50 rounded-lg border border-border text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Issue Date</p>
                    <p className="font-semibold text-sm text-foreground">
                      {format(new Date(invoice.issueDate), "MMM dd")}
                    </p>
                  </div>
                  <div className="p-3 bg-background/50 rounded-lg border border-border text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Due Date</p>
                    <p className="font-semibold text-sm text-foreground">
                      {format(new Date(invoice.dueDate), "MMM dd")}
                    </p>
                  </div>
                  <div className="p-3 bg-background/50 rounded-lg border border-border text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Status</p>
                    <Badge className="bg-accent/20 text-accent border-0 text-xs">Pending</Badge>
                  </div>
                </div>

                {/* Trust Indicator */}
                <div className="bg-info/5 border border-info/20 rounded-lg p-4 flex items-start gap-3">
                  <Lock className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-foreground mb-1">Bank-Grade Security</p>
                    <p className="text-muted-foreground text-xs">
                      Your connection is encrypted. We never store your credentials.
                    </p>
                  </div>
                </div>

                {/* CTA for Step 1 */}
                {step === "review" && (
                  <Button
                    onClick={() => setStep("bank")}
                    className="w-full bg-accent text-accent-foreground hover:opacity-90 h-12 text-base font-semibold group"
                  >
                    Continue <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition" />
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 2: Link Bank */}
          {step === "bank" && (
            <div className="space-y-6">
              <BankAccountLinkerV2 onAccountLinked={handleBankLinked} onSkip={() => setStep("confirm")} />
            </div>
          )}

          {/* Step 3: Confirm Payment */}
          {step === "confirm" && (
            <Card className="border-2 border-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-success" />
                  Confirm Your Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedAccount && fundingSources.length > 0 && (
                  <div className="p-4 bg-success/5 border border-success/20 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">
                      Payment From
                    </p>
                    <div className="font-semibold text-foreground">
                      {fundingSources.find((f) => f.id === selectedAccount)?.accountName}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {fundingSources.find((f) => f.id === selectedAccount)?.bankName} • ••••
                      {fundingSources.find((f) => f.id === selectedAccount)?.accountMask}
                    </div>
                  </div>
                )}

                <div className="bg-background/50 p-6 rounded-lg border border-border space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="text-2xl font-bold text-accent">${invoice.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-muted-foreground">Invoice</span>
                    <span className="font-semibold">{invoice.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-muted-foreground">Processing Time</span>
                    <span className="font-semibold">1-2 business days</span>
                  </div>
                </div>

                <div className="bg-warning/5 border border-warning/20 rounded-lg p-4 text-sm text-foreground">
                  By clicking "Confirm Payment", you authorize the ACH transfer of{" "}
                  <strong>${invoice.total.toFixed(2)}</strong> from your bank account.
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep("bank")} className="flex-1 bg-transparent">
                    Back
                  </Button>
                  <Button
                    onClick={handlePayment}
                    disabled={paymentLoading}
                    className="flex-1 bg-accent text-accent-foreground hover:opacity-90 h-12 font-semibold"
                  >
                    {paymentLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Confirm Payment"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Success */}
          {step === "success" && invoice && (
            <PaymentConfirmation
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
