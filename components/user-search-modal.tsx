"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { Search, Loader2, Users, MessageCircle } from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  profilePicture?: string
}

interface UserSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectUser: (user: User) => void
  currentUser: any
}

export function UserSearchModal({ isOpen, onClose, onSelectUser, currentUser }: UserSearchModalProps) {
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      fetchUsers()
    }
  }, [isOpen, searchQuery])

  const fetchUsers = async () => {
    if (!currentUser) return

    setLoading(true)
    try {
      const params = new URLSearchParams({
        currentUserId: currentUser.id,
      })

      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim())
      }

      const response = await fetch(`/api/users?${params}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
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

  const handleSelectUser = (user: User) => {
    onSelectUser(user)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-400" />
            Find Users to Chat
          </DialogTitle>
        </DialogHeader>

        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
          />
        </div>

        {/* Users List */}
        <ScrollArea className="flex-1 max-h-96">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No users found</p>
              <p className="text-sm">Try searching with different keywords</p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.profilePicture || "/placeholder.svg"} />
                    <AvatarFallback className="bg-gradient-to-r from-gray-700 via-slate-600 to-red-800 text-white">
                      {user.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white">{user.name}</p>
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
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
