"use client"

import AdminTierProposals from "@/components/admin-tier-proposals"

export default function AdminTierProposalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Tier Proposals</h1>
        <p className="text-muted-foreground mt-2">Review and manage tier upgrade requests</p>
      </div>
      <AdminTierProposals />
    </div>
  )
}
