"use client"

import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/pricing-utils"

interface PricingRow {
  name: string
  goldPrice?: number
  platinumPrice?: number
  diamondPrice?: number
  suggestedRetail?: number
}

interface PricingTableProps {
  title: string
  rows: PricingRow[]
  columns: ("gold" | "platinum" | "diamond" | "retail")[]
}

export default function PricingTable({
  title,
  rows,
  columns,
}: PricingTableProps) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="bg-accent text-accent-foreground p-4">
        <h3 className="text-lg font-bold uppercase tracking-wide text-balance">
          {title}
        </h3>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-semibold text-foreground text-sm">
                Product
              </th>
              {columns.includes("gold") && (
                <th className="px-4 py-3 text-center font-semibold text-foreground text-sm">
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600">
                    Gold
                  </Badge>
                </th>
              )}
              {columns.includes("platinum") && (
                <th className="px-4 py-3 text-center font-semibold text-foreground text-sm">
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-600">
                    Platinum
                  </Badge>
                </th>
              )}
              {columns.includes("diamond") && (
                <th className="px-4 py-3 text-center font-semibold text-foreground text-sm">
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-600">
                    Diamond
                  </Badge>
                </th>
              )}
              {columns.includes("retail") && (
                <th className="px-4 py-3 text-center font-semibold text-foreground text-sm">
                  Suggested Retail
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={idx}
                className={`border-b border-border ${
                  idx % 2 === 0 ? "bg-background" : "bg-muted/20"
                }`}
              >
                <td className="px-4 py-3 font-medium text-foreground">
                  {row.name}
                </td>
                {columns.includes("gold") && (
                  <td className="px-4 py-3 text-center text-foreground font-semibold">
                    {row.goldPrice ? formatPrice(row.goldPrice) : "—"}
                  </td>
                )}
                {columns.includes("platinum") && (
                  <td className="px-4 py-3 text-center text-foreground font-semibold">
                    {row.platinumPrice ? formatPrice(row.platinumPrice) : "—"}
                  </td>
                )}
                {columns.includes("diamond") && (
                  <td className="px-4 py-3 text-center text-foreground font-semibold">
                    {row.diamondPrice ? formatPrice(row.diamondPrice) : "—"}
                  </td>
                )}
                {columns.includes("retail") && (
                  <td className="px-4 py-3 text-center text-foreground">
                    {row.suggestedRetail ? `${row.suggestedRetail}` : "—"}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
