import { Metadata } from "next"
import HomeClientPage from "./HomeClientPage"

export const metadata: Metadata = {
  title: "Premium Super Exotic & Fresh Deps | High-Quality Products & COAs",
  description: "Discover premium super exotic and fresh deps. Watch product videos, review certified COAs, and request quotes for high-quality curated selections.",
  keywords: "premium deps, exotic products, fresh deps, COAs, product videos, quotes, high-quality",
  openGraph: {
    title: "Premium Super Exotic & Fresh Deps | High-Quality Products & COAs",
    description: "Discover premium super exotic and fresh deps. Watch product videos, review certified COAs, and request quotes.",
    type: "website",
    locale: "en_US",
    siteName: "Premium Deps",
  },
  twitter: {
    card: "summary_large_image",
    title: "Premium Super Exotic & Fresh Deps",
    description: "Discover our curated selection of high-quality products with videos and COAs",
  },
}

export default function HomePage() {
  return <HomeClientPage />
}