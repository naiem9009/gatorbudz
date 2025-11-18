import { randomUUID } from "crypto"
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    const where: any = {}

    if (session.user.role === "VERIFIED") {
      where.userId = session.user.id
    } else if (userId && ["MANAGER", "ADMIN"].includes(session.user.role)) {
      where.userId = userId
    }

    const files = await prisma.userFile.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ success: true, data: files })
  } catch (error) {
    console.error("Error fetching files:", error)
    return NextResponse.json({ error: "Failed to fetch files" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session || !["VERIFIED", "MANAGER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const fileType = formData.get("fileType") as string

    if (!file || !fileType) {
      return NextResponse.json({ error: "Missing file or fileType" }, { status: 400 })
    }

    const storageZone = process.env.BUNNY_STORAGE_ZONE
    const storagePassword = process.env.BUNNY_STORAGE_PASSWORD
    const cdnUrl = process.env.BUNNY_CDN_URL

    if (!storageZone || !storagePassword || !cdnUrl) {
      console.error("Bunny.net configuration missing")
      return NextResponse.json({ error: "Storage service unavailable" }, { status: 500 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const extension = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : ""
    const fileName = extension ? `${randomUUID()}.${extension}` : randomUUID()
    const objectPath = `${session.user.id}/${fileType}/${fileName}`

    const uploadResponse = await fetch(`https://storage.bunnycdn.com/${storageZone}/${objectPath}`, {
      method: "PUT",
      headers: {
        AccessKey: storagePassword,
        "Content-Type": file.type || "application/octet-stream",
        "Content-Length": buffer.byteLength.toString(),
      },
      body: buffer,
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text().catch(() => "Unknown error")
      console.error("Bunny.net upload failed:", uploadResponse.status, errorText)
      return NextResponse.json({ error: "Failed to upload file" }, { status: 502 })
    }

    const url = `${cdnUrl.replace(/\/$/, "")}/${objectPath}`

    const userFile = await prisma.userFile.create({
      data: {
        userId: session.user.id,
        fileType: fileType as any,
        fileName: file.name,
        url,
        size: file.size,
      },
    })

    return NextResponse.json({ success: true, data: userFile }, { status: 201 })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}
