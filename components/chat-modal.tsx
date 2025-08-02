"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { Send, Mic, MicOff, Loader2, MessageCircle, Play, Pause, Paperclip, Image as ImageIcon, Video } from "lucide-react"

interface Message {
  id: string
  content?: string
  voiceUrl?: string
  mediaUrl?: string
  mediaType?: 'image' | 'video'
  senderId: string
  senderName: string
  senderProfilePicture?: string
  receiverId?: string
  receiverName?: string
  type: "text" | "voice" | "image" | "video"
  createdAt: string
}

interface ChatModalProps {
  isOpen: boolean
  onClose: () => void
  user: any
  currentUser: any
}

export function ChatModal({ isOpen, onClose, user, currentUser }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen && user && currentUser) {
      fetchMessages()
      const interval = setInterval(fetchMessages, 2000)
      return () => clearInterval(interval)
    }
  }, [isOpen, user, currentUser])

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const fetchMessages = async () => {
    if (!user || !currentUser) return
    setLoading(true)
    try {
      const response = await fetch(`/api/chat/private?user1Id=${encodeURIComponent(currentUser.id)}&user2Id=${encodeURIComponent(user.id)}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async ({ content, type, mediaUrl, mediaType }: { content?: string; type: Message['type'], mediaUrl?: string; mediaType?: Message['mediaType'] }) => {
    if (!user || !currentUser) return
    if (type === 'text' && !content?.trim()) return

    setSending(true)
    try {
      const response = await fetch("/api/chat/private", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderProfilePicture: currentUser.profilePicture,
          receiverId: user.id,
          receiverName: user.name,
          type,
          mediaUrl,
          mediaType,
        }),
      })

      if (response.ok) {
        setNewMessage("")
        fetchMessages()
      } else {
        throw new Error("Failed to send message")
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive", duration: 3000 })
    } finally {
      setSending(false)
    }
  }

 const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      const chunks: BlobPart[] = []

      recorder.ondataavailable = (e) => chunks.push(e.data)
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" })
        await sendVoiceMessage(blob)
        stream.getTracks().forEach((track) => track.stop())
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
    } catch (error) {
      toast({ title: "Error", description: "Could not access microphone", variant: "destructive", duration: 3000 })
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      setIsRecording(false)
      setMediaRecorder(null)
    }
  }

  const sendVoiceMessage = async (audioBlob: Blob) => {
    if (!user || !currentUser) return
    setSending(true)
    try {
      const formData = new FormData()
      formData.append("audio", audioBlob, 'voice-message.webm')
      formData.append("senderId", currentUser.id)
      formData.append("senderName", currentUser.name)
      formData.append("senderProfilePicture", currentUser.profilePicture || '')
      formData.append("receiverId", user.id)
      formData.append("receiverName", user.name)

      const response = await fetch("/api/chat/private/voice", { method: "POST", body: formData })
      if (response.ok) {
        fetchMessages()
      } else {
        throw new Error("Failed to send voice message")
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to send voice message", variant: "destructive", duration: 3000 })
    } finally {
      setSending(false)
    }
  }

   const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setSending(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch('/api/chat/upload', { method: 'POST', body: formData })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Upload failed')
      }

      const mediaType = file.type.startsWith('image/') ? 'image' : 'video'
      await handleSendMessage({ type: mediaType, mediaUrl: result.url, mediaType })

    } catch (error) {
      toast({ title: "Upload Failed", description: (error as Error).message, variant: "destructive" })
    } finally {
      setSending(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }


  const playAudio = (audioUrl: string, messageId: string) => {
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => audio.pause());

    if (playingAudio === messageId) {
      setPlayingAudio(null)
      return
    }

    const audio = new Audio(audioUrl)
    audio.onended = () => setPlayingAudio(null)
    audio.onpause = () => setPlayingAudio(null)
    audio.play().catch(e => console.error("Audio play failed", e));
    setPlayingAudio(messageId)
  }

  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-400" />
            Chat with {user.name}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6" ref={scrollAreaRef}>
          <div className="space-y-4 pr-2">
              {loading && messages.length === 0 && <Loader2 className="h-6 w-6 animate-spin text-gray-400 mx-auto" />}
              {messages.length === 0 && !loading && <div className="text-center py-8 text-gray-400">No messages yet.</div>}
              {messages.map((message) => {
                const isCurrentUser = message.senderId === currentUser.id
                return (
                  <div key={message.id} className={`flex gap-3 ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}>
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={message.senderProfilePicture || "/placeholder-user.jpg"} />
                      <AvatarFallback className="bg-gradient-to-r from-gray-700 via-slate-600 to-red-800 text-white text-xs">
                        {message.senderName?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex flex-col gap-1 min-w-0 ${isCurrentUser ? "items-end" : "items-start"}`}>
                        <div className={`rounded-2xl p-3 max-w-sm ${isCurrentUser ? "bg-purple-600 rounded-br-none" : "bg-gray-700 rounded-bl-none"}`}>
                            {message.type === 'text' && <p className="text-white text-sm break-words">{message.content}</p>}
                            {message.type === 'voice' && message.voiceUrl && (
                                <div className="flex items-center gap-2">
                                <Button onClick={() => playAudio(message.voiceUrl!, message.id)} size="sm" variant="ghost" className="h-6 w-6 p-0 rounded-full text-white hover:bg-white/20">
                                    {playingAudio === message.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                </Button>
                                <div className="w-24 h-1 bg-white/50 rounded-full" />
                                </div>
                            )}
                            { (message.type === 'image' || message.type === 'video') && message.mediaUrl && (
                                <div className="mt-2 max-w-xs rounded-lg overflow-hidden">
                                { message.mediaType === 'image' ? (
                                    <img src={message.mediaUrl} alt="Shared content" className="max-w-full h-auto rounded-md" />
                                ) : (
                                    <video src={message.mediaUrl} controls className="max-w-full h-auto rounded-md" />
                                )}
                                </div>
                            )}
                        </div>
                        <span className="text-xs text-gray-500 px-1">{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                )}
              )}
            </div>
        </ScrollArea>

        <div className="flex gap-2 items-center pt-4">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={currentUser?.profilePicture || "/placeholder-user.jpg"} />
            <AvatarFallback className="bg-gradient-to-r from-gray-700 via-slate-600 to-red-800 text-white text-xs">
              {currentUser?.name?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 flex gap-2 items-center bg-gray-700/50 rounded-full px-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage({ content: newMessage, type: 'text' })}
              className="bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-white placeholder-gray-400"
              disabled={sending || isRecording}
            />
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,video/*" />
            <Button onClick={() => fileInputRef.current?.click()} size="icon" variant="ghost" className="h-8 w-8" disabled={sending || isRecording}>
                <Paperclip className="h-4 w-4 text-gray-400" />
            </Button>
            <Button onClick={isRecording ? stopRecording : startRecording} size="icon" variant="ghost" className={`h-8 w-8 ${isRecording ? "text-red-400" : "text-gray-400"}`} disabled={sending}>
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          </div>
          <Button onClick={() => handleSendMessage({ content: newMessage, type: 'text' })} disabled={!newMessage.trim() || sending || isRecording} size="icon" className="bg-purple-600 hover:bg-purple-700 rounded-full h-8 w-8">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}