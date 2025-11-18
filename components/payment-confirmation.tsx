"use client"

import { CheckCircle2, Download, Share2, Home, AlertCircle, Lock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { format } from "date-fns"

interface PaymentConfirmationProps {
  invoiceId: string
  invoiceNumber: string
  amount: number
  bankAccount?: string
}

export default function PaymentConfirmation({
  invoiceId,
  invoiceNumber,
  amount,
  bankAccount,
}: PaymentConfirmationProps) {
  return (
    <div className="w-full space-y-6">
      {/* Main Success Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-success/5 via-card to-card">
        <CardContent className="pt-12 pb-12">
          <div className="text-center space-y-8">
            {/* Success Icon */}
            <div className="flex justify-center">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 bg-success/20 rounded-full animate-pulse" />
                <div
                  className="absolute inset-2 bg-success/10 rounded-full animate-pulse"
                  style={{ animationDelay: "0.2s" }}
                />
                <CheckCircle2 className="w-24 h-24 text-success relative z-10" strokeWidth={1.5} />
              </div>
            </div>

            {/* Success Message */}
            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">Payment Received!</h1>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Your ACH transfer has been successfully initiated. You'll receive a confirmation email shortly.
              </p>
            </div>

            {/* Amount Display */}
            <div className="bg-success/10 border border-success/20 rounded-xl p-8 inline-block mx-auto w-full max-w-sm">
              <p className="text-sm font-semibold text-success uppercase tracking-wider mb-2">Amount Transferred</p>
              <p className="text-5xl font-bold text-success">${amount.toFixed(2)}</p>
            </div>

            {/* Payment Details */}
            <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
              <div className="bg-background/50 rounded-lg p-4 border border-border text-left">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Invoice</p>
                <p className="font-semibold text-foreground">{invoiceNumber}</p>
              </div>
              <div className="bg-background/50 rounded-lg p-4 border border-border text-left">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Date</p>
                <p className="font-semibold text-foreground">{format(new Date(), "MMM dd, yyyy")}</p>
              </div>
              {bankAccount && (
                <div className="bg-background/50 rounded-lg p-4 border border-border text-left col-span-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">From Account</p>
                  <p className="font-semibold text-foreground">{bankAccount}</p>
                </div>
              )}
            </div>

            {/* Info Boxes */}
            <div className="space-y-3 max-w-2xl mx-auto text-left">
              <div className="bg-info/5 border border-info/20 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-foreground mb-1">Processing Time</p>
                  <p className="text-muted-foreground">
                    ACH transfers typically complete within 1-2 business days. You'll be notified once the payment is
                    processed.
                  </p>
                </div>
              </div>

              <div className="bg-success/5 border border-success/20 rounded-lg p-4 flex items-start gap-3">
                <Lock className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-foreground mb-1">Your payment is secure</p>
                  <p className="text-muted-foreground">
                    All transactions are bank-grade encrypted. Your financial information is never stored on our
                    servers.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-2xl mx-auto pt-4">
              <Button asChild className="flex-1 bg-success text-success-foreground hover:opacity-90 h-11 font-semibold">
                <a href={`/api/invoices/${invoiceId}/download`}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Receipt
                </a>
              </Button>
              <Button variant="outline" className="flex-1 bg-transparent h-11 font-semibold">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>

            {/* Return to Dashboard */}
            <div>
              <Link href="/dashboard">
                <Button variant="ghost" className="text-accent hover:text-accent gap-2">
                  <Home className="w-4 h-4" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card className="border-border bg-background/50">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-foreground mb-4">Frequently Asked Questions</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium text-foreground mb-1">How long does the payment take?</p>
              <p className="text-muted-foreground">ACH transfers typically process within 1-2 business days.</p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Can I cancel the payment?</p>
              <p className="text-muted-foreground">
                Once initiated, payments cannot be cancelled. Contact support if you have concerns.
              </p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Is my payment secure?</p>
              <p className="text-muted-foreground">
                Yes. We use bank-grade encryption and PCI compliance standards to protect all transactions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
