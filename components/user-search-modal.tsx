"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Search, Loader2, Users, MessageCircle, Sparkles } from "lucide-react"
import { supabase, type SupabaseUser } from "@/lib/supabase"

interface UserSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectUser: (user: SupabaseUser) => void
  currentUser: SupabaseUser
}

export function UserSearchModal({ isOpen, onClose, onSelectUser, currentUser }: UserSearchModalProps) {
  const [users, setUsers] = useState<SupabaseUser[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"discover" | "search">("discover")
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      if (activeTab === "discover") {
        fetchDiscoverUsers()
      } else {
        fetchUsers()
      }
    }
  }, [isOpen, searchQuery, activeTab])

  const fetchDiscoverUsers = async () => {
    if (!currentUser) return

    setLoading(true)
    try {
      // Get recent users (excluding current user)
      const { data, error } = await supabase.auth.admin.listUsers()

      if (error) {
        console.error("Error fetching users:", error)
        return
      }

      const filteredUsers = data.users
        .filter((user) => user.id !== currentUser.id)
        .map((user) => ({
          ...user,
          user_metadata: {
            display_name:
              user.user_metadata?.display_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
            full_name: user.user_metadata?.full_name,
            avatar_url: user.user_metadata?.avatar_url,
          },
        }))
        .sort(
          (a, b) =>
            new Date(b.last_sign_in_at || b.created_at).getTime() -
            new Date(a.last_sign_in_at || a.created_at).getTime(),
        )
        .slice(0, 20) // Limit to 20 users

      setUsers(filteredUsers as SupabaseUser[])
    } catch (error) {
      console.error("Error fetching discover users:", error)
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    if (!currentUser) return

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.admin.listUsers()

      if (error) {
        console.error("Error fetching users:", error)
        return
      }

      let filteredUsers = data.users
        .filter((user) => user.id !== currentUser.id)
        .map((user) => ({
          ...user,
          user_metadata: {
            display_name:
              user.user_metadata?.display_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
            full_name: user.user_metadata?.full_name,
            avatar_url: user.user_metadata?.avatar_url,
          },
        }))

      // Filter by search query if provided
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        filteredUsers = filteredUsers.filter(
          (user) =>
            user.user_metadata?.display_name?.toLowerCase().includes(query) ||
            user.user_metadata?.full_name?.toLowerCase().includes(query) ||
            user.email?.toLowerCase().includes(query),
        )
      }

      setUsers(filteredUsers.slice(0, 50) as SupabaseUser[]) // Limit to 50 results
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectUser = (user: SupabaseUser) => {
    onSelectUser(user)
    onClose()
  }

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return "Unknown"

    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return `${Math.floor(diffInHours / 168)}w ago`
  }

  const isOnline = (lastSeen?: string) => {
    if (!lastSeen) return false
    const lastSeenDate = new Date(lastSeen)
    const now = new Date()
    const diffInMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60)
    return diffInMinutes < 15 // Consider online if active within 15 minutes
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-400" />
            Find People to Chat With
          </DialogTitle>
        </DialogHeader>

        {/* Tab Navigation */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "discover" | "search")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 bg-gray-700">
            <TabsTrigger value="discover" className="text-white data-[state=active]:bg-gray-600">
              <Sparkles className="h-4 w-4 mr-2" />
              Discover
            </TabsTrigger>
            <TabsTrigger value="search" className="text-white data-[state=active]:bg-gray-600">
              <Search className="h-4 w-4 mr-2" />
              Search
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-4 max-h-96 overflow-y-auto">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Recently Active Users
              </h3>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : users.length > 0 ? (
                <div className="space-y-2">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.user_metadata?.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback className="bg-gradient-to-r from-gray-700 via-slate-600 to-red-800 text-white">
                            {user.user_metadata?.display_name?.charAt(0)?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        {isOnline(user.last_sign_in_at) && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-white truncate">{user.user_metadata?.display_name}</p>
                          {isOnline(user.last_sign_in_at) && (
                            <Badge variant="secondary" className="bg-green-600/20 text-green-400 text-xs">
                              Online
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 truncate">{user.email}</p>
                        <p className="text-xs text-gray-500">
                          {user.last_sign_in_at
                            ? `Active ${getTimeAgo(user.last_sign_in_at)}`
                            : `Joined ${getTimeAgo(user.created_at)}`}
                        </p>
                      </div>

                      <Button
                        onClick={() => handleSelectUser(user)}
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Chat
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recently active users found</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
              />
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2">
              {loading ? (
                <div className="text-center py-8 text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-4" />
                  <p>Searching users...</p>
                </div>
              ) : users.length > 0 ? (
                users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.user_metadata?.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback className="bg-gradient-to-r from-gray-700 via-slate-600 to-red-800 text-white">
                        {user.user_metadata?.display_name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{user.user_metadata?.display_name}</p>
                      <p className="text-sm text-gray-400 truncate">{user.email}</p>
                    </div>
                    <Button
                      onClick={() => handleSelectUser(user)}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Chat
                    </Button>
                  </div>
                ))
              ) : searchQuery ? (
                <div className="text-center py-8 text-gray-400">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No users found matching "{searchQuery}"</p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Start typing to search for users</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            {activeTab === "discover"
              ? "Discover new people in the community"
              : "Search for specific users to start chatting"}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
