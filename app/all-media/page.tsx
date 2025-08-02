"use client"

import { useState } from "react"
import { Search, Upload, ArrowLeft, Tag, Download, Trash2, Check, X, Camera, Video, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Checkbox } from "@/components/ui/checkbox"
import { useMedia } from "@/hooks/use-media"
import { useToast } from "@/hooks/use-toast"
import { TaggingModal } from "@/components/tagging-modal"
import { UploadProgress } from "@/components/upload-progress"

// Mock data for demonstration
const mockMedia = [
  {
    id: 1,
    type: "image",
    url: "/placeholder.svg?height=200&width=200&text=📸&bg=1f2937&fg=6b7280",
    name: "Mountain Sunset",
    tags: ["bas", "nate"],
    uploadedBy: "Bas",
    uploadedAt: "2 hours ago",
  },
  {
    id: 2,
    type: "video",
    url: "/placeholder.svg?height=200&width=200&text=🎬&bg=374151&fg=9ca3af",
    name: "Beach Waves",
    tags: ["sha", "simon"],
    uploadedBy: "Sha",
    uploadedAt: "5 hours ago",
  },
  {
    id: 3,
    type: "image",
    url: "/placeholder.svg?height=200&width=200&text=🖼️&bg=1f2937&fg=6b7280",
    name: "City Lights",
    tags: ["felaw"],
    uploadedBy: "Felaw",
    uploadedAt: "1 day ago",
  },
]

const quickAccessUsers = [
  { id: "bas", name: "Bas", initials: "BA" },
  { id: "sha", name: "Sha", initials: "SH" },
  { id: "nate", name: "Nate", initials: "NA" },
  { id: "simon", name: "Simon", initials: "SI" },
  { id: "felaw", name: "Felaw", initials: "FE" },
]

