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

    // VERIFIED users can only see their own invoices
    if (session.user.role === "VERIFIED") {
      where.userId = session.user.id
    } 
    // MANAGER and ADMIN need to specify userId to see specific user's invoices
    else if (["MANAGER", "ADMIN"].includes(session.user.role)) {
      if (userId) {
        where.userId = userId
      } else {
        // Return empty array or error for admin without userId
        return NextResponse.json(
          { 
            success: true, 
            data: [],
            message: "Please provide a userId parameter to view specific user's invoices"
          },
          { status: 200 }
        )
        
        // OR return error instead:
        // return NextResponse.json(
        //   { error: "userId parameter is required for admin/manager users" },
        //   { status: 400 }
        // )
      }
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
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ success: true, data: invoices })
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 })
  }
}