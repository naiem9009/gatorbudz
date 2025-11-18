import { PrismaClient } from "@prisma/client"
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")
    const entity = searchParams.get("entity")
    const limit = Number.parseInt(searchParams.get("limit") || "100")

    const where: any = {}
    if (action) where.action = action
    if (entity) where.entity = entity

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        actor: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    return NextResponse.json(logs)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 })
  }
}
