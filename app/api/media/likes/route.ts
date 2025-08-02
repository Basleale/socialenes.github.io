import { type NextRequest, NextResponse } from "next/server"
import { BlobStorage } from "@/lib/blob-storage"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mediaId = searchParams.get("mediaId")
    const userId = searchParams.get("userId")

    if (!mediaId || !mediaId.trim()) {
      return NextResponse.json({ error: "Valid Media ID required" }, { status: 400 })
    }

    const likes = await BlobStorage.getLikes(mediaId)
    const count = likes.length
    const userLiked = userId ? likes.some((like) => like.userId === userId) : false

    return NextResponse.json({ count, userLiked })
  } catch (error) {
    console.error("Error fetching likes:", error)
    return NextResponse.json({ error: "Failed to fetch likes" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { mediaId, userId, userName, action } = await request.json()

    if (!mediaId || !mediaId.trim()) {
      return NextResponse.json({ error: "Valid Media ID required" }, { status: 400 })
    }

    if (!userId || !userId.trim()) {
      return NextResponse.json({ error: "Valid User ID required" }, { status: 400 })
    }

    if (!userName || !userName.trim()) {
      return NextResponse.json({ error: "Valid User Name required" }, { status: 400 })
    }

    if (action === "like") {
      await BlobStorage.addLike({
        mediaId: mediaId.trim(),
        userId: userId.trim(),
        userName: userName.trim(),
      })
    } else if (action === "unlike") {
      await BlobStorage.removeLike(mediaId.trim(), userId.trim())
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Get updated count
    const likes = await BlobStorage.getLikes(mediaId)
    const count = likes.length

    return NextResponse.json({ success: true, count })
  } catch (error) {
    console.error("Error updating like:", error)
    return NextResponse.json({ error: "Failed to update like" }, { status: 500 })
  }
}
