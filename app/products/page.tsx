"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, X, Filter, SortAsc, Crown, Star, Zap } from "lucide-react"
import VideoCardComponent from "@/components/video-card"
import { useAuth } from "@/lib/auth-context"
import { getCategory } from "@/lib/utils"

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
}

// Memoized loading skeleton
const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="bg-card border border-border rounded-lg overflow-hidden animate-pulse">
        <div className="aspect-video bg-muted" />
        <div className="p-4 space-y-3">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-3 bg-muted rounded w-full" />
          <div className="h-3 bg-muted rounded w-2/3" />
        </div>
      </div>
    ))}
  </div>
)

// Memoized category buttons
const CategoryButtons = ({ 
  categories, 
  selectedCategory, 
  onCategoryChange 
}: { 
  categories: readonly string[]
  selectedCategory: string
  onCategoryChange: (category: string) => void 
}) => (
  <div className="flex flex-wrap gap-2 mb-6">
    {categories.map((category) => (
      <Button
        key={category}
        onClick={() => onCategoryChange(category)}
        variant={selectedCategory === category ? "default" : "outline"}
        size="sm"
        className={`transition-all ${
          selectedCategory === category
            ? "bg-accent text-accent-foreground shadow-lg shadow-accent/20"
            : "bg-transparent border-border hover:border-accent hover:text-accent"
        }`}
      >
        {getCategory(category)}
      </Button>
    ))}
  </div>
)

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

