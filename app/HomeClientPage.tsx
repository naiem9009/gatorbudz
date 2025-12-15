"use client"

import { useState, useEffect } from "react"
import Header from "@/components/header"
import CategoryGrid from "@/components/category-grid"
import Footer from "@/components/footer"
import { useAuth } from "@/lib/auth-context"
import AccessRequestWholesale from "@/components/access-request-wholesale"
import Image from "next/image"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"

export default function HomeClientPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const router = useRouter()

  // Read category from URL on component mount
  useEffect(() => {
    const category = searchParams.get('category')
    setSelectedCategory(category)
  }, [searchParams])

  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category)
    
    // Update URL without page reload
    const params = new URLSearchParams(searchParams.toString())
    if (category) {
      params.set('category', category)
    } else {
      params.delete('category')
    }
    
    // Update URL without triggering a full page reload
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  return (
    <main className="min-h-screen bg-background">


      <header className="max-w-5xl mx-auto">
        <Link href={'/'} className="flex items-center justify-center h-full border border-[#49B281] mt-4 md:mx-0 mx-4 p-4">
          <Image src={"/my-logo.png"} alt="Gatorbudz logo" width={600} height={400} />
        </Link>
      </header>

      <section className="px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          <CategoryGrid category={selectedCategory} onCategoryChange={handleCategoryChange} />
        </div>
      </section>

      <Footer selectedCategory={selectedCategory} onCategoryChange={handleCategoryChange} />
    </main>
  )
}