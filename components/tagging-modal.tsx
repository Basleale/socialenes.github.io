"use client"

import { useState } from "react"
import { Check, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const quickAccessUsers = [
  { id: "bas", name: "Bas" },
  { id: "sha", name: "Sha" },
  { id: "nate", name: "Nate" },
  { id: "simon", name: "Simon" },
  { id: "felaw", name: "Felaw" },
]

interface TaggingModalProps {
  isOpen: boolean
  onClose: () => void
  mediaItem: any
  onTagsUpdate: (mediaId: string, tags: string[]) => void
}

export function TaggingModal({ isOpen, onClose, mediaItem, onTagsUpdate }: TaggingModalProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>(mediaItem?.tags || [])

  const handleTagToggle = (userId: string) => {
    setSelectedTags((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const handleSave = () => {
    if (mediaItem) {
      onTagsUpdate(mediaItem.id, selectedTags)
    }
    onClose()
  }

  const handleCancel = () => {
    setSelectedTags(mediaItem?.tags || [])
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-600 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Tag Media
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-gray-300 text-sm">Select people to tag in "{mediaItem?.name}"</p>

          <div className="space-y-3">
            {quickAccessUsers.map((user) => (
              <div key={user.id} className="flex items-center space-x-3">
                <Checkbox
                  id={user.id}
                  checked={selectedTags.includes(user.id)}
                  onCheckedChange={() => handleTagToggle(user.id)}
                  className="border-gray-500"
                />
                <label htmlFor={user.id} className="text-white font-medium cursor-pointer flex-1">
                  {user.name}
                </label>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              onClick={handleCancel}
              variant="outline"
              className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700 text-white">
              <Check className="h-4 w-4 mr-2" />
              Save Tags
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
