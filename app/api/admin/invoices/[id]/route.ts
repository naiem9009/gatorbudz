import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        order: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        payments: true,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error("Admin get invoice error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const updatedInvoice = await prisma.invoice.update({
      where: { id: params.id },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.dueDate && { dueDate: new Date(body.dueDate) }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.total && { total: body.total }),
        ...(body.status === "PAID" && { paidAt: new Date() }),
      },
      include: {
        user: true,
        payments: true,
      },
    })

    return NextResponse.json(updatedInvoice)
  } catch (error) {
    console.error("Admin update invoice error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.invoice.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete invoice error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
