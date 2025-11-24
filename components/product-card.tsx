"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { getPriceForTier, formatPrice } from "@/lib/pricing"
import { ShoppingCart } from 'lucide-react'
import Link from "next/link"

interface ProductCardProps {
  id: string
  name: string
  description?: string
  videoUrl: string
  category: string
  priceGold?: number
  pricePlatinum?: number
  priceDiamond?: number
  subcategory?: string
  weight?: string
  potency?: string
  slug: string
  bulkDiscountGold?: number
  bulkDiscountPlatinum?: number
  bulkDiscountDiamond?: number
  suggestedRetail?: number
}

export default function ProductCard({
  id,
  name,
  description,
  videoUrl,
  category,
  priceGold,
  pricePlatinum,
  priceDiamond,
  subcategory,
  weight,
  potency,
  slug,
  suggestedRetail,
}: ProductCardProps) {
  const { user, isAuthenticated } = useAuth()
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToCart = async () => {
    if (!isAuthenticated || !user) return

    setIsAdding(true)
    try {
      const price = getPriceForTier(
        { priceGold: priceGold || 0, pricePlatinum: pricePlatinum || 0, priceDiamond: priceDiamond || 0 },
        user.tier,
      )

      await fetch("/api/order-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: id,
          quantity: 1,
          unitPrice: price,
        }),
      })
    } catch (error) {
      console.error("Failed to add to cart:", error)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:border-accent transition">
      {/* Video Container */}
      <div className="aspect-video bg-muted relative">
        <iframe src={videoUrl} className="w-full h-full" allowFullScreen title={name} />
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-accent uppercase">{category}</span>
          {subcategory && (
            <span className="text-xs font-semibold text-muted-foreground uppercase">{subcategory}</span>
          )}
        </div>
        <h3 className="text-lg font-bold text-foreground mb-1">{name}</h3>
        {weight && <p className="text-xs text-muted-foreground">{weight}</p>}
        {potency && <p className="text-xs text-muted-foreground">Potency: {potency}</p>}
        {description && <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{description}</p>}

        {/* Pricing Section */}
        {isAuthenticated && user && priceGold && pricePlatinum && priceDiamond ? (
          <div className="space-y-4">
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Your Tier Price</p>
              <p className="text-2xl font-bold text-accent">
                {formatPrice(getPriceForTier({ priceGold, pricePlatinum, priceDiamond }, user.tier))}
              </p>
              {suggestedRetail && suggestedRetail > 0 && (
                <p className="text-xs text-yellow-400 mt-1">Retail: {formatPrice(suggestedRetail)}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAddToCart}
                disabled={isAdding}
                className="flex-1 bg-accent text-accent-foreground hover:opacity-90 gap-2"
              >
                <ShoppingCart size={18} />
                {isAdding ? "Adding..." : "Add"}
              </Button>
              <Link href={`/products/${slug}`} className="flex-1">
                <Button variant="outline" className="w-full bg-transparent">
                  Details
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-muted p-3 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              {isAuthenticated ? "Sign in to see pricing" : "Sign in to view pricing"}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
