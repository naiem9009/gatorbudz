import { Metadata } from "next"
import HomeClientPage from "./HomeClientPage"

export const metadata: Metadata = {
  title: "Premium Super Exotic & Fresh Deps | High-Quality Products & COAs",
  description: "Discover premium super exotic and fresh deps. Watch product videos, review certified COAs, and request quotes for high-quality curated selections.",
  keywords: "premium deps, exotic products, fresh deps, COAs, product videos, quotes, high-quality",
}

export default function HomePage() {
  
  return <HomeClientPage />
}