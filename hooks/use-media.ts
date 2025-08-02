import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useMedia() {
  const { data, error, mutate } = useSWR("/api/media", fetcher, {
    refreshInterval: 5000, // Auto-refresh every 5 seconds
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  })

  const uploadFiles = async (files: File[]) => {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append("files", file)
    })

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Upload failed")
    }

    const result = await response.json()
    mutate() // Refresh data after upload
    return result
  }

  const updateTags = async (mediaId: string, tags: string[]) => {
    const response = await fetch("/api/media", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mediaId, tags }),
    })

    if (!response.ok) {
      throw new Error("Failed to update tags")
    }

    mutate() // Refresh data after update
    return response.json()
  }

  return {
    media: data?.media || [],
    loading: !error && !data,
    error,
    mutate,
    uploadFiles,
    updateTags,
  }
}
