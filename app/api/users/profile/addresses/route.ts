import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

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
        // Billing address
        billingAddress1: true,
        billingAddress2: true,
        billingCity: true,
        billingState: true,
        billingPostalCode: true,
        billingCountry: true,
        // Shipping address
        shippingAddress1: true,
        shippingAddress2: true,
        shippingCity: true,
        shippingState: true,
        shippingPostalCode: true,
        shippingCountry: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error("Error fetching addresses:", error)
    return NextResponse.json({ error: "Failed to fetch addresses" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { type, ...addressData } = body

    // Validate address type
    if (!type || (type !== "billing" && type !== "shipping")) {
      return NextResponse.json({ error: "Invalid address type" }, { status: 400 })
    }

    // Prepare update data based on type
    const updateData: any = {}
    
    if (type === "billing") {
      if (addressData.billingAddress1 !== undefined) updateData.billingAddress1 = addressData.billingAddress1
      if (addressData.billingAddress2 !== undefined) updateData.billingAddress2 = addressData.billingAddress2
      if (addressData.billingCity !== undefined) updateData.billingCity = addressData.billingCity
      if (addressData.billingState !== undefined) updateData.billingState = addressData.billingState
      if (addressData.billingPostalCode !== undefined) updateData.billingPostalCode = addressData.billingPostalCode
      if (addressData.billingCountry !== undefined) updateData.billingCountry = addressData.billingCountry
    } else {
      if (addressData.shippingAddress1 !== undefined) updateData.shippingAddress1 = addressData.shippingAddress1
      if (addressData.shippingAddress2 !== undefined) updateData.shippingAddress2 = addressData.shippingAddress2
      if (addressData.shippingCity !== undefined) updateData.shippingCity = addressData.shippingCity
      if (addressData.shippingState !== undefined) updateData.shippingState = addressData.shippingState
      if (addressData.shippingPostalCode !== undefined) updateData.shippingPostalCode = addressData.shippingPostalCode
      if (addressData.shippingCountry !== undefined) updateData.shippingCountry = addressData.shippingCountry
    }

    // Validate required fields
    if (type === "billing") {
      if (!addressData.billingAddress1?.trim()) {
        return NextResponse.json({ error: "Address Line 1 is required" }, { status: 400 })
      }
      if (!addressData.billingCity?.trim()) {
        return NextResponse.json({ error: "City is required" }, { status: 400 })
      }
      if (!addressData.billingCountry?.trim()) {
        return NextResponse.json({ error: "Country is required" }, { status: 400 })
      }
    } else {
      if (!addressData.shippingAddress1?.trim()) {
        return NextResponse.json({ error: "Address Line 1 is required" }, { status: 400 })
      }
      if (!addressData.shippingCity?.trim()) {
        return NextResponse.json({ error: "City is required" }, { status: 400 })
      }
      if (!addressData.shippingCountry?.trim()) {
        return NextResponse.json({ error: "Country is required" }, { status: 400 })
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        // Billing address
        billingAddress1: true,
        billingAddress2: true,
        billingCity: true,
        billingState: true,
        billingPostalCode: true,
        billingCountry: true,
        // Shipping address
        shippingAddress1: true,
        shippingAddress2: true,
        shippingCity: true,
        shippingState: true,
        shippingPostalCode: true,
        shippingCountry: true,
      },
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        actorRole: session.user.role,
        action: type === "billing" ? "BILLING_ADDRESS_UPDATED" : "SHIPPING_ADDRESS_UPDATED",
        entity: "User",
        entityId: session.user.id,
        meta: addressData,
      },
    })

    return NextResponse.json({ 
      success: true, 
      message: `${type === "billing" ? "Billing" : "Shipping"} address updated successfully`,
      data: updatedUser 
    })
  } catch (error) {
    console.error("Error updating address:", error)
    
    if (error instanceof Error && error.message.includes("P2002")) {
      return NextResponse.json({ 
        error: "Database error occurred" 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: "Failed to update address. Please try again." 
    }, { status: 500 })
  }
}