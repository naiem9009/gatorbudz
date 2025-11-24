"use client"

import { useState } from "react"
import Header from "@/components/header"
import CategoryGrid from "@/components/category-grid"
import Footer from "@/components/footer"
import { useAuth } from "@/lib/auth-context"
import AccessRequestWholesale from "@/components/access-request-wholesale"

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
      <AccessRequestWholesale />

      <section className="py-8 md:py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <CategoryGrid category={selectedCategory} onCategoryChange={handleCategoryChange} />
        </div>
      </section>

      <Footer />
    </main>
  )
}
