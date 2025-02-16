"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"

interface SendMoneyDialogProps {
  onSendMoney: (recipient: string, amount: number) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  userEmail: string
  accountBalance: number
}

export function SendMoneyDialog({ onSendMoney, open, onOpenChange, userEmail, accountBalance }: SendMoneyDialogProps) {
  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return // Prevent double submission

    setIsLoading(true)

    try {
      // Check if the email is the user's own email
      if (recipient === userEmail) {
        throw new Error("You cannot send money to yourself.")
      }

      // Check if the amount is greater than the balance
      if (Number(amount) > accountBalance) {
        throw new Error("Insufficient funds. The amount exceeds your account balance.")
      }

      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiverEmail: recipient,
          amount: Number(amount),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to send money")
      }

      await response.json()
      onSendMoney(recipient, Number(amount))
      onOpenChange(false)
      setRecipient("")
      setAmount("")

      toast({
        title: "Success",
        description: `Successfully sent ${amount} to ${recipient}`,
        variant: "default",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send Money</DialogTitle>
          <DialogDescription>Enter the recipient's email and the amount you want to send.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="recipient" className="text-right">
                To
              </Label>
              <Input
                id="recipient"
                type="email"
                className="col-span-3"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="recipient@example.com"
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                className="col-span-3"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                required
                disabled={isLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

