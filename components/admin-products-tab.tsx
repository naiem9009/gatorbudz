"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Trash2 } from "lucide-react"

interface Product {
  id: string
  name: string
  category: string
  priceGold: number
  pricePlatinum: number
  priceDiamond: number
  status: string
}

export default function AdminProductsTab() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [editData, setEditData] = useState({
    priceGold: 0,
    pricePlatinum: 0,
    priceDiamond: 0,
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products")
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error("Failed to fetch products:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProduct = async () => {
    if (!selectedProduct) return

    try {
      const response = await fetch(`/api/admin/products/${selectedProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      })

      if (response.ok) {
        setSelectedProduct(null)
        await fetchProducts()
      }
    } catch (error) {
      console.error("Failed to update product:", error)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchProducts()
      }
    } catch (error) {
      console.error("Failed to delete product:", error)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading products...</div>
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground mb-6">Manage Products</h2>

      {products.length > 0 ? (
        <div className="space-y-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-card border border-border p-4 rounded-lg flex items-center justify-between"
            >
              <div className="flex-1">
                <p className="font-medium text-foreground">{product.name}</p>
                <p className="text-xs text-muted-foreground">{product.category}</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right text-sm">
                  <p className="text-muted-foreground">Gold / Plat / Diamond</p>
                  <p className="font-semibold text-accent">
                    ${product.priceGold} / ${product.pricePlatinum} / ${product.priceDiamond}
                  </p>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent"
                      onClick={() => {
                        setSelectedProduct(product)
                        setEditData({
                          priceGold: product.priceGold,
                          pricePlatinum: product.pricePlatinum,
                          priceDiamond: product.priceDiamond,
                        })
                      }}
                    >
                      Edit Pricing
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Product Pricing</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Product</label>
                        <p className="text-foreground">{selectedProduct?.name}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Gold Price</label>
                        <input
                          type="number"
                          value={editData.priceGold}
                          onChange={(e) => setEditData({ ...editData, priceGold: Number.parseFloat(e.target.value) })}
                          className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Platinum Price</label>
                        <input
                          type="number"
                          value={editData.pricePlatinum}
                          onChange={(e) =>
                            setEditData({ ...editData, pricePlatinum: Number.parseFloat(e.target.value) })
                          }
                          className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Diamond Price</label>
                        <input
                          type="number"
                          value={editData.priceDiamond}
                          onChange={(e) =>
                            setEditData({ ...editData, priceDiamond: Number.parseFloat(e.target.value) })
                          }
                          className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                      </div>

                      <Button
                        onClick={handleUpdateProduct}
                        className="w-full bg-accent text-accent-foreground hover:opacity-90"
                      >
                        Save Pricing
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-destructive text-destructive hover:bg-destructive/10"
                  onClick={() => handleDeleteProduct(product.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No products found</p>
        </div>
      )}
    </div>
  )
}
