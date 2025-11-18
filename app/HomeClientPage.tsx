"use client"

import { useState } from "react"
import Header from "@/components/header"
import VideoGrid from "@/components/video-grid"
import CategoryFilter from "@/components/category-filter"
import Footer from "@/components/footer"
import { useAuth } from "@/lib/auth-context"

export default function HomeClientPage() {
  const [selectedCategory, setSelectedCategory] = useState("All")
  const { user } = useAuth()

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
  }

  return (
    <main className="min-h-screen bg-background">
      {user?.role === "PUBLIC" && (
        <div className="w-full bg-yellow-100 border-b border-yellow-300 text-yellow-800 px-4 py-3 text-center text-sm md:text-base">
          <strong className="font-medium">Notice:</strong> Please contact the admin to verify your account and enable full access.
        </div>
      )}

      <Header />

      <section className="py-8 md:py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 md:mb-12">
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-3 md:mb-4 text-balance">
              Premium Super Exotic & Fresh Deps
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl">
              Discover our curated selection of high-quality products. Watch videos, review COAs, and request quotes.
            </p>
          </div>

          <CategoryFilter
            onCategoryChange={handleCategoryChange}
            selectedCategory={selectedCategory}
          />

          <VideoGrid category={selectedCategory} />
        </div>
      </section>

      <Footer />
    </main>
  )
}
