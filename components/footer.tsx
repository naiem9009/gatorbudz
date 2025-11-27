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

export default function Footer({ selectedCategory, onCategoryChange }: FooterProps) {
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
        )].sort()
        
        setCategories(uniqueCategories)
      } else {
        throw new Error("Invalid products data format")
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error)
      setError("Failed to load categories")
      // Fallback to default categories
      setCategories(["Flower", "Concentrates", "Edibles", "Tinctures"])
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
    <footer className="text-primary-foreground border-t border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-6">
        {/* Main Footer Grid */}
        <AccessRequestWholesale />
        <div className="flex items-center justify-center mb-5">
          <Image 
            src={'/footer-img-1.png'} 
            alt="straight from the swamp" 
            width={400} 
            height={400} 
            className="w-full max-w-[300px] md:max-w-[400px]"
          />
        </div>
        
        {/* Categories Section */}
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
      </div>
    </footer>
  )
}