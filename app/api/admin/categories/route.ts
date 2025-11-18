import { PrismaClient } from "@prisma/client"
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { z } from "zod"

const prisma = new PrismaClient()

const createCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
})

// GET all unique categories from products
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const categories = await prisma.product.findMany({
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    })

    const uniqueCategories = categories.map((c) => c.category)

    return NextResponse.json({ categories: uniqueCategories })
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}
