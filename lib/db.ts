import { put, list, del } from "@vercel/blob"

export interface MediaItem {
  id: string
  name: string
  original_name: string
  type: "image" | "video"
  extension: string
  blob_url: string
  file_size: number
  uploaded_at: string
  uploaded_by: string
  tags: string[]
  created_at: string
  updated_at: string
  url?: string
}

export interface User {
  id: string
  name: string
  email: string
  password_hash: string
  created_at: string
  updated_at: string
  profilePicture?: string
}

export class MediaDatabase {
  // Get all media items, sorted by upload date (newest first)
  static async getAllMedia(): Promise<MediaItem[]> {
    try {
      const { blobs } = await list({ prefix: "media-items/" })
      const mediaItems: MediaItem[] = []

      for (const blob of blobs) {
        try {
          const response = await fetch(blob.url)
          const item = await response.json()
          mediaItems.push({
            ...item,
            url: item.blob_url, // Add url property for compatibility
          })
        } catch (error) {
          console.error("Error fetching media item:", error)
        }
      }

      return mediaItems.sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())
    } catch (error) {
      console.error("Error getting media from blob storage:", error)
      return []
    }
  }

  // Insert new media items
  static async insertMedia(mediaItems: Omit<MediaItem, "id" | "created_at" | "updated_at">[]): Promise<MediaItem[]> {
    try {
      const insertedItems: MediaItem[] = []

      for (const item of mediaItems) {
        const id = `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const fullItem: MediaItem = {
          ...item,
          id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          url: item.blob_url, // Add url property for compatibility
        }

        await put(`media-items/${id}.json`, JSON.stringify(fullItem), {
          access: "public",
          token: "vercel_blob_rw_5UFG312mpLZOjrgt_w4QIybQYmJk3MDGVFM0f5BDTSBXDVY",
        })

        insertedItems.push(fullItem)
      }

      return insertedItems
    } catch (error) {
      console.error("Error inserting media to blob storage:", error)
      throw error
    }
  }

  // Delete media items by IDs
  static async deleteMedia(ids: string[]): Promise<MediaItem[]> {
    try {
      const deletedItems: MediaItem[] = []

      for (const id of ids) {
        try {
          // Get the item before deleting
          const response = await fetch(`https://blob.vercel-storage.com/media-items/${id}.json`)
          if (response.ok) {
            const item = await response.json()
            deletedItems.push(item)
          }

          // Delete the item
          await del(`media-items/${id}.json`, {
            token: "vercel_blob_rw_5UFG312mpLZOjrgt_w4QIybQYmJk3MDGVFM0f5BDTSBXDVY",
          })
        } catch (error) {
          console.error(`Error deleting media item ${id}:`, error)
        }
      }

      return deletedItems
    } catch (error) {
      console.error("Error deleting media from blob storage:", error)
      throw error
    }
  }

  // Update tags for a media item
  static async updateMediaTags(mediaId: string, tags: string[]): Promise<MediaItem | null> {
    try {
      // Get existing item
      const response = await fetch(`https://blob.vercel-storage.com/media-items/${mediaId}.json`)
      if (!response.ok) return null

      const item = await response.json()
      const updatedItem = {
        ...item,
        tags,
        updated_at: new Date().toISOString(),
      }

      // Update the item
      await put(`media-items/${mediaId}.json`, JSON.stringify(updatedItem), {
        access: "public",
        token: "vercel_blob_rw_5UFG312mpLZOjrgt_w4QIybQYmJk3MDGVFM0f5BDTSBXDVY",
      })

      return updatedItem
    } catch (error) {
      console.error("Error updating media tags in blob storage:", error)
      throw error
    }
  }

  // Get media by specific tags
  static async getMediaByTags(tags: string[]): Promise<MediaItem[]> {
    try {
      const allMedia = await this.getAllMedia()
      return allMedia.filter((item) => item.tags && item.tags.some((tag) => tags.includes(tag)))
    } catch (error) {
      console.error("Error fetching media by tags from blob storage:", error)
      throw error
    }
  }

  // Get a single media item by ID
  static async getMediaById(id: string): Promise<MediaItem | null> {
    try {
      const response = await fetch(`https://blob.vercel-storage.com/media-items/${id}.json`)
      if (response.ok) {
        const item = await response.json()
        return {
          ...item,
          url: item.blob_url, // Add url property for compatibility
        }
      }
      return null
    } catch (error) {
      console.error("Error fetching media by ID from blob storage:", error)
      throw error
    }
  }
}

export class UserDatabase {
  // Create a new user
  static async createUser(name: string, email: string, passwordHash: string): Promise<User> {
    try {
      const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const user: User = {
        id,
        name,
        email,
        password_hash: passwordHash,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      await put(`users/${id}.json`, JSON.stringify(user), {
        access: "public",
        token: "vercel_blob_rw_5UFG312mpLZOjrgt_w4QIybQYmJk3MDGVFM0f5BDTSBXDVY",
      })

      return user
    } catch (error) {
      console.error("Error creating user:", error)
      throw error
    }
  }

  // Find user by email
  static async findUserByEmail(email: string): Promise<User | null> {
    try {
      const { blobs } = await list({ prefix: "users/" })

      for (const blob of blobs) {
        try {
          const response = await fetch(blob.url)
          const user = await response.json()
          if (user.email === email) {
            return user
          }
        } catch (error) {
          console.error("Error fetching user:", error)
        }
      }

      return null
    } catch (error) {
      console.error("Error finding user by email:", error)
      throw error
    }
  }

  // Find user by ID
  static async findUserById(id: string): Promise<User | null> {
    try {
      const response = await fetch(`https://blob.vercel-storage.com/users/${id}.json`)
      if (response.ok) {
        return await response.json()
      }
      return null
    } catch (error) {
      console.error("Error finding user by ID:", error)
      throw error
    }
  }
}