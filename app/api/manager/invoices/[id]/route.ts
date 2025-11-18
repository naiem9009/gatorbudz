import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/lib/db"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session || session.user.role !== "MANAGER") {
      return new Response("Unauthorized", { status: 401 })
    }

    await db.invoice.delete({
      where: { id: params.id },
    })

    return Response.json({ message: "Invoice deleted" })
  } catch (error) {
    console.error("Invoice delete error:", error)
    return Response.json({ error: "Failed to delete invoice" }, { status: 500 })
  }
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session || (session.user.role !== "MANAGER" && session.user.role !== "ADMIN")) {
      return new Response("Unauthorized", { status: 401 })
    }

    const invoice = await db.invoice.findUnique({
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
      return new Response("Not found", { status: 404 })
    }

    return Response.json(invoice)
  } catch (error) {
    console.error("Manager get invoice error:", error)
    return Response.json({ error: "Failed to get invoice" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session || (session.user.role !== "MANAGER" && session.user.role !== "ADMIN")) {
      return new Response("Unauthorized", { status: 401 })
    }

    const body = await request.json()

    const updatedInvoice = await db.invoice.update({
      where: { id: params.id },
      data: {
        ...body,
        ...(body.status === "PAID" && { paidAt: new Date() }),
      },
      include: {
        user: true,
        payments: true,
      },
    })

    return Response.json(updatedInvoice)
  } catch (error) {
    console.error("Manager update invoice error:", error)
    return Response.json({ error: "Failed to update invoice" }, { status: 500 })
  }
}
