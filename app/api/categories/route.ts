import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Get unique categories from products
    const categories = await prisma.product.findMany({
      where: { status: "ACTIVE" },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' }
    })

    const uniqueCategories = categories.map(item => item.category).filter(Boolean)

    return NextResponse.json(uniqueCategories)
  } catch (error) {
    console.error("Failed to fetch categories:", error)
    return NextResponse.json(["Flower", "Concentrates", "Edibles", "Tinctures", "Accessories"])
  }
}
