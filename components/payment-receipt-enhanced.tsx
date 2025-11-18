"use client"

import {
  CheckCircle2,
  Download,
  Share2,
  Home,
  AlertCircle,
  Lock,
  Clock,
  FileText,
  ArrowRight,
  Copy,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { format } from "date-fns"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface PaymentReceiptEnhancedProps {
  invoiceId: string
  invoiceNumber: string
  amount: number
  bankAccount?: string
  transferDate?: string
  referenceId?: string
  estimatedDelivery?: string
}

export default function PaymentReceiptEnhanced({
  invoiceId,
  invoiceNumber,
  amount,
  bankAccount,
  transferDate,
  referenceId,
  estimatedDelivery,
}: PaymentReceiptEnhancedProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleCopyReference = () => {
    if (referenceId) {
      navigator.clipboard.writeText(referenceId)
      setCopied(true)
      toast({ description: "Reference ID copied to clipboard" })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const displayDate = transferDate
    ? format(new Date(transferDate), "MMMM dd, yyyy")
    : format(new Date(), "MMMM dd, yyyy")
  const deliveryDate = estimatedDelivery || format(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), "MMMM dd, yyyy")

  return (
    <div className="w-full space-y-6">
      <Card className="border-0 shadow-xl bg-gradient-to-br from-success/5 via-card to-card overflow-hidden">
        <CardContent className="pt-12 pb-12">
          <div className="text-center space-y-8">
            {/* Success Icon Animation */}
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
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">Payment Confirmed!</h1>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Your ACH transfer has been successfully initiated and will arrive shortly.
              </p>
            </div>

            {/* Amount Display */}
            <div className="bg-success/10 border border-success/20 rounded-2xl p-8 inline-block mx-auto w-full max-w-sm">
              <p className="text-sm font-semibold text-success uppercase tracking-wider mb-2">Amount Transferred</p>
              <p className="text-5xl font-bold text-success">${amount.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Receipt Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-accent" />
              Receipt Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-sm text-muted-foreground">Invoice Number</span>
                <span className="font-semibold text-foreground text-right">{invoiceNumber}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between items-start">
                <span className="text-sm text-muted-foreground">Payment Date</span>
                <span className="font-semibold text-foreground">{displayDate}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between items-start">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className="font-bold text-success text-lg">${amount.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-info" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-sm text-muted-foreground">Initiated</span>
                <Badge className="bg-success/20 text-success border-0 text-xs">Just now</Badge>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between items-start">
                <span className="text-sm text-muted-foreground">Estimated Delivery</span>
                <span className="font-semibold text-foreground">{deliveryDate}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between items-start">
                <span className="text-sm text-muted-foreground">Processing</span>
                <span className="text-xs text-muted-foreground">1-2 business days</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Source Card */}
      {bankAccount && (
        <Card className="border-success/20 bg-success/5">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">Payment Source</p>
            <p className="font-semibold text-foreground text-lg">{bankAccount}</p>
            <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Securely connected via Plaid
            </p>
          </CardContent>
        </Card>
      )}

      {/* Reference ID Card */}
      {referenceId && (
        <Card className="border-border">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-3">Reference Number</p>
            <div className="flex items-center gap-2 bg-background/50 p-3 rounded-lg border border-border">
              <code className="flex-1 font-mono text-sm font-semibold text-foreground break-all">{referenceId}</code>
              <Button size="sm" variant="ghost" onClick={handleCopyReference} className="flex-shrink-0 h-8 w-8 p-0">
                <Copy className={`w-4 h-4 ${copied ? "text-success" : "text-muted-foreground"}`} />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Keep this reference number for your records and support inquiries.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Information Boxes */}
      <div className="space-y-3">
        <div className="bg-info/5 border border-info/20 rounded-lg p-4 flex items-start gap-3">
          <Clock className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-foreground mb-1">When will it arrive?</p>
            <p className="text-muted-foreground">
              ACH transfers typically complete within 1-2 business days. Weekends and holidays may add extra time.
            </p>
          </div>
        </div>

        <div className="bg-success/5 border border-success/20 rounded-lg p-4 flex items-start gap-3">
          <Lock className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-foreground mb-1">Your payment is secure</p>
            <p className="text-muted-foreground">
              All transactions are encrypted with bank-grade security. Your financial information is never stored on our
              servers.
            </p>
          </div>
        </div>

        <div className="bg-warning/5 border border-warning/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-foreground mb-1">Need help?</p>
            <p className="text-muted-foreground">
              If you don't see the payment in your account after 3 business days, contact our support team with your
              reference number.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Button asChild className="bg-accent text-accent-foreground hover:opacity-90 h-11 font-semibold">
          <a href={`/api/invoices/${invoiceId}/download`}>
            <Download className="w-4 h-4 mr-2" />
            Download Receipt
          </a>
        </Button>
        <Button variant="outline" className="bg-transparent h-11 font-semibold" onClick={handlePrint}>
          <FileText className="w-4 h-4 mr-2" />
          Print Receipt
        </Button>
        <Button variant="outline" className="bg-transparent h-11 font-semibold">
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </div>

      {/* FAQ Section */}
      <Card className="border-border bg-background/50">
        <CardHeader>
          <CardTitle className="text-base">Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-semibold text-foreground text-sm mb-1">How long does the payment take?</p>
            <p className="text-muted-foreground text-sm">
              ACH transfers typically process within 1-2 business days. If sent on a weekend or holiday, processing may
              take longer.
            </p>
          </div>
          <div className="h-px bg-border" />
          <div>
            <p className="font-semibold text-foreground text-sm mb-1">Can I cancel the payment?</p>
            <p className="text-muted-foreground text-sm">
              Once initiated, payments cannot be cancelled through our system. Contact our support team immediately if
              you need to stop the transfer.
            </p>
          </div>
          <div className="h-px bg-border" />
          <div>
            <p className="font-semibold text-foreground text-sm mb-1">Is my payment secure?</p>
            <p className="text-muted-foreground text-sm">
              Yes. We use bank-grade encryption, PCI compliance standards, and Plaid's security framework to protect all
              transactions.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Return to Dashboard */}
      <div className="flex justify-center pt-4">
        <Link href="/dashboard">
          <Button variant="ghost" className="text-accent hover:text-accent gap-2">
            <Home className="w-4 h-4" />
            Back to Dashboard
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
