"use client"

import Link from "next/link"
import { useState, useCallback, memo } from "react"
import { useCart } from "@/lib/cart-context"
import VideoPlayer from "./VideoPlayer"
import { useAuth } from "@/lib/auth-context"

interface ProductVariant {
  id: string
  subcategory: string
  priceGold?: number
  pricePlatinum?: number
  priceDiamond?: number
}

interface Product {
  id: string
  name: string
  description: string
  videoUrl: string
  category: string
  slug: string
  weight?: string
  potency?: string
  minimumQty: number
  variants: ProductVariant[]
}

const VideoCardComponent = memo(({ product }: { product: Product }) => {
  const { user, isAuthenticated } = useAuth()
  const [showAdded, setShowAdded] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const { addToCart } = useCart()

  // Set default variant on mount
  useState(() => {
    if (product.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0])
    }
  })

  const handleAddToCart = useCallback(() => {
    try {
      if (selectedVariant) {
        addToCart(product, selectedVariant, 1)
        setShowAdded(true)
        setTimeout(() => setShowAdded(false), 2000)
      }
    } catch (error) {
      console.error("Error adding to cart:", error)
    }
  }, [product, selectedVariant, addToCart])

  const variantCount = product.variants?.length || 0
  const hasVariants = variantCount > 0

  // Get price for current user tier
  const getCurrentPrice = (variant: ProductVariant) => {
    if (!user) return 0
    switch (user.tier) {
      case "DIAMOND": return variant.priceDiamond || 0
      case "PLATINUM": return variant.pricePlatinum || 0
      case "GOLD": 
      default: return variant.priceGold || 0
    }
  }

  const canAddToCart = selectedVariant && getCurrentPrice(selectedVariant) > 0

  return (
    <div className="group overflow-hidden">
      {/* Video Player with Autoplay */}
      <Link href={`/products/${product.slug}`} prefetch={false}>
        <h3 className="font-bold text-foreground mb-1 line-clamp-2 hover:text-accent transition text-sm md:text-base text-center truncate font-myriad">
          {product.name} 
        </h3>
        <VideoPlayer product={product} />
        {/* Product Info */}
        <div className="p-3 md:p-4 space-y-2">
          {/* Variant Count Badge */}
          {/* {hasVariants && (
            <Badge variant="secondary" className="text-xs">
              {variantCount} strain{variantCount > 1 ? 's' : ''}
            </Badge>
          )} */}
          
          {/* Product Specs */}
          {/* <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {product.weight && <span>{product.weight}</span>}
            {product.potency && <span>• {product.potency}</span>}
            {product.minimumQty > 1 && <span>• Min {product.minimumQty}</span>}
          </div> */}
        </div>
      </Link>

      {/* Variant Selection and Add to Cart */}
      {/* {isAuthenticated && user && user.role !== "PUBLIC" && hasVariants && (
        <div className="px-3 md:px-4 pb-3 md:pb-4 space-y-2">
          {variantCount > 1 ? (
            <Select 
              value={selectedVariant?.id} 
              onValueChange={(value) => {
                const variant = product.variants.find(v => v.id === value)
                setSelectedVariant(variant || product.variants[0])
              }}
            >
              <SelectTrigger className="w-full text-xs">
                <SelectValue placeholder="Select strain" />
              </SelectTrigger>
              <SelectContent>
                {product.variants.map((variant) => (
                  <SelectItem key={variant.id} value={variant.id}>
                    {variant.subcategory}
                    {getCurrentPrice(variant) > 0 && ` - $${getCurrentPrice(variant).toFixed(2)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="text-center">
              <Badge variant="outline" className="text-xs">
                {product.variants[0].subcategory}
              </Badge>
            </div>
          )}

          <Button
            onClick={handleAddToCart}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 cursor-pointer text-xs md:text-sm"
            size="sm"
            disabled={!canAddToCart}
          >
            {showAdded ? "Added!" : `Add to Cart - $${canAddToCart ? getCurrentPrice(selectedVariant!).toFixed(2) : '0.00'}`}
          </Button>
        </div>
      )} */}
    </div>
  )
})

VideoCardComponent.displayName = 'VideoCardComponent'

export default VideoCardComponent