import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"

const MEDIA_KEY = "media_store"

export async function GET() {
  try {
    const mediaStore = (await kv.get<any[]>(MEDIA_KEY)) || []

    // Sort by upload date (most recent first)
    const sortedMedia = [...mediaStore].sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
    )
    return NextResponse.json({ media: sortedMedia })
  } catch (error) {
    console.error("Error fetching media:", error)
    return NextResponse.json({ media: [] })
  }
}

export async function POST(request: Request) {
  try {
    const { files } = await request.json()

    const mediaStore = (await kv.get<any[]>(MEDIA_KEY)) || []

    // Add new files to the beginning of the array (most recent first)
    mediaStore.unshift(...files)

    await kv.set(MEDIA_KEY, mediaStore)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving media:", error)
    return NextResponse.json({ error: "Failed to save media" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { ids } = await request.json()

    let mediaStore = (await kv.get<any[]>(MEDIA_KEY)) || []
    mediaStore = mediaStore.filter((item) => !ids.includes(item.id))

    await kv.set(MEDIA_KEY, mediaStore)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting media:", error)
    return NextResponse.json({ error: "Failed to delete media" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { mediaId, tags } = await request.json()

    const mediaStore = (await kv.get<any[]>(MEDIA_KEY)) || []

    // Find and update the media item with new tags
    const mediaIndex = mediaStore.findIndex((item) => item.id === mediaId)
    if (mediaIndex !== -1) {
      mediaStore[mediaIndex] = {
        ...mediaStore[mediaIndex],
        tags: tags,
      }
    }

    await kv.set(MEDIA_KEY, mediaStore)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating media tags:", error)
    return NextResponse.json({ error: "Failed to update tags" }, { status: 500 })
  }
}
