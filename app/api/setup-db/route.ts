import { NextResponse } from "next/server"
import { sql } from "@vercel/postgres"

export async function POST() {
  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Create index on email for faster lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `

    // Create media table (if it doesn't exist)
    await sql`
      CREATE TABLE IF NOT EXISTS media (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        extension VARCHAR(10) NOT NULL,
        blob_url TEXT NOT NULL,
        file_size BIGINT NOT NULL,
        uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL,
        uploaded_by VARCHAR(255) NOT NULL,
        tags TEXT[] DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    return NextResponse.json({
      message: "Database tables created successfully!",
    })
  } catch (error) {
    console.error("Database setup error:", error)
    return NextResponse.json({ error: "Failed to setup database tables" }, { status: 500 })
  }
}
