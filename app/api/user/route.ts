import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user?.email) {
    return new NextResponse(JSON.stringify({ error: "You must be logged in to access this route." }), { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { name: true, email: true, accountBalance: true },
  })

  if (!user) {
    return new NextResponse(JSON.stringify({ error: "User not found" }), { status: 404 })
  }

  return NextResponse.json(user)
}

