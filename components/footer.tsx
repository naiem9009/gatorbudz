"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Mail, Phone, MapPin, Facebook, Instagram, Linkedin, Twitter, Loader } from "lucide-react"
import { getCategory } from "@/lib/utils"
import AccessRequestWholesale from "./access-request-wholesale"
import Image from "next/image"

export default function Footer() {
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
      
      // Extract unique categories from products
      let productsData = data
      if (data.products && Array.isArray(data.products)) {
        productsData = data.products
      }
      
      if (Array.isArray(productsData)) {
        const uniqueCategories = [...new Set(
          productsData
            .map((product: any) => product.category)
            .filter(Boolean) // Remove null/undefined
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

  return (
    <footer className="bg-primary text-primary-foreground border-t border-border mt-16 md:mt-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
        {/* Main Footer Grid */}
        <AccessRequestWholesale />
        <div className="flex items-center justify-center mb-5">
          <Image src={'/footer-img-1.png'} alt="straight from the swamp" width={400} height={400} />
        </div>
        <div className="border border-[#F11D8A] max-w-5xl mx-auto p-2">
          {categories.map((c) => (
            <button
              key={c}
              className={`m-2 transition-all font-opensans-condensed font-semibold bg-[#108632] px-4 py-2 hover:bg-[#0e6b28] text-white"
              }`}
            >
              {getCategory(c)}
            </button>
          ))}
        </div>
      </div>
    </footer>
  )
}
