"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Filter, X } from "lucide-react"
import { getCategory } from "@/lib/utils"

interface CategoryFilterProps {
  onCategoryChange: (category: string) => void
  selectedCategory: string
}

// Fallback categories in case API fails
const FALLBACK_CATEGORIES = ["Flower", "Concentrates", "Edibles", "Tinctures"]

export default function CategoryFilter({ onCategoryChange, selectedCategory }: CategoryFilterProps) {
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategoriesFromProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch products and extract categories from the existing API
      const response = await fetch("/api/products")
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Extract unique categories from products
      if (data.products && Array.isArray(data.products)) {
        const uniqueCategories = [...new Set(
          data.products
            .map((product: any) => product.category)
            .filter(Boolean) // Remove null/undefined categories
        )].sort()
        
        setCategories(uniqueCategories as any)
      } else if (Array.isArray(data)) {
        // Handle case where API returns array directly
        const uniqueCategories = [...new Set(
          data
            .map((product: any) => product.category)
            .filter(Boolean)
        )].sort()
        
        setCategories(uniqueCategories)
      } else {
        throw new Error("Invalid products data format")
      }
    } catch (error) {
      console.error("Failed to fetch categories from products:", error)
      setError("Failed to load categories")
      // Use fallback categories
      setCategories(FALLBACK_CATEGORIES)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategoriesFromProducts()
  }, [fetchCategoriesFromProducts])

  const handleClearFilter = useCallback(() => {
    onCategoryChange("All")
  }, [onCategoryChange])

  const handleRetry = useCallback(() => {
    fetchCategoriesFromProducts()
  }, [fetchCategoriesFromProducts])

  // Loading state
  if (loading) {
    return (
      <div className="space-y-3 mb-8">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Categories</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-20 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  // Error state with fallback categories
  if (error) {
    return (
      <div className="space-y-3 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Categories</span>
            <Badge variant="outline" className="text-xs">
              Using Fallback
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRetry}
            className="h-7 text-xs"
          >
            Retry
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {["All", ...categories].map((category) => (
            <Button
              key={category}
              onClick={() => onCategoryChange(category)}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              className={`transition-all ${
                selectedCategory === category
                  ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                  : "bg-transparent border-border hover:border-primary hover:text-primary"
              }`}
            >
              {getCategory(category)}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Categories loaded from fallback list
        </p>
      </div>
    )
  }

  // Normal state
  return (
    <div className="space-y-3 mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Categories</span>
          {selectedCategory !== "All" && (
            <Badge variant="secondary" className="text-xs">
              {selectedCategory}
            </Badge>
          )}
        </div>
        
        {selectedCategory !== "All" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilter}
            className="h-7 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {["All", ...categories].map((category) => (
          <Button
            key={category}
            onClick={() => onCategoryChange(category)}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            className={`transition-all ${
              selectedCategory === category
                ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                : "bg-transparent border-border hover:border-primary hover:text-primary"
            }`}
          >
            {getCategory(category)}
          </Button>
        ))}
      </div>

      {selectedCategory !== "All" && (
        <p className="text-xs text-muted-foreground">
          Showing {selectedCategory} products • {categories.length} categories available
        </p>
      )}
    </div>
  )
}
