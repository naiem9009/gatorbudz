"use client"

import { CheckCircle2, Download, Home, Lock, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { format } from "date-fns"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface PaymentConfirmationModernProps {
  invoiceId: string
  invoiceNumber: string
  amount: number
  bankAccount?: string
  transferDate?: string
  referenceId?: string
}

export default function PaymentConfirmationModern({
  invoiceId,
  invoiceNumber,
  amount,
  bankAccount,
  transferDate,
  referenceId,
}: PaymentConfirmationModernProps) {
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
  const deliveryDate = format(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), "MMMM dd, yyyy")

  return (
    <div className="w-full space-y-6">
      {/* Success Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 w-24 h-24 bg-success/20 rounded-full animate-pulse" />
            <CheckCircle2 className="w-24 h-24 text-success relative z-10" strokeWidth={1.5} />
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-foreground">Payment Confirmed!</h1>
          <p className="text-muted-foreground mt-2">Your ACH transfer has been successfully initiated</p>
        </div>
      </div>

      {/* Amount Card */}
      <Card className="border-0 bg-gradient-to-r from-success/10 to-success/5 shadow-lg">
        <CardContent className="pt-8 pb-8 text-center">
          <p className="text-sm font-semibold text-success uppercase tracking-wide mb-2">Amount Transferred</p>
          <p className="text-6xl font-bold text-success">${amount.toFixed(2)}</p>
        </CardContent>
      </Card>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Transaction Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex justify-between pb-3 border-b border-border">
              <span className="text-muted-foreground">Invoice</span>
              <span className="font-semibold">{invoiceNumber}</span>
            </div>
            <div className="flex justify-between pb-3 border-b border-border">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold text-success">${amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span className="font-semibold">{displayDate}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-info" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex justify-between pb-3 border-b border-border">
              <span className="text-muted-foreground">Initiated</span>
              <Badge className="bg-success/20 text-success border-0 text-xs">Today</Badge>
            </div>
            <div className="flex justify-between pb-3 border-b border-border">
              <span className="text-muted-foreground">Processing</span>
              <span className="font-semibold">1-2 Days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expected Arrival</span>
              <span className="font-semibold">{deliveryDate}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bank Account Info */}
      {bankAccount && (
        <Card className="border-0 bg-accent/5 shadow-md">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">From Account</p>
            <p className="font-semibold text-foreground text-lg">{bankAccount}</p>
          </CardContent>
        </Card>
      )}

      {/* Info Alerts */}
      <div className="space-y-3">
        <div className="bg-info/5 border border-info/20 p-4 rounded-lg flex gap-3">
          <Clock className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-foreground">Processing Time</p>
            <p className="text-muted-foreground">ACH transfers typically complete within 1-2 business days</p>
          </div>
        </div>
        <div className="bg-success/5 border border-success/20 p-4 rounded-lg flex gap-3">
          <Lock className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-foreground">Secure & Encrypted</p>
            <p className="text-muted-foreground">Bank-grade encryption protects all transaction data</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button asChild className="flex-1 bg-accent text-accent-foreground hover:opacity-90 h-11 font-semibold">
          <a href={`/api/invoices/${invoiceId}/download`}>
            <Download className="w-4 h-4 mr-2" />
            Download Receipt
          </a>
        </Button>
        <Button variant="outline" asChild className="flex-1 bg-transparent h-11 font-semibold">
          <Link href="/dashboard">
            <Home className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {/* FAQ */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-base">Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-semibold text-foreground mb-1">How long does it take?</p>
            <p className="text-muted-foreground">ACH transfers typically process within 1-2 business days</p>
          </div>
          <div className="border-t border-border pt-4">
            <p className="font-semibold text-foreground mb-1">Can I cancel?</p>
            <p className="text-muted-foreground">
              Once initiated, cancellation may not be possible. Contact support immediately if needed
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
