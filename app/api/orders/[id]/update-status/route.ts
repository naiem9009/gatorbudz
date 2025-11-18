import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const runtime = "nodejs"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session || !["MANAGER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { status } = body

    if (!["PENDING", "APPROVED", "REJECTED", "FULFILLED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const order = await prisma.orderRequest.update({
      where: { id: params.id },
      data: {
        status,
        lastActorId: session.user.id,
        lastActorRole: session.user.role,
        updatedAt: new Date(),
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
        product: { select: { id: true, name: true } },
      },
    })

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        actorRole: session.user.role,
        action: `UPDATE_ORDER_STATUS_${status}`,
        entity: "OrderRequest",
        entityId: order.id,
        metaJson: JSON.stringify({ previousStatus: "PENDING", newStatus: status }),
      },
    })

    return NextResponse.json({ success: true, data: order })
  } catch (error) {
    console.error("Error updating order:", error)
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
  }
}
