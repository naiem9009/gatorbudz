"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { FileText, Upload } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface UserFile {
  id: string
  fileName: string
  fileType: string
  url: string
  size: number
  flagged: boolean
  reviewNote?: string
  createdAt: string
}

export default function DashboardFiles() {
  const [files, setFiles] = useState<UserFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchFiles()
  }, [])

  async function fetchFiles() {
    try {
      const response = await fetch("/api/files")
      const json = await response.json()
      setFiles(json.data || [])
    } catch (error) {
      console.error("Failed to fetch files:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("fileType", "DOCUMENT")

      const response = await fetch("/api/files", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        await fetchFiles()
      }
    } catch (error) {
      console.error("Failed to upload file:", error)
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading files...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-foreground">Your Files</h2>
        <label>
          <Button className="bg-accent text-accent-foreground hover:opacity-90 gap-2" disabled={uploading} asChild>
            <span>
              <Upload size={18} />
              {uploading ? "Uploading..." : "Upload File"}
            </span>
          </Button>
          <input type="file" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      {files.length > 0 ? (
        <div className="space-y-3">
          {files.map((file) => (
            <div key={file.id} className="bg-card border border-border p-4 rounded-lg hover:border-accent transition">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={20} className="text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{file.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB • {new Date(file.createdAt).toLocaleDateString()}
                    </p>
                    {file.flagged && (
                      <div className="mt-1">
                        <Badge className="bg-red-500/10 text-red-700 text-xs">Flagged: {file.reviewNote}</Badge>
                      </div>
                    )}
                  </div>
                </div>

                <Button variant="outline" size="sm" className="bg-transparent" asChild>
                  <a href={file.url} target="_blank" rel="noopener noreferrer">
                    Download
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No files uploaded yet</p>
          <label>
            <Button className="bg-accent text-accent-foreground hover:opacity-90 gap-2" asChild>
              <span>
                <Upload size={18} />
                Upload Your First File
              </span>
            </Button>
            <input type="file" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      )}
    </div>
  )
}
