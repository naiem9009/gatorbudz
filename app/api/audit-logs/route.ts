import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action") || ""
    const limit = Number.parseInt(searchParams.get("limit") || "100")

    const where: any = {}
    if (action) where.action = { contains: action }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        actor: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    return NextResponse.json({ success: true, data: logs })
  } catch (error) {
    console.error("Error fetching audit logs:", error)
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 })
  }
}