export default function AllMediaPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState<string[]>([])
  const [expandedMedia, setExpandedMedia] = useState<any>(null)
  const [taggingMedia, setTaggingMedia] = useState<any>(null)
  const [uploadProgress, setUploadProgress] = useState<{ name: string; progress: number }[]>([])
  const { media, loading, deleteMedia, updateTags, uploadFiles } = useMedia()
  const { toast } = useToast()

  const handleUpload = async () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*,video/*"
    input.multiple = true
    input.onchange = async (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || [])
      if (files.length === 0) return

      // Initialize progress tracking
      const progressFiles = files.map((file) => ({ name: file.name, progress: 0 }))
      setUploadProgress(progressFiles)

      try {
        console.log("Starting upload of", files.length, "files")

        // Simulate progress (in real implementation, you'd track actual upload progress)
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) =>
            prev.map((file) => ({
              ...file,
              progress: Math.min(file.progress + Math.random() * 30, 95),
            })),
          )
        }, 500)

        await uploadFiles(files)

        clearInterval(progressInterval)
        setUploadProgress((prev) => prev.map((file) => ({ ...file, progress: 100 })))

        setTimeout(() => {
          setUploadProgress([])
          toast({
            title: "Upload successful",
            description: `${files.length} file${files.length > 1 ? "s" : ""} uploaded successfully`,
          })
        }, 1000)
      } catch (error) {
        setUploadProgress([])
        console.error("Upload failed:", error)
        toast({
          title: "Upload failed",
          description: "There was an error uploading your files",
          variant: "destructive",
        })
      }
    }
    input.click()
  }

  const handleSingleDelete = async (mediaId: string, mediaName: string) => {
    try {
      await deleteMedia([mediaId])
      toast({
        title: "Media deleted",
        description: `"${mediaName}" has been deleted`,
      })
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "There was an error deleting the file",
        variant: "destructive",
      })
    }
  }

  const toggleMediaSelection = (mediaId: string) => {
    setSelectedMedia((prev) => (prev.includes(mediaId) ? prev.filter((id) => id !== mediaId) : [...prev, mediaId]))
  }

  const isMediaSelected = (mediaId: string) => selectedMedia.includes(mediaId)

  const handleMediaClick = (media: (typeof mockMedia)[0]) => {
    if (!isSelectMode) {
      setExpandedMedia(media)
    }
  }

  const handleDownload = async (mediaItem: any) => {
    try {
      const response = await fetch(mediaItem.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = mediaItem.name
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      toast({
        title: "Download failed",
        description: "There was an error downloading the file",
        variant: "destructive",
      })
    }
  }

  const handleTagsUpdate = async (mediaId: string, tags: string[]) => {
    try {
      await updateTags(mediaId, tags)
      toast({
        title: "Tags updated",
        description: "Media has been tagged successfully",
      })
    } catch (error) {
      toast({
        title: "Tagging failed",
        description: "There was an error updating the tags",
        variant: "destructive",
      })
    }
  }

  const filteredMedia = media.filter(
    (mediaItem) =>
      mediaItem.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mediaItem.tags.some((tag) =>
        quickAccessUsers
          .find((user) => user.id === tag)
          ?.name.toLowerCase()
          .includes(searchQuery.toLowerCase()),
      ),
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-red-950">
      {/* Header */}
      <header className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="icon" className="bg-transparent border-gray-600 hover:bg-gray-800">
              <ArrowLeft className="h-4 w-4 text-white" />
            </Button>
          </Link>
          <Button
            onClick={handleUpload}
            variant="outline"
            size="icon"
            className="bg-transparent border-gray-600 hover:bg-gray-800"
            disabled={uploadProgress.length > 0}
          >
            {uploadProgress.length > 0 ? (
              <Loader2 className="h-4 w-4 text-white animate-spin" />
            ) : (
              <Upload className="h-4 w-4 text-white" />
            )}
          </Button>
        </div>
        <h1 className="text-2xl font-bold text-white">All Media</h1>
        <div className="flex items-center gap-2">
          {isSelectMode && selectedMedia.length > 0 && (
            <>
              <Button
                onClick={() => {
                  selectedMedia.forEach((mediaId) => {
                    const mediaItem = media.find((m) => m.id === mediaId)
                    if (mediaItem) handleDownload(mediaItem)
                  })
                }}
                variant="outline"
                size="icon"
                className="bg-transparent border-gray-600 hover:bg-gray-800"
              >
                <Download className="h-4 w-4 text-white" />
              </Button>
              <Button
                onClick={async () => {
                  try {
                    await deleteMedia(selectedMedia)
                    setSelectedMedia([])
                    toast({
                      title: "Media deleted",
                      description: `${selectedMedia.length} file${selectedMedia.length > 1 ? "s" : ""} deleted successfully`,
                    })
                  } catch (error) {
                    toast({
                      title: "Delete failed",
                      description: "There was an error deleting the files",
                      variant: "destructive",
                    })
                  }
                }}
                variant="outline"
                size="icon"
                className="bg-transparent border-red-600 hover:bg-red-800"
              >
                <Trash2 className="h-4 w-4 text-red-400" />
              </Button>
            </>
          )}
          <Button
            onClick={() => {
              setIsSelectMode(!isSelectMode)
              setSelectedMedia([])
            }}
            variant="outline"
            className="bg-transparent border-gray-600 hover:bg-gray-800 text-white"
          >
            {isSelectMode ? "Cancel" : "Select"}
          </Button>
        </div>
      </header>

      {/* Search Bar */}
      <div className="px-4 mb-8">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search all media"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
          />
        </div>
      </div>

      {/* Media Grid */}
      <div className="px-4 pb-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700 animate-pulse">
                <div className="aspect-square bg-gray-700"></div>
                <div className="p-3">
                  <div className="h-4 bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredMedia.length === 0 && searchQuery === "" ? (
          <div className="text-center py-16">
            <div className="mb-4">
              <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No media files yet</h3>
              <p className="text-gray-400 mb-6">Upload some images or videos to get started</p>
            </div>

            <Button onClick={handleUpload} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2">
              <Upload className="h-4 w-4 mr-2" />
              Upload Media
            </Button>
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">No media found matching your search</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredMedia.map((mediaItem) => (
              <div
                key={mediaItem.id}
                className={`bg-gray-800/50 rounded-lg overflow-hidden border transition-colors relative group ${
                  isSelectMode && isMediaSelected(mediaItem.id)
                    ? "border-purple-500 bg-purple-900/20"
                    : "border-gray-700 hover:border-purple-500"
                }`}
              >
                {isSelectMode && (
                  <div className="absolute top-2 left-2 z-10">
                    <Checkbox
                      checked={isMediaSelected(mediaItem.id)}
                      onCheckedChange={() => toggleMediaSelection(mediaItem.id)}
                      className="bg-gray-800/80 border-gray-600"
                    />
                  </div>
                )}

                {/* Single Delete Button - appears on hover/long press */}
                {!isSelectMode && (
                  <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSingleDelete(mediaItem.id, mediaItem.name)
                      }}
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8 bg-red-600/90 hover:bg-red-700 border-0 shadow-lg"
                      onTouchStart={(e) => {
                        // Show button immediately on touch for mobile
                        e.currentTarget.parentElement!.style.opacity = "1"
                      }}
                      onTouchEnd={(e) => {
                        // Hide button after touch for mobile
                        setTimeout(() => {
                          if (e.currentTarget.parentElement) {
                            e.currentTarget.parentElement.style.opacity = "0"
                          }
                        }, 2000)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <div
                  className="relative aspect-square cursor-pointer"
                  onClick={() => {
                    if (isSelectMode) {
                      toggleMediaSelection(mediaItem.id)
                    } else {
                      handleMediaClick(mediaItem)
                    }
                  }}
                  onTouchStart={(e) => {
                    // Long press detection for mobile
                    const target = e.currentTarget
                    const deleteButton = target.parentElement?.querySelector(".absolute.top-2.right-2") as HTMLElement

                    const longPressTimer = setTimeout(() => {
                      if (deleteButton) {
                        deleteButton.style.opacity = "1"
                        // Hide after 3 seconds
                        setTimeout(() => {
                          deleteButton.style.opacity = "0"
                        }, 3000)
                      }
                    }, 500) // 500ms for long press

                    const cleanup = () => {
                      clearTimeout(longPressTimer)
                      target.removeEventListener("touchend", cleanup)
                      target.removeEventListener("touchmove", cleanup)
                    }

                    target.addEventListener("touchend", cleanup)
                    target.addEventListener("touchmove", cleanup)
                  }}
                >
                  {mediaItem.type === "image" ? (
                    <img
                      src={mediaItem.url || "/placeholder.svg"}
                      alt={mediaItem.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = "none"
                        target.nextElementSibling?.classList.remove("hidden")
                      }}
                    />
                  ) : (
                    <video
                      src={mediaItem.url}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLVideoElement
                        target.style.display = "none"
                        target.nextElementSibling?.classList.remove("hidden")
                      }}
                    />
                  )}

                  {/* Fallback placeholder */}
                  <div className="hidden w-full h-full bg-gradient-to-br from-gray-800 via-slate-700 to-gray-900 flex items-center justify-center absolute inset-0">
                    {mediaItem.type === "image" ? (
                      <div className="text-center">
                        <Camera className="h-8 w-8 text-gray-500 opacity-30 mx-auto mb-1" />
                        <div className="text-gray-500 text-xs font-medium">Image</div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Video className="h-8 w-8 text-gray-500 opacity-30 mx-auto mb-1" />
                        <div className="text-gray-500 text-xs font-medium">Video</div>
                      </div>
                    )}
                  </div>

                  {mediaItem.type === "video" && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black/50 rounded-full p-3">
                        <div className="w-0 h-0 border-l-[12px] border-l-white border-y-[8px] border-y-transparent ml-1"></div>
                      </div>
                    </div>
                  )}
                  {isSelectMode && isMediaSelected(mediaItem.id) && (
                    <div className="absolute inset-0 bg-purple-600/20 flex items-center justify-center">
                      <Check className="h-8 w-8 text-white" />
                    </div>
                  )}
                </div>

                {/* Bottom buttons */}
                <div className="p-3 flex items-center justify-between">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDownload(mediaItem)
                    }}
                    size="sm"
                    variant="ghost"
                    className="text-gray-400 hover:text-white hover:bg-gray-700 p-2"
                  >
                    <Download className="h-3 w-3" />
                  </Button>

                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      setTaggingMedia(mediaItem)
                    }}
                    size="sm"
                    variant="ghost"
                    className="text-gray-400 hover:text-white hover:bg-gray-700 p-2"
                  >
                    <Tag className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Progress */}
      <UploadProgress files={uploadProgress} />

      {/* Fullscreen Media Modal */}
      {expandedMedia && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            <Button
              onClick={() => setExpandedMedia(null)}
              size="icon"
              variant="ghost"
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white"
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="relative">
              {expandedMedia.type === "image" ? (
                <img
                  src={expandedMedia.url || "/placeholder.svg"}
                  alt={expandedMedia.name}
                  className="max-w-full max-h-[80vh] object-contain rounded-lg"
                />
              ) : (
                <video src={expandedMedia.url} controls className="max-w-full max-h-[80vh] object-contain rounded-lg" />
              )}
            </div>

            <div className="mt-4 text-center">
              <h3 className="text-white text-xl font-medium">{expandedMedia.name}</h3>
              <p className="text-gray-400 text-sm mt-1">
                by {expandedMedia.uploadedBy} • {new Date(expandedMedia.uploadedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}
      <TaggingModal
        isOpen={!!taggingMedia}
        onClose={() => setTaggingMedia(null)}
        mediaItem={taggingMedia}
        onTagsUpdate={handleTagsUpdate}
      />
    </div>
  )
}
