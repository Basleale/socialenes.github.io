import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { BlobStorage } from "@/lib/blob-storage"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 })
    }

    // Find user
    const user = await BlobStorage.getUserByEmail(email.trim())
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Return user without password hash
    const { passwordHash: _, ...safeUser } = user
    return NextResponse.json({ user: safeUser })
  } catch (error) {
    console.error("Error signing in:", error)
    return NextResponse.json({ error: "Failed to sign in" }, { status: 500 })
  }
}
