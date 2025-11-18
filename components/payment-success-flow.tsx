"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, AlertCircle, Download, Share2, Home } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface PaymentSuccessFlowProps {
  invoiceId: string
  amount: number
  invoiceNumber: string
  bankAccount?: string
  transferDate?: string
}

export default function PaymentSuccessFlow({
  invoiceId,
  amount,
  invoiceNumber,
  bankAccount,
  transferDate,
}: PaymentSuccessFlowProps) {
  const [status, setStatus] = useState<"processing" | "completed" | "error">("processing")
  const [timeElapsed, setTimeElapsed] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed((prev) => prev + 1)
    }, 1000)

    // Simulate status change after a few seconds
    const timeout = setTimeout(() => {
      setStatus("completed")
    }, 3000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [])

  if (status === "processing") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-2xl bg-slate-800/50 backdrop-blur border border-slate-700/50">
          <CardContent className="pt-12 pb-12">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 bg-blue-500/30 rounded-full animate-pulse" />
                  <div className="absolute inset-1 bg-blue-500/20 rounded-full animate-pulse" />
                  <Clock className="w-20 h-20 text-blue-400 absolute inset-0" />
                </div>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                  Processing Payment
                </h1>
                <p className="text-slate-400">Your ACH transfer is being processed</p>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 space-y-2">
                <p className="text-sm text-blue-300">
                  <strong>Amount:</strong> ${amount.toFixed(2)}
                </p>
                <p className="text-sm text-blue-300">
                  <strong>Invoice:</strong> {invoiceNumber}
                </p>
              </div>

              <p className="text-xs text-slate-400">
                Transfers typically complete within 1-2 business days. You'll receive an email confirmation.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900/50 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Success Card */}
        <Card className="border-0 shadow-2xl mb-6 bg-slate-800/50 backdrop-blur border border-slate-700/50">
          <CardContent className="pt-12 pb-12">
            <div className="text-center space-y-8">
              {/* Success Icon */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 w-24 h-24 bg-green-500/30 rounded-full animate-pulse" />
                  <div
                    className="absolute inset-2 w-20 h-20 bg-green-500/20 rounded-full animate-pulse"
                    style={{ animationDelay: "0.3s" }}
                  />
                  <CheckCircle2 className="w-24 h-24 text-green-400 relative z-10" strokeWidth={1.5} />
                </div>
              </div>

              {/* Main Message */}
              <div className="space-y-3">
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-300 to-emerald-300 bg-clip-text text-transparent">
                  Payment Received!
                </h1>
                <p className="text-lg text-slate-300">Thank you for your payment. We've received your transfer.</p>
              </div>

              {/* Amount Display */}
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-8 space-y-2">
                <p className="text-sm font-semibold text-green-300 uppercase tracking-wider">Amount Paid</p>
                <p className="text-5xl font-bold text-green-400">${amount.toFixed(2)}</p>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50">
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Invoice Number</p>
                  <p className="font-semibold text-white">{invoiceNumber}</p>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50">
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Payment Method</p>
                  <p className="font-semibold text-white">{bankAccount || "ACH Transfer"}</p>
                </div>
                {transferDate && (
                  <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50 col-span-2">
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Payment Date</p>
                    <p className="font-semibold text-white">{format(new Date(transferDate), "MMMM dd, yyyy")}</p>
                  </div>
                )}
              </div>

              {/* Info Box */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="font-semibold text-blue-300 text-sm">What's Next?</p>
                    <p className="text-xs text-blue-300/80">
                      We'll send you a receipt via email. Your invoice is now marked as paid.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Button
                  asChild
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                >
                  <a href={`/api/invoices/${invoiceId}/download`}>
                    <Download className="w-4 h-4 mr-2" />
                    Download Receipt
                  </a>
                </Button>
                <Button
                  variant="outline"
                  className="border-slate-600 bg-slate-700/30 text-slate-200 hover:bg-slate-600/50"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>

              {/* Home Link */}
              <div>
                <Link href="/dashboard">
                  <Button variant="ghost" className="text-slate-400 hover:text-white">
                    <Home className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Info */}
        <Card className="border-0 shadow-md bg-slate-800/50 backdrop-blur border border-slate-700/50">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-slate-300">
                <p className="font-semibold mb-1">Your payment is secure</p>
                <p>
                  All transactions are encrypted and processed through our secure payment gateway. Your financial
                  information is never stored on our servers.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
