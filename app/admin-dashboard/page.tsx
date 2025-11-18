"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"
import { Users, Package, ShoppingCart, TrendingUp } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface DashboardStats {
  totalUsers: number
  totalProducts: number
  activeOrders: number
  totalRevenue: number
}

interface ChartDataPoint {
  month: string
  users: number
  orders: number
  revenue: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch("/api/admin/dashboard/stats")
        if (!response.ok) throw new Error("Failed to fetch stats")

        const data = await response.json()
        setStats(data.stats)
        setChartData(data.chartData)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const statsConfig = [
    { label: "Total Users", value: stats?.totalUsers || 0, icon: Users},
    { label: "Total Products", value: stats?.totalProducts || 0, icon: Package},
    { label: "Active Orders", value: stats?.activeOrders || 0, icon: ShoppingCart},
    { label: "Revenue", value: `$${(stats?.totalRevenue || 0).toLocaleString()}`, icon: TrendingUp},
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Welcome back! Here's your system overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsConfig.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    {loading ? (
                      <Skeleton className="h-8 w-20 mt-2" />
                    ) : (
                      <p className="text-2xl font-bold text-foreground mt-2">{stat.value}</p>
                    )}
                  </div>
                  <div className="bg-accent/10 p-3 rounded-lg">
                    <Icon className="w-6 h-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users & Orders Chart */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Users & Orders Trend</CardTitle>
            <CardDescription>Monthly growth over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="month" stroke="var(--color-muted-foreground)" />
                  <YAxis stroke="var(--color-muted-foreground)" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}
                  />
                  <Legend />
                  <Bar dataKey="users" fill="var(--color-accent)" name="Users" />
                  <Bar dataKey="orders" fill="var(--color-chart-2)" name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue performance</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="month" stroke="var(--color-muted-foreground)" />
                  <YAxis stroke="var(--color-muted-foreground)" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="var(--color-accent)" name="Revenue" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
