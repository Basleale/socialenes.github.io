import { type NextRequest, NextResponse } from "next/server"
import { BlobStorage } from "@/lib/blob-storage"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const currentUserId = searchParams.get("currentUserId")

    let users = await BlobStorage.getUsers()

    // Filter out current user
    if (currentUserId) {
      users = users.filter((user) => user.id !== currentUserId)
    }

    // Filter by search term
    if (search && search.trim()) {
      const searchTerm = search.toLowerCase()
      users = users.filter(
        (user) => user.name.toLowerCase().includes(searchTerm) || user.email.toLowerCase().includes(searchTerm),
      )
    }

    // Remove sensitive data
    const safeUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture,
    }))

    return NextResponse.json({ users: safeUsers })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}
