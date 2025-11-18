"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { usePlaidLink } from "react-plaid-link"
import { CheckCircle2, Lock, Plus, Loader2, ShieldCheck, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface BankAccountLinkerV3Props {
  onAccountLinked?: (accounts: any[]) => void
  onSkip?: () => void
  showAccountsList?: boolean
}

export default function BankAccountLinkerV3({
  onAccountLinked,
  onSkip,
  showAccountsList = true,
}: BankAccountLinkerV3Props) {
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
        toast({
          title: "Success",
          description: `${data.accountsLinked || 1} account(s) linked successfully`,
          className: "bg-success/20 border-success/50 text-success",
        })
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

  const handleLinkBank = () => {
    if (linkToken) {
      open()
    } else {
      initializeLinker()
    }
  }

  const handleContinue = () => {
    if (selectedAccountId) {
      const selectedAccount = linkedAccounts.find((a) => a.id === selectedAccountId)
      if (selectedAccount) {
        onAccountLinked?.([selectedAccount])
        onSkip?.()
      }
    } else {
      onSkip?.()
    }
  }

  return (
    <div className="space-y-6 w-full">
      {/* Information Card */}
      <Card className="border-0 bg-accent/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Zap className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-foreground mb-1">Quick & Secure Connection</p>
              <p className="text-muted-foreground">
                Link your checking account in seconds. Your login credentials are never shared with us.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-accent/20">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <ShieldCheck className="w-6 h-6 text-accent" />
                Connect Your Bank Account
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Link your checking or savings account to pay via secure ACH transfer
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Display linked accounts if any */}
          {linkedAccounts.length > 0 && showAccountsList && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Connected Accounts</p>
              <div className="space-y-2">
                {linkedAccounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => setSelectedAccountId(account.id)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      selectedAccountId === account.id
                        ? "border-accent bg-accent/10"
                        : "border-border hover:border-accent/50 hover:bg-background/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle2
                            className={`w-5 h-5 flex-shrink-0 ${
                              selectedAccountId === account.id ? "text-accent" : "text-success"
                            }`}
                          />
                          <p className="font-semibold text-foreground">{account.accountName}</p>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
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
            onClick={handleLinkBank}
            disabled={loading || (linkToken ? !ready : false) || linkingInProgress}
            className="w-full bg-accent text-accent-foreground hover:opacity-90 h-12 font-semibold text-base transition-all"
            variant="default"
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

          {/* Security Information */}
          <div className="bg-info/5 border border-info/20 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Lock className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-foreground mb-1">Your data is secure</p>
                <p className="text-muted-foreground text-xs">
                  We use Plaid's bank-grade security. Your login details are encrypted and never stored on our servers.
                </p>
              </div>
            </div>
          </div>

          {/* Continue Button - Only show if we have linked accounts */}
          {linkedAccounts.length > 0 && (
            <Button onClick={handleContinue} variant="outline" className="w-full bg-transparent h-11 font-semibold">
              Continue with {linkedAccounts.find((a) => a.id === selectedAccountId)?.accountName || "Selected Account"}
            </Button>
          )}

          {/* Skip Option - Only show if no accounts linked yet */}
          {linkedAccounts.length === 0 && onSkip && (
            <Button onClick={onSkip} variant="ghost" className="w-full text-muted-foreground hover:text-foreground">
              Skip for now
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Benefits List */}
      {linkedAccounts.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border border-border bg-background/50 text-center">
            <Zap className="w-5 h-5 text-accent mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">Instant Setup</p>
            <p className="text-xs text-muted-foreground mt-1">Connect in under 60 seconds</p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-background/50 text-center">
            <ShieldCheck className="w-5 h-5 text-success mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">Bank Secure</p>
            <p className="text-xs text-muted-foreground mt-1">Military-grade encryption</p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-background/50 text-center">
            <CheckCircle2 className="w-5 h-5 text-info mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">Verified</p>
            <p className="text-xs text-muted-foreground mt-1">100% verified accounts</p>
          </div>
        </div>
      )}
    </div>
  )
}
