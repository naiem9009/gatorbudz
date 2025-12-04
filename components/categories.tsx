"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Mail, Phone, MapPin, Facebook, Instagram, Linkedin, Twitter, Loader } from "lucide-react"
import { getCategory } from "@/lib/utils"
import AccessRequestWholesale from "./access-request-wholesale"
import Image from "next/image"

interface FooterProps {
  selectedCategory?: string | null
  onCategoryChange?: (category: string | null) => void
}

// Define the exact category order
const CATEGORY_ORDER = [
  "SUPER_EXOTICS",
  "PREMIUM_EXOTICS", 
  "EXOTICS",
  "LIVING_SOIL",
  "COMMERCIAL_INDOORS",
  "FRESH_DEPS",
  "DEPS"
]


const Categories = ({ selectedCategory, onCategoryChange }: FooterProps) => {
  const currentYear = new Date().getFullYear()
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch("/api/products")
      
      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status}`)
      }
      
      const data = await response.json()
      
      let productsData = data
      if (data.products && Array.isArray(data.products)) {
        productsData = data.products
      }
      
      if (Array.isArray(productsData)) {
        const uniqueCategories = [...new Set(
          productsData
            .map((product: any) => product.category)
            .filter(Boolean) 
        )]
        
        // Sort categories according to the predefined order
        const sortedCategories = uniqueCategories.sort((a, b) => {
          const indexA = CATEGORY_ORDER.indexOf(a)
          const indexB = CATEGORY_ORDER.indexOf(b)
          
          // If both categories are in the predefined order, sort by that order
          if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB
          }
          
          // If only A is in predefined order, it comes first
          if (indexA !== -1) return -1
          
          // If only B is in predefined order, it comes first  
          if (indexB !== -1) return 1
          
          // If neither are in predefined order, sort alphabetically
          return a.localeCompare(b)
        })
        
        setCategories(sortedCategories)
      } else {
        throw new Error("Invalid products data format")
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error)
      setError("Failed to load categories")
      // Fallback to default categories in correct order
      setCategories(CATEGORY_ORDER)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleRetry = useCallback(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleCategoryClick = useCallback((category: string) => {
    if (onCategoryChange) {
      if (selectedCategory === category) {
        onCategoryChange(null)
      } else {
        onCategoryChange(category)
      }
    }
  }, [selectedCategory, onCategoryChange])


  return (
        <div className="border border-[#F11D8A] max-w-5xl mx-auto p-2 md:p-3 mt-6">
          {loading ? (
            <div className="flex justify-center items-center py-4">
              <Loader className="animate-spin h-6 w-6 text-[#F11D8A]" />
              <span className="ml-2 text-sm">Loading categories...</span>
            </div>
          ) : error ? (
            <div className="text-center py-4">
              <p className="text-red-300 text-sm mb-2">{error}</p>
              <button
                onClick={handleRetry}
                className="bg-[#F11D8A] text-white px-4 py-2 text-sm hover:bg-[#e01a7a] transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryClick(category)}
                  className={`
                    transition-all font-opensans-condensed font-semibold
                    whitespace-nowrap
                    text-sm md:text-base
                    px-3 py-2 md:px-4 md:py-2
                    min-w-[100px] md:min-w-0
                    border-2
                    ${
                      selectedCategory === category
                        ? "bg-[#F11D8A] text-white border-white"
                        : "bg-[#108632] hover:bg-[#0e6b28] text-white border-transparent"
                    }
                  `}
                >
                  {getCategory(category)}
                </button>
              ))}
            </div>
          )}
        </div>
  )
}

export default Categories