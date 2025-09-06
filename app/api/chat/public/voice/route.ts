import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { BlobStorage } from "@/lib/blob-storage"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File
    const senderId = formData.get("senderId") as string
    const senderName = formData.get("senderName") as string

    if (!audioFile) {
      return NextResponse.json({ error: "Audio file required" }, { status: 400 })
    }

    if (!senderId || !senderId.trim()) {
      return NextResponse.json({ error: "Valid Sender ID required" }, { status: 400 })
    }

    if (!senderName || !senderName.trim()) {
      return NextResponse.json({ error: "Valid Sender Name required" }, { status: 400 })
    }

    // Upload audio to blob storage
    const timestamp = Date.now()
    const filename = `voice-public-${timestamp}-${Math.random().toString(36).substr(2, 9)}.webm`
    const blob = await put(filename, audioFile, {
      access: "public",
    })

    // Create message with voice URL
    const message = await BlobStorage.addPublicMessage({
      voiceUrl: blob.url,
      senderId: senderId.trim(),
      senderName: senderName.trim(),
      type: "voice",
    })

    return NextResponse.json({ message })
  } catch (error) {
    console.error("Error creating voice message:", error)
    return NextResponse.json({ error: "Failed to create voice message" }, { status: 500 })
  }
}
