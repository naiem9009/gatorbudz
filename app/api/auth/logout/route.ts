import { auth } from "@/lib/auth"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    await auth.api.signOut({ headers: request.headers })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}
