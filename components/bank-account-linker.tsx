"use client"

import { useState, useCallback, useEffect } from "react"
import { usePlaidLink } from "react-plaid-link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Trash2, CheckCircle2, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface LinkedAccount {
  id: string
  accountName: string
  bankName: string
  accountMask: string
  verificationStatus: string
  createdAt: string
}

interface BankAccountLinkerProps {
  onAccountLinked?: (accounts: LinkedAccount[]) => void
}

export default function BankAccountLinker({ onAccountLinked }: BankAccountLinkerProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    initializeComponent()
  }, [])

  const initializeComponent = async () => {
    try {
      const userResponse = await fetch("/api/auth/get-session")
      const userData = await userResponse.json()

      if (userData.user?.id) {
        setUserId(userData.user.id)
        await fetchLinkedAccounts(userData.user.id)
      }
    } catch (error) {
      console.error("[v0] Init error:", error)
    } finally {
      setInitialLoadDone(true)
    }
  }

  // Get user ID and fetch link token
  const initializeLinker = async () => {
    try {
      setLoading(true)

      if (!userId) {
        const userResponse = await fetch("/api/auth/get-session")
        const userData = await userResponse.json()

        if (!userData.user?.id) {
          toast({
            title: "Error",
            description: "Please log in first",
            variant: "destructive",
          })
          return
        }
        setUserId(userData.user.id)
      }

      // Create link token
      const response = await fetch("/api/payments/plaid/create-link-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId }),
      })

      const data = await response.json()

      if (data.linkToken) {
        setLinkToken(data.linkToken)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to initialize bank linking",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Init linker error:", error)
      toast({
        title: "Error",
        description: "Failed to initialize bank linking",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle successful link
  const onSuccess = useCallback(
    async (publicToken: string, metadata: any) => {
      try {
        setLoading(true)

        const response = await fetch("/api/payments/plaid/exchange-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publicToken,
            userId,
          }),
        })

        const data = await response.json()

        if (data.success) {
          toast({
            title: "Success",
            description: `${data.accountsLinked} account(s) linked successfully`,
          })

          await new Promise((resolve) => setTimeout(resolve, 500))
          const accountsResponse = await fetch("/api/payments/plaid/accounts", {
            headers: { "x-user-id": userId || "" },
          })
          const accountsData = await accountsResponse.json()
          const accounts = accountsData.accounts || []

          setLinkToken(null)
          setLinkedAccounts(accounts)

          if (onAccountLinked) {
            onAccountLinked(accounts)
          }
        } else {
          toast({
            title: "Error",
            description: data.error || "Failed to link account",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("[v0] Link success error:", error)
        toast({
          title: "Error",
          description: "Failed to complete linking",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    },
    [userId, toast, onAccountLinked],
  )

  const onExit = (error: any, metadata: any) => {
    console.log("[v0] Plaid link exited", error, metadata)
    setLinkToken(null)
  }

  // Plaid Link hook
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
    onExit,
  })

  const fetchLinkedAccounts = async (userIdParam: string) => {
    try {
      if (!userIdParam) return

      const response = await fetch("/api/payments/plaid/accounts", {
        headers: { "x-user-id": userIdParam },
      })

      const data = await response.json()
      const accounts = data.accounts || []
      setLinkedAccounts(accounts)

      if (onAccountLinked && accounts.length > 0) {
        onAccountLinked(accounts)
      }
    } catch (error) {
      console.error("[v0] Fetch accounts error:", error)
    }
  }

  // Delete linked account
  const deleteAccount = async (accountId: string) => {
    try {
      const response = await fetch(`/api/payments/plaid/accounts/${accountId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Account removed successfully",
        })
        await fetchLinkedAccounts(userId || "")
      }
    } catch (error) {
      console.error("[v0] Delete error:", error)
      toast({
        title: "Error",
        description: "Failed to remove account",
        variant: "destructive",
      })
    }
  }

  if (!initialLoadDone) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Linked Accounts */}
      <Card className="bg-slate-800/50 backdrop-blur border border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Connected Bank Accounts</CardTitle>
          <CardDescription className="text-slate-400">
            Manage your linked bank accounts for ACH payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {linkedAccounts.length > 0 ? (
            <div className="space-y-3">
              {linkedAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:border-blue-500/50 transition"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{account.accountName}</p>
                      <p className="text-sm text-slate-400">
                        {account.bankName} • ••••{account.accountMask}
                      </p>
                      <Badge
                        variant="outline"
                        className="mt-2 text-xs border-green-500/30 bg-green-500/10 text-green-300"
                      >
                        {account.verificationStatus}
                      </Badge>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteAccount(account.id)}
                    className="p-2 hover:bg-red-500/20 rounded transition text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-3 opacity-50" />
              <p className="text-slate-400">No bank accounts linked yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Link New Account */}
      <Card className="border-blue-500/30 bg-blue-500/5 backdrop-blur border">
        <CardHeader>
          <CardTitle className="text-lg text-white">Link a New Bank Account</CardTitle>
          <CardDescription className="text-slate-400">Connect your bank account securely using Plaid</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => {
              if (linkToken && ready) {
                open()
              } else if (!linkToken) {
                initializeLinker()
              }
            }}
            disabled={loading || (linkToken ? !ready : false)}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 h-11 font-semibold"
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
            ) : (
              "Link Bank Account"
            )}
          </Button>
          <p className="text-xs text-slate-400 mt-3">
            Your bank connection is secure and encrypted. We'll never store your login credentials.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
