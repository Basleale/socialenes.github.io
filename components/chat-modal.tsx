"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { supabase, type User, type Message } from "@/lib/supabase"
import { Send, Mic, MicOff, Play, Pause, Clock } from "lucide-react"
import { toast } from "sonner"

interface ChatModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser: User
  chatUser: User
}

export function ChatModal({ isOpen, onClose, currentUser, chatUser }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (isOpen) {
      loadMessages()
      markMessagesAsRead()
    }
  }, [isOpen, chatUser.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${currentUser.id},receiver_id.eq.${chatUser.id}),and(sender_id.eq.${chatUser.id},receiver_id.eq.${currentUser.id})`,
        )
        .order("created_at", { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error("Error loading messages:", error)
      toast.error("Failed to load messages")
    }
  }

  const markMessagesAsRead = async () => {
    try {
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("sender_id", chatUser.id)
        .eq("receiver_id", currentUser.id)
        .eq("read", false)
    } catch (error) {
      console.error("Error marking messages as read:", error)
    }
  }

  const sendMessage = async (content: string, type: "text" | "voice" = "text") => {
    if (!content.trim() && type === "text") return

    setIsLoading(true)
    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: currentUser.id,
        receiver_id: chatUser.id,
        content,
        type,
        read: false,
      })

      if (error) throw error

      setNewMessage("")
      loadMessages()
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
    } finally {
      setIsLoading(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks((prev) => [...prev, event.data])
        }
      }

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" })
        const audioUrl = URL.createObjectURL(audioBlob)
        await sendMessage(audioUrl, "voice")
        setAudioChunks([])
        stream.getTracks().forEach((track) => track.stop())
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
    } catch (error) {
      console.error("Error starting recording:", error)
      toast.error("Failed to start recording")
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      setIsRecording(false)
      setMediaRecorder(null)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const MessageBubble = ({ message }: { message: Message }) => {
    const isOwn = message.sender_id === currentUser.id
    const [isPlaying, setIsPlaying] = useState(false)

    const playVoiceMessage = () => {
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause()
          setIsPlaying(false)
        } else {
          audioRef.current.src = message.content
          audioRef.current.play()
          setIsPlaying(true)
        }
      }
    }

    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-4`}>
        <div className={`max-w-[70%] ${isOwn ? "order-2" : "order-1"}`}>
          <div className={`px-4 py-2 rounded-lg ${isOwn ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
            {message.type === "voice" ? (
              <div className="flex items-center space-x-2">
                <Button size="sm" variant={isOwn ? "secondary" : "default"} onClick={playVoiceMessage}>
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <span className="text-sm">Voice message</span>
                <audio ref={audioRef} onEnded={() => setIsPlaying(false)} className="hidden" />
              </div>
            ) : (
              <p className="text-sm">{message.content}</p>
            )}
          </div>
          <div className={`flex items-center mt-1 space-x-1 ${isOwn ? "justify-end" : "justify-start"}`}>
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{formatTime(message.created_at)}</span>
            {isOwn && (
              <Badge variant={message.read ? "default" : "secondary"} className="text-xs">
                {message.read ? "Read" : "Sent"}
              </Badge>
            )}
          </div>
        </div>
        <div className={`${isOwn ? "order-1 mr-2" : "order-2 ml-2"}`}>
          <Avatar className="h-8 w-8">
            <AvatarImage src={isOwn ? currentUser.avatar_url : chatUser.avatar_url} />
            <AvatarFallback>
              {isOwn
                ? currentUser.name?.charAt(0) || currentUser.email.charAt(0)
                : chatUser.name?.charAt(0) || chatUser.email.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg h-[600px] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center space-x-3">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={chatUser.avatar_url || "/placeholder.svg"} />
                <AvatarFallback>{chatUser.name?.charAt(0) || chatUser.email.charAt(0)}</AvatarFallback>
              </Avatar>
              {chatUser.is_online && (
                <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
              )}
            </div>
            <div>
              <p className="font-medium">{chatUser.name || "Anonymous"}</p>
              <p className="text-sm text-muted-foreground">{chatUser.is_online ? "Online" : "Offline"}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4">
            {messages.length > 0 ? (
              messages.map((message) => <MessageBubble key={message.id} message={message} />)
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No messages yet. Start the conversation!</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="flex-shrink-0 p-4 border-t">
          <div className="flex space-x-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage(newMessage)
                }
              }}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              variant={isRecording ? "destructive" : "outline"}
              size="icon"
              disabled={isLoading}
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Button onClick={() => sendMessage(newMessage)} disabled={isLoading || !newMessage.trim()} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {isRecording && (
            <div className="mt-2 text-center">
              <Badge variant="destructive" className="animate-pulse">
                Recording... Tap to stop
              </Badge>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
