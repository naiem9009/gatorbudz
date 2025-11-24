import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session || !["MANAGER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get pending orders
    const pendingOrders = await prisma.orderRequest.count({
      where: { status: "PENDING" },
    })

    // Get completed orders today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const completedToday = await prisma.orderRequest.count({
      where: {
        status: "FULFILLED",
        createdAt: { gte: today },
      },
    })

    // Get total orders
    const totalOrders = await prisma.orderRequest.count()

    // Get orders with issues (cancelled or failed)
    const issues = await prisma.orderRequest.count({
      where: { status: { in: ["REJECTED"] } },
    })

    // Get weekly order data
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const weeklyOrders = await prisma.orderRequest.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { status: true, createdAt: true },
    })

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const chartData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      date.setHours(0, 0, 0, 0)

      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const dayOrders = weeklyOrders.filter((o) => new Date(o.createdAt) >= date && new Date(o.createdAt) < nextDate)

      return {
        day: days[date.getDay()],
        pending: dayOrders.filter((o) => o.status === "PENDING").length,
        completed: dayOrders.filter((o) => o.status === "FULFILLED").length,
        cancelled: dayOrders.filter((o) => o.status === "REJECTED").length,
      }
    })

    return NextResponse.json({
      success: true,
      stats: {
        pendingOrders,
        completedToday,
        totalOrders,
        issues,
      },
      chartData,
    })
  } catch (error) {
    console.error("Error fetching manager dashboard stats:", error)
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 })
  }
}
