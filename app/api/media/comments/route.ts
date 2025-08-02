import { type NextRequest, NextResponse } from "next/server"
import { BlobStorage } from "@/lib/blob-storage"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mediaId = searchParams.get("mediaId")

    if (!mediaId || !mediaId.trim()) {
      return NextResponse.json({ error: "Valid Media ID required" }, { status: 400 })
    }

    console.log("Fetching comments for mediaId:", mediaId)
    const comments = await BlobStorage.getComments(mediaId)
    console.log("Found comments:", comments.length)

    return NextResponse.json({ comments })
  } catch (error) {
    console.error("Error fetching comments:", error)
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mediaId, userId, userName, userProfilePicture, content } = body

    console.log("Creating comment with data:", { mediaId, userId, userName, content })

    if (!mediaId || !mediaId.trim()) {
      return NextResponse.json({ error: "Valid Media ID required" }, { status: 400 })
    }
    if (!userId || !userId.trim()) {
      return NextResponse.json({ error: "Valid User ID required" }, { status: 400 })
    }
    if (!userName || !userName.trim()) {
      return NextResponse.json({ error: "Valid User Name required" }, { status: 400 })
    }
    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Comment content required" }, { status: 400 })
    }

    const comment = await BlobStorage.addComment({
      mediaId: mediaId.trim(),
      userId: userId.trim(),
      userName: userName.trim(),
      userProfilePicture,
      content: content.trim(),
    })

    console.log("Comment created successfully:", comment)
    return NextResponse.json({ comment })
  } catch (error) {
    console.error("Error creating comment:", error)
    return NextResponse.json({
      error: "Failed to create comment",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}