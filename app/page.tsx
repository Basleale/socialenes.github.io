"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthForm } from "@/components/auth-form"

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      const user = localStorage.getItem("currentUser")
      if (user) {
        setIsAuthenticated(true)
        router.push("/dashboard")
      } else {
        setIsAuthenticated(false)
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-800 to-red-950">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (isAuthenticated) {
    return null // Will redirect to dashboard
  }

  return <AuthForm />
}
