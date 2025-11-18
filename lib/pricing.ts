import type { Tier } from "@/lib/auth-context"
import { calculateOrderPrice, PRICING_TIERS, PRODUCT_CATEGORIES, PRODUCT_STRAINS } from "./pricing-utils"

export interface ProductPricing {
  priceGold: number
  pricePlatinum: number
  priceDiamond: number
}

export function getPriceForTier(pricing: ProductPricing, tier: Tier): number {
  const tierPriceMap: Record<Tier, keyof ProductPricing> = {
    GOLD: "priceGold",
    PLATINUM: "pricePlatinum",
    DIAMOND: "priceDiamond",
  }
  return pricing[tierPriceMap[tier]]
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price)
}
