import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return new NextResponse(JSON.stringify({ error: "You must be logged in to create a transaction." }), {
        status: 401,
      })
    }

    const { receiverEmail, amount } = await req.json()
    const senderEmail = session.user.email

    // Create the transaction
    const transaction = await prisma.$transaction(async (tx) => {
      const createdTransaction = await tx.transaction.create({
        data: {
          senderEmail,
          receiverEmail,
          amount,
        },
      })

      // Update sender's balance
      await tx.user.update({
        where: { email: senderEmail },
        data: { accountBalance: { decrement: amount } },
      })

      // Update receiver's balance
      await tx.user.update({
        where: { email: receiverEmail },
        data: { accountBalance: { increment: amount } },
      })
      return createdTransaction
    })

    return NextResponse.json(transaction)
  } catch (error: any) {
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return new NextResponse(JSON.stringify({ error: "You must be logged in to view transactions." }), { status: 401 })
    }

    const userEmail = session.user.email

    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [{ senderEmail: userEmail }, { receiverEmail: userEmail }],
      },
      orderBy: {
        dateTime: "desc",
      },
    })

    return NextResponse.json(transactions)
  } catch (error: any) {
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 })
  }
}

