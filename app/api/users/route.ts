import { PrismaClient } from "@prisma/client"
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session || !["MANAGER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role")
    const tier = searchParams.get("tier")

    const where: any = {}
    if (role) where.role = role
    if (tier) where.tier = tier

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        role: true,
        tier: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}
