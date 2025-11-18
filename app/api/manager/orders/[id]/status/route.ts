import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/lib/db"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session || session.user.role !== "MANAGER") {
      return new Response("Unauthorized", { status: 401 })
    }

    const { status } = await request.json()

    const order = await db.orderRequest.update({
      where: { id: params.id },
      data: { status: status.toUpperCase() },
      include: { user: true },
    })

    return Response.json({
      id: order.id,
      status: order.status,
      message: "Order status updated",
    })
  } catch (error) {
    console.error("Order update error:", error)
    return Response.json({ error: "Failed to update order" }, { status: 500 })
  }
}
