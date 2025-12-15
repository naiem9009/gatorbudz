


import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, company } = body

    // Validate input
    if (name && name.length > 100) {
      return NextResponse.json({ error: "Name is too long" }, { status: 400 })
    }

    if (company && company.length > 100) {
      return NextResponse.json({ error: "Company name is too long" }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name !== undefined ? name : session.user.name,
        company: company !== undefined ? company : session.user.company,
      },
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        tier: true,
        role: true,
        phone: true,
        accountStatus: true,
        createdAt: true,
      },
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        actorRole: session.user.role,
        action: "USER_PROFILE_UPDATED",
        entity: "User",
        entityId: session.user.id,
        meta: { name, company },
      },
    })

    return NextResponse.json({ 
      success: true, 
      message: "Profile updated successfully",
      data: updatedUser 
    })
  } catch (error) {
    console.error("Error updating profile:", error)
    
    // Handle specific Prisma errors
    if (error instanceof Error && error.message.includes("P2002")) {
      return NextResponse.json({ 
        error: "A user with this information already exists" 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: "Failed to update profile. Please try again." 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        phone: true,
        tier: true,
        role: true,
        accountStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}