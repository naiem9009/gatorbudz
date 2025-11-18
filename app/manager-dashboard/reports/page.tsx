"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

const weeklyData = [
  { day: "Mon", orders: 24, revenue: 2400, fulfillment: 95 },
  { day: "Tue", orders: 28, revenue: 2210, fulfillment: 92 },
  { day: "Wed", orders: 32, revenue: 2290, fulfillment: 98 },
  { day: "Thu", orders: 30, revenue: 2000, fulfillment: 89 },
  { day: "Fri", orders: 42, revenue: 2181, fulfillment: 96 },
  { day: "Sat", orders: 38, revenue: 2500, fulfillment: 94 },
  { day: "Sun", orders: 20, revenue: 1800, fulfillment: 91 },
]

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Reports</h1>
        <p className="text-muted-foreground mt-2">Performance and fulfillment analytics</p>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders & Revenue */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Orders & Revenue</CardTitle>
            <CardDescription>Weekly performance</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}
                />
                <Legend />
                <Bar dataKey="orders" fill="var(--color-accent)" name="Orders" />
                <Bar dataKey="revenue" fill="var(--color-chart-2)" name="Revenue ($)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Fulfillment Rate */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Fulfillment Rate</CardTitle>
            <CardDescription>Weekly fulfillment percentage</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="fulfillment"
                  stroke="var(--color-accent)"
                  strokeWidth={2}
                  name="Fulfillment %"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
