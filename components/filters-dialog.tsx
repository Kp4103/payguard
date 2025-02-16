"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface FilterOptions {
  showIncome: boolean
  showExpenses: boolean
  minAmount: number
  maxAmount: number
}

interface FiltersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filterOptions: FilterOptions
  setFilterOptions: (options: FilterOptions) => void
}

export function FiltersDialog({ open, onOpenChange, filterOptions, setFilterOptions }: FiltersDialogProps) {
  const [localOptions, setLocalOptions] = useState(filterOptions)

  useEffect(() => {
    setLocalOptions(filterOptions)
  }, [filterOptions])

  const handleApplyFilters = () => {
    setFilterOptions(localOptions)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Filters</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-income"
              checked={localOptions.showIncome}
              onCheckedChange={(checked) => setLocalOptions((prev) => ({ ...prev, showIncome: checked }))}
            />
            <label htmlFor="show-income">Show Income</label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="show-expenses"
              checked={localOptions.showExpenses}
              onCheckedChange={(checked) => setLocalOptions((prev) => ({ ...prev, showExpenses: checked }))}
            />
            <label htmlFor="show-expenses">Show Expenses</label>
          </div>
          <div className="flex flex-col space-y-2">
            <label htmlFor="min-amount">Minimum Amount</label>
            <Input
              id="min-amount"
              type="number"
              placeholder="0"
              value={localOptions.minAmount}
              onChange={(e) =>
                setLocalOptions((prev) => ({
                  ...prev,
                  minAmount: Number(e.target.value) || 0,
                }))
              }
            />
          </div>
          <div className="flex flex-col space-y-2">
            <label htmlFor="max-amount">Maximum Amount</label>
            <Input
              id="max-amount"
              type="number"
              placeholder="No limit"
              value={localOptions.maxAmount === Number.POSITIVE_INFINITY ? "" : localOptions.maxAmount}
              onChange={(e) =>
                setLocalOptions((prev) => ({
                  ...prev,
                  maxAmount: Number(e.target.value) || Number.POSITIVE_INFINITY,
                }))
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleApplyFilters}>Apply Filters</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

