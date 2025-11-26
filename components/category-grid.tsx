"use client"

import React, { useState, useEffect, useCallback } from "react"
import VideoCard from "./video-card"
import { useAuth } from "@/lib/auth-context"
import { getCategory } from "@/lib/utils"

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
  category: string
  onCategoryChange?: (category: string) => void
}

interface CategoryData {
  name: string
  displayName: string
  products: Product[]
}

const LoadingSkeleton = () => (
  <div className="w-full space-y-16">
    {Array.from({ length: 3 }).map((_, sectionIndex) => (
      <div key={sectionIndex} className="space-y-6">
        <div className="h-10 bg-muted rounded w-40 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-card rounded-lg aspect-video animate-pulse border border-border" />
          ))}
        </div>
      </div>
    ))}
  </div>
)

const CategorySection = React.memo(({ section, userTier, role }: { section: CategoryData; userTier: string, role: string }) => {
  return (
    <section className="space-y-6">
      <div className="flex flex-col items-center gap-2">
        <div className="flex-1">
          <h2 className="text-3xl md:text-4xl font-semibold text-accent uppercase tracking-wide font-opensans-condensed">
            {section.displayName}
          </h2>
        </div>
        {/* <div className="text-right text-sm text-muted-foreground">
          {section.products.length} products
        </div> */}
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-4 gap-3 md:gap-4 border border-[#F11D8A] p-3 md:p-4">
        {section.products.map((product) => (
          <div key={product.id} className="bg-card border border-border overflow-hidden hover:shadow-lg transition-shadow">
            <VideoCard product={product} />
          </div>
        ))}
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
      
      const sections = Object.entries(groupedByCategory).map(([categoryName, products]) => ({
        name: categoryName,
        displayName: getCategory(categoryName).toUpperCase(),
        products: products as Product[]
      }))
      
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
    if (category === "All" || !category) {
      setFilteredCategoryData(allCategoryData)
    } else {
      const filtered = allCategoryData.filter(section => section.name === category)
      setFilteredCategoryData(filtered)
    }
  }, [category, allCategoryData])

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
    <div className="w-full space-y-16">
      {/* Category Navigation - Always show all available categories */}
      <div className="border border-[#F11D8A] max-w-5xl mx-auto p-2">
        {allCategoryData.map((section) => (
          <button
            key={section.name}
            onClick={() => onCategoryChange && onCategoryChange(section.name)}
            className={`m-2 transition-all font-opensans-condensed font-semibold ${
              category === section.name
                ? "bg-[#F11D8A] text-white px-4 py-2 border-2 border-white"
                : "bg-[#108632] px-4 py-2 hover:bg-[#0e6b28] text-white"
            }`}
          >
            {getCategory(section.name)}
          </button>
        ))}
      </div>

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