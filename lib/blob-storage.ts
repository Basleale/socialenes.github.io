import { put, list, del } from "@vercel/blob"

export interface BlobMessage {
  id: string
  content?: string
  voiceUrl?: string
  senderId: string
  senderName: string
  receiverId?: string
  receiverName?: string
  type: "text" | "voice"
  createdAt: string
}

export interface BlobComment {
  id: string
  mediaId: string
  userId: string
  userName: string
  content: string
  createdAt: string
}

export interface BlobLike {
  id: string
  mediaId: string
  userId: string
  userName: string
  createdAt: string
}

export interface BlobUser {
  id: string
  name: string
  email: string
  passwordHash: string
  profilePicture?: string
  createdAt: string
}

// Helper function to sanitize paths
function sanitizePath(path: string): string {
  return path.replace(/\/+/g, '/').replace(/^\/|\/$/g, '')
}

// Helper function to create safe blob keys
function createBlobKey(...parts: string[]): string {
  const cleanParts = parts.filter(part => part && part.trim()).map(part => 
    part.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^_+|_+$/g, '')
  )
  return cleanParts.join('/')
}

export class BlobStorage {
  // Public Messages
  static async getPublicMessages(): Promise<BlobMessage[]> {
    try {
      const { blobs } = await list({ prefix: "public-messages/" })
      const messages: BlobMessage[] = []

      for (const blob of blobs) {
        try {
          const response = await fetch(blob.url)
          const message = await response.json()
          messages.push(message)
        } catch (error) {
          console.error("Error fetching message:", error)
        }
      }

      return messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    } catch (error) {
      console.error("Error getting public messages:", error)
      return []
    }
  }

  static async addPublicMessage(message: Omit<BlobMessage, "id" | "createdAt">): Promise<BlobMessage> {
    const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const fullMessage: BlobMessage = {
      ...message,
      id,
      createdAt: new Date().toISOString(),
    }

    const blobKey = createBlobKey("public-messages", `${id}.json`)
    await put(blobKey, JSON.stringify(fullMessage), {
      access: "public",
    })

    return fullMessage
  }

  // Private Messages
  static async getPrivateMessages(user1Id: string, user2Id: string): Promise<BlobMessage[]> {
    try {
      const { blobs } = await list({ prefix: "private-messages/" })
      const messages: BlobMessage[] = []

      for (const blob of blobs) {
        try {
          const response = await fetch(blob.url)
          const message = await response.json()

          // Check if message is between the two users
          if (
            (message.senderId === user1Id && message.receiverId === user2Id) ||
            (message.senderId === user2Id && message.receiverId === user1Id)
          ) {
            messages.push(message)
          }
        } catch (error) {
          console.error("Error fetching private message:", error)
        }
      }

      return messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    } catch (error) {
      console.error("Error getting private messages:", error)
      return []
    }
  }

  static async addPrivateMessage(message: Omit<BlobMessage, "id" | "createdAt">): Promise<BlobMessage> {
    const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const fullMessage: BlobMessage = {
      ...message,
      id,
      createdAt: new Date().toISOString(),
    }

    const blobKey = createBlobKey("private-messages", `${id}.json`)
    await put(blobKey, JSON.stringify(fullMessage), {
      access: "public",
    })

    return fullMessage
  }

  // Comments
  static async getComments(mediaId: string): Promise<BlobComment[]> {
    if (!mediaId || !mediaId.trim()) {
      console.error("Invalid mediaId for getComments:", mediaId)
      return []
    }

    try {
      const sanitizedMediaId = mediaId.replace(/[^a-zA-Z0-9._-]/g, '_')
      const { blobs } = await list({ prefix: `comments-${sanitizedMediaId}/` })
      const comments: BlobComment[] = []

      for (const blob of blobs) {
        try {
          const response = await fetch(blob.url)
          const comment = await response.json()
          comments.push(comment)
        } catch (error) {
          console.error("Error fetching comment:", error)
        }
      }

      return comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    } catch (error) {
      console.error("Error getting comments:", error)
      return []
    }
  }

  static async addComment(comment: Omit<BlobComment, "id" | "createdAt">): Promise<BlobComment> {
    if (!comment.mediaId || !comment.mediaId.trim()) {
      throw new Error("Invalid mediaId for addComment")
    }

    const id = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const fullComment: BlobComment = {
      ...comment,
      id,
      createdAt: new Date().toISOString(),
    }

    const sanitizedMediaId = comment.mediaId.replace(/[^a-zA-Z0-9._-]/g, '_')
    const blobKey = createBlobKey(`comments-${sanitizedMediaId}`, `${id}.json`)
    
    await put(blobKey, JSON.stringify(fullComment), {
      access: "public",
    })

    return fullComment
  }

