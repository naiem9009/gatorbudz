import { PrismaClient } from "@prisma/client"
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

const prisma = new PrismaClient()

// GET user files
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params promise
    const resolvedParams = await params
    const { id } = resolvedParams
    
    console.log("GET user files for ID:", id)
    
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const files = await prisma.userFile.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fileName: true,
        filePath: true,
        fileType: true,
        fileSize: true,
        category: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return NextResponse.json({ files })
  } catch (error: any) {
    console.error("Error fetching user files:", error)
    return NextResponse.json({ 
      error: "Failed to fetch user files",
      details: error.message 
    }, { status: 500 })
  }
}