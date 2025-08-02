import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const uniqueName = `chat-media-${Date.now()}-${file.name}`

    const blob = await put(`chat-media/${uniqueName}`, file, {
      access: "public",
      token: "vercel_blob_rw_5UFG312mpLZOjrgt_w4QIybQYmJk3MDGVFM0f5BDTSBXDVY",
    })

    return NextResponse.json({ success: true, url: blob.url })
  } catch (error) {
    console.error("Chat upload error:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}