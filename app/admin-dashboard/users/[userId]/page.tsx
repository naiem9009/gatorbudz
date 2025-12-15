"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  Mail, 
  User, 
  Building, 
  Phone, 
  Shield, 
  CreditCard, 
  Package,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"


export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export default function UserDetailPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.userId as string
  
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [userFiles, setUserFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filesLoading, setFilesLoading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const { isAuthenticated, user } = useAuth()

  useEffect(() => {
    if (userId) {
      fetchUserDetails()
      fetchUserFiles()
    }
  }, [userId])

  const fetchUserDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/users/${userId}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch user details")
      }
      const data = await response.json()
      setSelectedUser(data.user)
    } catch (error: any) {
      console.error("Error fetching user details:", error.message)
      // Show error notification
    } finally {
      setLoading(false)
    }
  }

  const fetchUserFiles = async () => {
    try {
      setFilesLoading(true)
      const response = await fetch(`/api/admin/users/${userId}/files`)
      if (!response.ok) throw new Error("Failed to fetch user files")
      const data = await response.json()
      setUserFiles(data.files || [])
    } catch (error) {
      console.error("Error fetching user files:", error)
    } finally {
      setFilesLoading(false)
    }
  }

  const handleUpdateUser = async (updates: any) => {
    if (!selectedUser) return
    
    try {
      setUpdating(true)
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (!response.ok) throw new Error("Failed to update user")

      await fetchUserDetails()
    } catch (error) {
      console.error("Error updating user:", error)
    } finally {
      setUpdating(false)
    }
  }

  const handleDownloadFile = async (fileId: string, fileName: string) => {
    try {
      // Open in new tab for Bunny CDN redirect
      window.open(`/api/admin/files/${fileId}/download`, '_blank')
    } catch (error) {
      console.error("Error downloading file:", error)
    }
  }

  const handleBack = () => {
    router.push("/admin-dashboard/users")
  }

  const isCurrentUser = (userId: string) => {
    return user?.id === userId
  }

  const getRoleBadge = (role: string) => {
    const colors: any = {
      ADMIN: "bg-red-500/10 text-red-500 border-red-500/30",
      MANAGER: "bg-purple-500/10 text-purple-500 border-purple-500/30",
      VERIFIED: "bg-green-500/10 text-green-500 border-green-500/30",
      PUBLIC: "bg-gray-500/10 text-gray-500 border-gray-500/30",
    }
    return colors[role] || colors.PUBLIC
  }

  const getTierBadge = (tier: string) => {
    const colors: any = {
      DIAMOND: "bg-blue-500/10 text-blue-500 border-blue-500/30",
      PLATINUM: "bg-slate-500/10 text-slate-500 border-slate-500/30",
      GOLD: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
      NONE: "bg-gray-500/10 text-gray-500 border-gray-500/30",
    }
    return colors[tier] || colors.NONE
  }

  const getStatusBadge = (status: string) => {
    const colors: any = {
      ACTIVE: "bg-green-500/10 text-green-500 border-green-500/30",
      PENDING_REVIEW: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
      SUSPENDED: "bg-red-500/10 text-red-500 border-red-500/30",
    }
    return colors[status] || colors.PENDING_REVIEW
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 animate-pulse rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!selectedUser) {
    return (
      <div className="text-center py-12">
        <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">User Not Found</h1>
        <p className="text-muted-foreground mb-6">The user you're looking for doesn't exist.</p>
        <Button onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Users
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={handleBack}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Users
      </Button>

      {/* User Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{selectedUser.name || "Unnamed User"}</h1>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <p className="text-muted-foreground">{selectedUser.email}</p>
            </div>
            <Badge variant="outline" className={getRoleBadge(selectedUser.role)}>
              {selectedUser.role}
            </Badge>
            {isCurrentUser(selectedUser.id) && (
              <Badge variant="secondary">Your Account</Badge>
            )}
          </div>
        </div>
    
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">{selectedUser.name || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedUser.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedUser.emailVerified ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-yellow-500" />
                    )}
                    <span className="text-sm text-muted-foreground">
                      {selectedUser.emailVerified ? "Verified" : "Not verified"}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedUser.phone || "Not provided"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Company</p>
                  <p className="font-medium">{selectedUser.company || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">License Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedUser.licenseVerified ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                    )}
                    <span className="font-medium">
                      {selectedUser.licenseVerified ? "Verified" : "Pending Verification"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Account Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">User ID</p>
                  <p className="font-medium text-sm font-mono">{selectedUser.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="font-medium">{formatDate(selectedUser.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="font-medium">{formatDate(selectedUser.updatedAt)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Tier & Role */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Tier & Role
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Role</p>
                  <Select
                    value={selectedUser.role}
                    onValueChange={(newRole) => 
                      handleUpdateUser({ role: newRole })
                    }
                    disabled={updating || (isCurrentUser(selectedUser.id) && selectedUser.role === "ADMIN")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLIC">Public</SelectItem>
                      <SelectItem value="VERIFIED">Verified</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  {isCurrentUser(selectedUser.id) && selectedUser.role === "ADMIN" && (
                    <p className="text-xs text-muted-foreground mt-2">
                      You cannot change your own admin role
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Tier</p>
                  <Select
                    value={selectedUser.tier}
                    onValueChange={(newTier) => 
                      handleUpdateUser({ tier: newTier })
                    }
                    disabled={updating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">None</SelectItem>
                      <SelectItem value="GOLD">Gold</SelectItem>
                      <SelectItem value="PLATINUM">Platinum</SelectItem>
                      <SelectItem value="DIAMOND">Diamond</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Billing Address */}
            {(selectedUser.billingAddress1 || selectedUser.billingCity) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Billing Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-medium">{selectedUser.billingAddress1}</p>
                  {selectedUser.billingAddress2 && (
                    <p className="font-medium">{selectedUser.billingAddress2}</p>
                  )}
                  <p className="text-muted-foreground">
                    {[selectedUser.billingCity, selectedUser.billingState, selectedUser.billingPostalCode]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                  {selectedUser.billingCountry && (
                    <p className="text-muted-foreground">{selectedUser.billingCountry}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Shipping Address */}
            {(selectedUser.shippingAddress1 || selectedUser.shippingCity) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-medium">{selectedUser.shippingAddress1}</p>
                  {selectedUser.shippingAddress2 && (
                    <p className="font-medium">{selectedUser.shippingAddress2}</p>
                  )}
                  <p className="text-muted-foreground">
                    {[selectedUser.shippingCity, selectedUser.shippingState, selectedUser.shippingPostalCode]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                  {selectedUser.shippingCountry && (
                    <p className="text-muted-foreground">{selectedUser.shippingCountry}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                User Documents
              </CardTitle>
              <CardDescription>
                View and manage user uploaded files
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-9 w-20" />
                    </div>
                  ))}
                </div>
              ) : userFiles.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium text-lg mb-2">No documents found</h3>
                  <p className="text-muted-foreground">This user hasn't uploaded any documents yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userFiles.map((file) => (
                      <TableRow key={file.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            {file.fileName}
                          </div>
                          {file.description && (
                            <p className="text-sm text-muted-foreground mt-1">{file.description}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {file.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{file.fileType}</TableCell>
                        <TableCell className="text-sm">{formatFileSize(file.fileSize)}</TableCell>
                        <TableCell className="text-sm">
                          {formatDate(file.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadFile(file.id, file.fileName)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Advanced account management options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Danger Zone</h3>
                  <Separator />
                </div>
                
                <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-red-900">Delete User Account</h4>
                      <p className="text-sm text-red-700 mt-1">
                        Permanently delete this user account and all associated data.
                        This action cannot be undone.
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      disabled={isCurrentUser(selectedUser.id)}
                      onClick={async () => {
                        if (confirm(`Are you sure you want to delete ${selectedUser.email}? This action cannot be undone.`)) {
                          try {
                            const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
                              method: 'DELETE',
                            })
                            if (response.ok) {
                              router.push('/admin-dashboard/users')
                            }
                          } catch (error) {
                            console.error('Error deleting user:', error)
                          }
                        }
                      }}
                    >
                      {isCurrentUser(selectedUser.id) ? "Cannot Delete Own Account" : "Delete Account"}
                    </Button>
                  </div>
                  {isCurrentUser(selectedUser.id) && (
                    <p className="text-sm text-red-700 mt-2">
                      You cannot delete your own account. Please ask another administrator.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}