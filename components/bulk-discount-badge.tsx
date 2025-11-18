"use client"

import { Badge } from "@/components/ui/badge"

interface BulkDiscountBadgeProps {
  quantity: number
  discount: number
  originalPrice: number
}

export default function BulkDiscountBadge({
  quantity,
  discount,
  originalPrice,
}: BulkDiscountBadgeProps) {
  if (quantity < 10 || discount <= 0) return null

  const discountedPrice = originalPrice * (1 - discount / 100)
  const savings = originalPrice - discountedPrice

  return (
    <div className="flex items-center gap-2">
      <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
        <span className="font-bold">{discount}% OFF</span>
      </Badge>
      <span className="text-xs text-muted-foreground">
        Save ${savings.toFixed(2)} per unit on orders 10+
      </span>
    </div>
  )
}
