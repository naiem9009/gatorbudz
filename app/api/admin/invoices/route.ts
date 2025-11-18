import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { generateInvoiceNumber } from "@/lib/utils"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session || session.user.role !== "ADMIN") {
      return new Response("Unauthorized", { status: 401 })
    }

    const invoices = await db.invoice.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            tier: true,
          },
        },
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return new Response(JSON.stringify({ invoices }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Admin get invoices error:", error)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId, total, issueDate, dueDate, notes, orderRequestId, items } = await request.json()

    if (!userId || !dueDate) {
      return NextResponse.json({ error: "Missing required fields: userId, dueDate" }, { status: 400 })
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "At least one invoice item is required" }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    let linkOrderId = orderRequestId

    if (orderRequestId) {
      const order = await db.orderRequest.findUnique({ where: { id: orderRequestId } })
      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 })
      }
      linkOrderId = orderRequestId
    } else {
      const standalonOrder = await db.orderRequest.create({
        data: {
          userId,
          totalPrice: total,
          notes: notes || `Standalone invoice for ${user.email}`,
          status: "PENDING",
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
            })),
          },
        },
      })
      linkOrderId = standalonOrder.id
    }

    const invoiceNumber = generateInvoiceNumber()

    const invoice = await db.invoice.create({
      data: {
        userId,
        orderRequestId: linkOrderId,
        invoiceNumber,
        total,
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        dueDate: new Date(dueDate),
        notes,
        status: "DRAFT",
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            company: true,
          },
        },
        order: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ invoice }, { status: 201 })
  } catch (error) {
    console.error("Create invoice error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
