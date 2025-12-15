import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { CartProvider } from "@/lib/cart-context"
import InactiveWarning from "@/components/inactive-warning"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Gator Budz – Premium Wholesale THCA Flower Marketplace",
  description: "Welcome to Gator Budz, your exclusive wholesale destination for premium THCA hemp flower. We connect top growers from across the country with licensed buyers looking for the finest selection",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <AuthProvider>
          <CartProvider>
            <InactiveWarning />
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
