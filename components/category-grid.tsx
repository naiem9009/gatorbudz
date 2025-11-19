"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import VideoCard from "./video-card"
import { useAuth } from "@/lib/auth-context"
import { Crown, Star, Zap } from 'lucide-react'
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
          <h2 className="text-3xl md:text-4xl font-bold text-accent uppercase tracking-wide">
            {section.displayName}
          </h2>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          {section.products.length} products
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 border border-red-300/40 p-3 md:p-4 rounded-sm">
        {section.products.map((product) => (
          <div key={product.id} className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
            <VideoCard product={product} />
          </div>
        ))}
      </div>
    </section>
  )
})

CategorySection.displayName = 'CategorySection'

export default function CategoryGrid({ category, onCategoryChange }: CategoryGridProps) {
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const userTier = user?.tier || "GOLD"

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
      
      const productsArray = Array.isArray(data) ? data : (data.products || [])
      
      if (category === "All" || !category) {
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
        
        setCategoryData(sections)
      } else {
        setCategoryData([{
          name: category,
          displayName: getCategory(category).toUpperCase(),
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
    <div className="w-full space-y-16">
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
