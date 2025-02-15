"use client"

import type React from "react"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/icons"

export default function AuthPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      if (isSignUp) {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        })

        if (!res.ok) {
          throw new Error("Registration failed")
        }

        // After successful registration, sign in
        await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        })
      } else {
        const result = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        })

        if (result?.error) {
          throw new Error("Invalid credentials")
        }
      }

      router.push("/dashboard")
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-100 to-blue-50">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-lg">
        <div className="flex justify-center mb-6">
          <div className="p-3 rounded-full bg-gray-50">
            <Icons.login className="w-6 h-6 text-gray-600" />
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-center mb-2">
          {isSignUp ? "Create an account" : "Sign in with email"}
        </h1>
        <p className="text-gray-500 text-center mb-6">
          {isSignUp
            ? "Create a new account to get started"
            : "Make a new doc to bring your words, data, and teams together. For free"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required={isSignUp}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          {!isSignUp && (
            <div className="flex justify-end">
              <Button variant="link" className="px-0">
                Forgot password?
              </Button>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button className="w-full bg-gray-900 hover:bg-gray-800" type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Please wait
              </>
            ) : isSignUp ? (
              "Create account"
            ) : (
              "Get Started"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Button variant="link" className="text-sm" onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
          </Button>
        </div>
      </div>
    </div>
  )
}

