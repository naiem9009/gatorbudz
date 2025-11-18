"use client"

import { CheckCircle2, Download, Share2, Home, Lock, Clock, Copy, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { format } from "date-fns"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface PaymentConfirmationReceiptProps {
  invoiceId: string
  invoiceNumber: string
  amount: number
  bankAccount?: string
  transferDate?: string
  referenceId?: string
  estimatedDelivery?: string
  recipientBank?: string
  last4?: string
}

export default function PaymentConfirmationReceipt({
  invoiceId,
  invoiceNumber,
  amount,
  bankAccount,
  transferDate,
  referenceId,
  estimatedDelivery,
  recipientBank,
  last4,
}: PaymentConfirmationReceiptProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleCopyReference = () => {
    if (referenceId) {
      navigator.clipboard.writeText(referenceId)
      setCopied(true)
      toast({ description: "Reference ID copied" })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const displayDate = transferDate
    ? format(new Date(transferDate), "MMMM dd, yyyy")
    : format(new Date(), "MMMM dd, yyyy")
  const deliveryDate = estimatedDelivery || format(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), "MMMM dd, yyyy")

  return (
    <div className="w-full space-y-6">
      {/* Success Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 bg-success/20 rounded-full animate-pulse" />
            <CheckCircle2 className="w-20 h-20 text-success relative z-10" strokeWidth={1.5} />
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-foreground">Payment Confirmed</h1>
          <p className="text-muted-foreground mt-2">Your transfer has been successfully initiated</p>
        </div>
      </div>

      {/* Amount Highlight */}
      <Card className="border-0 bg-success/5">
        <CardContent className="pt-8 pb-8 text-center">
          <p className="text-sm font-semibold text-success uppercase tracking-wider mb-2">Amount Transferred</p>
          <p className="text-6xl font-bold text-success">${amount.toFixed(2)}</p>
        </CardContent>
      </Card>

      {/* Transaction Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Transaction Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Invoice</span>
              <span className="font-semibold">{invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold text-success">${amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span className="font-semibold">{displayDate}</span>
            </div>
            {referenceId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference</span>
                <code className="font-mono text-xs bg-background px-2 py-1 rounded">{referenceId.slice(0, 12)}...</code>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Initiated</span>
              <Badge className="bg-success/20 text-success border-0 text-xs">Today</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Processing</span>
              <span className="font-semibold">1-2 days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Arrival</span>
              <span className="font-semibold">{deliveryDate}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bank Details */}
      {bankAccount && (
        <Card className="border-accent/20 bg-accent/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Wallet className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">From Account</p>
                <p className="font-semibold text-foreground">{bankAccount}</p>
                {last4 && <p className="text-sm text-muted-foreground mt-1">Ending in {last4}</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reference Number */}
      {referenceId && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-3">Reference Number</p>
            <div className="flex items-center gap-2 bg-background p-3 rounded-lg border border-border">
              <code className="flex-1 font-mono text-sm">{referenceId}</code>
              <Button size="sm" variant="ghost" onClick={handleCopyReference} className="h-8 w-8 p-0">
                <Copy className={`w-4 h-4 ${copied ? "text-success" : ""}`} />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Save for your records</p>
          </CardContent>
        </Card>
      )}

      {/* Info Alerts */}
      <div className="space-y-3">
        <div className="bg-info/5 border border-info/20 p-4 rounded-lg flex gap-3">
          <Clock className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-foreground">Expected Arrival</p>
            <p className="text-muted-foreground">Your payment will arrive by {deliveryDate}</p>
          </div>
        </div>
        <div className="bg-success/5 border border-success/20 p-4 rounded-lg flex gap-3">
          <Lock className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-foreground">Secure Transfer</p>
            <p className="text-muted-foreground">Encrypted and protected by bank-grade security</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button asChild className="flex-1 bg-accent text-accent-foreground hover:opacity-90">
          <a href={`/api/invoices/${invoiceId}/download`}>
            <Download className="w-4 h-4 mr-2" />
            Download Receipt
          </a>
        </Button>
        <Button variant="outline" className="flex-1 bg-transparent">
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </div>

      {/* FAQ */}
      <Card className="bg-background/50">
        <CardHeader>
          <CardTitle className="text-base">Questions?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-semibold mb-1">When will I see this payment?</p>
            <p className="text-muted-foreground">ACH transfers take 1-2 business days.</p>
          </div>
          <div>
            <p className="font-semibold mb-1">Can I cancel?</p>
            <p className="text-muted-foreground">Contact support immediately if needed.</p>
          </div>
        </CardContent>
      </Card>

      {/* Return Link */}
      <div className="text-center">
        <Link href="/dashboard">
          <Button variant="ghost" className="text-accent">
            <Home className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  )
}
