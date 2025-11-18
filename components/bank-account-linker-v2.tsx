"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { usePlaidLink } from "react-plaid-link"
import { CheckCircle2, Lock, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface BankAccountLinkerV2Props {
  onAccountLinked?: (accounts: any[]) => void
  onSkip?: () => void
}

export default function BankAccountLinkerV2({ onAccountLinked, onSkip }: BankAccountLinkerV2Props) {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [linkedAccounts, setLinkedAccounts] = useState<any[]>([])
  const [userId, setUserId] = useState<string | null>(null)
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
      if (data.linkToken) setLinkToken(data.linkToken)
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
        onAccountLinked?.(data.accounts || [])
        toast({ title: "Success", description: `${data.accountsLinked} account(s) linked successfully` })
      } else {
        toast({ title: "Error", description: data.error || "Failed to link account", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to complete linking", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const { open, ready } = usePlaidLink({ token: linkToken, onSuccess, onExit: () => setLinkToken(null) })

  return (
    <div className="space-y-6">
      <Card className="border-2 border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-6 h-6 text-accent" />
            Connect Your Bank Account
          </CardTitle>
          <CardDescription className="text-base">
            Link your checking or savings account to pay via ACH transfer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {linkedAccounts.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Connected Accounts</p>
              {linkedAccounts.map((account) => (
                <div
                  key={account.id}
                  className="p-4 bg-success/5 border border-success/20 rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground">{account.accountName}</p>
                      <p className="text-sm text-muted-foreground">
                        {account.bankName} • ••••{account.accountMask}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-success/20 text-success border-0">Verified</Badge>
                </div>
              ))}
            </div>
          )}

          <Button
            onClick={() => {
              if (linkToken) {
                open()
              } else {
                initializeLinker()
              }
            }}
            disabled={loading || (linkToken ? !ready : false)}
            className="w-full bg-accent text-accent-foreground hover:opacity-90 h-12 font-semibold"
            variant="default"
          >
            <Plus className="w-4 h-4 mr-2" />
            {loading ? "Initializing..." : linkToken && !ready ? "Loading..." : "Link Bank Account"}
          </Button>

          <div className="bg-info/5 border border-info/20 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-2">
              <Lock className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-foreground mb-1">Bank data is secure</p>
                <p className="text-muted-foreground">
                  We use Plaid to encrypt and secure your connection. Your bank login credentials are never shared with
                  us.
                </p>
              </div>
            </div>
          </div>

          {linkedAccounts.length > 0 && (
            <Button onClick={onSkip} variant="outline" className="w-full bg-transparent">
              Continue with {linkedAccounts[0]?.accountName || "Selected Account"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
