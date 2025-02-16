import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { subMonths, subDays, subHours, startOfDay } from "date-fns"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return new NextResponse(JSON.stringify({ error: "You must be logged in to view dashboard stats." }), {
        status: 401,
      })
    }

    const url = new URL(request.url)
    const period = url.searchParams.get("period") || "30 days"

    const userEmail = session.user.email

    // Get the date range based on the selected period
    const now = new Date()
    let startDate: Date

    switch (period) {
      case "12 months":
        startDate = startOfDay(subMonths(now, 12))
        break
      case "30 days":
        startDate = startOfDay(subDays(now, 30))
        break
      case "7 days":
        startDate = startOfDay(subDays(now, 7))
        break
      case "24 hours":
        startDate = subHours(now, 24)
        break
      default:
        startDate = startOfDay(subDays(now, 30)) // Default to 30 days
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        accountBalance: true,
        createdAt: true,
      },
    })

    if (!user) {
      throw new Error("User not found")
    }

    // Get transactions within the selected period
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [{ receiverEmail: userEmail }, { senderEmail: userEmail }],
        dateTime: {
          gte: startDate,
        },
      },
    })

    // Calculate totals from transactions
    let totalIncome = 0
    let totalExpense = 0

    transactions.forEach((transaction) => {
      if (transaction.receiverEmail === userEmail) {
        totalIncome += transaction.amount
      }
      if (transaction.senderEmail === userEmail) {
        totalExpense += transaction.amount
      }
    })

    // Include initial balance only if the account was created within the selected period
    const initialBalance = 1000
    const shouldIncludeInitialBalance = user.createdAt >= startDate

    return NextResponse.json({
      totalIncome: totalIncome + (shouldIncludeInitialBalance ? initialBalance : 0),
      totalExpense: totalExpense,
      currentBalance: user.accountBalance,
      period: period,
    })
  } catch (error: any) {
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 })
  }
}