  // Likes
  static async getLikes(mediaId: string): Promise<BlobLike[]> {
    if (!mediaId || !mediaId.trim()) {
      console.error("Invalid mediaId for getLikes:", mediaId)
      return []
    }

    try {
      const sanitizedMediaId = mediaId.replace(/[^a-zA-Z0-9._-]/g, '_')
      const { blobs } = await list({ prefix: `likes-${sanitizedMediaId}/` })
      const likes: BlobLike[] = []

      for (const blob of blobs) {
        try {
          const response = await fetch(blob.url)
          const like = await response.json()
          likes.push(like)
        } catch (error) {
          console.error("Error fetching like:", error)
        }
      }

      return likes
    } catch (error) {
      console.error("Error getting likes:", error)
      return []
    }
  }

  static async addLike(like: Omit<BlobLike, "id" | "createdAt">): Promise<BlobLike> {
    if (!like.mediaId || !like.mediaId.trim()) {
      throw new Error("Invalid mediaId for addLike")
    }

    const id = `like_${like.userId}_${Date.now()}`
    const fullLike: BlobLike = {
      ...like,
      id,
      createdAt: new Date().toISOString(),
    }

    const sanitizedMediaId = like.mediaId.replace(/[^a-zA-Z0-9._-]/g, '_')
    const blobKey = createBlobKey(`likes-${sanitizedMediaId}`, `${id}.json`)

    await put(blobKey, JSON.stringify(fullLike), {
      access: "public",
    })

    return fullLike
  }

  static async removeLike(mediaId: string, userId: string): Promise<void> {
    if (!mediaId || !mediaId.trim() || !userId || !userId.trim()) {
      console.error("Invalid parameters for removeLike:", { mediaId, userId })
      return
    }

    try {
      const sanitizedMediaId = mediaId.replace(/[^a-zA-Z0-9._-]/g, '_')
      const { blobs } = await list({ prefix: `likes-${sanitizedMediaId}/` })
      
      // Find and delete the like by this user
      for (const blob of blobs) {
        try {
          const response = await fetch(blob.url)
          const like = await response.json()
          if (like.userId === userId) {
            await del(blob.url)
            break
          }
        } catch (error) {
          console.error("Error processing like for removal:", error)
        }
      }
    } catch (error) {
      console.error("Error removing like:", error)
    }
  }

  // Users
  static async getUsers(): Promise<BlobUser[]> {
    try {
      const { blobs } = await list({ prefix: "users/" })
      const users: BlobUser[] = []

      for (const blob of blobs) {
        try {
          const response = await fetch(blob.url)
          const user = await response.json()
          users.push(user)
        } catch (error) {
          console.error("Error fetching user:", error)
        }
      }

      return users
    } catch (error) {
      console.error("Error getting users:", error)
      return []
    }
  }

  static async getUserByEmail(email: string): Promise<BlobUser | null> {
    const users = await this.getUsers()
    return users.find((user) => user.email === email) || null
  }

  static async getUserById(id: string): Promise<BlobUser | null> {
    try {
      const { blobs } = await list({ prefix: "users/" })
      
      for (const blob of blobs) {
        try {
          const response = await fetch(blob.url)
          const user = await response.json()
          if (user.id === id) {
            return user
          }
        } catch (error) {
          console.error("Error fetching user:", error)
        }
      }
    } catch (error) {
      console.error("Error getting user by ID:", error)
    }
    return null
  }

  static async addUser(user: Omit<BlobUser, "id" | "createdAt">): Promise<BlobUser> {
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const fullUser: BlobUser = {
      ...user,
      id,
      createdAt: new Date().toISOString(),
    }

    const blobKey = createBlobKey("users", `${id}.json`)
    await put(blobKey, JSON.stringify(fullUser), {
      access: "public",
    })

    return fullUser
  }

  static async updateUser(userId: string, updates: Partial<BlobUser>): Promise<BlobUser | null> {
    try {
      const user = await this.getUserById(userId)
      if (!user) return null

      const updatedUser = { ...user, ...updates }
      const blobKey = createBlobKey("users", `${userId}.json`)
      await put(blobKey, JSON.stringify(updatedUser), {
        access: "public",
      })

      return updatedUser
    } catch (error) {
      console.error("Error updating user:", error)
      return null
    }
  }
}
