import { type NextRequest, NextResponse } from "next/server"
import { BlobStorage } from "@/lib/blob-storage"

export async function GET() {
    try {
        const messages = await BlobStorage.getPublicMessages()
        return NextResponse.json({ messages })
    } catch (error) {
        console.error("Error fetching public messages:", error)
        return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const { content, senderId, senderName, senderProfilePicture, type = "text", mediaUrl, mediaType } = await request.json()

        if (!senderId || !senderId.trim()) {
            return NextResponse.json({ error: "Valid Sender ID required" }, { status: 400 })
        }

        if (!senderName || !senderName.trim()) {
            return NextResponse.json({ error: "Valid Sender Name required" }, { status: 400 })
        }

        if (type === "text" && (!content || !content.trim())) {
            return NextResponse.json({ error: "Message content required" }, { status: 400 })
        }

        const message = await BlobStorage.addPublicMessage({
            content: content?.trim(),
            senderId: senderId.trim(),
            senderName: senderName.trim(),
            senderProfilePicture,
            type,
            mediaUrl,
            mediaType,
        })

        return NextResponse.json({ message })
    } catch (error) {
        console.error("Error creating public message:", error)
        return NextResponse.json({ error: "Failed to create message" }, { status: 500 })
    }
}