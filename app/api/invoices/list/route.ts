import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    const where: any = {}

    if (session.user.role === "VERIFIED") {
      where.userId = session.user.id
    } else if (userId && ["MANAGER", "ADMIN"].includes(session.user.role)) {
      where.userId = userId
    }

    const invoices = await prisma.invoice.findMany({
      where,
      select: {
        id: true,
        invoiceNumber: true,
        total: true,
        status: true,
        issueDate: true,
        dueDate: true,
        paymentMethod: true,
        paidAt: true,
        stripeUrl: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ success: true, data: invoices })
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 })
  }
}
