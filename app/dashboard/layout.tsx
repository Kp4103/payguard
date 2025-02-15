"use client"

import "./globals.css"
import { Inter } from "next/font/google"
import type React from "react"
import { SessionProvider } from "next-auth/react"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Banking Dashboard",
  description: "Manage your account and send money securely",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}