export default function ProductsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const observerRef = useRef<IntersectionObserver | null>(null)
  const { user, loading: authLoading, isAuthenticated } = useAuth()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [localSearchTerm, setLocalSearchTerm] = useState("")

  // Get initial state from URL params
  const searchTerm = searchParams.get("search") || ""
  const selectedCategory = searchParams.get("category") || "All"
  const sortBy = searchParams.get("sort") || "name"

  // Extract unique categories from products
  const dynamicCategories = useMemo(() => {
    const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))]
    return ["All", ...uniqueCategories.sort()]
  }, [products])

  // Get user tier for price display
  const userTier = user?.tier || "GOLD"
  

  // Memoized filtered and sorted products
  const filteredProducts = useMemo(() => {
    let filtered = products

    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter((p) => p.category === selectedCategory)
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term)
      )
    }

    // Sort products based on user tier prices
    const sorted = [...filtered].sort((a, b) => {
      const getPrice = (product: Product) => {
        switch (userTier) {
          case "DIAMOND":
            return product.priceDiamond || 0
          case "PLATINUM":
            return product.pricePlatinum || 0
          case "GOLD":
          default:
            return product.priceGold || 0
        }
      }

      const priceA = getPrice(a)
      const priceB = getPrice(b)

      switch (sortBy) {
        case "price-low":
          return priceA - priceB
        case "price-high":
          return priceB - priceA
        default:
          return a.name.localeCompare(b.name)
      }
    })

    return sorted
  }, [products, searchTerm, selectedCategory, sortBy, userTier])

  // Optimized Intersection Observer for autoplay
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const videoElement = entry.target as HTMLVideoElement
          
          if (entry.isIntersecting) {
            videoElement.play().catch(() => {
              videoElement.setAttribute('data-needs-interaction', 'true')
            })
          } else {
            videoElement.pause()
            // Reset to beginning for better UX when scrolling back
            if (videoElement.currentTime > 2) {
              videoElement.currentTime = 0
            }
          }
        })
      },
      { 
        rootMargin: '50px 0px',
        threshold: 0.1 
      }
    )

    observerRef.current = observer

    const videoElements = document.querySelectorAll('video[data-autoplay]')
    videoElements.forEach(el => observer.observe(el))

    return () => observer.disconnect()
  }, [filteredProducts])

  // Update URL params
  const updateURLParams = useCallback((updates: { search?: string; category?: string; sort?: string }) => {
    const params = new URLSearchParams(searchParams)
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "All" && value !== "name") {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    
    router.replace(`/products?${params.toString()}`, { scroll: false })
  }, [router, searchParams])

  // Event handlers with useCallback
  const handleCategoryChange = useCallback((category: string) => {
    updateURLParams({ category })
  }, [updateURLParams])

  const handleSearchChange = useCallback((term: string) => {
    updateURLParams({ search: term })
  }, [updateURLParams])

  const handleSortChange = useCallback((sort: string) => {
    updateURLParams({ sort })
  }, [updateURLParams])

  const handleClearFilters = useCallback(() => {
    setLocalSearchTerm("")
    router.replace("/products", { scroll: false })
  }, [router])

  const handleRetry = useCallback(() => {
    fetchProducts()
  }, [])

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/products")
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`)
      }
      
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error("Failed to fetch products:", error)
      setError("Failed to load products. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Debounced search - prevent too many URL updates
  useEffect(() => {
    setLocalSearchTerm(searchTerm)
  }, [searchTerm])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localSearchTerm !== searchTerm) {
        handleSearchChange(localSearchTerm)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [localSearchTerm, searchTerm, handleSearchChange])

  const hasActiveFilters = searchTerm || selectedCategory !== "All"

  // Enhanced VideoCard component with tier-based pricing
  const EnhancedVideoCard = useCallback(({ product, role }: { product: Product, role:string }) => (
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      <VideoCardComponent product={product} />
      <div className="border-t border-border">
        <PriceDisplay product={product} userTier={userTier} role={role} />
      </div>
    </div>
  ), [userTier])

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Page Header */}
        <div className="mb-8 md:mb-12 text-center">
          <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent mb-4">
            Premium Products
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover our curated selection of lab-tested, premium hemp and cannabis products. 
            Quality you can trust.
          </p>
          
          {/* Tier Information */}
          {user && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full border border-accent/20">
              <Badge variant="secondary" className="bg-accent text-accent-foreground">
                {userTier} Tier
              </Badge>
              <span className="text-sm text-muted-foreground">
                Viewing {userTier.toLowerCase()} tier pricing
              </span>
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 p-6 bg-card rounded-xl border border-border shadow-sm">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              type="text"
              placeholder="Search products by name or description..."
              value={localSearchTerm}
              onChange={(e) => setLocalSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-background border-border"
            />
          </div>

          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="bg-background border-border">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <SelectValue placeholder="Category" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {dynamicCategories.map(category => (
                <SelectItem key={category} value={category}>
                  {getCategory(category)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort - Removed THCA option */}
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="bg-background border-border">
              <div className="flex items-center gap-2">
                <SortAsc className="w-4 h-4" />
                <SelectValue placeholder="Sort by" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quick Categories */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Categories</h2>
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
          <CategoryButtons 
            categories={dynamicCategories}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
          />
        </div>

        {/* Results Header */}
        {!loading && !authLoading && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 p-4 bg-card rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-sm">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'}
              </Badge>
              {hasActiveFilters && (
                <span className="text-sm text-muted-foreground">
                  Filtered from {products.length} total
                </span>
              )}
            </div>
            
            {hasActiveFilters && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Active filters:</span>
                {searchTerm && (
                  <Badge variant="outline" className="text-xs">
                    Search: "{searchTerm}"
                  </Badge>
                )}
                {selectedCategory !== "All" && (
                  <Badge variant="outline" className="text-xs">
                    Category: {getCategory(selectedCategory)}
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={handleRetry} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {/* Products Grid */}
        {loading || authLoading ? (
          <LoadingSkeleton />
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <EnhancedVideoCard 
                key={product.id} 
                product={product} 
                role={user?.role!}
              />
            ))}
          </div>
        ) : !error ? (
          <div className="text-center py-16 bg-card rounded-lg border border-border">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No products found</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {hasActiveFilters 
                ? "Try adjusting your search terms or filters to find what you're looking for."
                : "No products are currently available. Please check back later."
              }
            </p>
            {hasActiveFilters && (
              <Button onClick={handleClearFilters} variant="default">
                Clear All Filters
              </Button>
            )}
          </div>
        ) : null}
      </div>

      <Footer />
    </main>
  )
}
