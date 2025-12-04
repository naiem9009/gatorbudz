"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Share2, ArrowLeft, DollarSign, Zap, TrendingUp, Package, ShoppingCart } from 'lucide-react'
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import ProductRequestModal from "@/components/product-request-modal"
import VideoPlayer from "@/components/VideoPlayer"
import { useCart } from "@/lib/cart-context"
import Image from "next/image"
import Categories from "@/components/categories"
import Footer from "@/components/footer"

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
  weight?: string
  potency?: string
  minimumQty: number
  status: string
  slug: string
  variants: ProductVariant[]
}

export default function ProductPage() {
  const params = useParams()
  const { cartCount } = useCart()
  const router = useRouter()
  const { user, loading: authLoading, isAuthenticated } = useAuth()
  const productSlug = params.slug as string

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const { addToCart } = useCart()
  const [showAdded, setShowAdded] = useState(false)

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const searchParams = useSearchParams()

  // Read category from URL on component mount
  useEffect(() => {
    const category = searchParams.get('category')
    setSelectedCategory(category)
  }, [searchParams])

  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category)
    
    // Update URL without page reload
    const params = new URLSearchParams(searchParams.toString())
    if (category) {
      params.set('category', category)
    } else {
      params.delete('category')
    }
    
    // Update URL without triggering a full page reload
    router.replace(`/?${params.toString()}`, { scroll: false })
  }


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

    

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${productSlug}`)
        const json = await res.json()
        setProduct(json)
        // Set the first variant as selected by default
        if (json.variants && json.variants.length > 0) {
          setSelectedVariant(json.variants[0])
        }
      } catch (error) {
        console.error("Error fetching product:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [productSlug])

  const getUserPrice = (variant: ProductVariant) => {
    if (!user || !variant) return variant?.priceGold || 0
    const tierPrices: Record<string, number | undefined> = {
      GOLD: variant.priceGold,
      PLATINUM: variant.pricePlatinum,
      DIAMOND: variant.priceDiamond,
    }
    return tierPrices[user.tier] || variant.priceGold || 0
  }

  const getTierBadgeColor = (tier: string) => {
    const colors: Record<string, string> = {
      GOLD: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      PLATINUM: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      DIAMOND: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    }
    return colors[tier] || ""
  }

  const getPriceRange = () => {
    if (!product?.variants?.length) return null
    
    const allPrices = product.variants.flatMap(variant => [
      variant.priceGold,
      variant.pricePlatinum,
      variant.priceDiamond
    ]).filter(price => price !== undefined && price !== null) as number[]
    
    if (allPrices.length === 0) return null
    
    const minPrice = Math.min(...allPrices)
    const maxPrice = Math.max(...allPrices)
    
    return { min: minPrice, max: maxPrice, hasRange: minPrice !== maxPrice }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
      <header className="max-w-5xl mx-auto">
        <div className="flex items-center justify-center h-full border border-[#49B281] mt-4 md:mx-0 mx-4 p-4">
          <Image src={"/my-logo.png"} alt="Gatorbudz logo" width={600} height={400} />
        </div>
      </header>

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:gap-12 md:w-1/2 w-full mx-auto">
              <div className="aspect-video bg-muted rounded-lg" />
              <div className="space-y-4">
                <div className="h-12 bg-muted rounded w-3/4" />
                <div className="h-6 bg-muted rounded w-1/2" />
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Product Not Found</h1>
          <Link href="/products" className="text-accent hover:underline">
            Back to Products
          </Link>
        </div>
      </main>
    )
  }

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
    <main className="min-h-screen bg-background">
      <header className="max-w-5xl mx-auto">
        <div className="flex items-center justify-center h-full border border-[#49B281] mt-4 md:mx-0 mx-4 p-4">
          <Image src={"/my-logo.png"} alt="Gatorbudz logo" width={600} height={400} />
        </div>
      </header>


      <Categories selectedCategory={selectedCategory} onCategoryChange={handleCategoryChange} />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">

        <div className="grid grid-cols-1 gap-4 lg:gap-12 md:w-1/2 w-full mx-auto">
          {/* Product Video */}
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">{product.name}</h1>
          </div>
          <div className="flex flex-col gap-4">
            <div className="bg-card border border-border/50 rounded-lg overflow-hidden shadow-lg">
              <VideoPlayer 
                product={product}
                autoPlay={true}
                muted={true}
                loop={true}
              />
            </div>
          </div>

          {/* Product Details */}
          <div className="flex flex-col gap-6">
            {/* Your Price if logged in */}
            {user && user.role !== "PUBLIC" && selectedVariant && (
              <div className="pt-4 border-t border-border/30">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Your Price</p>
                <div className="flex items-center justify-between">
                  <span className="text-foreground font-semibold">{user.tier}</span>
                  <span className="text-3xl font-bold text-accent">
                    ${getUserPrice(selectedVariant).toFixed(2)}
                  </span>
                </div>
              </div>
            )}


            {/* CTA Buttons */}
            <div className="space-y-3 pt-2">
              {authLoading ? (
                <Button disabled className="w-full py-6 text-lg">
                  Loading...
                </Button>
              ) : user ? (
                user.role === "PUBLIC" ? (
                  <Button
                    disabled
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90 py-6 text-lg font-semibold shadow-lg shadow-accent/20"
                  >
                    Request Quote
                  </Button>
                ) : (
                <div className="flex flex-row gap-6 justify-center">
                  {isAuthenticated && <Link href="/cart" className="relative p-2 text-foreground hover:text-accent transition">
                    <ShoppingCart size={20} />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-accent text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {cartCount}
                      </span>
                  )}
                </Link> }
                  <button
                    onClick={handleAddToCart}
                    className="transition-all font-opensans-condensed font-semibold
                    whitespace-nowrap
                    text-sm md:text-base
                    px-3 py-2 md:px-4 md:py-2
                    min-w-[100px] md:min-w-0
                    border-2 bg-[#108632] hover:bg-[#0e6b28] text-white border-transparent" 
                    disabled={!canAddToCart}
                  >
                    {showAdded ? "Added!" : `Add to Cart - $${canAddToCart ? getCurrentPrice(selectedVariant!).toFixed(2) : '0.00'}`}
                  </button>
                </div>
                )
              ) : (
                <Button
                  onClick={() => router.push("/login")}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 py-6 text-lg font-semibold shadow-lg shadow-accent/20"
                >
                  Sign In to Request
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {user && selectedVariant && (
        <ProductRequestModal
          minimumQty={product.minimumQty}
          open={showRequestModal}
          onOpenChange={setShowRequestModal}
          product={product}
          selectedVariant={selectedVariant}
          userTier={user.tier}
          onSuccess={() => setShowRequestModal(false)}
        />
      )}

      <Footer selectedCategory={selectedCategory} onCategoryChange={handleCategoryChange} />
    </main>
  )
}