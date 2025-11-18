"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface TierProposal {
  id: string
  user: { id: string; email: string; name: string | null; tier: string }
  proposedTier: string
  reason: string
  status: string
  createdAt: string
}

export default function AdminTierProposals() {
  const [proposals, setProposals] = useState<TierProposal[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("PENDING")
  const [selectedProposal, setSelectedProposal] = useState<TierProposal | null>(null)
  const [decisionNote, setDecisionNote] = useState("")
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchProposals()
  }, [statusFilter])

  async function fetchProposals() {
    setLoading(true)
    try {
      const params = statusFilter !== "all" ? `?status=${statusFilter}` : ""
      const res = await fetch(`/api/tier-proposals/list${params}`)
      const json = await res.json()
      setProposals(json.data || [])
    } catch (error) {
      console.error("Error fetching proposals:", error)
    } finally {
      setLoading(false)
    }
  }

  async function respondToProposal(proposalId: string, status: "APPROVED" | "REJECTED") {
    setProcessing(true)
    try {
      const res = await fetch(`/api/tier-proposals/${proposalId}/respond`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, decisionNote }),
      })

      if (res.ok) {
        setSelectedProposal(null)
        setDecisionNote("")
        fetchProposals()
      }
    } catch (error) {
      console.error("Error responding to proposal:", error)
    } finally {
      setProcessing(false)
    }
  }

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-500/10 text-yellow-700",
    APPROVED: "bg-green-500/10 text-green-700",
    REJECTED: "bg-red-500/10 text-red-700",
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Tier Change Proposals</CardTitle>
          <CardDescription>Review and approve customer tier upgrade requests</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="w-full md:w-48">
            <label className="text-sm font-medium text-foreground mb-2 block">Filter by Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead>Customer</TableHead>
                  <TableHead>Current Tier</TableHead>
                  <TableHead>Requested Tier</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : proposals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No proposals found
                    </TableCell>
                  </TableRow>
                ) : (
                  proposals.map((proposal) => (
                    <TableRow key={proposal.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{proposal.user.name || proposal.user.email}</p>
                          <p className="text-xs text-muted-foreground">{proposal.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-blue-500/10 text-blue-700">{proposal.user.tier}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-purple-500/10 text-purple-700">{proposal.proposedTier}</Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-xs truncate">{proposal.reason}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[proposal.status] || ""}>{proposal.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{new Date(proposal.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        {proposal.status === "PENDING" && (
                          <Button variant="ghost" size="sm" onClick={() => setSelectedProposal(proposal)}>
                            Review
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      {selectedProposal && (
        <AlertDialog open={!!selectedProposal} onOpenChange={() => setSelectedProposal(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Review Tier Proposal</AlertDialogTitle>
              <AlertDialogDescription>
                {selectedProposal.user.email} is requesting upgrade from {selectedProposal.user.tier} to{" "}
                {selectedProposal.proposedTier}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Reason</label>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded">{selectedProposal.reason}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Decision Note</label>
                <Textarea
                  placeholder="Add a note for your records..."
                  value={decisionNote}
                  onChange={(e) => setDecisionNote(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={() => respondToProposal(selectedProposal.id, "REJECTED")}
                disabled={processing}
              >
                {processing ? "Processing..." : "Reject"}
              </Button>
              <AlertDialogAction
                onClick={() => respondToProposal(selectedProposal.id, "APPROVED")}
                disabled={processing}
              >
                {processing ? "Processing..." : "Approve"}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
