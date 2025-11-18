import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session || !["ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || ""

    const where: any = {}
    if (status) where.status = status

    const proposals = await prisma.tierChangeProposal.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, name: true, tier: true } },
        proposer: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ success: true, data: proposals })
  } catch (error) {
    console.error("Error fetching proposals:", error)
    return NextResponse.json({ error: "Failed to fetch proposals" }, { status: 500 })
  }
}
