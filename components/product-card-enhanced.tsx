"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { getPriceForTier, formatPrice, PRICING_TIERS } from "@/lib/pricing-utils"
import { ShoppingCart, Info } from 'lucide-react'
import Link from "next/link"
import BulkDiscountBadge from "./bulk-discount-badge"

interface ProductCardEnhancedProps {
  id: string
  name: string
  description?: string
  category: string
  subcategory?: string
  videoUrl: string
  priceGold: number
  pricePlatinum: number
  priceDiamond: number
  bulkDiscountGold?: number
  bulkDiscountPlatinum?: number
  bulkDiscountDiamond?: number
  suggestedRetail?: number
  weight?: string
  potency?: string
  slug: string
}

export default function ProductCardEnhanced({
  id,
  name,
  description,
  category,
  subcategory,
  videoUrl,
  priceGold,
  pricePlatinum,
  priceDiamond,
  bulkDiscountGold = 0,
  bulkDiscountPlatinum = 0,
  bulkDiscountDiamond = 0,
  suggestedRetail = 0,
  weight = "3.5G",
  potency,
  slug,
}: ProductCardEnhancedProps) {
  const { user, isAuthenticated } = useAuth()
  const [quantity, setQuantity] = useState(10)
  const [isAdding, setIsAdding] = useState(false)

  const tierPrice = getPriceForTier(
    {
      priceGold,
      pricePlatinum,
      priceDiamond,
      bulkDiscountGold,
      bulkDiscountPlatinum,
      bulkDiscountDiamond,
    },
    user?.tier || "GOLD",
    quantity
  )

  const bulkDiscount = quantity >= 10 ? (user?.tier === "GOLD" ? bulkDiscountGold : user?.tier === "PLATINUM" ? bulkDiscountPlatinum : bulkDiscountDiamond) : 0

  const handleAddToCart = async () => {
    if (!isAuthenticated || !user) return

    setIsAdding(true)
    try {
      // Implementation for adding to cart
      console.log("Adding to cart:", { id, quantity, price: tierPrice })
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:border-accent transition-all group">
      {/* Video Container */}
      <div className="aspect-video bg-muted relative overflow-hidden">
        <iframe
          src={videoUrl}
          className="w-full h-full group-hover:scale-105 transition-transform"
          allowFullScreen
          title={name}
        />
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Category & Strain */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-accent uppercase tracking-wide">
            {category}
          </span>
          {subcategory && (
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              {subcategory}
            </span>
          )}
        </div>

        {/* Product Name & Weight */}
        <div>
          <h3 className="text-sm font-bold text-foreground line-clamp-2">
            {name}
          </h3>
          {weight && (
            <p className="text-xs text-muted-foreground">{weight}</p>
          )}
        </div>

        {/* Potency */}
        {potency && (
          <div className="flex items-center gap-1">
            <Info size={14} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{potency}</span>
          </div>
        )}

        {/* Pricing Section */}
        {isAuthenticated && user ? (
          <div className="space-y-3 pt-2 border-t border-border">
            {/* Bulk Info */}
            <div className="flex items-center gap-2 text-xs bg-green-500/10 border border-green-500/20 rounded px-2 py-1">
              <span className="font-semibold text-green-600">Min 10 units</span>
              {bulkDiscount > 0 && (
                <span className="text-green-600">• {bulkDiscount}% off</span>
              )}
            </div>

            {/* Price Display */}
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">
                {user.tier} Tier Price
              </p>
              <p className="text-2xl font-bold text-accent">
                {formatPrice(tierPrice)}
              </p>
              {suggestedRetail > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Retail: ${suggestedRetail}
                </p>
              )}
            </div>

            {/* Bulk Discount Badge */}
            {bulkDiscount > 0 && (
              <BulkDiscountBadge
                quantity={quantity}
                discount={bulkDiscount}
                originalPrice={getPriceForTier(
                  { priceGold, pricePlatinum, priceDiamond, bulkDiscountGold, bulkDiscountPlatinum, bulkDiscountDiamond },
                  user.tier,
                  1
                )}
              />
            )}

            {/* Action Button */}
            <Button
              onClick={handleAddToCart}
              disabled={isAdding}
              className="w-full bg-accent text-accent-foreground hover:opacity-90 gap-2"
            >
              <ShoppingCart size={16} />
              {isAdding ? "Adding..." : "Add to Cart"}
            </Button>

            {/* View Details Link */}
            <Link href={`/products/${slug}`} className="block">
              <Button
                variant="outline"
                className="w-full bg-transparent text-accent border-accent hover:bg-accent/5"
              >
                View Details
              </Button>
            </Link>
          </div>
        ) : (
          <div className="bg-muted p-3 rounded-lg text-center">
            <p className="text-xs text-muted-foreground">
              Sign in to view pricing
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
