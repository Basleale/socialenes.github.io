"use client"

import { Search, Menu, Upload, Tag, ArrowUpRight, ArrowLeft, Download, Square, CheckSquare, X, ImageIcon, Video, Check } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { useState, useRef } from "react"

interface MediaItem {
  id: number
  date: string
  title: string
  type?: "image" | "video"
  tags: string[]
  file?: File
}

export default function Component() {
  const [currentPage, setCurrentPage] = useState<"recent" | "all-media" | "user-media">("recent")
  const [selectedUser, setSelectedUser] = useState<string>("")
  const [loadingItems, setLoadingItems] = useState<Set<number>>(new Set())
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [tagModalOpen, setTagModalOpen] = useState(false)
  const [currentTaggingItem, setCurrentTaggingItem] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [allMediaItems, setAllMediaItems] = useState<MediaItem[]>([
    { id: 1, date: "2023-11-22", title: "Video_008.avi", type: "video", tags: ["Bas", "Sha"] },
    { id: 2, date: "2023-11-21", title: "Image_007.gif", type: "image", tags: ["Nate"] },
    { id: 3, date: "2023-11-20", title: "Video_006.mp4", type: "video", tags: ["Simon", "Felaw"] },
    { id: 4, date: "2023-11-19", title: "Image_005.jpg", type: "image", tags: ["Bas"] },
    { id: 5, date: "2023-11-18", title: "Video_004.mov", type: "video", tags: ["Sha", "Nate"] },
    { id: 6, date: "2023-11-17", title: "Image_003.png", type: "image", tags: ["Simon"] },
    { id: 7, date: "2023-11-16", title: "Video_002.mp4", type: "video", tags: ["Felaw"] },
    { id: 8, date: "2023-11-15", title: "Image_001.jpg", type: "image", tags: ["Bas", "Simon"] },
    { id: 9, date: "2023-11-14", title: "Video_009.webm", type: "video", tags: ["Sha"] },
    { id: 10, date: "2023-11-13", title: "Image_010.webp", type: "image", tags: ["Nate", "Felaw"] },
    { id: 11, date: "2023-11-12", title: "Video_011.mkv", type: "video", tags: ["Simon"] },
    { id: 12, date: "2023-11-11", title: "Image_012.svg", type: "image", tags: ["Bas"] },
    { id: 13, date: "2023-11-10", title: "Video_013.flv", type: "video", tags: ["Sha", "Nate"] },
    { id: 14, date: "2023-11-09", title: "Image_014.bmp", type: "image", tags: ["Felaw"] },
    { id: 15, date: "2023-11-08", title: "Video_015.wmv", type: "video", tags: ["Simon", "Bas"] },
    { id: 16, date: "2023-11-07", title: "Image_016.tiff", type: "image", tags: ["Sha"] },
    { id: 17, date: "2023-11-06", title: "Video_017.m4v", type: "video", tags: ["Nate"] },
    { id: 18, date: "2023-11-05", title: "Image_018.jpeg", type: "image", tags: ["Felaw", "Simon"] },
    { id: 19, date: "2023-11-04", title: "Video_019.ogv", type: "video", tags: ["Bas"] },
    { id: 20, date: "2023-11-03", title: "Image_020.png", type: "image", tags: ["Sha", "Nate"] },
  ])

  const quickAccessUsers = [
    { initials: "BA", name: "Bas" },
    { initials: "SH", name: "Sha" },
    { initials: "NA", name: "Nate" },
    { initials: "SI", name: "Simon" },
    { initials: "FE", name: "Felaw" },
  ]

  const getMediaIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white/70" />
      case "video":
        return <Video className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white/70" />
      default:
        return <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white/70" />
    }
  }

  const handleFileUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      Array.from(files).forEach((file) => {
        const fileType = file.type.startsWith('image/') ? 'image' : 'video'
        const newMedia: MediaItem = {
          id: Date.now() + Math.random(),
          date: new Date().toISOString().split('T')[0],
          title: file.name,
          type: fileType,
          tags: [],
          file: file
        }
        setAllMediaItems(prev => [newMedia, ...prev])
      })
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDownload = (filename: string, index: number) => {
    setLoadingItems((prev) => new Set(prev).add(index))

    setTimeout(() => {
      setLoadingItems((prev) => {
        const newSet = new Set(prev)
        newSet.delete(index)
        return newSet
      })

      const element = document.createElement("a")
      element.href = `/placeholder.svg?height=400&width=400&text=${filename}`
      element.download = filename
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    }, 2000)
  }

  const handleTagClick = (itemId: number) => {
    setCurrentTaggingItem(itemId)
    setTagModalOpen(true)
  }

  const handleTagUpdate = (tags: string[]) => {
    if (currentTaggingItem !== null) {
      setAllMediaItems(prev => 
        prev.map(item => 
          item.id === currentTaggingItem 
            ? { ...item, tags } 
            : item
        )
      )
    }
    setTagModalOpen(false)
    setCurrentTaggingItem(null)
  }

  const handleJumpToUser = (userName: string) => {
    setSelectedUser(userName)
    setCurrentPage("user-media")
  }

  const handleSelectItem = (index: number) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const handleSelectMode = () => {
    setIsSelectMode(!isSelectMode)
    setSelectedItems(new Set())
  }

  const handleBulkDownload = () => {
    const currentMedia = getCurrentMedia()
    selectedItems.forEach((index) => {
      const media = currentMedia[index]
      if (media) {
        handleDownload(media.title, index + 100)
      }
    })
    setSelectedItems(new Set())
    setIsSelectMode(false)
  }

  const handleBulkDelete = () => {
    const currentMedia = getCurrentMedia()
    const itemsToDelete = Array.from(selectedItems).map(index => currentMedia[index]?.id).filter(Boolean)
    setAllMediaItems(prev => prev.filter(item => !itemsToDelete.includes(item.id)))
    setSelectedItems(new Set())
    setIsSelectMode(false)
  }

  const getCurrentMedia = () => {
    let filteredMedia = allMediaItems

    // Filter by page type
    if (currentPage === "recent") {
      filteredMedia = allMediaItems.slice(0, 20) // Show recent 20 items
    } else if (currentPage === "user-media" && selectedUser) {
      filteredMedia = allMediaItems.filter(item => item.tags.includes(selectedUser))
    }

    // Apply search filter
    if (searchQuery) {
      filteredMedia = filteredMedia.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    return filteredMedia
  }

  const getPageTitle = () => {
    if (currentPage === "recent") return "Recent"
    if (currentPage === "all-media") return "All Media"
    if (currentPage === "user-media") return `${selectedUser}'s Media`
    return "Recent"
  }

  const TagModal = () => {
    const currentItem = allMediaItems.find(item => item.id === currentTaggingItem)
    const [selectedTags, setSelectedTags] = useState<string[]>(currentItem?.tags || [])

    const handleTagToggle = (tagName: string) => {
      setSelectedTags(prev => 
        prev.includes(tagName) 
          ? prev.filter(t => t !== tagName)
          : [...prev, tagName]
      )
    }

    return (
      <Dialog open={tagModalOpen} onOpenChange={setTagModalOpen}>
        <DialogContent className="bg-black/90 backdrop-blur-md border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Tag Media</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-white/70">Select users to tag this media:</p>
            <div className="space-y-3">
              {quickAccessUsers.map((user) => (
                <div key={user.name} className="flex items-center space-x-3">
                  <Checkbox
                    id={user.name}
                    checked={selectedTags.includes(user.name)}
                    onCheckedChange={() => handleTagToggle(user.name)}
                    className="border-white/30 data-[state=checked]:bg-purple-600"
                  />
                  <label htmlFor={user.name} className="text-sm text-white/80 cursor-pointer">
                    {user.name}
                  </label>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setTagModalOpen(false)}
                className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:border-white/60"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleTagUpdate(selectedTags)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Save Tags
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const MediaGrid = ({ media }: { media: MediaItem[] }) => (
    <div className={`grid gap-3 sm:gap-4 pb-6 sm:pb-8 pt-2 sm:pt-4 ${
      currentPage === "all-media" || currentPage === "user-media" 
        ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7"
        : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
    }`}>
      {media.map((item, index) => (
        <div
          key={item.id}
          className={`bg-black/30 rounded-lg p-3 sm:p-4 aspect-square flex flex-col border transition-all duration-300 group cursor-pointer relative ${
            selectedItems.has(index) ? "border-blue-400 bg-blue-900/20" : "border-white/10 hover:border-white/20"
          }`}
        >
          {isSelectMode && (
            <div className="absolute top-2 left-2 z-20">
              <Button
                size="icon"
                onClick={() => handleSelectItem(index)}
                className="h-5 w-5 sm:h-6 sm:w-6 bg-black/60 hover:bg-black/80 text-white border-none"
              >
                {selectedItems.has(index) ? (
                  <CheckSquare className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
                ) : (
                  <Square className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </Button>
            </div>
          )}

          <div
            className={`flex-1 bg-gradient-to-br from-red-900/30 via-blue-900/30 to-black/50 rounded flex items-center justify-center relative overflow-hidden ${
              loadingItems.has(index + 100) ? "animate-pulse" : ""
            } group-hover:scale-105 transition-transform duration-200`}
          >
            {loadingItems.has(index + 100) && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite] -skew-x-12"></div>
            )}
            <span className="text-xl sm:text-2xl z-10 flex items-center justify-center">
              {getMediaIcon(item.type || "image")}
            </span>
          </div>

          {/* Tags indicator */}
          {item.tags.length > 0 && (
            <div className="absolute top-2 right-2 flex gap-1">
              {item.tags.slice(0, 3).map((tag, tagIndex) => (
                <div
                  key={tagIndex}
                  className="w-2 h-2 bg-purple-500 rounded-full"
                  title={`Tagged: ${item.tags.join(', ')}`}
                />
              ))}
              {item.tags.length > 3 && (
                <div className="w-2 h-2 bg-purple-300 rounded-full" title={`+${item.tags.length - 3} more tags`} />
              )}
            </div>
          )}

          {/* Action buttons */}
          {!isSelectMode && (
            <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button
                size="icon"
                onClick={() => handleTagClick(item.id)}
                className="h-4 w-4 sm:h-5 sm:w-5 bg-white/10 hover:bg-white/20 text-white border-none"
              >
                <Tag className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              </Button>
              <Button
                size="icon"
                onClick={() => handleDownload(item.title, index + 100)}
                disabled={loadingItems.has(index + 100)}
                className="h-4 w-4 sm:h-5 sm:w-5 bg-white/10 hover:bg-white/20 text-white border-none"
              >
                <Download className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  )

  const currentMedia = getCurrentMedia()

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 via-blue-950 to-black text-white overflow-hidden">
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }
        
        .scrollbar-custom::-webkit-scrollbar {
          width: 6px;
        }
        
        @media (min-width: 640px) {
          .scrollbar-custom::-webkit-scrollbar {
            width: 8px;
          }
        }
        
        .scrollbar-custom::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 4px;
        }
        
        .scrollbar-custom::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #7c2d12, #1e3a8a, #000000);
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .scrollbar-custom::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #991b1b, #1e40af, #1f2937);
        }
      `}</style>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Tag Modal */}
      <TagModal />

      {/* Sticky Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between p-3 sm:p-4 backdrop-blur-sm bg-black/20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 backdrop-blur-sm h-8 w-8 sm:h-10 sm:w-10"
            >
              <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-black/80 backdrop-blur-md border-white/20 text-white">
            <DropdownMenuItem onClick={handleFileUpload} className="hover:bg-white/10 focus:bg-white/10 cursor-pointer">
              <Upload className="mr-2 h-4 w-4" />
              Upload Media
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-2 sm:gap-4">
          {currentPage === "recent" && (
            <Button
              onClick={() => setCurrentPage("all-media")}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg text-sm sm:text-base px-3 sm:px-4"
            >
              All Media
            </Button>
          )}
        </div>
      </header>

      {/* Page Content */}
      <div className="h-[calc(100vh-3rem)] sm:h-[calc(100vh-4rem)] flex">
        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Sticky Header Section */}
          <div className="sticky top-12 sm:top-16 z-10 pb-2 sm:pb-4">
            <div className="text-center mb-4 sm:mb-6 lg:mb-8 pt-4 sm:pt-6 lg:pt-8">
              {currentPage === "recent" && (
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
                  Eneskench Summit
                </h1>
              )}
              <div className="max-w-xs sm:max-w-md mx-auto relative px-4 sm:px-0">
                <Search className="absolute left-6 sm:left-3 top-1/2 transform -translate-y-1/2 text-white h-4 w-4 sm:h-5 sm:w-5" />
                <Input
                  placeholder="search by name or tag"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 sm:pl-10 bg-black/30 border-white/20 text-white placeholder:text-white/50 focus:border-purple-400 text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="px-4 sm:px-6 lg:px-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {(currentPage === "all-media" || currentPage === "user-media") && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentPage("recent")}
                    className="text-white hover:bg-white/10 h-8 w-8 sm:h-10 sm:w-10"
                  >
                    <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                )}
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-white/90">{getPageTitle()}</h2>
              </div>

              {(currentPage === "all-media" || currentPage === "user-media") && (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleSelectMode}
                    className="bg-gradient-to-r from-gray-800 to-black hover:from-gray-700 hover:to-gray-900 text-white shadow-lg text-sm px-3"
                  >
                    {isSelectMode ? <X className="h-3 w-3 mr-1" /> : null}
                    {isSelectMode ? "Cancel" : "Select"}
                  </Button>

                  {isSelectMode && selectedItems.size > 0 && (
                    <>
                      <Button
                        onClick={handleBulkDownload}
                        className="bg-gradient-to-r from-slate-900 via-blue-900 to-blue-600 hover:from-slate-800 hover:via-blue-800 hover:to-blue-500 text-white shadow-lg text-xs px-2"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        ({selectedItems.size})
                      </Button>
                      <Button
                        onClick={handleBulkDelete}
                        className="bg-gradient-to-r from-red-900 via-purple-900 to-red-800 hover:from-red-800 hover:via-purple-800 hover:to-red-700 text-white shadow-lg text-xs px-2"
                      >
                        Delete ({selectedItems.size})
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Fade overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-6 sm:h-8 bg-gradient-to-b from-transparent to-[#0f0a1a] pointer-events-none z-10"></div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 scrollbar-custom">
            <MediaGrid media={currentMedia} />
          </div>
        </main>

        {/* Sticky Right Sidebar - Only show on recent page */}
        {currentPage === "recent" && (
          <aside className="hidden lg:block w-64 xl:w-80 p-4 xl:p-6 sticky top-12 sm:top-16 h-fit">
            <div className="bg-black/30 backdrop-blur-md rounded-lg p-4 border border-white/10">
              <h3 className="text-lg font-semibold mb-4 text-white/90">Quick Access</h3>
              <div className="space-y-3">
                {quickAccessUsers.map((user, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 hover:bg-white/5 rounded-lg px-2 transition-all duration-200 cursor-pointer"
                    onClick={() => handleJumpToUser(user.name)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-red-800/50 to-blue-800/50 backdrop-blur-sm rounded-full flex items-center justify-center text-sm font-medium border border-white/20">
                        {user.initials}
                      </div>
                      <span className="text-sm text-white/80">{user.name}</span>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-white/50 group-hover:text-white/70 transition-colors duration-200" />
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
