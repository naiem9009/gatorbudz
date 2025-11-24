import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const where: any = {}

    // Users see their own orders
    if (session.user.role === "VERIFIED") {
      where.userId = session.user.id
    }

    if (status) where.status = status

    const orders = await prisma.orderRequest.findMany({
      where,
      include: {
        items: {
          include: {
            product: { 
              select: { 
                id: true, 
                name: true, 
                category: true,
                weight: true,
                potency: true,
                slug: true
              } 
            },
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        invoice: true, 
      },
      orderBy: { createdAt: "desc" },
    })

    // Transform orders to include variant data
    const normalized = orders.map((order) => ({
      ...order,
      totalAmount: order.totalPrice,
      items: order.items.map(item => ({
        ...item,
        // Include strain and variant data
        strain: item.strain,
        variantId: item.variantId
      }))
    }))
    

    return NextResponse.json({ success: true, data: normalized })
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}