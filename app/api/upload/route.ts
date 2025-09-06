import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll("files") as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    console.log(`Processing ${files.length} files for upload`)

    const uploadPromises = files.map(async (file) => {
      try {
        console.log(`Uploading file: ${file.name} (${file.size} bytes)`)

        // Generate a unique filename to avoid conflicts
        const timestamp = Date.now()
        const extension = file.name.split(".").pop()
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "")
        const uniqueName = `${nameWithoutExt}-${timestamp}.${extension}`

        // Upload to Vercel Blob
        const blob = await put(uniqueName, file, {
          access: "public",
          token: process.env.BLOB_READ_WRITE_TOKEN,
        })

        console.log(`Successfully uploaded: ${uniqueName} -> ${blob.url}`)

        // Determine file type
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
          uploadedBy: "User",
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
