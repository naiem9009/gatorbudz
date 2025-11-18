"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import VideoCard from "./video-card"
import { useAuth } from "@/lib/auth-context"
import { Crown, Star, Zap } from "lucide-react"
import { getCategory } from "@/lib/utils"
import { Badge } from "./ui/badge"

interface Product {
  id: string
  name: string
  category: string
  priceGold?: number
  pricePlatinum?: number
  priceDiamond?: number
  videoUrl: string
  description: string
  slug: string
}

interface VideoGridProps {
  category: string
}

interface CategoryData {
  name: string
  description: string
  icon: string
  products: Product[]
}

// Default category metadata with fallbacks
const defaultCategoryMetadata: {[key: string]: {description: string; icon: string}} = {
  
  "Super Exotics": {
    description: "Premium Super Exotics selection",
    icon: "🔥"
  },
  "Premium Exotics": {
    description: "Premium Exotics selection",
    icon: "🔥"
  },
  "": {
    description: "",
    icon: "🍬"
  },
  "": {
    description: "",
    icon: "💧"
  },
  "": {
    description: "",
    icon: "🧴"
  }
}

// Price display component based on user tier
const PriceDisplay = ({ product, userTier, role }: { product: Product; userTier: string, role: string }) => {
  
  
  const getPriceForTier = useCallback(() => {
    switch (userTier) {
      case "DIAMOND":
        return product.priceDiamond
      case "PLATINUM":
        return product.pricePlatinum
      case "GOLD":
      default:
        return product.priceGold
    }
    
  }, [product, userTier])

  const getTierIcon = useCallback((tier: string) => {
    switch (tier) {
      case "DIAMOND":
        return <Crown className="w-3 h-3" />
      case "PLATINUM":
        return <Zap className="w-3 h-3" />
      case "GOLD":
      default:
        return <Star className="w-3 h-3" />
    }
  }, [])

  const price = getPriceForTier()
  
  if (!price && price !== 0) {
    return (
      <div className="text-sm text-muted-foreground">
        {role === "PUBLIC" ? "Contact the admin to verify your account and enable full access" : "Login to view prices"}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 text-accent font-semibold">
        {getTierIcon(userTier)}
        <span>${price.toFixed(2)}</span>
      </div>
      <Badge variant="outline" className="text-xs">
        {userTier}
      </Badge>
    </div>
  )
}


// Memoized loading skeleton component
const LoadingSkeleton = () => (
  <div className="w-full space-y-12">
    {Array.from({ length: 3 }).map((_, sectionIndex) => (
      <div key={sectionIndex} className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-muted rounded-lg animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 bg-muted rounded w-48 animate-pulse" />
            <div className="h-4 bg-muted rounded w-64 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-muted rounded-lg aspect-video animate-pulse" />
          ))}
        </div>
      </div>
    ))}
  </div>
)




// Memoized category section component
const CategorySection = React.memo(({ section, userTier, role }: { section: CategoryData; userTier: string, role: string }) => {
  const getCategoryMetadata = useCallback((categoryName: string) => {
    return defaultCategoryMetadata[getCategory(categoryName)] || {
      description: `Explore our ${getCategory(categoryName)} collection`,
      // icon: "📦"
    }
  }, [])

  const metadata = getCategoryMetadata(getCategory(section.name))



  // Enhanced VideoCard with tier pricing
  const EnhancedVideoCard = useCallback(({ product}: { product: Product }) => (
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      <VideoCard product={product} />
      <div className="border-t border-border">
        <PriceDisplay product={product} userTier={userTier} role={role} />
      </div>
    </div>
  ), [userTier])


  

  return (
    <section className="space-y-6">
      {/* Category Hero */}
      <div className="flex items-start gap-4 p-6 bg-card rounded-lg border border-border">
        <div className="text-3xl">{metadata.icon}</div>
        <div className="flex-1">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            {getCategory(section.name).toUpperCase()}
          </h2>
          <p className="text-muted-foreground mt-2">
            {metadata.description}
          </p>
          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
            <span>{section.products.length} products</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              {userTier} Tier Pricing
            </span>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {section.products.map((product) => (
          <EnhancedVideoCard 
            key={product.id} 
            product={product} 
          />
        ))}
      </div>
    </section>
  )
})

