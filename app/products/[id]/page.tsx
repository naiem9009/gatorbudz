"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Share2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import ProductRequestModal from "@/components/product-request-modal"
import VideoPlayer from "@/components/VideoPlayer"

interface Product {
  id: string
  name: string
  description: string
  videoUrl: string
  category: string
  priceGold: number
  pricePlatinum: number
  priceDiamond: number
  status: string
}

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [showRequestModal, setShowRequestModal] = useState(false)

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${productId}`)
        const json = await res.json()
        setProduct(json)
      } catch (error) {
        console.error("Error fetching product:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [productId])
  

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

  const getUserPrice = () => {
    if (!user) return product.priceGold
    const tierPrices: Record<string, number> = {
      GOLD: product.priceGold,
      PLATINUM: product.pricePlatinum,
      DIAMOND: product.priceDiamond,
    }
    return tierPrices[user.tier] || product.priceGold
  }

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
            <VideoPlayer 
              product={product}
              autoPlay={true}
              muted={true}
              loop={true}
            />
          </div>

          {/* Product Details */}
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-accent text-xs md:text-sm font-semibold mb-2">{product.category}</p>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{product.name}</h1>
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            </div>

            {/* Pricing */}
            {(!authLoading && user) ? <div className="bg-card border border-border p-4 md:p-6 rounded-lg">
              <h2 className="text-sm font-semibold text-muted-foreground mb-4">PRICING BY TIER</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-foreground">Gold Tier:</span>
                  <span className="font-bold text-lg text-foreground">${product.priceGold.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-foreground">Platinum Tier:</span>
                  <span className="font-bold text-lg text-foreground">${product.pricePlatinum.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-foreground">Diamond Tier:</span>
                  <span className="font-bold text-lg text-foreground">${product.priceDiamond.toFixed(2)}</span>
                </div>
              </div>

              {user && (
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-2">Your Price ({user.tier}):</p>
                  <p className="text-3xl font-bold text-accent">${getUserPrice().toFixed(2)}</p>
                </div>
              )}
            </div> : <div className="bg-card border border-border p-4 md:p-6 rounded-lg">
              <p className="text-sm text-muted-foreground mt-2">Sign in to see your tiered pricing.</p>
            </div>}

            {/* CTA */}
            {authLoading ? (
              <Button disabled className="w-full py-6">
                Loading...
              </Button>
            ) : user ? (
              <Button
                onClick={() => setShowRequestModal(true)}
                className="w-full bg-accent text-accent-foreground hover:bg-white cursor-pointer py-6 text-lg"
              >
                Request Quote
              </Button>
            ) : (
              <Button
                onClick={() => router.push("/login")}
                className="w-full bg-accent text-accent-foreground hover:opacity-90 py-6 text-lg"
              >
                Sign In to Request
              </Button>
            )}

            <Button variant="outline" className="w-full bg-transparent gap-2">
              <Share2 size={20} />
              Share Product
            </Button>
          </div>
        </div>
      </div>

      {user && (
        <ProductRequestModal
          open={showRequestModal}
          onOpenChange={setShowRequestModal}
          product={product}
          userTier={user.tier}
          onSuccess={() => setShowRequestModal(false)}
        />
      )}

      <Footer />
    </main>
  )
}