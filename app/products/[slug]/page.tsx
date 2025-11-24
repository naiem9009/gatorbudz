"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from 'next/navigation'
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Share2, ArrowLeft, DollarSign, Zap, TrendingUp, Package } from 'lucide-react'
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import ProductRequestModal from "@/components/product-request-modal"
import VideoPlayer from "@/components/VideoPlayer"

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
  const router = useRouter()
  const { user, loading: authLoading, isAuthenticated } = useAuth()
  const productSlug = params.slug as string

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)

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
        <Header />
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="aspect-video bg-muted rounded-lg" />
              <div className="space-y-4">
                <div className="h-12 bg-muted rounded w-3/4" />
                <div className="h-6 bg-muted rounded w-1/2" />
              </div>
            </div>
          </div>
        </div>
        <Footer />
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
        <Footer />
      </main>
    )
  }

  const priceRange = getPriceRange()

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Back Button */}
        <Link href="/products" className="inline-flex items-center gap-2 text-accent hover:opacity-80 transition mb-8">
          <ArrowLeft size={20} />
          Back to Products
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Video */}
          <div className="flex flex-col gap-4">
            <div className="bg-card border border-border/50 rounded-lg overflow-hidden shadow-lg">
              <VideoPlayer 
                product={product}
                autoPlay={true}
                muted={true}
                loop={true}
              />
            </div>

            {/* Bulk Order Info */}
            <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 flex gap-3">
              <Zap className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-accent">Bulk Orders</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum {product.minimumQty || 10} units required per order. Contact sales for bulk pricing details.
                </p>
              </div>
            </div>

            {/* Product Specs */}
            {(product.weight || product.potency) && (
              <div className="grid grid-cols-2 gap-3 p-4 bg-primary/30 rounded-lg border border-border/30">
                {product.weight && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Weight</p>
                    <p className="text-lg font-semibold text-foreground mt-1">{product.weight}</p>
                  </div>
                )}
                {product.potency && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Potency</p>
                    <p className="text-lg font-semibold text-accent mt-1">{product.potency}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="flex flex-col gap-6">
            {/* Product Header */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="bg-accent/20 text-accent border-accent/30">
                  {product?.category?.replace(/_/g, " ")}
                </Badge>
                {product.variants && product.variants.length > 0 && (
                  <Badge variant="outline" className="bg-primary/40 text-foreground border-border/50">
                    {product.variants.length} strain{product.variants.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">{product.name}</h1>
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            </div>

            {/* Variant Selection */}
            {user?.role !== "PUBLIC" && product.variants && product.variants.length > 1 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">Select Strain:</p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <Button
                      key={variant.id}
                      variant={selectedVariant?.id === variant.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedVariant(variant)}
                      className={
                        selectedVariant?.id === variant.id 
                          ? "bg-accent text-accent-foreground" 
                          : "bg-transparent border-border/50"
                      }
                    >
                      {variant.subcategory}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Your Price if logged in */}
            {user && user.role !== "PUBLIC" && selectedVariant && (
              <div className="pt-4 border-t border-border/30">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Your Price</p>
                <div className="flex items-center justify-between">
                  <span className="text-foreground font-semibold">{user.tier} Tier</span>
                  <span className="text-3xl font-bold text-accent">
                    ${getUserPrice(selectedVariant).toFixed(2)}
                  </span>
                </div>
                {product.variants.length > 1 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    for {selectedVariant.subcategory} strain
                  </p>
                )}
              </div>
            )}

            {/* All Tier Prices */}
            {isAuthenticated && user && user.role !== "PUBLIC" && selectedVariant ? (
              <div className="space-y-3">
                <div className={`p-3 rounded-lg border ${getTierBadgeColor("GOLD")}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Gold Tier</span>
                    <span className="text-xl font-bold">
                      ${selectedVariant.priceGold?.toFixed(2) || "N/A"}
                    </span>
                  </div>
                </div>
                {selectedVariant.pricePlatinum && <div className={`p-3 rounded-lg border ${getTierBadgeColor("PLATINUM")}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Platinum Tier</span>
                    <span className="text-xl font-bold">
                      ${selectedVariant.pricePlatinum?.toFixed(2) || "N/A"}
                    </span>
                  </div> 
                </div> }
                {selectedVariant.priceDiamond && <div className={`p-3 rounded-lg border ${getTierBadgeColor("DIAMOND")}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Diamond Tier</span>
                    <span className="text-xl font-bold">
                      ${selectedVariant.priceDiamond?.toFixed(2) || "N/A"}
                    </span>
                  </div>
                </div> }
              </div> 
            ) : user?.role === "PUBLIC" ? (
              <div className="text-muted-foreground">Contact the admin to verify your account and enable order process</div>
            ) : (
              <div className="text-muted-foreground">Sign in to view tier pricing</div>
            )}

            {/* Price Range Info */}
            {priceRange && product.variants.length > 1 && (
              <div className="bg-primary/20 border border-border/30 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="w-4 h-4" />
                  <span>Price range across all strains: </span>
                  <span className="font-semibold text-foreground">
                    ${priceRange.min.toFixed(2)} - ${priceRange.max.toFixed(2)}
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
                  <Button
                    onClick={() => setShowRequestModal(true)}
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90 py-6 text-lg font-semibold shadow-lg shadow-accent/20"
                  >
                    Request Quote
                  </Button>
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

      <Footer />
    </main>
  )
}