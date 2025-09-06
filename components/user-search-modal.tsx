"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase, type User } from "@/lib/supabase"
import { Search, MessageCircle, Users, Clock } from "lucide-react"
import { toast } from "sonner"

interface UserSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onStartChat: (user: User) => void
  currentUserId: string
}

export function UserSearchModal({ isOpen, onClose, onStartChat, currentUserId }: UserSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [recentUsers, setRecentUsers] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [activeTab, setActiveTab] = useState("discover")

  // Load recently active users
  useEffect(() => {
    if (isOpen) {
      loadRecentUsers()
    }
  }, [isOpen])

  // Search users when query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      searchUsers()
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  const loadRecentUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", currentUserId)
        .order("last_seen", { ascending: false })
        .limit(20)

      if (error) throw error
      setRecentUsers(data || [])
    } catch (error) {
      console.error("Error loading recent users:", error)
    }
  }

  const searchUsers = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", currentUserId)
        .or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(10)

      if (error) throw error
      setSearchResults(data || [])
    } catch (error) {
      console.error("Error searching users:", error)
      toast.error("Failed to search users")
    } finally {
      setIsSearching(false)
    }
  }

  const handleStartChat = (user: User) => {
    onStartChat(user)
    onClose()
    setSearchQuery("")
    setSearchResults([])
  }

  const formatLastSeen = (lastSeen: string | null) => {
    if (!lastSeen) return "Never"

    const now = new Date()
    const lastSeenDate = new Date(lastSeen)
    const diffInMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const UserCard = ({ user }: { user: User }) => (
    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
            <AvatarFallback>{user.name?.charAt(0) || user.email.charAt(0)}</AvatarFallback>
          </Avatar>
          {user.is_online && (
            <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{user.name || "Anonymous"}</p>
          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          <div className="flex items-center space-x-2 mt-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {user.is_online ? "Online" : formatLastSeen(user.last_seen)}
            </span>
          </div>
        </div>
      </div>
      <Button size="sm" onClick={() => handleStartChat(user)} className="shrink-0">
        <MessageCircle className="h-4 w-4 mr-1" />
        Chat
      </Button>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Find Users</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="discover" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Discover</span>
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <span>Search</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Recently Active</h3>
              <Badge variant="secondary">{recentUsers.length} users</Badge>
            </div>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {recentUsers.length > 0 ? (
                  recentUsers.map((user) => <UserCard key={user.id} user={user} />)
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No users found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {searchQuery.trim() ? (
                  isSearching ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                      <p>Searching...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((user) => <UserCard key={user.id} user={user} />)
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No users found</p>
                    </div>
                  )
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Start typing to search users</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
