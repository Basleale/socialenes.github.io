import { NextResponse } from "next/server"

// This would typically query your database
// For now, we'll use the same in-memory store
const mediaMetadata: any[] = []

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Find the media item by ID
    const mediaItem = mediaMetadata.find((item) => item.id === id)

    if (!mediaItem) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 })
    }

    // Return the media item with its blob URL for fetching
    return NextResponse.json({
      media: {
        ...mediaItem,
        // The blob URL is already stored and should be accessible
        url: mediaItem.blobUrl || mediaItem.url,
      },
    })
  } catch (error) {
    console.error("Error fetching individual media:", error)
    return NextResponse.json({ error: "Failed to fetch media" }, { status: 500 })
  }
}
