import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // ----- Top-level stats -----

    // Total users
    const totalUsers = await prisma.user.count();

    // Total ACTIVE products
    const totalProducts = await prisma.product.count({ where: { status: "ACTIVE" } });

    // Active orders (pending/approved)
    const activeOrders = await prisma.orderRequest.count({
      where: { status: { in: ["PENDING", "APPROVED"] } },
    });

    // Total revenue from FULFILLED orders
    const fulfilledOrdersAllTime = await prisma.orderRequest.findMany({
      where: { status: "FULFILLED" },
      select: { totalPrice: true },
    });
    const totalRevenue = fulfilledOrdersAllTime.reduce(
      (sum, o) => sum + (o.totalPrice || 0),
      0
    );

    // ----- Chart (last 6 months) -----

    // 6 মাস বলতে: চলতি মাস সহ আগের ৫ মাস = মোট ৬ মাস
    const now = new Date();
    const monthStartOf = (y: number, m: number) => new Date(y, m, 1, 0, 0, 0, 0);
    const monthEndOf   = (y: number, m: number) => new Date(y, m + 1, 0, 23, 59, 59, 999);

    // ৫ মাস আগে মাসের শুরু (inclusive)
    const oldestMonthDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const sixMonthsStart = monthStartOf(oldestMonthDate.getFullYear(), oldestMonthDate.getMonth());

    // এই রেঞ্জের মধ্যে কেবল FULFILLED অর্ডারগুলো নিয়ে আসি
    const fulfilledOrdersLast6M = await prisma.orderRequest.findMany({
      where: {
        status: "FULFILLED",
        createdAt: { gte: sixMonthsStart },
      },
      select: { createdAt: true, totalPrice: true },
    });

    // ৬ মাসের মাস-ভিত্তিক ডাটা তৈরি
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const start = monthStartOf(d.getFullYear(), d.getMonth());
      const end   = monthEndOf(d.getFullYear(), d.getMonth());
      const label = d.toLocaleString("default", { month: "short" }); // e.g., Jan, Feb
      return { start, end, label };
    });

    // প্রতি মাসের cumulative users + fulfilled orders + revenue
    const chartData = await Promise.all(
      months.map(async ({ start, end, label }) => {
        // মাসটিতে FULFILLED অর্ডারগুলো
        const monthOrders = fulfilledOrdersLast6M.filter(
          (o) => o.createdAt >= start && o.createdAt <= end
        );

        const orders = monthOrders.length;
        const revenue = monthOrders.reduce((s, o) => s + (o.totalPrice || 0), 0);

        // ওই মাসের শেষ সময় পর্যন্ত মোট ইউজার (cumulative)
        const users = await prisma.user.count({
          where: { createdAt: { lte: end } },
        });

        return {
          month: label,
          users,
          orders,
          revenue,
        };
      })
    );

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalProducts,
        activeOrders,
        totalRevenue,
      },
      chartData,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 });
  }
}
