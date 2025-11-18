import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const accounts = await prisma.plaidAccount.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ accounts })
  } catch (error) {
    console.error("Get accounts error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
