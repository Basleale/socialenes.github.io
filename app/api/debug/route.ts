import { NextResponse } from "next/server"
import { list } from "@vercel/blob"
import { MediaDatabase } from "@/lib/db"

export async function GET() {
  try {
    // Check database
    const dbMedia = await MediaDatabase.getAllMedia()

    // Check blob storage
    const { blobs } = await list()

    return NextResponse.json({
      database: {
        count: dbMedia.length,
        items: dbMedia.slice(0, 3).map((item) => ({
          id: item.id,
          name: item.name,
          type: item.type,
          blob_url: item.blob_url,
          uploaded_at: item.uploaded_at,
          tags: item.tags,
        })),
      },
      blobs: {
        count: blobs.length,
        items: blobs.slice(0, 3).map((blob) => ({
          pathname: blob.pathname,
          url: blob.url,
          size: blob.size,
          uploadedAt: blob.uploadedAt,
        })),
      },
    })
  } catch (error) {
    console.error("Debug error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
