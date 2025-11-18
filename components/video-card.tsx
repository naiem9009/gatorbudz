"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState, useCallback, memo } from "react"
import { useCart } from "@/lib/cart-context"
import VideoPlayer from "./VideoPlayer"
import { useAuth } from "@/lib/auth-context"
import { getPriceForTier } from "@/lib/pricing"
import { Badge } from "./ui/badge"

interface Product {
  id: string
  name: string
  description: string
  videoUrl: string
  category: string
  priceGold?: number
  pricePlatinum?: number
  priceDiamond?: number
  slug: string
  subcategory?: string
}

const VideoCardComponent = memo(({ product }: { product: Product }) => {
  const { user, isAuthenticated } = useAuth()
  const [showAdded, setShowAdded] = useState(false)
  const { addToCart } = useCart()
  


  const handleAddToCart = useCallback(() => {
    try {
      addToCart(product, 1)
      setShowAdded(true)
      setTimeout(() => setShowAdded(false), 2000)
    } catch (error) {
      console.error("Error adding to cart:", error)
    }
  }, [product, addToCart])

  return (
    
      <div className="group bg-card rounded-lg overflow-hidden border border-border hover:border-accent transition-all duration-300 hover:shadow-lg">
        {/* Video Player with Autoplay */}
        
        <Link href={`/products/${product.slug}`} prefetch={false}>
          <VideoPlayer product={product} />
          {/* Product Info */}
          <div className="p-3 md:p-4">
            {product.subcategory && (
              <Badge variant="outline" className="bg-green-500/20 text-foreground border-border/50">
                {product?.subcategory}
              </Badge>
            )}
            <h3 className="font-bold text-foreground mb-1 line-clamp-2 hover:text-accent transition text-sm md:text-base">
              {product.name} 
            </h3>
            

            {/* Actions */}

          </div>
        </Link>

        { isAuthenticated && user && user.role!=="PUBLIC" && <div className="flex gap-2">
          <Button
            onClick={handleAddToCart}
            className="flex-1 bg-accent text-accent-foreground hover:bg-amber-50 cursor-pointer text-xs md:text-sm"
            size="sm"
          >
            {showAdded ? "Added!" : "Add to Cart"}
          </Button> 
        </div> }
      </div>

  )
})

VideoCardComponent.displayName = 'VideoCardComponent'

export default VideoCardComponent
