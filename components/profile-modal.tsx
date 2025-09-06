"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Camera, Loader2, Save, X } from "lucide-react"
import { supabase, type SupabaseUser } from "@/lib/supabase"

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  user: SupabaseUser
  onUpdate: (user: SupabaseUser) => void
}

export function ProfileModal({ isOpen, onClose, user, onUpdate }: ProfileModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [profileData, setProfileData] = useState({
    displayName: user.user_metadata?.display_name || user.email?.split("@")[0] || "",
    fullName: user.user_metadata?.full_name || "",
    avatarUrl: user.user_metadata?.avatar_url || "",
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: {
          display_name: profileData.displayName,
          full_name: profileData.fullName,
          avatar_url: profileData.avatarUrl,
        },
      })

      if (error) throw error

      if (data.user) {
        const updatedUser = data.user as SupabaseUser
        onUpdate(updatedUser)
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully",
        })
        onClose()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarUpload = async (file: File) => {
    if (!file) return

    setIsLoading(true)
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath)

      setProfileData((prev) => ({ ...prev, avatarUrl: data.publicUrl }))

      toast({
        title: "Avatar uploaded",
        description: "Your profile picture has been uploaded successfully",
      })
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profileData.avatarUrl || "/placeholder.svg"} />
                <AvatarFallback className="bg-gradient-to-r from-gray-700 via-slate-600 to-red-800 text-white text-2xl">
                  {profileData.displayName?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <Button
                onClick={() => fileInputRef.current?.click()}
                size="sm"
                className="absolute -bottom-2 -right-2 rounded-full bg-purple-600 hover:bg-purple-700 p-2"
                disabled={isLoading}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleAvatarUpload(file)
              }}
              className="hidden"
            />
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-gray-300">
                Display Name
              </Label>
              <Input
                id="displayName"
                value={profileData.displayName}
                onChange={(e) => setProfileData((prev) => ({ ...prev, displayName: e.target.value }))}
                className="bg-gray-700/50 border-gray-600 text-white"
                placeholder="Enter display name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-gray-300">
                Full Name
              </Label>
              <Input
                id="fullName"
                value={profileData.fullName}
                onChange={(e) => setProfileData((prev) => ({ ...prev, fullName: e.target.value }))}
                className="bg-gray-700/50 border-gray-600 text-white"
                placeholder="Enter full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">
                Email
              </Label>
              <Input id="email" value={user.email} disabled className="bg-gray-700/30 border-gray-600 text-gray-400" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1 bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
