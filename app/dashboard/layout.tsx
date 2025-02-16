import type React from "react"

export const metadata = {
  title: "Banking Dashboard",
  description: "Manage your account and send money securely",
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <section>{children}</section>
}

