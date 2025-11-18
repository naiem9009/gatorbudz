"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit2, Trash2 } from "lucide-react"

interface Product {
  id: string
  name: string
  category: string
  priceGold: number
  pricePlatinum: number
  priceDiamond: number
  status: string
  createdAt: string
}

export default function AdminProductsTable() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    setLoading(true)
    try {
      const res = await fetch("/api/products")
      const json = await res.json()
      setProducts(json || [])
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Products</CardTitle>
          <CardDescription>Manage your product catalog</CardDescription>
        </div>
        <Button className="bg-accent text-accent-foreground hover:opacity-90 gap-2">
          <Plus className="w-4 h-4" />
          Add Product
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Gold Price</TableHead>
                <TableHead className="text-right">Platinum Price</TableHead>
                <TableHead className="text-right">Diamond Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No products found
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell className="text-right">${product.priceGold.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${product.pricePlatinum.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${product.priceDiamond.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          product.status === "ACTIVE"
                            ? "bg-green-500/10 text-green-700"
                            : "bg-gray-500/10 text-gray-700"
                        }
                      >
                        {product.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right flex gap-2 justify-end">
                      <Button variant="ghost" size="sm">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
