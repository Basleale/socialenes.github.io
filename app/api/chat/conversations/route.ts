import { type NextRequest, NextResponse } from "next/server"
import { BlobStorage } from "@/lib/blob-storage"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const allUsers = await BlobStorage.getUsers()
    const usersById = new Map(allUsers.map((user) => [user.id, user]))

    const allPrivateMessages = await BlobStorage.getAllPrivateMessages()

    const conversations: Map<
      string,
      { user: any; lastMessageTimestamp: string }
    > = new Map()

    for (const message of allPrivateMessages) {
      if (message.senderId === userId || message.receiverId === userId) {
        const otherUserId =
          message.senderId === userId ? message.receiverId! : message.senderId
        const otherUser = usersById.get(otherUserId)

        if (otherUser) {
          const existing = conversations.get(otherUserId)
          const messageTimestamp = new Date(message.createdAt).getTime()
          const lastMessageTimestamp = existing
            ? new Date(existing.lastMessageTimestamp).getTime()
            : 0

          if (messageTimestamp > lastMessageTimestamp) {
            conversations.set(otherUserId, {
              user: {
                id: otherUser.id,
                name: otherUser.name,
                email: otherUser.email,
                profilePicture: otherUser.profilePicture,
              },
              lastMessageTimestamp: message.createdAt,
            })
          }
        }
      }
    }

    const sortedConversations = Array.from(conversations.values()).sort(
      (a, b) =>
        new Date(b.lastMessageTimestamp).getTime() -
        new Date(a.lastMessageTimestamp).getTime(),
    )

    return NextResponse.json({ conversations: sortedConversations.map(c => c.user) })
  } catch (error) {
    console.error("Error fetching conversations:", error)
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 })
  }
