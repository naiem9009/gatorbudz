"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertCircle, Lock, DollarSign, Loader2, ChevronRight } from "lucide-react"
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

interface PaymentStepsFlowProps {
  invoiceId: string
  onPaymentInitiated?: () => void
}

export default function PaymentStepsFlow({ invoiceId, onPaymentInitiated }: PaymentStepsFlowProps) {
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
    { key: "review", label: "Review Invoice", icon: DollarSign },
    { key: "bank", label: "Link Bank", icon: Lock },
    { key: "confirm", label: "Confirm Payment", icon: CheckCircle2 },
    { key: "success", label: "Done", icon: CheckCircle2 },
  ]

  const currentStepIndex = stepConfig.findIndex((s) => s.key === step)

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      {/* Step Progress Indicator */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-8">
          {stepConfig.map((s, index) => {
            const StepIcon = s.icon
            const isCompleted = stepConfig.findIndex((st) => st.key === step) > index
            const isCurrent = s.key === step

            return (
              <div key={s.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all mb-3 ${
                      isCurrent
                        ? "bg-accent text-accent-foreground ring-4 ring-accent/20"
                        : isCompleted
                          ? "bg-success text-success-foreground"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <StepIcon className="w-6 h-6" />}
                  </div>
                  <p
                    className={`text-sm font-medium text-center ${isCurrent ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {s.label}
                  </p>
                </div>

                {index < stepConfig.length - 1 && (
                  <div className={`h-1 flex-1 mx-2 mb-8 transition-all ${isCompleted ? "bg-success" : "bg-muted"}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="space-y-6">
        {/* Step 1: Review Invoice */}
        {(step === "review" || step === "bank" || step === "confirm" || step === "success") && (
          <Card className="border-2 border-accent/20 bg-gradient-to-br from-card to-card/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-3xl">{invoice.invoiceNumber}</CardTitle>
                  <p className="text-muted-foreground mt-1">Invoice amount to be paid</p>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-bold text-accent">${invoice.total.toFixed(2)}</div>
                  <Badge className="mt-2 bg-success/20 text-success border-0">Amount due</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Invoice Details Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-background/50 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Issue Date</p>
                  <p className="font-semibold text-foreground">{format(new Date(invoice.issueDate), "MMM dd")}</p>
                </div>
                <div className="p-4 bg-background/50 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Due Date</p>
                  <p className="font-semibold text-foreground">{format(new Date(invoice.dueDate), "MMM dd")}</p>
                </div>
                <div className="p-4 bg-background/50 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Status</p>
                  <p className="font-semibold text-success">Pending</p>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="bg-info/5 border border-info/20 rounded-lg p-4 flex items-start gap-3">
                <Lock className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-foreground mb-1">Secure & Encrypted</p>
                  <p className="text-muted-foreground">
                    Your bank connection is 100% secure. We never store your login credentials.
                  </p>
                </div>
              </div>

              {/* CTA for Step 1 */}
              {step === "review" && (
                <Button
                  onClick={() => setStep("bank")}
                  className="w-full bg-accent text-accent-foreground hover:opacity-90 h-12 text-base font-semibold group"
                >
                  Continue to Link Bank <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition" />
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Link Bank */}
        {step === "bank" && (
          <BankAccountLinkerV2 onAccountLinked={handleBankLinked} onSkip={() => setStep("confirm")} />
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
                  <p className="text-sm text-muted-foreground mb-2">Payment from:</p>
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

              <div className="bg-warning/5 border border-warning/20 rounded-lg p-4">
                <p className="text-sm text-foreground">
                  By clicking "Confirm Payment", you authorize the ACH transfer of{" "}
                  <strong>${invoice.total.toFixed(2)}</strong> from your bank account.
                </p>
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
  )
}
