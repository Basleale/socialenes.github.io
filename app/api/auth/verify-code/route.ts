import { type NextRequest, NextResponse } from "next/server"
import { verificationStore } from "@/lib/verification-store"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 })
    }

    // Verify the code
    const verified = verificationStore.verifyCode(email, code)

    if (!verified) {
      return NextResponse.json({ error: "Invalid or expired verification code" }, { status: 400 })
    }

    // Create the user in Supabase
    const { data, error } = await supabase.auth.admin.createUser({
      email: verified.email,
      password: verified.password,
      user_metadata: {
        name: verified.name,
      },
      email_confirm: true, // Skip email confirmation since we verified with code
    })

    if (error) {
      throw error
    }

    return NextResponse.json({
      message: "Account created successfully!",
      user: data.user,
    })
  } catch (error: any) {
    console.error("Error verifying code:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to verify code",
      },
      { status: 500 },
    )
  }
}
