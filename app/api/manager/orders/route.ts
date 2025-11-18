import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session || session.user.role !== "MANAGER") {
      return new Response("Unauthorized", { status: 401 })
    }

    const orders = await db.orderRequest.findMany({
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const formattedOrders = orders.map((order) => ({
      id: order.id,
      customerName: order.user?.name || "Unknown",
      email: order.user?.email || "",
      items: order.items.map((item) => ({
        productId: item.productId,
        productName: item.product?.name || "Unknown Product",
        category: item.product?.category || "Uncategorized",
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        notes: item.notes,
      })),
      totalAmount: order.totalPrice,
      status: order.status,
      createdAt: order.createdAt,
      notes: order.notes,
    }))

    return Response.json({ orders: formattedOrders })
  } catch (error) {
    console.error("Orders fetch error:", error)
    return Response.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}
