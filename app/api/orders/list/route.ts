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
    const userId = searchParams.get("userId")

    const where: any = {}

    // VERIFIED users can only see their own orders
    if (session.user.role === "VERIFIED") {
      where.userId = session.user.id
    } 
    // MANAGER and ADMIN need to specify userId to see specific user's orders
    else if (["MANAGER", "ADMIN"].includes(session.user.role)) {
      if (userId) {
        where.userId = userId
      } else {
        // Return empty array for admin without userId
        return NextResponse.json(
          { 
            success: true, 
            data: [],
            message: "Please provide a userId parameter to view specific user's orders"
          },
          { status: 200 }
        )
        
        // OR return error instead (uncomment if preferred):
        // return NextResponse.json(
        //   { error: "userId parameter is required for admin/manager users" },
        //   { status: 400 }
        // )
      }
    }

    // Apply status filter if provided
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
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
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