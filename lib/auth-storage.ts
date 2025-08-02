import { put, list } from "@vercel/blob"
import bcrypt from "bcryptjs"

interface User {
  id: string
  name: string
  email: string
  passwordHash: string
  profilePicture?: string
  createdAt: string
}

const USERS_FILE = "authentication/users.json"

export class AuthStorage {
  static async getUsers(): Promise<User[]> {
    try {
      const { blobs } = await list({ prefix: "authentication/" })
      const usersBlob = blobs.find((blob) => blob.pathname === USERS_FILE)

      if (!usersBlob) {
        // Create demo user if no users file exists
        const demoUser: User = {
          id: "demo",
          name: "Demo User",
          email: "demo@example.com",
          passwordHash: await bcrypt.hash("password", 12),
          createdAt: new Date().toISOString(),
        }

        await this.saveUsers([demoUser])
        return [demoUser]
      }

      const response = await fetch(usersBlob.url)
      const users = await response.json()
      return users
    } catch (error) {
      console.error("Error getting users:", error)
      return []
    }
  }

  static async saveUsers(users: User[]): Promise<void> {
    try {
      const blob = await put(USERS_FILE, JSON.stringify(users, null, 2), {
        access: "public",
        token: "vercel_blob_rw_5UFG312mpLZOjrgt_w4QIybQYmJk3MDGVFM0f5BDTSBXDVY",
      })
      console.log("Users saved to:", blob.url)
    } catch (error) {
      console.error("Error saving users:", error)
      throw error
    }
  }

  static async createUser(name: string, email: string, password: string): Promise<User> {
    const users = await this.getUsers()

    // Check if user already exists
    const existingUser = users.find((user) => user.email === email)
    if (existingUser) {
      throw new Error("An account with this email already exists")
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      passwordHash,
      createdAt: new Date().toISOString(),
    }

    users.push(newUser)
    await this.saveUsers(users)

    return newUser
  }

  static async validateUser(email: string, password: string): Promise<User> {
    const users = await this.getUsers()
    const user = users.find((u) => u.email === email)

    if (!user) {
      throw new Error("No account found with this email address")
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash)
    if (!isValidPassword) {
      throw new Error("Incorrect password")
    }

    return user
  }
}