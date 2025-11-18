import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session) {
      return new Response("Unauthorized", { status: 401 })
    }

    const invoices = await db.invoice.findMany({
      where: { userId: session.user.id },
      include: {
        payments: true,
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
      orderBy: { createdAt: "desc" },
    })

    const formattedInvoices = invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      total: invoice.total,
      status: invoice.status,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      paymentMethod: invoice.paymentMethod,
      paidAt: invoice.paidAt,
      dwollaStatus: invoice.dwollaStatus,
      dwollaTransferId: invoice.dwollaTransferId,
      payments: invoice.payments,
      order: invoice.order,
      notes: invoice.notes,
    }))

    return new Response(JSON.stringify({ invoices: formattedInvoices }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Get invoices error:", error)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
