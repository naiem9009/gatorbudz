"use client"

import { useState } from "react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import ApplyModal from "@/components/apply-modal"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Minus, ShoppingCart, AlertCircle } from 'lucide-react'
import Link from "next/link"
import { useCart } from "@/lib/cart-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart()
  const [showApplyModal, setShowApplyModal] = useState(false)

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center space-y-6 max-w-md">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-primary/30 rounded-full flex items-center justify-center border border-border/50">
                <ShoppingCart className="w-10 h-10 text-muted-foreground" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Your Cart is Empty</h1>
              <p className="text-muted-foreground">Browse our premium products and add items to your cart</p>
            </div>
            <Link href="/products">
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 px-8 py-6 text-lg font-semibold shadow-lg shadow-accent/20">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  const hasLowQuantityItems = items.some(item => item.quantity < 10)

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-8 md:py-16">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground flex items-center gap-2">
            <ShoppingCart className="w-8 h-8 text-accent" />
            Shopping Cart
          </h1>
          <p className="text-muted-foreground mt-2">{items.length} item(s) in cart</p>
        </div>

        {/* Minimum Order Warning */}
        {hasLowQuantityItems && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-400">Minimum Order: 10 Units</p>
              <p className="text-xs text-yellow-400/80 mt-1">Some items in your cart are below the minimum order quantity. Adjust quantities to meet the 10-unit minimum.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {items.map((item) => (
                <Card key={item.id} className="bg-card border-border/50 hover:border-accent/30 transition">
                  <CardContent className="pt-6">
                    <div className="flex gap-4 md:gap-6">
                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <Link href={`/products/${item.slug}`}>
                          <h3 className="font-bold text-foreground hover:text-accent transition text-sm md:text-base line-clamp-2">
                            {item.name}
                          </h3>
                        </Link>
                        <div className="text-xs text-muted-foreground mt-2 space-y-1">
                          <p className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{item.category}</Badge>
                            {item.subcategory && <Badge variant="outline" className="text-xs">{item.subcategory}</Badge>}
                          </p>
                          {item.weight && <p>📦 {item.weight}</p>}
                          {item.potency && <p>⚡ {item.potency}</p>}
                        </div>
                      </div>

                      {/* Quantity & Price */}
                      <div className="flex flex-col items-end gap-4">
                        <div className="flex items-center border border-border/50 rounded-lg bg-primary/30">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-2 text-foreground hover:bg-primary/60 transition"
                          >
                            <Minus size={16} />
                          </button>

                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                            className="w-12 md:w-16 text-center bg-transparent border-none focus:outline-none text-foreground font-medium text-sm"
                          />

                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-2 text-foreground hover:bg-primary/60 transition"
                          >
                            <Plus size={16} />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Subtotal</p>
                          <p className="font-bold text-foreground text-lg text-accent">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-destructive hover:opacity-70 transition p-2"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Continue Shopping */}
            <Link href="/products" className="inline-block mt-6">
              <Button variant="outline" className="bg-transparent border-border/50 hover:bg-primary/30">
                Continue Shopping
              </Button>
            </Link>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="bg-card border-border/50 sticky top-24 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/30 to-primary/20 border-b border-border/30">
                <CardTitle className="text-accent flex items-center gap-2">
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground font-medium">${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-foreground font-medium">$0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="text-foreground font-medium">$0</span>
                  </div>
                </div>

                <div className="border-t border-border/30 pt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span className="text-foreground">Total</span>
                    <span className="text-accent text-2xl">${cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  onClick={() => setShowApplyModal(true)}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 py-3 text-base font-semibold shadow-lg shadow-accent/20"
                >
                  Proceed to Checkout
                </Button>

                <Button
                  onClick={clearCart}
                  variant="outline"
                  className="w-full bg-transparent text-destructive hover:bg-destructive/20 border-destructive/30"
                >
                  Clear Cart
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-4 p-3 bg-primary/20 rounded border border-border/30">
                  💡 Minimum 10 units per order for bulk pricing. Contact support for large orders.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />

      <ApplyModal isOpen={showApplyModal} onClose={() => setShowApplyModal(false)} />
    </main>
  )
}
