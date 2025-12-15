import { PrismaClient } from "@prisma/client"
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

const prisma = new PrismaClient()


// Download file via Bunny CDN redirect
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params promise
    const resolvedParams = await params
    const { id } = resolvedParams
    
    console.log("Download file request for file ID:", id)
    
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const file = await prisma.userFile.findUnique({
      where: { id },
      select: {
        id: true,
        fileName: true,
        filePath: true,
        fileType: true,
        userId: true,
      }
    })

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Check if user has permission to access this file
    if (session.user.role !== "ADMIN" && session.user.id !== file.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Clean file path
    const cleanFilePath = file.filePath.startsWith('/') ? file.filePath.slice(1) : file.filePath
    
    const cdnUrl = `${cleanFilePath}`
    
    console.log("Redirecting to CDN URL:", cdnUrl)
    
    // Redirect to Bunny CDN
    return NextResponse.redirect(cdnUrl)

  } catch (error: any) {
    console.error("Error downloading file:", error)
    return NextResponse.json({ 
      error: "Failed to download file",
      details: error.message 
    }, { status: 500 })
  }
}