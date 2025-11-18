import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session || session.user.role !== "MANAGER") {
      return new Response("Unauthorized", { status: 401 })
    }

    const users = await db.user.findMany({
      where: { role: "USER" },
      include: {
        _count: {
          select: { orderRequests: true },
        },
      },
    })

    const customersWithStats = await Promise.all(
      users.map(async (user) => {
        const orders = await db.orderRequest.findMany({
          where: { userId: user.id },
          select: { totalPrice: true },
        })
        const totalSpent = orders.reduce((sum, o) => sum + o.totalPrice, 0)

        return {
          id: user.id,
          email: user.email,
          name: user.name || "Unknown",
          tier: user.tier || "STANDARD",
          totalOrders: user._count.orderRequests,
          totalSpent,
          createdAt: user.createdAt,
        }
      }),
    )

    return Response.json({ customers: customersWithStats })
  } catch (error) {
    console.error("Customers fetch error:", error)
    return Response.json({ error: "Failed to fetch customers" }, { status: 500 })
  }
}
