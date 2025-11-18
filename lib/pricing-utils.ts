import type { Tier } from "@/lib/auth-context"

export interface ProductPricing {
  priceGold: number
  pricePlatinum: number
  priceDiamond: number
  bulkDiscountGold: number
  bulkDiscountPlatinum: number
  bulkDiscountDiamond: number
}

export function getPriceForTier(
  pricing: ProductPricing,
  tier: Tier,
  quantity: number = 1
): number {
  const tierPriceMap: Record<Tier, keyof ProductPricing> = {
    GOLD: "priceGold",
    PLATINUM: "pricePlatinum",
    DIAMOND: "priceDiamond",
  }

  const bulkDiscountMap: Record<Tier, keyof ProductPricing> = {
    GOLD: "bulkDiscountGold",
    PLATINUM: "bulkDiscountPlatinum",
    DIAMOND: "bulkDiscountDiamond",
  }

  const basePrice = pricing[tierPriceMap[tier]]
  const isBulk = quantity >= 10
  const bulkDiscount = isBulk ? pricing[bulkDiscountMap[tier]] : 0

  // Apply bulk discount if applicable
  if (isBulk && bulkDiscount > 0) {
    return basePrice * (1 - bulkDiscount / 100)
  }

  return basePrice
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price)
}

export function calculateOrderPrice(
  pricing: ProductPricing,
  tier: Tier,
  quantity: number
): number {
  return getPriceForTier(pricing, tier, quantity) * quantity
}

// Pricing tier badges for display
export const PRICING_TIERS = {
  GOLD: { label: "Gold Tier", color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
  PLATINUM: { label: "Platinum Tier", color: "text-blue-400", bgColor: "bg-blue-500/10" },
  DIAMOND: { label: "Diamond Tier", color: "text-purple-500", bgColor: "bg-purple-500/10" },
}

// GatorBudz product categories
export const PRODUCT_CATEGORIES = [
  "Super Exotics",
  "Premium Exotics",
  "Exotics",
  "Living Soil Indoors",
  "Commercial Indoors",
  "Fresh Deps",
  "Deps",
]

// Strain names/subcategories
export const PRODUCT_STRAINS = ["Glades", "Cypress", "SeaGlass", "Sandbar"]
