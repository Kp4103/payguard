import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return new NextResponse(JSON.stringify({ error: "You must be logged in to view dashboard stats." }), {
        status: 401,
      })
    }

    const userEmail = session.user.email

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { accountBalance: true },
    })

    const totalIncome = await prisma.transaction.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        receiverEmail: userEmail,
      },
    })

    const totalExpense = await prisma.transaction.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        senderEmail: userEmail,
      },
    })

    const initialBalance = 1000 // The initial account balance

    return NextResponse.json({
      totalIncome: (totalIncome._sum.amount || 0) + initialBalance,
      totalExpense: totalExpense._sum.amount || 0,
      currentBalance: user?.accountBalance || initialBalance,
    })
  } catch (error: any) {
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 })
  }
}

