"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { Send, Loader2, MessageCircle } from "lucide-react"

interface Comment {
  id: string
  content: string
  createdAt: string
  userId: string
  userName: string
}

interface CommentsModalProps {
  isOpen: boolean
  onClose: () => void
  mediaItem: any
  currentUser: any
  onCommentAdded: () => void
}

export function CommentsModal({ isOpen, onClose, mediaItem, currentUser, onCommentAdded }: CommentsModalProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen && mediaItem) {
      fetchComments()
      // Auto-refresh comments every 3 seconds
      const interval = setInterval(fetchComments, 3000)
      return () => clearInterval(interval)
    }
  }, [isOpen, mediaItem])

  const fetchComments = async () => {
    if (!mediaItem?.id) return

    setLoading(true)
    try {
      const response = await fetch(`/api/media/comments?mediaId=${encodeURIComponent(mediaItem.id)}`)
      if (response.ok) {
        const data = await response.json()
        console.log("Fetched comments:", data.comments)
        setComments(data.comments || [])
      } else {
        console.error("Failed to fetch comments:", response.status)
      }
    } catch (error) {
      console.error("Error fetching comments:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !currentUser || !mediaItem?.id) return

    setSubmitting(true)
    try {
      const response = await fetch("/api/media/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaId: mediaItem.id,
          userId: currentUser.id,
          userName: currentUser.name,
          content: newComment.trim(),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Comment added:", data.comment)
        setNewComment("")
        // Add the new comment to the local state immediately
        setComments((prev) => [...prev, data.comment])
        onCommentAdded()

        // Show success toast that disappears quickly
        toast({
          title: "Comment added",
          description: "Your comment has been posted successfully",
          duration: 2000, // 2 seconds
        })
      } else {
        throw new Error("Failed to post comment")
      }
    } catch (error) {
      console.error("Error posting comment:", error)
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmitComment()
    }
  }

  if (!mediaItem) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-400" />
            Comments ({comments.length})
          </DialogTitle>
        </DialogHeader>

        {/* Media Preview */}
        <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg mb-4">
          <div className="w-12 h-12 rounded overflow-hidden">
            {mediaItem.type === "image" ? (
              <img
                src={mediaItem.url || "/placeholder.svg"}
                alt={mediaItem.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <video src={mediaItem.url} className="w-full h-full object-cover" />
            )}
          </div>
          <div>
            <p className="font-medium text-sm">{mediaItem.name}</p>
            <p className="text-gray-400 text-xs">by {mediaItem.uploadedBy}</p>
          </div>
        </div>

        {/* Comments List */}
        <ScrollArea className="flex-1 max-h-96 mb-4">
          {loading && comments.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No comments yet</p>
              <p className="text-sm">Be the first to comment!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-gradient-to-r from-gray-700 via-slate-600 to-red-800 text-white text-xs">
                      {comment.userName?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-purple-400">{comment.userName}</span>
                      <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-gray-300 text-sm break-words">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Comment Input */}
        <div className="flex gap-2">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={currentUser?.profilePicture || "/placeholder.svg"} />
            <AvatarFallback className="bg-gradient-to-r from-gray-700 via-slate-600 to-red-800 text-white text-xs">
              {currentUser?.name?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={handleKeyPress}
              className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
              disabled={submitting}
            />
            <Button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || submitting}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
