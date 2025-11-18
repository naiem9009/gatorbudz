"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useAuth } from "./auth-context"

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  videoUrl: string
  category: string
  slug: string
  subcategory?: string
  weight?: string
  potency?: string
  originalPrice?: number 

}

interface CartContextType {
  items: CartItem[]
  addToCart: (product: any, quantity: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  cartTotal: number
  cartCount: number
  isHydrated: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isHydrated, setIsHydrated] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    try {
      const storedCart = localStorage.getItem("gatorbudz_cart")
      if (storedCart) {
        const parsedCart = JSON.parse(storedCart)
        setItems(Array.isArray(parsedCart) ? parsedCart : [])
      }
    } catch (error) {
      console.error("Failed to parse cart from localStorage:", error)
      setItems([])
    }
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem("gatorbudz_cart", JSON.stringify(items))
    }
  }, [items, isHydrated])

  const addToCart = (product: any, quantity = 1) => {
    if (!product || !product.id) {
      console.error("Invalid product:", product)
      return
    }

    const normalizedProduct: CartItem = {
      id: String(product.id),
      name: product.name || "Unknown Product",
      price: Number(user?.tier === "GOLD" ? product.priceGold : user?.tier === "DIAMOND" ? product.priceDiamond : product.pricePlatinum) || 0,
      quantity: Math.max(1, Number(quantity) || 1),
      videoUrl: product.videoUrl || product.image || "",
      category: product.category || "Uncategorized",
      slug: product.slug || "unknown-product",
      subcategory: product.subcategory,
      weight: product.weight,
      potency: product.potency,
      originalPrice: Number(user?.tier === "GOLD" ? product.priceGold : user?.tier === "DIAMOND" ? product.priceDiamond : product.pricePlatinum) || 0,
    }

    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === normalizedProduct.id)

      if (existingItem) {
        return prevItems.map((item) =>
          item.id === normalizedProduct.id ? { ...item, quantity: item.quantity + normalizedProduct.quantity } : item,
        )
      }

      return [...prevItems, normalizedProduct]
    })
  }

  const removeFromCart = (productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setItems((prevItems) =>
      prevItems.map((item) => (item.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item)),
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const cartTotal = items.reduce((total, item) => total + item.price * item.quantity, 0)
  const cartCount = items.reduce((count, item) => count + item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
        isHydrated,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within CartProvider")
  }
  return context
}
