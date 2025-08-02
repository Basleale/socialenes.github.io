import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll("files") as File[]
    const userName = formData.get("userName") as string

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    console.log(`Processing ${files.length} files for upload by ${userName}`)

    const uploadPromises = files.map(async (file) => {
      try {
        console.log(`Uploading file: ${file.name} (${file.size} bytes)`)

        const timestamp = Date.now()
        const extension = file.name.split(".").pop()
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "")
        const uniqueName = `${nameWithoutExt}-${timestamp}.${extension}`

        const blob = await put(`media/${uniqueName}`, file, {
          access: "public",
          token: "vercel_blob_rw_5UFG312mpLZOjrgt_w4QIybQYmJk3MDGVFM0f5BDTSBXDVY",
        })

        console.log(`Successfully uploaded: ${uniqueName} -> ${blob.url}`)

        const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg"]
        const videoExtensions = ["mp4", "mov", "avi", "mkv", "webm"]
        const ext = extension?.toLowerCase() || ""

        let type: "image" | "video" = "image"
        if (videoExtensions.includes(ext)) {
          type = "video"
        }

        return {
          name: uniqueName,
          originalName: file.name,
          type,
          extension: ext,
          url: blob.url,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          uploadedBy: userName || "User",
          tags: [],
        }
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error)
        throw error
      }
    })

    const uploadedFiles = await Promise.all(uploadPromises)
    console.log(`Successfully uploaded ${uploadedFiles.length} files`)

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Failed to upload files" }, { status: 500 })
  }
}