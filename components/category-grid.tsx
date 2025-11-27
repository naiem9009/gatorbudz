"use client"

import React, { useState, useEffect, useCallback } from "react"
import VideoCard from "./video-card"
import { useAuth } from "@/lib/auth-context"
import { getCategory } from "@/lib/utils"
import AccessRequestWholesale from "./access-request-wholesale"

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

interface CategoryGridProps {
  category: string | null
  onCategoryChange?: (category: string | null) => void
}

interface CategoryData {
  name: string
  displayName: string
  products: Product[]
}

const LoadingSkeleton = () => (
  <div className="w-full space-y-8 mt-5">
    <div className="border border-[#F11D8A] max-w-5xl mx-auto p-4">
      <div className="flex flex-wrap justify-center gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse min-w-[120px]"
          />
        ))}
      </div>
    </div>


    {Array.from({ length: 3 }).map((_, sectionIndex) => (
      <div key={sectionIndex} className="space-y-6">
        <div className="border border-[#F11D8A] p-6">
          <div className="flex justify-center mb-6">
            <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse w-64" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-lg overflow-hidden animate-pulse"
              >
                <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer" />
                </div>
              
              </div>
            ))}
          </div>
        </div>
      </div>
    ))}
  </div>
)

const CategorySection = React.memo(({ section, userTier, role }: { section: CategoryData; userTier: string, role: string }) => {
  return (
    <section className="space-y-6">
      <div className="border border-[#F11D8A] p-3 md:p-4">
        <div className="flex-1">
          <h2 className="text-4xl md:text-5xl font-semibold text-accent uppercase tracking-wide font-opensans-condensed text-center mb-5">
            {section.displayName}
          </h2>
        </div>

        <div className="grid grid-cols-4 gap-2 md:gap-3">
          {section.products.map((product) => (
            <div key={product.id} className="bg-card border border-border overflow-hidden hover:shadow-lg transition-shadow">
              <VideoCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
})

CategorySection.displayName = 'CategorySection'

export default function CategoryGrid({ category, onCategoryChange }: CategoryGridProps) {
  const [allCategoryData, setAllCategoryData] = useState<CategoryData[]>([])
  const [filteredCategoryData, setFilteredCategoryData] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const userTier = user?.tier || "GOLD"

  // Define the exact category order
  const categoryOrder = [
    "SUPER_EXOTICS",
    "PREMIUM_EXOTICS", 
    "EXOTICS",
    "LIVING_SOIL",
    "COMMERCIAL_INDOORS",
    "FRESH_DEPS",
    "DEPS"
  ]

  // Fetch all categories initially
  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/products")
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`)
      }
      
      const data = await response.json()
      const productsArray = Array.isArray(data) ? data : (data.products || [])
      
      // Group by category
      const groupedByCategory = productsArray.reduce((acc: {[key: string]: Product[]}, product: Product) => {
        if (!acc[product.category]) {
          acc[product.category] = []
        }
        acc[product.category].push(product)
        return acc
      }, {})
      
      // Create sections and sort by predefined order
      const sections = Object.entries(groupedByCategory)
        .map(([categoryName, products]) => ({
          name: categoryName,
          displayName: getCategory(categoryName).toUpperCase(),
          products: products as Product[]
        }))
        .sort((a, b) => {
          const indexA = categoryOrder.indexOf(a.name)
          const indexB = categoryOrder.indexOf(b.name)
          
          // If both categories are in the predefined order, sort by that order
          if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB
          }
          
          // If only A is in predefined order, it comes first
          if (indexA !== -1) return -1
          
          // If only B is in predefined order, it comes first  
          if (indexB !== -1) return 1
          
          // If neither are in predefined order, sort alphabetically
          return a.name.localeCompare(b.name)
        })
      
      setAllCategoryData(sections)
      setFilteredCategoryData(sections) // Initially show all
    } catch (error) {
      console.error("Failed to fetch products:", error)
      setError("Failed to load products. Please try again.")
      setAllCategoryData([])
      setFilteredCategoryData([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Filter categories when category prop changes
  useEffect(() => {
    if (category === null) {
      setFilteredCategoryData(allCategoryData)
    } else {
      const filtered = allCategoryData.filter(section => section.name === category)
      setFilteredCategoryData(filtered)
    }
  }, [category, allCategoryData])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleCategoryClick = (categoryName: string) => {
    if (onCategoryChange) {
      // Toggle: if clicking the same category, clear filter (set to null)
      if (category === categoryName) {
        onCategoryChange(null)
      } else {
        onCategoryChange(categoryName)
      }
    }
  }

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

  if (allCategoryData.length === 0) {
    return (
      <div className="w-full text-center py-12">
        <div className="bg-card border border-border rounded-lg p-8 max-w-md mx-auto">
          <div className="w-12 h-12 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
            <span className="text-2xl">📦</span>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No Products Found</h3>
          <p className="text-muted-foreground">
            No products are currently available.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-5">
      {/* Category Filter Buttons */}
      <div className="border border-[#F11D8A] max-w-5xl mx-auto p-2 mt-6">
        <div className="flex flex-wrap justify-center gap-2">
          {allCategoryData.map((section) => (
            <button
              key={section.name}
              onClick={() => handleCategoryClick(section.name)}
              className={`
                transition-all font-opensans-condensed font-semibold
                whitespace-nowrap
                text-sm sm:text-base
                px-3 py-2 sm:px-4 sm:py-2
                m-1 sm:m-2
                min-w-[100px] sm:min-w-0
                ${
                  category === section.name
                    ? "bg-[#F11D8A] text-white border-2 border-white"
                    : "bg-[#108632] hover:bg-[#0e6b28] text-white"
                }
              `}
            >
              {getCategory(section.name)}
            </button>
          ))}
        </div>
      </div>

      <AccessRequestWholesale />

      {/* Show filtered category sections */}
      {filteredCategoryData.length === 0 ? (
        <div className="w-full text-center py-12">
          <div className="bg-card border border-border rounded-lg p-8 max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-foreground mb-2">No Products Found</h3>
            <p className="text-muted-foreground">
              No products found in the {category} category.
            </p>
          </div>
        </div>
      ) : (
        filteredCategoryData.map((section) => (
          <CategorySection 
            key={section.name} 
            section={section} 
            userTier={userTier}
            role={user?.role!}
          />
        ))
      )}
    </div>
  )
}