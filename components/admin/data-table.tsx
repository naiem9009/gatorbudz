"use client"

import type React from "react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Search } from "lucide-react"
import { useState } from "react"

interface Column {
  key: string
  label: string
  render?: (value: any, row: any) => React.ReactNode
}

interface DataTableProps {
  columns: Column[]
  data: any[]
  actions?: (row: any) => React.ReactNode
  title: string
  description?: string
  searchPlaceholder?: string
  onSearch?: (term: string) => void
}

export default function DataTable({
  columns,
  data,
  actions,
  title,
  description,
  searchPlaceholder = "Search...",
  onSearch,
}: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    onSearch?.(term)
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        {onSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-background border-border"
            />
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                {columns.map((column) => (
                  <TableHead key={column.key} className="text-foreground">
                    {column.label}
                  </TableHead>
                ))}
                {actions && <TableHead className="text-foreground text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (actions ? 1 : 0)}
                    className="text-center text-muted-foreground py-8"
                  >
                    No data found
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, idx) => (
                  <TableRow key={idx} className="border-border hover:bg-muted/50">
                    {columns.map((column) => (
                      <TableCell key={column.key} className="text-foreground">
                        {column.render ? column.render(row[column.key], row) : row[column.key]}
                      </TableCell>
                    ))}
                    {actions && <TableCell className="text-right">{actions(row)}</TableCell>}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
