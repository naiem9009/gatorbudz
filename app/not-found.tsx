"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, ArrowLeft, Search } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md mx-auto">
        {/* Error Code */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-accent mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            Page Not Found
          </h2>
          <p className="text-muted-foreground mb-8">
            Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or never existed.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="bg-accent text-accent-foreground">
            <Link href="/" className="flex items-center gap-2">
              <Home size={16} />
              Back to Home
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/products" className="flex items-center gap-2">
              <Search size={16} />
              Browse Products
            </Link>
          </Button>
        </div>

        {/* Additional Help */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4">
            Need help finding something?
          </p>
          <Button variant="ghost" asChild>
            <Link href="/contact" className="text-accent">
              Contact Support
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}