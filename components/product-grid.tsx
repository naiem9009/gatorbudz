"use client"

import { useEffect, useState } from "react"
import ProductCard from "@/components/product-card"
import { Skeleton } from "@/components/ui/skeleton"

interface Product {
  id: string
  name: string
  description?: string
  videoUrl: string
  category: string
  priceGold?: number
  pricePlatinum?: number
  priceDiamond?: number
}

interface ProductGridProps {
  category?: string
}

export default function ProductGrid({ category = "All" }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const url = new URL("/api/products", window.location.origin)
        if (category !== "All") {
          url.searchParams.set("category", category)
        }

        const response = await fetch(url.toString())
        const data = await response.json()
        setProducts(data)
      } catch (error) {
        console.error("Failed to fetch products:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [category])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="aspect-video rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} {...product} />
      ))}
    </div>
  )
}
