"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { usePlaidLink } from "react-plaid-link"
import { CheckCircle2, Lock, Plus, Loader2, Zap, ArrowRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface BankAccountLinkerModernProps {
  onAccountLinked?: (accounts: any[]) => void
  onSkip?: () => void
}

export default function BankAccountLinkerModern({ onAccountLinked, onSkip }: BankAccountLinkerModernProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [linkedAccounts, setLinkedAccounts] = useState<any[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [linkingInProgress, setLinkingInProgress] = useState(false)
  const { toast } = useToast()

  const initializeLinker = async () => {
    try {
      setLoading(true)

      const userResponse = await fetch("/api/auth/get-session")
      const userData = await userResponse.json()

      if (!userData.user?.id) {
        toast({ title: "Error", description: "Please log in first", variant: "destructive" })
        return
      }

      setUserId(userData.user.id)

      const response = await fetch("/api/payments/plaid/create-link-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userData.user.id }),
      })

      const data = await response.json()
      if (data.linkToken) {
        setLinkToken(data.linkToken)
        setLinkingInProgress(true)
      }
    } catch (error) {
      console.error("Init error:", error)
      toast({ title: "Error", description: "Failed to initialize bank linking", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const onSuccess = async (publicToken: string, metadata: any) => {
    try {
      setLoading(true)

      const response = await fetch("/api/payments/plaid/exchange-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicToken, userId }),
      })

      const data = await response.json()

      if (data.success) {
        setLinkedAccounts(data.accounts || [])
        if (data.accounts && data.accounts.length > 0) {
          setSelectedAccountId(data.accounts[0].id)
        }
        onAccountLinked?.(data.accounts || [])
        toast({ title: "Success", description: "Account linked successfully" })
        setLinkingInProgress(false)
      } else {
        toast({ title: "Error", description: data.error || "Failed to link account", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to complete linking", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
    onExit: () => {
      setLinkToken(null)
      setLinkingInProgress(false)
    },
  })

  return (
    <div className="space-y-6">
      {/* Benefits Card */}
      <Card className="border-0 shadow-md bg-gradient-to-r from-accent/5 to-accent/10">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground mb-1">Link Your Bank Account</p>
              <p className="text-sm text-muted-foreground">
                Connect in seconds with Plaid's secure, encrypted connection. Your banking credentials are never shared.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Card */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-accent" />
                Your Bank Account
              </CardTitle>
              <CardDescription className="mt-1">Select or add a verified bank account for payment</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Linked Accounts Display */}
          {linkedAccounts.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Your Accounts</p>
              <div className="space-y-2">
                {linkedAccounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => setSelectedAccountId(account.id)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      selectedAccountId === account.id
                        ? "border-accent bg-accent/5"
                        : "border-border hover:border-accent/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {selectedAccountId === account.id ? (
                            <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-muted flex-shrink-0" />
                          )}
                          <p className="font-semibold text-foreground">{account.accountName}</p>
                        </div>
                        <p className="text-sm text-muted-foreground ml-7">
                          {account.bankName} • ••••{account.accountMask}
                        </p>
                      </div>
                      <Badge className="bg-success/20 text-success border-0 flex-shrink-0">Verified</Badge>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Link Bank Button */}
          <Button
            onClick={() => {
              if (linkToken) {
                open()
              } else {
                initializeLinker()
              }
            }}
            disabled={loading || (linkToken ? !ready : false) || linkingInProgress}
            variant={linkedAccounts.length > 0 ? "outline" : "default"}
            className={`w-full h-11 font-semibold ${
              linkedAccounts.length === 0 ? "bg-accent text-accent-foreground hover:opacity-90" : "bg-transparent"
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Initializing...
              </>
            ) : linkToken && !ready ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : linkedAccounts.length > 0 ? (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Another Account
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Link Bank Account
              </>
            )}
          </Button>

          {/* Security Info */}
          <div className="bg-info/5 border border-info/20 rounded-lg p-4">
            <p className="text-sm text-muted-foreground flex items-start gap-2">
              <Lock className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
              <span>
                <strong>Bank-grade security:</strong> We use Plaid to securely connect your bank. Your login credentials
                are never stored.
              </span>
            </p>
          </div>

          {/* Continue Button */}
          {linkedAccounts.length > 0 && (
            <Button
              onClick={() => onAccountLinked?.(linkedAccounts.filter((a) => a.id === selectedAccountId))}
              className="w-full bg-accent text-accent-foreground hover:opacity-90 h-11 font-semibold"
            >
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
