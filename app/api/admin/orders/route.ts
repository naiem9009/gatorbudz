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
        user: { select: { id: true, email: true, name: true } },
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const normalized = orders.map((order) => ({
      ...order,
      totalAmount: order.totalPrice,
    }))

    return NextResponse.json({ orders: normalized })
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}
