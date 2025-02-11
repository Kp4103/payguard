"use client"

import { useState, useEffect, useCallback } from "react"
import { LayoutDashboard, Settings, Search, Calendar, SlidersHorizontal, MoreVertical, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DateRangePickerDialog } from "@/components/date-range-picker-dialog"
import { format } from "date-fns"
import type { DateRange } from "@/components/date-range-picker-dialog"
import { SendMoneyDialog } from "@/components/send-money-dialog"
import { LoadingScreen } from "@/components/loading-screen"

// Mock data for charts
const balanceHistory = [
  { date: "Jan", income: 600, expense: 400, profit: 200 },
  { date: "Feb", income: 700, expense: 500, profit: 200 },
  { date: "Mar", income: 800, expense: 550, profit: 250 },
  { date: "Apr", income: 750, expense: 600, profit: 150 },
  { date: "May", income: 900, expense: 700, profit: 200 },
  { date: "Jun", income: 950, expense: 750, profit: 200 },
  { date: "Jul", income: 1000, expense: 800, profit: 200 },
  { date: "Aug", income: 1100, expense: 850, profit: 250 },
  { date: "Sep", income: 1200, expense: 900, profit: 300 },
  { date: "Oct", income: 1300, expense: 950, profit: 350 },
  { date: "Nov", income: 1400, expense: 1000, profit: 400 },
  { date: "Dec", income: 1500, expense: 1100, profit: 400 },
]

const transactions = [
  { id: 1, type: "Internal Payment", amount: 192.0, date: "July 26,2023", card: "visa" },
  { id: 2, type: "External Payment", amount: -216.0, date: "July 26,2023", card: "mastercard" },
  { id: 3, type: "External Payment", amount: -221.0, date: "stripe@pointfocus.com", card: "stripe" },
  { id: 4, type: "Internal Payment", amount: 231.0, date: "July 26,2023", card: "visa" },
  { id: 5, type: "External Payment", amount: -211.0, date: "July 26,2023", card: "visa" },
]

const miniChartData = Array.from({ length: 10 }, (_, i) => ({
  name: i,
  value: Math.random() * 100,
}))

