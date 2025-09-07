import { type NextRequest, NextResponse } from "next/server"
import { generateVerificationCode, storeVerificationCode } from "@/lib/verification-store"

export async function POST(request: NextRequest) {
  try {
    const { email, name, password } = await request.json()

    if (!email || !name || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    const code = generateVerificationCode()
    storeVerificationCode(email, code, name, password)

    // In production, send email here
    console.log(`Verification code for ${email}: ${code}`)

    // For demo purposes, return the code (remove in production)
    return NextResponse.json({
      success: true,
      message: "Verification code sent",
      demoCode: code, // Remove this in production
    })
  } catch (error) {
    console.error("Error sending verification code:", error)
    return NextResponse.json({ error: "Failed to send verification code" }, { status: 500 })
  }
}
