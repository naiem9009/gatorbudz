import { PrismaClient } from "@prisma/client"
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

const prisma = new PrismaClient()

// GET all users
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tier: true,
        createdAt: true,
        emailVerified: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}
