import { type NextRequest, NextResponse } from "next/server"
import { verifyCode } from "@/lib/verification-store"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json({ error: "Missing email or code" }, { status: 400 })
    }

    const verificationData = verifyCode(email, code)

    if (!verificationData) {
      return NextResponse.json({ error: "Invalid or expired verification code" }, { status: 400 })
    }

    // Create user in Supabase
    const supabase = createServerClient()

    const { data, error } = await supabase.auth.admin.createUser({
      email: verificationData.email,
      password: verificationData.password,
      email_confirm: true, // Skip email confirmation since we verified with code
      user_metadata: {
        name: verificationData.name,
        display_name: verificationData.name,
      },
    })

    if (error) {
      console.error("Supabase user creation error:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      user: data.user,
    })
  } catch (error) {
    console.error("Error verifying code:", error)
    return NextResponse.json({ error: "Failed to verify code" }, { status: 500 })
  }
}
