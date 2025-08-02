"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useMedia } from "@/hooks/use-media"
import { UploadProgress } from "@/components/upload-progress"
import { ProfileModal } from "@/components/profile-modal"
import { ChatModal } from "@/components/chat-modal"
import { PublicChatModal } from "@/components/public-chat-modal"
import { CommentsModal } from "@/components/comments-modal"
import {
  Search,
  Upload,
  Download,
  X,
  Camera,
  Video,
  Loader2,
  LogOut,
  Settings,
  Heart,
  MessageCircle,
  Compass,
  Globe,
  Eye,
  User,
} from "lucide-react"

interface MediaUser {
  id: string
  name: string
  email: string
  profilePicture?: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DashboardPage() {
  const [user, setUser] = useState<MediaUser | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedMedia, setExpandedMedia] = useState<any>(null)
  const [uploadProgress, setUploadProgress] = useState<{ name: string; progress: number }[]>([])
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isChatModalOpen, setIsChatModalOpen] = useState(false)
  const [isPublicChatOpen, setIsPublicChatOpen] = useState(false)
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false)
  const [selectedChatUser, setSelectedChatUser] = useState<any>(null)
  const [selectedMediaForComments, setSelectedMediaForComments] = useState<any>(null)
  const [likedMedia, setLikedMedia] = useState<Set<string>>(new Set())
  const [mediaLikes, setMediaLikes] = useState<{ [key: string]: number }>({})
  const [mediaComments, setMediaComments] = useState<{ [key: string]: number }>({})
  const [activeTab, setActiveTab] = useState("explore")

  const { media, loading, mutate } = useMedia()
  const { toast } = useToast()
  const router = useRouter()

  const { data: conversationsData, error: conversationsError } = useSWR(
    user ? `/api/chat/conversations?userId=${user.id}` : null,
    fetcher,
    { refreshInterval: 5000 }
  );
  
  useEffect(() => {
    const interval = setInterval(() => {
      updateMediaStats()
    }, 5000)

    return () => clearInterval(interval)
  }, [media, user])

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser")
    if (currentUser) {
      const userData = JSON.parse(currentUser)
      setUser(userData)
    } else {
      router.push("/")
    }
  }, [router])

  useEffect(() => {
    if (media.length > 0) {
      updateMediaStats()
    }
  }, [media])

  const updateMediaStats = async () => {
    if (!user || media.length === 0) return

    const likesPromises = media.map(async (item) => {
      try {
        const response = await fetch(`/api/media/likes?mediaId=${encodeURIComponent(item.id)}&userId=${encodeURIComponent(user.id)}`)
        if (response.ok) {
          const data = await response.json()
          return { id: item.id, count: data.count, userLiked: data.userLiked }
        }
      } catch (error) { console.error("Error fetching likes:", error) }
      return { id: item.id, count: 0, userLiked: false }
    })

    const commentsPromises = media.map(async (item) => {
      try {
        const response = await fetch(`/api/media/comments?mediaId=${encodeURIComponent(item.id)}`)
        if (response.ok) {
          const data = await response.json()
          return { id: item.id, count: data.comments?.length || 0 }
        }
      } catch (error) { console.error("Error fetching comments:", error) }
      return { id: item.id, count: 0 }
    })

    const [likesResults, commentsResults] = await Promise.all([Promise.all(likesPromises), Promise.all(commentsPromises)]);

    const newLikes: { [key: string]: number } = {}
    const newLikedSet = new Set<string>()
    const newComments: { [key: string]: number } = {}

    likesResults.forEach(({ id, count, userLiked }) => {
      newLikes[id] = count
      if (userLiked) newLikedSet.add(id)
    })
    commentsResults.forEach(({ id, count }) => { newComments[id] = count })

    setMediaLikes(newLikes)
    setLikedMedia(newLikedSet)
    setMediaComments(newComments)
  }

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    toast({ title: "Signed out", description: "You have been signed out successfully.", duration: 2000 })
    router.push("/")
  }

  const handleUpload = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*,video/*"
    input.multiple = true
    input.onchange = async (e) => {
      if (!user) return;
      const files = Array.from((e.target as HTMLInputElement).files || [])
      if (files.length === 0) return

      const formData = new FormData()
      files.forEach((file) => formData.append("files", file))
      formData.append("userName", user.name)

      const progressFiles = files.map((file) => ({ name: file.name, progress: 0 }))
      setUploadProgress(progressFiles)

      try {
        const response = await fetch("/api/upload", { method: "POST", body: formData });
        if (!response.ok) throw new Error("Upload failed");
        
        mutate();
        toast({ title: "Upload successful", description: `${files.length} file${files.length > 1 ? "s" : ""} uploaded.`, duration: 3000 })
      } catch (error) {
        toast({ title: "Upload failed", description: "There was an error uploading your files.", variant: "destructive", duration: 3000 })
      } finally {
        setUploadProgress([])
      }
    }
    input.click()
  }

  const handleMediaClick = (mediaItem: any) => setExpandedMedia(mediaItem)
  const handleLike = async (mediaId: string) => {
    if (!user) return
    const isLiked = likedMedia.has(mediaId)
    const action = isLiked ? "unlike" : "like"

    setLikedMedia(prev => {
      const newSet = new Set(prev);
      if (isLiked) newSet.delete(mediaId); else newSet.add(mediaId);
      return newSet;
    });
    setMediaLikes(prev => ({ ...prev, [mediaId]: (prev[mediaId] || 0) + (isLiked ? -1 : 1) }));

    try {
      await fetch("/api/media/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId, userId: user.id, userName: user.name, action }),
      })
    } catch (error) {
      toast({ title: "Error", description: "Failed to update like", variant: "destructive", duration: 3000 })
      // Revert optimistic update on failure
      setLikedMedia(prev => { const newSet = new Set(prev); if (isLiked) newSet.add(mediaId); else newSet.delete(mediaId); return newSet; });
      setMediaLikes(prev => ({ ...prev, [mediaId]: (prev[mediaId] || 0) + (isLiked ? 1 : -1) }));
    }
  }

  const handleChatUser = (chatUser: any) => {
    setSelectedChatUser(chatUser)
    setIsChatModalOpen(true)
  }
  const handleViewComments = (mediaItem: any) => {
    setSelectedMediaForComments(mediaItem)
    setIsCommentsModalOpen(true)
  }
  const handleProfileUpdate = (updatedUser: MediaUser) => {
    setUser(updatedUser)
    localStorage.setItem("currentUser", JSON.stringify(updatedUser))
    toast({ title: "Profile updated", description: "Your profile has been updated successfully.", duration: 2000 })
  }

  const filteredMedia = media.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))

  if (!user) return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-red-950 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-white" /></div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-red-950">
      <header className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <Button onClick={() => setActiveTab("explore")} variant={activeTab === "explore" ? "default" : "ghost"} size="icon" className={activeTab === "explore" ? "bg-purple-600 hover:bg-purple-700" : "text-gray-400 hover:text-white hover:bg-gray-800"}>
            <Compass className="h-5 w-5" />
          </Button>
          <Button onClick={() => setActiveTab("chat")} variant={activeTab === "chat" ? "default" : "ghost"} size="icon" className={activeTab === "chat" ? "bg-purple-600 hover:bg-purple-700" : "text-gray-400 hover:text-white hover:bg-gray-800"}>
            <MessageCircle className="h-5 w-5" />
          </Button>
        </div>
        <h1 className="text-2xl font-bold text-white">Eneskench Summit</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10"><AvatarImage src={user.profilePicture || "/placeholder-user.jpg"} alt={user.name} /><AvatarFallback className="bg-gradient-to-r from-gray-700 via-slate-600 to-red-800 text-white">{user.name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback></Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700" align="end" forceMount>
          <div className="p-2"><p className="font-medium text-white">{user.name}</p><p className="truncate text-sm text-gray-400">{user.email}</p></div>
            <DropdownMenuSeparator className="bg-gray-700" />
            <DropdownMenuSub>
                <DropdownMenuSubTrigger className="text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                    <DropdownMenuSubContent className="bg-gray-800 border-gray-700 text-white">
                        <DropdownMenuItem className="hover:bg-gray-700 cursor-pointer" onClick={() => setIsProfileModalOpen(true)}>
                            <User className="mr-2 h-4 w-4" />
                            <span>Edit Profile</span>
                        </DropdownMenuItem>
                    </DropdownMenuSubContent>
                </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSeparator className="bg-gray-700" />
            <DropdownMenuItem className="text-red-400 hover:bg-gray-700 hover:text-red-300 cursor-pointer" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" /><span>Sign out</span></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <main className="px-4 pb-8">
        {activeTab === 'explore' && (
           <div className="max-w-6xl mx-auto">
           {/* Upload Button and Search */}
           <div className="flex flex-col items-center mb-8 space-y-4">
             <Button
               onClick={handleUpload}
               className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3"
               disabled={uploadProgress.length > 0}
             >
               {uploadProgress.length > 0 ? (
                 <Loader2 className="h-5 w-5 mr-2 animate-spin" />
               ) : (
                 <Upload className="h-5 w-5 mr-2" />
               )}
               Upload Media
             </Button>

             <div className="relative max-w-md w-full">
               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
               <Input
                 type="text"
                 placeholder="Search media..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="pl-10 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
               />
             </div>
           </div>

           {/* Media Grid */}
           {loading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
               {[...Array(8)].map((_, i) => (
                 <div
                   key={i}
                   className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700 animate-pulse"
                 >
                   <div className="aspect-square bg-gray-700"></div>
                   <div className="p-3">
                     <div className="h-4 bg-gray-700 rounded mb-2"></div>
                     <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                   </div>
                 </div>
               ))}
             </div>
           ) : filteredMedia.length === 0 ? (
             <div className="text-center py-16">
               <div className="mb-4">
                 <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                 <h3 className="text-xl font-medium text-white mb-2">No media files yet</h3>
                 <p className="text-gray-400 mb-6">Upload some images or videos to get started</p>
               </div>
             </div>
           ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
               {filteredMedia.map((mediaItem) => (
                 <Card
                   key={mediaItem.id}
                   className="bg-gray-800/50 border-gray-700 hover:border-purple-500 transition-colors"
                 >
                   <div className="relative aspect-square cursor-pointer" onClick={() => handleMediaClick(mediaItem)}>
                     {mediaItem.type === "image" ? (
                       <img
                         src={mediaItem.url || "/placeholder.svg"}
                         alt={mediaItem.name}
                         className="w-full h-full object-cover rounded-t-lg"
                         onError={(e) => {
                           const target = e.target as HTMLImageElement
                           target.style.display = "none"
                           target.nextElementSibling?.classList.remove("hidden")
                         }}
                       />
                     ) : (
                       <video
                         src={mediaItem.url}
                         className="w-full h-full object-cover rounded-t-lg"
                         onError={(e) => {
                           const target = e.target as HTMLVideoElement
                           target.style.display = "none"
                           target.nextElementSibling?.classList.remove("hidden")
                         }}
                       />
                     )}

                     <div className="hidden w-full h-full bg-gradient-to-br from-gray-800 via-slate-700 to-gray-900 flex items-center justify-center absolute inset-0 rounded-t-lg">
                       {mediaItem.type === "image" ? (
                         <div className="text-center">
                           <Camera className="h-12 w-12 text-gray-500 opacity-30 mx-auto mb-2" />
                           <div className="text-gray-500 text-sm font-medium">Image</div>
                         </div>
                       ) : (
                         <div className="text-center">
                           <Video className="h-12 w-12 text-gray-500 opacity-30 mx-auto mb-2" />
                           <div className="text-gray-500 text-sm font-medium">Video</div>
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
                   </div>

                   <CardContent className="p-3">
                     <div className="flex items-center gap-2 mb-3">
                       <Avatar className="h-6 w-6">
                         <AvatarImage src={user.profilePicture || "/placeholder-user.jpg"} />
                         <AvatarFallback className="bg-gradient-to-r from-gray-700 via-slate-600 to-red-800 text-white text-xs">
                           {mediaItem.uploadedBy?.charAt(0)?.toUpperCase() || "U"}
                         </AvatarFallback>
                       </Avatar>
                       <span className="text-sm text-gray-300">{mediaItem.uploadedBy || "Unknown"}</span>
                     </div>
                     <div className="flex items-center justify-between mb-3">
                       <Button onClick={(e) => { e.stopPropagation(); handleDownload(mediaItem); }} size="sm" variant="ghost" className="text-gray-400 hover:text-white hover:bg-gray-700 p-2"><Download className="h-4 w-4" /></Button>
                       <div className="flex items-center gap-2">
                         <Button onClick={(e) => { e.stopPropagation(); handleLike(mediaItem.id); }} size="sm" variant="ghost" className={`p-2 ${likedMedia.has(mediaItem.id) ? "text-red-500" : "text-gray-400 hover:text-red-500"}`}><Heart className={`h-4 w-4 ${likedMedia.has(mediaItem.id) ? "fill-current" : ""}`} /><span className="ml-1 text-xs">{mediaLikes[mediaItem.id] || 0}</span></Button>
                         <Button onClick={(e) => { e.stopPropagation(); handleViewComments(mediaItem); }} size="sm" variant="ghost" className="text-gray-400 hover:text-white hover:bg-gray-700 p-2"><MessageCircle className="h-4 w-4" /><span className="ml-1 text-xs">{mediaComments[mediaItem.id] || 0}</span></Button>
                       </div>
                     </div>
                     <Button onClick={(e) => { e.stopPropagation(); handleViewComments(mediaItem); }} size="sm" variant="outline" className="w-full text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white"><Eye className="h-4 w-4 mr-2" />View Comments</Button>
                   </CardContent>
                 </Card>
               ))}
             </div>
           )}
         </div>
        )}
        {activeTab === 'chat' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-6 text-center">Chat</h3>
              <Card className="bg-gray-700/50 border-gray-600 hover:bg-gray-700 transition-colors cursor-pointer mb-6" onClick={() => setIsPublicChatOpen(true)}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="bg-purple-500/20 p-3 rounded-full"><Globe className="h-6 w-6 text-purple-400" /></div>
                  <div><h4 className="text-white font-medium">Public Chat</h4><p className="text-gray-400 text-sm">Join the community conversation</p></div>
                </CardContent>
              </Card>
              <h4 className="text-lg font-semibold text-white mb-4">Private Messages</h4>
              <div className="space-y-2">
                {conversationsData?.conversations.length > 0 ? (
                  conversationsData.conversations.map((convoUser: MediaUser) => (
                    <Card key={convoUser.id} className="bg-gray-700/50 border-gray-600 hover:bg-gray-700 transition-colors cursor-pointer" onClick={() => handleChatUser(convoUser)}>
                      <CardContent className="p-3 flex items-center gap-3">
                        <Avatar className="h-10 w-10"><AvatarImage src={convoUser.profilePicture || "/placeholder-user.jpg"} /><AvatarFallback>{convoUser.name.charAt(0)}</AvatarFallback></Avatar>
                        <p className="font-medium text-white">{convoUser.name}</p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-4">No private conversations yet.</p>
                )}
                {conversationsError && <p className="text-red-400 text-center py-4">Could not load conversations.</p>}
              </div>
            </div>
          </div>
        )}
      </main>

      <UploadProgress files={uploadProgress} />
      {expandedMedia && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            <Button onClick={() => setExpandedMedia(null)} size="icon" variant="ghost" className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white"><X className="h-4 w-4" /></Button>
            <div className="relative">
              {expandedMedia.type === "image" ? (
                <img src={expandedMedia.url || "/placeholder.svg"} alt={expandedMedia.name} className="max-w-full max-h-[80vh] object-contain rounded-lg" />
              ) : (
                <video src={expandedMedia.url} controls className="max-w-full max-h-[80vh] object-contain rounded-lg" />
              )}
            </div>
            <div className="mt-4 text-center"><h3 className="text-white text-xl font-medium">{expandedMedia.name}</h3><p className="text-gray-400 text-sm mt-1">by {expandedMedia.uploadedBy} • {new Date(expandedMedia.uploadedAt).toLocaleDateString()}</p></div>
          </div>
        </div>
      )}
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} user={user} onUpdate={handleProfileUpdate} />
      <ChatModal isOpen={isChatModalOpen} onClose={() => { setIsChatModalOpen(false); setSelectedChatUser(null); }} user={selectedChatUser} currentUser={user} />
      <PublicChatModal isOpen={isPublicChatOpen} onClose={() => setIsPublicChatOpen(false)} currentUser={user} />
      <CommentsModal isOpen={isCommentsModalOpen} onClose={() => { setIsCommentsModalOpen(false); setSelectedMediaForComments(null); }} mediaItem={selectedMediaForComments} currentUser={user} onCommentAdded={updateMediaStats} />
    </div>
  )
}