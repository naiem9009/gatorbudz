import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library"
import { prisma } from "@/lib/db"
import { randomUUID } from "crypto"
import { sendAccountUnderReviewEmail, sendNewUserAdminNotification } from "@/lib/email"

export const runtime = "nodejs"

// Extended registration schema with structured addresses
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  company: z.string().min(1, "Company name is required"),
  phone: z.string().min(1, "Phone number is required"),
  
  // Billing address fields
  billingAddress1: z.string().min(1, "Billing address line 1 is required"),
  billingAddress2: z.string().optional(),
  billingCity: z.string().min(1, "Billing city is required"),
  billingState: z.string().min(1, "Billing state is required"),
  billingPostalCode: z.string().min(1, "Billing postal code is required"),
  billingCountry: z.string().min(1, "Billing country is required").default("US"),
  
  // Shipping address fields
  shippingAddress1: z.string().optional(),
  shippingAddress2: z.string().optional(),
  shippingCity: z.string().optional(),
  shippingState: z.string().optional(),
  shippingPostalCode: z.string().optional(),
  shippingCountry: z.string().optional(),
})



export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    // Extract form data
    const jsonData = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      name: formData.get("name") as string,
      company: formData.get("company") as string,
      phone: formData.get("phone") as string,
      
      // Billing address
      billingAddress1: formData.get("billingAddress1") as string,
      billingAddress2: formData.get("billingAddress2") as string,
      billingCity: formData.get("billingCity") as string,
      billingState: formData.get("billingState") as string,
      billingPostalCode: formData.get("billingPostalCode") as string,
      billingCountry: formData.get("billingCountry") as string || "US",
      
      // Shipping address
      shippingAddress1: formData.get("shippingAddress1") as string,
      shippingAddress2: formData.get("shippingAddress2") as string,
      shippingCity: formData.get("shippingCity") as string,
      shippingState: formData.get("shippingState") as string,
      shippingPostalCode: formData.get("shippingPostalCode") as string,
      shippingCountry: formData.get("shippingCountry") as string || "US",
    }

    // Validate with schema
    const {
      email,
      password,
      name,
      company,
      phone,
      billingAddress1,
      billingAddress2,
      billingCity,
      billingState,
      billingPostalCode,
      billingCountry,
      shippingAddress1,
      shippingAddress2,
      shippingCity,
      shippingState,
      shippingPostalCode,
      shippingCountry: shippingCountryInput,
    } = registerSchema.parse(jsonData)

    const licenseFile = formData.get("license") as File | null
    if (!licenseFile) {
      return NextResponse.json({ error: "License file is required" }, { status: 400 })
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase()

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    })
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Process shipping address - use billing if shipping is not provided
    const shippingCountry = shippingCountryInput || billingCountry
    
    // Determine if shipping address is same as billing
    const isSameAddress = !shippingAddress1 && !shippingCity && !shippingState
    
    const finalShippingAddress1 = isSameAddress ? billingAddress1 : shippingAddress1
    const finalShippingAddress2 = isSameAddress ? billingAddress2 : shippingAddress2
    const finalShippingCity = isSameAddress ? billingCity : shippingCity
    const finalShippingState = isSameAddress ? billingState : shippingState
    const finalShippingPostalCode = isSameAddress ? billingPostalCode : shippingPostalCode
    const finalShippingCountry = isSameAddress ? billingCountry : shippingCountry

    // Create user with Better Auth
    const res = await auth.api.signUpEmail({
      body: { email: normalizedEmail, password, name },
    })

    if (!res?.user) {
      return NextResponse.json({ error: "Sign up failed" }, { status: 400 })
    }

    // Upload license to Bunny.net
    const storageZone = process.env.BUNNY_STORAGE_ZONE
    const storagePassword = process.env.BUNNY_STORAGE_PASSWORD
    const cdnUrl = process.env.BUNNY_CDN_URL

    if (!storageZone || !storagePassword || !cdnUrl) {
      console.error("Bunny.net configuration missing")
      return NextResponse.json({ error: "Storage service unavailable" }, { status: 500 })
    }

    const arrayBuffer = await licenseFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const extension = licenseFile.name.includes(".")
      ? licenseFile.name.split(".").pop()!.toLowerCase()
      : ""

    const storedFileName = extension ? `${randomUUID()}.${extension}` : randomUUID()

    // ✅ EMAIL folder (sanitize for Bunny path safety)
    const emailFolder = normalizedEmail.replace(/[^a-z0-9]/gi, "_").toLowerCase()
    const objectPath = `${emailFolder}/license/${storedFileName}`

    const uploadResponse = await fetch(
      `https://storage.bunnycdn.com/${storageZone}/${objectPath}`,
      {
        method: "PUT",
        headers: {
          AccessKey: storagePassword,
          "Content-Type": licenseFile.type || "application/octet-stream",
          "Content-Length": buffer.byteLength.toString(),
        },
        body: buffer,
      }
    )

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text().catch(() => "Unknown error")
      console.error("Bunny.net upload failed:", uploadResponse.status, errorText)
      return NextResponse.json({ error: "Failed to upload license file" }, { status: 502 })
    }

    const publicUrl = `${cdnUrl.replace(/\/$/, "")}/${objectPath}`

    // Update user with additional information
    const updatedUser = await prisma.user.update({
      where: { id: res.user.id },
      data: {
        role: "PUBLIC",
        tier: "NONE",
        company,
        phone,
        
        // Billing address
        billingAddress1,
        billingAddress2,
        billingCity,
        billingState,
        billingPostalCode,
        billingCountry,
        
        // Shipping address
        shippingAddress1: finalShippingAddress1 || null,
        shippingAddress2: finalShippingAddress2 || null,
        shippingCity: finalShippingCity || null,
        shippingState: finalShippingState || null,
        shippingPostalCode: finalShippingPostalCode || null,
        shippingCountry: finalShippingCountry || null,
        
        accountStatus: "PENDING_REVIEW",
        licenseVerified: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        phone: true,
        role: true,
        tier: true,
        accountStatus: true,
        billingAddress1: true,
        billingAddress2: true,
        billingCity: true,
        billingState: true,
        billingPostalCode: true,
        billingCountry: true,
        shippingAddress1: true,
        shippingAddress2: true,
        shippingCity: true,
        shippingState: true,
        shippingPostalCode: true,
        shippingCountry: true,
        createdAt: true,
      },
    })

    // Save license file record
    const userFile = await prisma.userFile.create({
      data: {
        userId: res.user.id,
        fileName: licenseFile.name,
        filePath: publicUrl,
        fileType: licenseFile.type || "application/octet-stream",
        fileSize: licenseFile.size,
        category: "LICENSE",
        description: "Resale/Tax License",
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: updatedUser.id,
        actorRole: updatedUser.role,
        action: "USER_REGISTERED",
        entity: "User",
        entityId: updatedUser.id,
        meta: {
          email: updatedUser.email,
          name: updatedUser.name,
          company: updatedUser.company,
          phone: updatedUser.phone,
        },
      },
    })

    // Send customer notification (run in background)
    sendAccountUnderReviewEmail({email: updatedUser.email!, name: updatedUser.name!}).catch(error => {
      console.error('Failed to send customer account under review email:', error)
    })

    // Send admin notification (run in background)
    sendNewUserAdminNotification(updatedUser).catch(error => {
      console.error('Failed to send admin notification:', error)
    })

    return NextResponse.json(
      {
        success: true,
        user: updatedUser,
        license: userFile,
        message: "Account created successfully. Your license is under review.",
      },
      { status: 201 }
    )
  } catch (err: any) {
    if (err?.issues) {
      return NextResponse.json({ 
        error: "Validation error",
        details: err.issues.map((issue: any) => issue.message) 
      }, { status: 400 })
    }
    if (err instanceof PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }
    console.error("Registration failed:", err)
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}