import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"
import { del } from "@vercel/blob"

const MEDIA_METADATA_KEY = "media_metadata_v2"

export async function GET() {
  try {
    const mediaMetadata = (await kv.get<any[]>(MEDIA_METADATA_KEY)) || []

    // Sort by upload date (most recent first)
    const sortedMedia = [...mediaMetadata].sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
    )

    console.log(`Returning ${sortedMedia.length} media items from KV store`)
    return NextResponse.json({ media: sortedMedia })
  } catch (error) {
    console.error("Error fetching media metadata from KV:", error)
    return NextResponse.json({ media: [] })
  }
}

export async function POST(request: Request) {
  try {
    const { files } = await request.json()

    if (!files || !Array.isArray(files)) {
      return NextResponse.json({ error: "Invalid files data" }, { status: 400 })
    }

    const currentMetadata = (await kv.get<any[]>(MEDIA_METADATA_KEY)) || []

    // Store metadata for each file
    const newMetadata = files.map((file) => ({
      id: file.id,
      name: file.name,
      originalName: file.originalName || file.name,
      type: file.type,
      extension: file.extension,
      blobUrl: file.url, // Store the blob URL for fetching
      size: file.size,
      uploadedAt: file.uploadedAt,
      uploadedBy: file.uploadedBy,
      tags: file.tags || [],
    }))

    // Add to metadata store
    const updatedMetadata = [...newMetadata, ...currentMetadata]
    await kv.set(MEDIA_METADATA_KEY, updatedMetadata)

    console.log(`Added ${newMetadata.length} files to KV metadata store. Total: ${updatedMetadata.length}`)

    return NextResponse.json({ success: true, count: newMetadata.length })
  } catch (error) {
    console.error("Error in POST /api/media-kv:", error)
    return NextResponse.json({ error: "Failed to save media metadata" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { ids } = await request.json()

    const currentMetadata = (await kv.get<any[]>(MEDIA_METADATA_KEY)) || []

    // Find the media items to delete
    const itemsToDelete = currentMetadata.filter((item) => ids.includes(item.id))

    if (itemsToDelete.length === 0) {
      return NextResponse.json({ success: true, message: "No items found" })
    }

    // Delete the actual blob files
    const deletePromises = itemsToDelete.map(async (item) => {
      try {
        await del(item.blobUrl)
        return { id: item.id, success: true }
      } catch (error) {
        console.error(`Failed to delete blob ${item.blobUrl}:`, error)
        return { id: item.id, success: false, error: error.message }
      }
    })

    const deleteResults = await Promise.all(deletePromises)

    // Remove from metadata store
    const updatedMetadata = currentMetadata.filter((item) => !ids.includes(item.id))
    await kv.set(MEDIA_METADATA_KEY, updatedMetadata)

    console.log(
      `Removed ${currentMetadata.length - updatedMetadata.length} items from KV store. Remaining: ${updatedMetadata.length}`,
    )

    return NextResponse.json({
      success: true,
      deletedFromStore: currentMetadata.length - updatedMetadata.length,
      blobDeletionResults: deleteResults,
    })
  } catch (error) {
    console.error("Error in DELETE /api/media-kv:", error)
    return NextResponse.json({ error: "Failed to delete media" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { mediaId, tags } = await request.json()

    const currentMetadata = (await kv.get<any[]>(MEDIA_METADATA_KEY)) || []

    // Find and update the media item with new tags
    const mediaIndex = currentMetadata.findIndex((item) => item.id === mediaId)
    if (mediaIndex !== -1) {
      currentMetadata[mediaIndex] = {
        ...currentMetadata[mediaIndex],
        tags: tags,
      }

      await kv.set(MEDIA_METADATA_KEY, currentMetadata)
      console.log(`Updated tags for media ${mediaId} in KV store`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in PUT /api/media-kv:", error)
    return NextResponse.json({ error: "Failed to update tags" }, { status: 500 })
  }
}