CategorySection.displayName = 'CategorySection'

export default function VideoGrid({ category }: VideoGridProps) {
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  // Get user tier for price display
  const userTier = user?.tier || "GOLD"

  // Optimized Intersection Observer for autoplay
  useEffect(() => {
    let observer: IntersectionObserver | null = null

    const initializeObserver = () => {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const videoElement = entry.target as HTMLVideoElement
            
            if (entry.isIntersecting) {
              // Play video when it enters viewport
              videoElement.play().catch(err => {
                console.log('Autoplay prevented:', err)
                // Fallback: add play button for user interaction
                videoElement.setAttribute('data-needs-interaction', 'true')
              })
            } else {
              // Pause and reset video when it leaves viewport
              videoElement.pause()
              videoElement.currentTime = 0
            }
          })
        },
        { 
          rootMargin: '100px 0px', // Start loading 100px before entering viewport
          threshold: 0.1 
        }
      )

      // Observe all video elements
      const videoElements = document.querySelectorAll('video[data-autoplay]')
      videoElements.forEach(el => observer!.observe(el))
    }

    // Initialize observer after a small delay
    const timeoutId = setTimeout(initializeObserver, 300)

    return () => {
      clearTimeout(timeoutId)
      observer?.disconnect()
    }
  }, [categoryData])

  // Memoized fetch function
  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const url = category && category !== "All" 
        ? `/api/products?category=${encodeURIComponent(category)}` 
        : "/api/products"
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Handle both array response and object with products property
      const productsArray = Array.isArray(data) ? data : (data.products || [])
      
      if (category === "All") {
        // Group products by category for "All" view
        const groupedByCategory = productsArray.reduce((acc: {[key: string]: Product[]}, product: Product) => {
          if (!acc[product.category]) {
            acc[product.category] = []
          }
          acc[product.category].push(product)
          return acc
        }, {})
        
        // Create sections for each category
        const sections = Object.entries(groupedByCategory).map(([categoryName, products]) => {
          const metadata = defaultCategoryMetadata[getCategory(categoryName)] || {
            description: `Explore our ${getCategory(categoryName)} collection`,
            icon: "📦"
          }
          
          return {
            name: categoryName,
            description: metadata.description,
            icon: metadata.icon,
            products: products as Product[]
          }
        })
        
        setCategoryData(sections)
      } else {
        // Single category view
        const metadata = defaultCategoryMetadata[getCategory(category)] || {
          description: `Explore our ${getCategory(category)} collection`,
          icon: "📦"
        }
        
        setCategoryData([{
          name: category,
          description: metadata.description,
          icon: metadata.icon,
          products: productsArray
        }])
      }
    } catch (error) {
      console.error("Failed to fetch products:", error)
      setError("Failed to load products. Please try again.")
      setCategoryData([])
    } finally {
      setLoading(false)
    }
  }, [category])
  

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  if (loading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return (
      <div className="w-full text-center py-12">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-destructive mb-4">{error}</p>
          <button
            onClick={fetchProducts}
            className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (categoryData.length === 0) {
    return (
      <div className="w-full text-center py-12">
        <div className="bg-card border border-border rounded-lg p-8 max-w-md mx-auto">
          <div className="w-12 h-12 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
            <span className="text-2xl">📦</span>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No Products Found</h3>
          <p className="text-muted-foreground">
            {category === "All" 
              ? "No products are currently available."
              : `No products found in the ${category} category.`
            }
          </p>
        </div>
      </div>
    )
  }

  

  return (
    <div className="w-full space-y-12">
      {categoryData.map((section) => (
        <CategorySection 
          key={section.name} 
          section={section} 
          userTier={userTier}
          role={user?.role!}
        />
      ))}
    </div>
  )
}