export default function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("30 days")
  const [currency, setCurrency] = useState("USD")
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isDarkTheme, setIsDarkTheme] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [searchQuery, setSearchQuery] = useState("")
  const [isSendMoneyOpen, setIsSendMoneyOpen] = useState(false)

  const fetchExchangeRates = useCallback(async () => {
    try {
      const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD")
      const data = await response.json()
      setExchangeRates(data.rates)
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching exchange rates:", error)
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchExchangeRates()
  }, [fetchExchangeRates])

  useEffect(() => {
    if (isDarkTheme) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDarkTheme])

  useEffect(() => {
    // This effect runs whenever the selected period changes
    console.log(`Selected period changed to: ${selectedPeriod}`)
    // You can add logic here to fetch new data or update the dashboard based on the selected period
  }, [selectedPeriod])

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    // TODO: Implement search functionality here
    console.log("Searching for:", query)
  }, [])

  const formatCurrency = useCallback(
    (value: number, fromUSD = false) => {
      if (isLoading) return "Loading..."

      const convertedValue = fromUSD ? value * exchangeRates[currency] : value * (1 / exchangeRates[currency])
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(convertedValue)
    },
    [currency, exchangeRates, isLoading],
  )

  const handleSendMoney = useCallback(
    (recipient: string, amount: number) => {
      console.log(`Sending ${formatCurrency(amount, true)} to ${recipient}`)
      // Here you would implement the actual money sending logic
      setIsSendMoneyOpen(false)
    },
    [formatCurrency],
  )

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <div className="fixed top-0 left-0 w-64 h-screen bg-card border-r border-border p-6 flex flex-col overflow-hidden">
        <h1 className="text-xl font-bold mb-8 text-primary">PAYGUARD</h1>

        <nav className="space-y-2 flex-shrink-0">
          <Button
            variant="ghost"
            className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
        </nav>

        <div className="flex-grow flex flex-col justify-end space-y-2 my-4">
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                onClick={() => setIsSettingsOpen(true)}
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="currency" className="text-sm font-medium">
                    Currency
                  </label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-[200px]">
                        {Object.keys(exchangeRates)
                          .sort()
                          .map((curr) => (
                            <SelectItem key={curr} value={curr}>
                              {curr}
                            </SelectItem>
                          ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <label htmlFor="theme" className="text-sm font-medium">
                    Dark Theme
                  </label>
                  <Switch id="theme" checked={isDarkTheme} onCheckedChange={setIsDarkTheme} />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* User Profile */}
        <div className="flex-shrink-0 pt-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center">
            <img
              src={`https://api.dicebear.com/6.x/pixel-art/svg?seed=ShaniFetrianti&backgroundColor=b6e3f4`}
              alt="Shani Fetrianti"
              className="w-8 h-8 rounded-full mr-3"
            />
            <div>
              <p className="text-sm font-medium">Shani Fetrianti</p>
              <p className="text-xs text-muted-foreground">Shani@payguard.com</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-semibold">Banking Dashboard ({selectedPeriod})</h1>
            <p className="text-muted-foreground">Welcome back, Shani!</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search"
                className="pl-10 w-64"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <Button onClick={() => setIsSendMoneyOpen(true)}>Send Money</Button>
            <SendMoneyDialog onSendMoney={handleSendMoney} open={isSendMoneyOpen} onOpenChange={setIsSendMoneyOpen} />
          </div>
        </div>

        {/* Time Period Selector */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex space-x-2">
            {["12 months", "30 days", "7 days", "24 hours"].map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? "default" : "outline"}
                className={selectedPeriod === period ? "bg-primary text-primary-foreground" : ""}
                onClick={() => setSelectedPeriod(period)}
              >
                {period}
              </Button>
            ))}
          </div>
          <div className="flex space-x-2">
            <DateRangePickerDialog date={dateRange} setDate={setDateRange}>
              <Button variant="outline" className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Select dates</span>
                )}
              </Button>
            </DateRangePickerDialog>
            <Button variant="outline" className="flex items-center" onClick={() => setIsFiltersOpen(true)}>
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-3 gap-6">
          {/* Primary Account */}
          <div className="col-span-1">
            <div className="rounded-xl p-6">
              <div className="relative h-56 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-6 overflow-hidden shadow-lg">
                {/* Subtle pattern overlay */}
                <div className="absolute inset-0 opacity-10">
                  <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
                    </pattern>
                    <rect width="100" height="100" fill="url(#grid)" />
                  </svg>
                </div>

                <div className="relative text-white h-full flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <svg className="w-12 h-12 text-white/80" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
                    </svg>
                    <p className="text-sm font-light">PayGuard</p>
                  </div>

                  <div className="flex justify-between items-center">
                    {/* Chip */}
                    <div className="w-12 h-9 bg-yellow-300 rounded-md overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-200 to-yellow-400" />
                      <div className="absolute inset-0 opacity-50">
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                          <pattern id="chipPattern" patternUnits="userSpaceOnUse" width="10" height="10">
                            <path d="M0 5 L10 5 M5 0 L5 10" strokeWidth="0.5" stroke="#000" fill="none" />
                          </pattern>
                          <rect width="100" height="100" fill="url(#chipPattern)" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-2xl font-bold tracking-wider">{formatCurrency(1000, true)}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-lg font-semibold tracking-widest">1234 5678 9012 3456</p>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs font-light">Valid Thru</p>
                        <p className="text-sm">05/25</p>
                      </div>
                      <p className="text-sm font-semibold tracking-wider">SHANI FETRIANTI</p>
                    </div>
                  </div>

                  {/* Network logo */}
                  <svg
                    className="absolute top-6 right-6 w-12 h-12 text-white/80"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 18.5c4.142 0 7.5-1.567 7.5-3.5S16.142 11.5 12 11.5S4.5 13.067 4.5 15s3.358 3.5 7.5 3.5z" />
                    <path d="M12 13.5c4.142 0 7.5-1.567 7.5-3.5S16.142 6.5 12 6.5S4.5 8.067 4.5 10s3.358 3.5 7.5 3.5z" />
                  </svg>
                </div>
              </div>
              {/* Glow effect */}
              <div className="absolute inset-0 bg-blue-400 opacity-20 blur-xl rounded-xl -z-10"></div>
            </div>
          </div>

          {/* Total Income */}
          <div className="col-span-1">
            <div className="bg-card rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-semibold">Total Income</h2>
                  <p className="text-sm text-muted-foreground">August 2023</p>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-2xl font-bold mb-4">{formatCurrency(6421.1, true)}</p>
              <div className="text-sm text-green-500 mb-4">↑ 2.5%</div>
              <div className="h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={miniChartData}>
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Total Expends */}
          <div className="col-span-1">
            <div className="bg-card rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-semibold">Total Expends</h2>
                  <p className="text-sm text-muted-foreground">August 2023</p>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-2xl font-bold mb-4">{formatCurrency(561.34, true)}</p>
              <div className="text-sm text-red-500 mb-4">↓ 1.0%</div>
              <div className="h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={miniChartData}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--destructive))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Money Flow */}
          <div className="col-span-2">
            <div className="bg-card rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Money flow</h2>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={balanceHistory}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      tickFormatter={(value) => formatCurrency(value, true).split(".")[0]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem",
                      }}
                      labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                      formatter={(value: number) => [formatCurrency(value, true), ""]}
                    />
                    <Bar dataKey="income" fill="hsl(var(--primary))" />
                    <Bar dataKey="expense" fill="hsl(var(--primary) / 0.3)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="col-span-1">
            <div className="bg-card rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[15px] font-semibold">Recent Transaction</h2>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
              <ScrollArea className="h-[200px]">
                <div className="space-y-5">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 
                          ${transaction.card === "visa" ? "bg-[#1434CB]/10" : ""} 
                          ${transaction.card === "mastercard" ? "bg-[#EB001B]/10" : ""}
                          ${transaction.card === "stripe" ? "bg-[#635BFF]/10" : ""}`}
                        >
                          {transaction.card === "visa" && (
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#1434CB">
                              <path d="M12 17.5c4.142 0 7.5-1.567 7.5-3.5S16.142 10.5 12 10.5S4.5 12.067 4.5 14s3.358 3.5 7.5 3.5z" />
                            </svg>
                          )}
                          {transaction.card === "mastercard" && (
                            <div className="w-6 h-6 relative">
                              <div className="absolute inset-0 bg-[#EB001B] rounded-full opacity-80 -ml-1" />
                              <div className="absolute inset-0 bg-[#F79E1B] rounded-full opacity-80 ml-1" />
                            </div>
                          )}
                          {transaction.card === "stripe" && (
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#635BFF">
                              <path d="M13.5 4.5h-3L12 9l1.5-4.5zM16.5 10.5L12 6l-4.5 4.5h9z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <p className="text-sm font-medium truncate">{transaction.type}</p>
                          <p className="text-xs text-muted-foreground">{transaction.date}</p>
                        </div>
                      </div>
                      <p
                        className={`text-sm font-medium tabular-nums ${
                          transaction.amount > 0 ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {transaction.amount > 0 ? "+" : ""}
                        {formatCurrency(Math.abs(transaction.amount), true)}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
        <FiltersDialog open={isFiltersOpen} onOpenChange={setIsFiltersOpen} />
      </div>
    </div>
  )
}

function FiltersDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [showIncome, setShowIncome] = useState(true)
  const [showExpenses, setShowExpenses] = useState(true)
  const [minAmount, setMinAmount] = useState("")
  const [maxAmount, setMaxAmount] = useState("")

  const handleApplyFilters = () => {
    // Here you would implement the logic to apply the filters
    console.log("Applying filters:", { showIncome, showExpenses, minAmount, maxAmount })
    onOpenChange(false) // Close the dialog after applying filters
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Filters</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <Switch id="show-income" checked={showIncome} onCheckedChange={setShowIncome} />
            <label htmlFor="show-income">Show Income</label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="show-expenses" checked={showExpenses} onCheckedChange={setShowExpenses} />
            <label htmlFor="show-expenses">Show Expenses</label>
          </div>
          <div className="flex flex-col space-y-2">
            <label htmlFor="min-amount">Minimum Amount</label>
            <Input
              id="min-amount"
              type="number"
              placeholder="0"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
            />
          </div>
          <div className="flex flex-col space-y-2">
            <label htmlFor="max-amount">Maximum Amount</label>
            <Input
              id="max-amount"
              type="number"
              placeholder="1000"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
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

