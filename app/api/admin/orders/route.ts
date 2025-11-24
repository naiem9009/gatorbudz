import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

// GET all orders
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const orders = await prisma.orderRequest.findMany({
      include: {
        user: { 
          select: { 
            id: true, 
            email: true, 
            name: true,
            company: true,
            tier: true
          } 
        },
        items: {
          include: { 
            product: {
              select: {
                id: true,
                name: true,
                category: true,
                weight: true,
                potency: true,
                slug: true,
                // Include variants if you want to show available options
                variants: {
                  select: {
                    id: true,
                    subcategory: true,
                    priceGold: true,
                    pricePlatinum: true,
                    priceDiamond: true
                  }
                }
              }
            }
          }
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Transform orders to include variant data properly
    const normalized = orders.map((order) => ({
      ...order,
      totalAmount: order.totalPrice,
      items: order.items.map(item => ({
        ...item,
        strain: item.strain,
        variantId: item.variantId,
        // Add pricing context - what the user paid vs current prices
        pricingContext: item.variantId && item.product.variants ? {
          paidPrice: item.unitPrice,
          currentPrices: item.product.variants.find(v => v.id === item.variantId) || null
        } : null
      }))
    }))

    return NextResponse.json({ orders: normalized })
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}