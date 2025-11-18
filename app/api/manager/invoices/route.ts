import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session || (session.user.role !== "MANAGER" && session.user.role !== "ADMIN")) {
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
        order: {
          include: {
            items: true,
          },
        },
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    })

    const formattedInvoices = invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.user?.name || "Unknown",
      email: invoice.user?.email || "",
      company: invoice.user?.company || "",
      amount: invoice.total,
      status: invoice.status,
      dueDate: invoice.dueDate,
      issuedDate: invoice.issueDate,
      user: invoice.user,
      payments: invoice.payments,
    }))

    return new Response(JSON.stringify({ invoices: formattedInvoices }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Manager get invoices error:", error)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session || (session.user.role !== "MANAGER" && session.user.role !== "ADMIN")) {
      return new Response("Unauthorized", { status: 401 })
    }

    const { userId, total, issueDate, dueDate, notes, orderRequestId } = await request.json()

    if (!userId || !total || !dueDate) {
      return new Response("Missing required fields", { status: 400 })
    }

    const invoiceNumber = `INV-${Date.now()}`

    const invoice = await db.invoice.create({
      data: {
        userId,
        orderRequestId: orderRequestId || "",
        invoiceNumber,
        total,
        issueDate: new Date(issueDate || Date.now()),
        dueDate: new Date(dueDate),
        notes,
        status: "PENDING",
      },
      include: {
        user: true,
      },
    })

    return new Response(JSON.stringify(invoice), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Manager create invoice error:", error)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
