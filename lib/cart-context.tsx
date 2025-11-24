"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useAuth } from "./auth-context"

export interface CartItem {
  id: string
  productId: string
  variantId: string
  name: string
  price: number
  quantity: number
  videoUrl: string
  category: string
  slug: string
  strain: string
  weight?: string
  potency?: string
  originalPrice?: number
  productName: string
}

interface CartContextType {
  items: CartItem[]
  addToCart: (product: any, variant: any, quantity: number) => void
  removeFromCart: (cartItemId: string) => void
  updateQuantity: (cartItemId: string, quantity: number) => void
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

  const addToCart = (product: any, variant: any, quantity = 1) => {
    if (!product || !product.id || !variant || !variant.id) {
      console.error("Invalid product or variant:", { product, variant })
      return
    }

    // Generate unique cart item ID combining product and variant
    const cartItemId = `${product.id}_${variant.id}`
    
    // Calculate price based on user tier
    const getPriceForTier = () => {
      switch (user?.tier) {
        case "DIAMOND":
          return variant.priceDiamond || 0
        case "PLATINUM":
          return variant.pricePlatinum || 0
        case "GOLD":
        default:
          return variant.priceGold || 0
      }
    }

    const price = getPriceForTier()

    if (!price || price === 0) {
      console.error("No price available for this variant:", variant)
      return
    }

    const normalizedCartItem: CartItem = {
      id: cartItemId,
      productId: String(product.id),
      variantId: String(variant.id),
      name: `${product.name} - ${variant.subcategory}`,
      productName: product.name,
      price: Number(price),
      quantity: Math.max(1, Number(quantity) || 1),
      videoUrl: product.videoUrl || "",
      category: product.category || "Uncategorized",
      slug: product.slug || "unknown-product",
      strain: variant.subcategory || "Unknown Strain",
      weight: product.weight,
      potency: product.potency,
      originalPrice: Number(price),
    }

    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === cartItemId)

      if (existingItem) {
        return prevItems.map((item) =>
          item.id === cartItemId 
            ? { ...item, quantity: item.quantity + normalizedCartItem.quantity } 
            : item
        )
      }

      return [...prevItems, normalizedCartItem]
    })
  }

  const removeFromCart = (cartItemId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== cartItemId))
  }

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId)
      return
    }

    setItems((prevItems) =>
      prevItems.map((item) => 
        item.id === cartItemId 
          ? { ...item, quantity: Math.max(1, quantity) } 
          : item
      ),
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