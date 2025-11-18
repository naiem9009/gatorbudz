"use client"

import { useState, useCallback } from "react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { ArrowLeft, CheckCircle, Crown, Star, Zap, type LucideIcon } from "lucide-react"

const TIER_ORDER = ["GOLD", "PLATINUM", "DIAMOND"] as const

type TierName = (typeof TIER_ORDER)[number]

type TierDetail = {
  name: string
  description: string
  benefits: string[]
  icon: LucideIcon
  color: string
  gradient: string
}

const isTierName = (tier: unknown): tier is TierName =>
  typeof tier === "string" && TIER_ORDER.includes(tier as TierName)

const tierDetails: Record<TierName, TierDetail> = {
  GOLD: {
    name: "Gold",
    description: "Perfect for growing businesses",
    benefits: ["Base product pricing", "Standard support"],
    icon: Star,
    color: "text-yellow-500",
    gradient: "from-yellow-400 to-yellow-600",
  },
  PLATINUM: {
    name: "Platinum",
    description: "Ideal for established businesses",
    benefits: ["Small discount on all products", "Priority support"],
    icon: Zap,
    color: "text-slate-400",
    gradient: "from-slate-400 to-slate-600",
  },
  DIAMOND: {
    name: "Diamond",
    description: "For enterprise-level partners",
    benefits: [
      "Big discount on all products",
      "24/7 premium support",
      "Custom pricing available",
    ],
    icon: Crown,
    color: "text-blue-400",
    gradient: "from-blue-400 to-purple-600",
  },
}

export default function TierUpgradePage() {
  const { user, loading } = useAuth()
  const tierOrder = TIER_ORDER
  const [selectedTier, setSelectedTier] = useState<TierName | "">("")
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const userTier = user?.tier
  const currentTierIndex = isTierName(userTier) ? tierOrder.indexOf(userTier) : 0

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTier) return

    setSubmitting(true)
    try {
      const res = await fetch("/api/tier-proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposedTier: selectedTier,
          reason,
        }),
      })

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => {
          setSuccess(false)
          setSelectedTier("")
          setReason("")
        }, 3000)
      } else {
        console.error("Failed to submit tier proposal")
      }
    } catch (error) {
      console.error("Error submitting tier proposal:", error)
    } finally {
      setSubmitting(false)
    }
  }, [selectedTier, reason])

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <Header />
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-16">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-1/4" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-96 bg-muted rounded-lg" />
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  // Auth check
  if (!user) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <Header />
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-16 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <p className="text-muted-foreground text-lg">Please log in to request a tier upgrade</p>
            <Link href="/login">
              <Button size="lg" className="bg-gradient-to-r from-accent to-accent/90 text-accent-foreground hover:opacity-90 transition-opacity">
                Go to Login
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header />

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <div className="space-y-8">
          {/* Page Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Upgrade Your Tier
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Unlock more features and better pricing as your business grows
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-full">
              <span className="text-muted-foreground">Current tier:</span>
              <Badge variant="secondary" className="bg-accent/10 text-accent font-semibold">
                {user.tier}
              </Badge>
            </div>
          </div>

          {/* Tier Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {tierOrder.map((tier, idx) => {
              const details = tierDetails[tier]
              const IconComponent = details.icon
              const isCurrentTier = tier === user.tier
              const isLowerTier = idx < currentTierIndex
              const isSelectable = !isLowerTier && !isCurrentTier

              return (
                <div
                  key={tier}
                  className={`relative transition-all duration-300 ${
                    isSelectable ? "hover:scale-105 cursor-pointer" : ""
                  } ${isLowerTier ? "opacity-60" : ""}`}
                >
                  {/* Popular Badge for Platinum */}
                  {tier === "PLATINUM" && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                      <Badge className="bg-gradient-to-r from-slate-500 to-slate-600 text-white px-4 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <Card
                    className={`h-full border-2 transition-all duration-300 relative overflow-hidden ${
                      selectedTier === tier 
                        ? `border-accent shadow-lg shadow-accent/20` 
                        : isCurrentTier
                        ? "border-green-500/50 shadow-lg shadow-green-500/10"
                        : "border-border hover:border-accent/50"
                    }`}
                    onClick={() => isSelectable && setSelectedTier(tier)}
                  >
                    {/* Gradient Top Bar */}
                    <div className={`h-2 bg-gradient-to-r ${details.gradient}`} />

                    <CardHeader className="text-center pb-4">
                      <div className="flex justify-center mb-4">
                        <div className={`p-3 rounded-full bg-muted ${details.color}`}>
                          <IconComponent size={24} />
                        </div>
                      </div>
                      <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                        {details.name}
                        {isCurrentTier && (
                          <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
                            Current
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-base">{details.description}</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      {/* Benefits List */}
                      <ul className="space-y-3">
                        {details.benefits.map((benefit, benefitIdx) => (
                          <li 
                            key={benefit} 
                            className="flex items-start gap-3 text-sm animate-fade-in"
                            style={{ animationDelay: `${benefitIdx * 100}ms` }}
                          >
                            <CheckCircle className={`w-5 h-5 ${details.color} mt-0.5 flex-shrink-0`} />
                            <span className="text-foreground">{benefit}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Action Button */}
                      {!isCurrentTier && !isLowerTier && (
                        <Button
                          variant={selectedTier === tier ? "default" : "outline"}
                          className={`w-full transition-all ${
                            selectedTier === tier 
                              ? `bg-gradient-to-r ${details.gradient} text-white shadow-lg` 
                              : "bg-transparent"
                          }`}
                          onClick={() => setSelectedTier(tier)}
                        >
                          {selectedTier === tier ? "Selected" : "Select Tier"}
                        </Button>
                      )}

                      {isLowerTier && (
                        <div className="text-center text-muted-foreground text-sm py-2">
                          Already upgraded beyond this tier
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>

          {/* Request Form */}
          {selectedTier && selectedTier !== user.tier && (
            <Card className="bg-card border-border shadow-lg animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-6 h-6 text-accent" />
                  Upgrade to {tierDetails[selectedTier]?.name}
                </CardTitle>
                <CardDescription>
                  Help us understand your needs for a smoother upgrade process
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">
                      Why are you interested in upgrading? (Optional)
                    </label>
                    <Textarea
                      placeholder="Tell us about your business needs, volume requirements, or any other relevant information that will help us process your upgrade..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={4}
                      className="resize-none transition-all focus:ring-2 focus:ring-accent/20"
                    />
                    <p className="text-xs text-muted-foreground">
                      Providing details helps us tailor the upgrade to your specific needs
                    </p>
                  </div>

                  {/* Success Message */}
                  {success && (
                    <div className="bg-green-500/10 border border-green-500/20 text-green-700 p-4 rounded-lg animate-fade-in">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Upgrade request submitted!</span>
                      </div>
                      <p className="text-sm mt-1">
                        Our team will review your request and contact you within 24 hours.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSelectedTier("")}
                      disabled={submitting}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-gradient-to-r from-accent to-accent/90 text-accent-foreground hover:opacity-90 transition-opacity shadow-lg"
                    >
                      {submitting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Submitting...
                        </div>
                      ) : (
                        "Submit Upgrade Request"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Footer />
    </main>
  )
}
