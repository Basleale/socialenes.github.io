"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export default function SetupDatabase() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const setupDatabase = async () => {
    setStatus("loading")
    setMessage("")

    try {
      const response = await fetch("/api/setup-db", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setStatus("success")
        setMessage(data.message || "Database setup completed successfully!")
      } else {
        setStatus("error")
        setMessage(data.error || "Failed to setup database")
      }
    } catch (error) {
      setStatus("error")
      setMessage("Network error occurred")
      console.error("Setup error:", error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Database Setup</CardTitle>
          <CardDescription>Initialize the database tables for your application</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={setupDatabase} disabled={status === "loading"} className="w-full">
            {status === "loading" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {status === "loading" ? "Setting up..." : "Setup Database"}
          </Button>

          {status === "success" && (
            <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-md">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm">{message}</span>
            </div>
          )}

          {status === "error" && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{message}</span>
            </div>
          )}

          {status === "success" && (
            <div className="text-center">
              <Button variant="outline" onClick={() => (window.location.href = "/")} className="w-full">
                Go to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
