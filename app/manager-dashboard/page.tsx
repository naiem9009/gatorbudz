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
import { ShoppingCart, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface ManagerStats {
  pendingOrders: number
  completedToday: number
  totalOrders: number
  issues: number
}

interface ChartDataPoint {
  day: string
  pending: number
  completed: number
  cancelled: number
}

export default function ManagerDashboard() {
  const [stats, setStats] = useState<ManagerStats | null>(null)
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch("/api/manager/dashboard/stats")
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
    {
      label: "Pending Orders",
      value: stats?.pendingOrders || 0,
      icon: Clock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      label: "Completed Today",
      value: stats?.completedToday || 0,
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      label: "Total Orders",
      value: stats?.totalOrders || 0,
      icon: ShoppingCart,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      label: "Issues",
      value: stats?.issues || 0,
      icon: AlertCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Order fulfillment and operations overview</p>
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
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Status */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
            <CardDescription>Weekly order status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="day" stroke="var(--color-muted-foreground)" />
                  <YAxis stroke="var(--color-muted-foreground)" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}
                  />
                  <Legend />
                  <Bar dataKey="pending" fill="var(--color-chart-4)" name="Pending" />
                  <Bar dataKey="completed" fill="var(--color-accent)" name="Completed" />
                  <Bar dataKey="cancelled" fill="var(--color-destructive)" name="Cancelled" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Fulfillment Trend */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Fulfillment Trend</CardTitle>
            <CardDescription>Completed orders over the week</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="day" stroke="var(--color-muted-foreground)" />
                  <YAxis stroke="var(--color-muted-foreground)" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke="var(--color-accent)"
                    strokeWidth={2}
                    name="Completed"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
