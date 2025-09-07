import { type NextRequest, NextResponse } from "next/server"
import { verificationStore } from "@/lib/verification-store"

export async function POST(request: NextRequest) {
  try {
    const { email, name, password } = await request.json()

    if (!email || !name || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    // Generate and store verification code
    const code = verificationStore.storeCode(email, name, password)

    // In a real app, you'd send this via email service like Resend, SendGrid, etc.
    // For demo purposes, we'll just log it and return it
    console.log(`Verification code for ${email}: ${code}`)

    // Simulate sending email
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return NextResponse.json({
      message: "Verification code sent to your email",
      // Remove this in production - only for demo
      demoCode: code,
    })
  } catch (error) {
    console.error("Error sending verification code:", error)
    return NextResponse.json({ error: "Failed to send verification code" }, { status: 500 })
  }
}
