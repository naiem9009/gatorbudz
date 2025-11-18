"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Mail, Phone, MapPin, Facebook, Instagram, Linkedin, Twitter, Loader } from "lucide-react"
import { getCategory } from "@/lib/utils"

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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-12 mb-12">
          {/* Brand Section */}
          <div className="md:col-span-1">
            <h3 className="font-bold text-lg md:text-xl mb-4">GatorBudz</h3>
            <p className="text-sm opacity-80 leading-relaxed mb-6">
              Premium hemp and cannabis products for B2B buyers. Quality, compliance, and reliability.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="p-2 rounded-lg bg-primary-foreground/10 hover:bg-accent hover:text-accent-foreground transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="p-2 rounded-lg bg-primary-foreground/10 hover:bg-accent hover:text-accent-foreground transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="p-2 rounded-lg bg-primary-foreground/10 hover:bg-accent hover:text-accent-foreground transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="p-2 rounded-lg bg-primary-foreground/10 hover:bg-accent hover:text-accent-foreground transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Products - Dynamic Categories */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h4 className="font-semibold text-base">Products</h4>
              {loading && <Loader className="w-3 h-3 animate-spin opacity-70" />}
            </div>
            
            {error ? (
              <div className="space-y-2">
                <p className="text-xs opacity-70 mb-2">Failed to load categories</p>
                <button
                  onClick={handleRetry}
                  className="text-xs bg-primary-foreground/10 hover:bg-primary-foreground/20 px-2 py-1 rounded transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : (
              <ul className="space-y-2 text-sm opacity-80">
                {/* Always show "All Products" */}
                <li>
                  <Link 
                    href="/products" 
                    className="hover:text-accent hover:opacity-100 transition-colors font-medium"
                  >
                    All Products
                  </Link>
                </li>
                
                {/* Dynamic Categories */}
                {categories.map((category) => (
                  <li key={category}>
                    <Link 
                      href={`/products?category=${encodeURIComponent(category)}`}
                      className="hover:text-accent hover:opacity-100 transition-colors capitalize"
                    >
                      {getCategory(category).toLowerCase()}
                    </Link>
                  </li>
                ))}
                
                {/* Loading state */}
                {loading && categories.length === 0 && (
                  <>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <li key={i} className="h-4 bg-primary-foreground/10 rounded animate-pulse" />
                    ))}
                  </>
                )}
                
                {/* Empty state */}
                {!loading && categories.length === 0 && (
                  <li className="text-xs opacity-70">No categories available</li>
                )}
              </ul>
            )}
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-base mb-4">Company</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li>
                <Link href="/about" className="hover:text-accent hover:opacity-100 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-accent hover:opacity-100 transition-colors">
                  Contact
                </Link>
              </li>
<<<<<<< HEAD
=======
              <li>
                <a href="#" className="hover:text-accent hover:opacity-100 transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-accent hover:opacity-100 transition-colors">
                  Blog
                </a>
              </li>
>>>>>>> 83009f1ac37bad315478ec03e4bdf9fe027b0239
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-base mb-4">Legal</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li>
                <a href="#" className="hover:text-accent hover:opacity-100 transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-accent hover:opacity-100 transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-base mb-4">Contact</h4>
            <ul className="space-y-3 text-sm opacity-80">
              <li className="flex gap-2 items-start">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0 text-accent" />
                <a 
                  href="mailto:admin@gatorbudz.com" 
                  className="hover:text-accent hover:opacity-100 transition-colors"
                >
<<<<<<< HEAD
                  support@gatorbudz.com
                </a>
              </li>
=======
                  admin@gatorbudz.com
                </a>
              </li>
              <li className="flex gap-2 items-start">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0 text-accent" />
                <a 
                  href="tel:" 
                  className="hover:text-accent hover:opacity-100 transition-colors"
                >
                  
                </a>
              </li>
              <li className="flex gap-2 items-start">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-accent" />
                <span></span>
              </li>
>>>>>>> 83009f1ac37bad315478ec03e4bdf9fe027b0239
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-primary-foreground/20 pt-8 md:pt-10">
          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs md:text-sm opacity-80">
            <div className="flex items-center gap-2">
              <p>&copy; {currentYear} GatorBudz. All rights reserved.</p>
              {loading && (
                <span className="text-xs opacity-70">• Loading categories...</span>
              )}
            </div>
            <div className="flex gap-6 text-xs">
              <a href="#" className="hover:text-accent hover:opacity-100 transition-colors">
                Sitemap
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
