"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  LayoutDashboard,
  Settings,
  Search,
  Calendar,
  SlidersHorizontal,
  MoreVertical,
  LogOut,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DateRangePickerDialog } from "@/components/date-range-picker-dialog"
import {
  format,
  isWithinInterval,
  parseISO,
  addHours,
  addDays,
  addMonths,
  subMonths,
  subDays,
  subHours,
  startOfHour,
  startOfDay,
  startOfMonth,
} from "date-fns"
import type { DateRange } from "react-day-picker"
import { SendMoneyDialog } from "@/components/send-money-dialog"
import { LoadingScreen } from "@/components/loading-screen"
import { signOut, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { FiltersDialog } from "@/components/filters-dialog"
import { ToastProvider } from "@/components/ui/toast"
import { Toaster } from "@/components/ui/toaster"

// Mock data for charts
const miniChartData = Array.from({ length: 10 }, (_, i) => ({
  name: i,
  value: Math.random() * 100,
}))

interface UserData {
  name: string
  email: string
  accountBalance: number
}

interface TransactionData {
  id: number
  senderEmail: string
  receiverEmail: string
  amount: number
  dateTime: string
}

interface DashboardStats {
  totalIncome: number
  totalExpense: number
  currentBalance: number
}

interface FilterOptions {
  showIncome: boolean
  showExpenses: boolean
  minAmount: number
  maxAmount: number
}

function aggregateTransactionsByPeriod(
  transactions: TransactionData[],
  userEmail: string,
  period: string,
  startDate: Date,
): { date: string; income: number; expense: number }[] {
  const now = new Date()
  const aggregatedData: Record<string, { income: number; expense: number }> = {}

  // Initialize all periods with zero values
  let currentDate = new Date(startDate)
  while (currentDate <= now) {
    let key: string
    switch (period) {
      case "24 hours":
        key = format(currentDate, "HH:00")
        currentDate = addHours(currentDate, 1)
        break
      case "7 days":
        key = format(currentDate, "EEE")
        currentDate = addDays(currentDate, 1)
        break
      case "30 days":
        key = format(currentDate, "MMM dd")
        currentDate = addDays(currentDate, 1)
        break
      default: // 12 months
        key = format(currentDate, "MMM")
        currentDate = addMonths(currentDate, 1)
        break
    }
    aggregatedData[key] = { income: 0, expense: 0 }
  }

  // Aggregate transaction data
  transactions.forEach((transaction) => {
    const date = new Date(transaction.dateTime)
    if (date >= startDate && date <= now) {
      let key: string
      switch (period) {
        case "24 hours":
          key = format(date, "HH:00")
          break
        case "7 days":
          key = format(date, "EEE")
          break
        case "30 days":
          key = format(date, "MMM dd")
          break
        default: // 12 months
          key = format(date, "MMM")
          break
      }

      if (transaction.receiverEmail === userEmail) {
        aggregatedData[key].income += transaction.amount
      } else if (transaction.senderEmail === userEmail) {
        aggregatedData[key].expense += transaction.amount
      }
    }
  })

  return Object.entries(aggregatedData).map(([date, data]) => ({
    date,
    income: data.income,
    expense: data.expense,
  }))
}

export default function Dashboard() {
  const router = useRouter()
  const [userData, setUserData] = useState<UserData | null>(null)
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
  const [transactions, setTransactions] = useState<TransactionData[]>([])
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalIncome: 1000,
    totalExpense: 0,
    currentBalance: 1000,
  })
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    showIncome: true,
    showExpenses: true,
    minAmount: 0,
    maxAmount: Number.POSITIVE_INFINITY,
  })
  const [moneyFlowData, setMoneyFlowData] = useState<{ date: string; income: number; expense: number }[]>([])
  const { data: session } = useSession()

  const fetchUserData = useCallback(async () => {
    try {
      const response = await fetch("/api/user")
      if (!response.ok) {
        throw new Error("Failed to fetch user data")
      }
      const data = await response.json()
      setUserData(data)
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }, [])

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

  const fetchTransactions = useCallback(async () => {
    try {
      const response = await fetch("/api/transactions")
      if (!response.ok) {
        throw new Error("Failed to fetch transactions")
      }
      const data = await response.json()
      setTransactions(data)
    } catch (error) {
      console.error("Error fetching transactions:", error)
    }
  }, [])

  const fetchDashboardStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/dashboard-stats?period=${encodeURIComponent(selectedPeriod)}`)
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats")
      }
      const data = await response.json()
      setDashboardStats(data)
      setUserData((prevData) => (prevData ? { ...prevData, accountBalance: data.currentBalance } : null))
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    }
  }, [selectedPeriod])

  useEffect(() => {
    let mounted = true

    const initializeData = async () => {
      if (mounted) {
        await Promise.all([fetchUserData(), fetchExchangeRates(), fetchDashboardStats()])
      }
    }

    initializeData()

    return () => {
      mounted = false
    }
  }, [fetchUserData, fetchExchangeRates, fetchDashboardStats])

  useEffect(() => {
    let mounted = true

    const fetchData = async () => {
      if (mounted && session) {
        await fetchTransactions()
      }
    }

    fetchData()

    return () => {
      mounted = false
    }
  }, [session, fetchTransactions])

  useEffect(() => {
    if (isDarkTheme) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDarkTheme])

  useEffect(() => {
    fetchDashboardStats()
  }, [fetchDashboardStats])

  useEffect(() => {
    if (!userData?.email || transactions.length === 0) return

    const now = new Date()
    let startDate: Date

    switch (selectedPeriod) {
      case "12 months":
        startDate = startOfMonth(subMonths(now, 11))
        break
      case "30 days":
        startDate = startOfDay(subDays(now, 29))
        break
      case "7 days":
        startDate = startOfDay(subDays(now, 6))
        break
      case "24 hours":
        startDate = startOfHour(subHours(now, 23))
        break
      default:
        startDate = startOfDay(subDays(now, 29))
    }

    const aggregatedData = aggregateTransactionsByPeriod(transactions, userData.email, selectedPeriod, startDate)

    setMoneyFlowData(aggregatedData)
  }, [selectedPeriod, transactions, userData?.email])

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query.toLowerCase())
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
    async (recipient: string, amount: number) => {
      try {
        // Remove the API call from here since it's now handled in the dialog
        fetchUserData()
        fetchTransactions()
        fetchDashboardStats()
      } catch (error) {
        console.error("Error updating data:", error)
      }
    },
    [fetchUserData, fetchTransactions, fetchDashboardStats],
  )

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push("/auth")
  }

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const isIncome = transaction.receiverEmail === userData?.email
      const isExpense = transaction.senderEmail === userData?.email
      const transactionDate = parseISO(transaction.dateTime)

      const dateRangeFilter = dateRange
        ? isWithinInterval(transactionDate, {
            start: dateRange.from!,
            end: dateRange.to || dateRange.from!,
          })
        : true

      const searchFilter = searchQuery
        ? transaction.senderEmail.toLowerCase().includes(searchQuery) ||
          transaction.receiverEmail.toLowerCase().includes(searchQuery)
        : true

      return (
        ((isIncome && filterOptions.showIncome) || (isExpense && filterOptions.showExpenses)) &&
        transaction.amount >= filterOptions.minAmount &&
        transaction.amount <= filterOptions.maxAmount &&
        dateRangeFilter &&
        searchFilter
      )
    })
  }, [transactions, userData, filterOptions, dateRange, searchQuery])

  const handlePeriodChange = useCallback((period: string) => {
    setSelectedPeriod(period)
  }, [])

  if (isLoading || !userData) {
    return <LoadingScreen />
  }

  return (
    <ToastProvider>
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
                src={`https://api.dicebear.com/6.x/pixel-art/svg?seed=${userData.name}&backgroundColor=b6e3f4`}
                alt={userData.name}
                className="w-8 h-8 rounded-full mr-3"
              />
              <div>
                <p className="text-sm font-medium">{userData.name}</p>
                <p className="text-xs text-muted-foreground">{userData.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="ml-64 flex-1 p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-semibold">Banking Dashboard ({selectedPeriod})</h1>
              <p className="text-muted-foreground">Welcome back, {userData.name}!</p>
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
                  onClick={() => handlePeriodChange(period)}
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
              {dateRange && (
                <Button variant="outline" onClick={() => setDateRange(undefined)}>
                  Clear Dates
                </Button>
              )}
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
                      <p className="text-2xl font-bold tracking-wider">
                        {formatCurrency(dashboardStats.currentBalance, true)}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-lg font-semibold tracking-widest">1234 5678 9012 3456</p>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-xs font-light">Valid Thru</p>
                          <p className="text-sm">05/25</p>
                        </div>
                        <p className="text-sm font-semibold tracking-wider">{userData.name.toUpperCase()}</p>
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
                    <p className="text-sm text-muted-foreground">Including initial balance</p>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-2xl font-bold mb-4">{formatCurrency(dashboardStats.totalIncome, true)}</p>
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
                    <p className="text-sm text-muted-foreground">All time</p>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-2xl font-bold mb-4">{formatCurrency(dashboardStats.totalExpense, true)}</p>
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
                    <BarChart data={moneyFlowData}>
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
                  <h2 className="text-[15px] font-semibold">Recent Transactions</h2>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-5">
                    {filteredTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 
                    ${transaction.senderEmail === userData?.email ? "bg-red-100" : "bg-green-100"}`}
                          >
                            {transaction.senderEmail === userData?.email ? (
                              <ArrowUpRight className="h-6 w-6 text-red-600" />
                            ) : (
                              <ArrowDownLeft className="h-6 w-6 text-green-600" />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <p className="text-sm font-medium truncate">
                              {transaction.senderEmail === userData?.email ? "Sent to" : "Received from"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {transaction.senderEmail === userData?.email
                                ? transaction.receiverEmail
                                : transaction.senderEmail}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-sm font-medium tabular-nums ${
                              transaction.senderEmail === userData?.email ? "text-red-500" : "text-green-500"
                            }`}
                          >
                            {transaction.senderEmail === userData?.email ? "-" : "+"}
                            {formatCurrency(transaction.amount, true)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(transaction.dateTime).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
          <FiltersDialog
            open={isFiltersOpen}
            onOpenChange={setIsFiltersOpen}
            filterOptions={filterOptions}
            setFilterOptions={setFilterOptions}
          />
          <SendMoneyDialog
            onSendMoney={handleSendMoney}
            open={isSendMoneyOpen}
            onOpenChange={setIsSendMoneyOpen}
            userEmail={userData?.email}
            accountBalance={dashboardStats.currentBalance}
          />
        </div>
      </div>
      <Toaster />
    </ToastProvider>
  )
}

function FiltersDialog({
  open,
  onOpenChange,
  filterOptions,
  setFilterOptions,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  filterOptions: FilterOptions
  setFilterOptions: (options: FilterOptions) => void
}) {
  const [showIncome, setShowIncome] = useState(filterOptions.showIncome)
  const [showExpenses, setShowExpenses] = useState(filterOptions.showExpenses)
  const [minAmount, setMinAmount] = useState(filterOptions.minAmount.toString())
  const [maxAmount, setMaxAmount] = useState(
    filterOptions.maxAmount === Number.POSITIVE_INFINITY ? "" : filterOptions.maxAmount.toString(),
  )

  const handleApplyFilters = () => {
    setFilterOptions({
      showIncome,
      showExpenses,
      minAmount: Number.parseInt(minAmount, 10) || 0,
      maxAmount: maxAmount ? Number.parseInt(maxAmount, 10) : Number.POSITIVE_INFINITY,
    })
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

