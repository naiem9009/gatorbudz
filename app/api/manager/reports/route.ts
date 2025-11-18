import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session || session.user.role !== "MANAGER") {
      return new Response("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "month"

    const orders = await db.orderRequest.findMany({
      include: {
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const totalOrders = orders.length
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0)
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
    const conversionRate = 45 // Placeholder until real analytics are wired

    const dailyOrders = generateDailyData(orders)
    const revenueByProduct = generateProductRevenue(orders)
    const topProducts = generateTopProducts(orders)

    return Response.json({
      totalOrders,
      totalRevenue,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      conversionRate,
      dailyOrders,
      revenueByProduct,
      topProducts,
    })
  } catch (error) {
    console.error("Reports fetch error:", error)
    return Response.json({ error: "Failed to fetch reports" }, { status: 500 })
  }
}

type OrderWithItems = Awaited<ReturnType<typeof db.orderRequest.findMany>>[number]

function generateDailyData(orders: OrderWithItems[]) {
  const daysBack = 7
  const buckets = new Map<string, { date: string; orders: number; revenue: number }>()

  for (let i = daysBack - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const key = date.toISOString().slice(0, 10)
    buckets.set(key, {
      date: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      orders: 0,
      revenue: 0,
    })
  }

  orders.forEach((order) => {
    const key = order.createdAt.toISOString().slice(0, 10)
    const bucket = buckets.get(key)
    if (bucket) {
      bucket.orders += 1
      bucket.revenue += order.totalPrice
    }
  })

  return Array.from(buckets.values())
}

function generateProductRevenue(orders: OrderWithItems[]) {
  const revenueMap = new Map<string, number>()

  orders.forEach((order) => {
    order.items.forEach((item) => {
      const name = item.product?.name || "Unknown"
      revenueMap.set(name, (revenueMap.get(name) || 0) + item.totalPrice)
    })
  })

  return Array.from(revenueMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
}

function generateTopProducts(orders: OrderWithItems[]) {
  const grouped = new Map<
    string,
    {
      name: string
      sold: number
      revenue: number
    }
  >()

  orders.forEach((order) => {
    order.items.forEach((item) => {
      const name = item.product?.name || "Unknown"
      const entry = grouped.get(name) || { name, sold: 0, revenue: 0 }
      entry.sold += item.quantity
      entry.revenue += item.totalPrice
      grouped.set(name, entry)
    })
  })

  return Array.from(grouped.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
}
