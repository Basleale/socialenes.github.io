import { NextResponse } from "next/server"
import { list, del } from "@vercel/blob"

export async function GET() {
  try {
    console.log("Fetching media from Vercel Blob...")

    // List blobs only from the "media/" directory
    const { blobs } = await list({ prefix: "media/" })

    console.log(`Found ${blobs.length} media blobs in storage`)

    // Transform blob data to our media format
    const media = blobs.map((blob) => {
      // Extract metadata from pathname or use defaults
      const pathParts = blob.pathname.split("/")
      const fileName = pathParts[pathParts.length - 1]
      const extension = fileName.split(".").pop()?.toLowerCase() || ""

      // Determine type based on extension
      const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg"]
      const videoExtensions = ["mp4", "mov", "avi", "mkv", "webm"]

      let type: "image" | "video" = "image"
      if (videoExtensions.includes(extension)) {
        type = "video"
      }

      return {
        id: blob.url, // Use URL as unique ID
        name: fileName,
        originalName: fileName,
        type,
        extension,
        url: blob.url,
        blobUrl: blob.url,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
        uploadedBy: "User", // Default since we don't store this in blob metadata
        tags: [], // Default empty tags
      }
    })

    // Sort by upload date (most recent first)
    const sortedMedia = media.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())

    console.log(`Returning ${sortedMedia.length} media items`)
    return NextResponse.json({ media: sortedMedia })
  } catch (error) {
    console.error("Error fetching media from Vercel Blob:", error)
    return NextResponse.json({ media: [] })
  }
}

export async function POST(request: Request) {
  try {
    const { files } = await request.json()

    if (!files || !Array.isArray(files)) {
      return NextResponse.json({ error: "Invalid files data" }, { status: 400 })
    }

    console.log(`Received ${files.length} files - they should already be in blob storage`)

    // Files are already uploaded to blob storage by the upload route
    // We don't need to do anything here since list() will fetch them

    return NextResponse.json({ success: true, count: files.length })
  } catch (error) {
    console.error("Error in POST /api/media:", error)
    return NextResponse.json({ error: "Failed to process media" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { ids } = await request.json()

    console.log(`Attempting to delete ${ids.length} media items`)

    // Delete the blob files (ids are the blob URLs)
    const deletePromises = ids.map(async (blobUrl: string) => {
      try {
        console.log(`Deleting blob: ${blobUrl}`)
        await del(blobUrl, {
          token: "vercel_blob_rw_5UFG312mpLZOjrgt_w4QIybQYmJk3MDGVFM0f5BDTSBXDVY",
        })
        console.log(`Successfully deleted blob: ${blobUrl}`)
        return { id: blobUrl, success: true }
      } catch (error) {
        console.error(`Failed to delete blob ${blobUrl}:`, error)
        return { id: blobUrl, success: false, error: (error as Error).message }
      }
    })

    const deleteResults = await Promise.all(deletePromises)

    const successful = deleteResults.filter((r) => r.success)
    const failed = deleteResults.filter((r) => !r.success)

    console.log(`Blob deletion results: ${successful.length} successful, ${failed.length} failed`)

    if (failed.length > 0) {
      console.error("Failed deletions:", failed)
    }

    return NextResponse.json({
      success: true,
      deletedCount: successful.length,
      blobDeletionResults: deleteResults,
    })
  } catch (error) {
    console.error("Error in DELETE /api/media:", error)
    return NextResponse.json({ error: "Failed to delete media" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { mediaId, tags } = await request.json()

    console.log(`Tags update requested for ${mediaId}, but we can't store tags without a database`)

    // Without a database, we can't store tags
    // You could implement this by encoding tags in the blob pathname
    // or use a simple key-value store like Vercel KV for just tags

    return NextResponse.json({
      success: false,
      message: "Tags not supported without database",
    })
  } catch (error) {
    console.error("Error in PUT /api/media:", error)
    return NextResponse.json({ error: "Failed to update tags" }, { status: 500 })
  }
}