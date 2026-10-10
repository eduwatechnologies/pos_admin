'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, CalendarDays, Clock3, Package, Plus, ReceiptText, RefreshCw, ShoppingBag, TrendingUp } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { useShop } from '@/context/shop-context'
import { StatCard } from '@/components/stat-card'
import { RevenueOverview, type MonthlySales } from '@/components/revenue-overview'
import { PaymentBreakdownCard } from '@/components/payment-breakdown-card'
import { useRevenueQuery, useSalesTrendQuery, usePaymentBreakdownQuery } from '@/redux/api/analytics-api'
import { useListReceiptsQuery } from '@/redux/api/receipts-api'
import { useListProductsQuery } from '@/redux/api/products-api'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { Receipt } from '@/lib/types'

type DatePreset = 'today' | 'yesterday' | 'custom'

function parseLocalDate(value: string) {
  const parts = value.split('-').map(Number)
  const [year, month, day] = parts
  if (!year || !month || !day) return null
  const date = new Date(year, month - 1, day)
  return Number.isNaN(date.getTime()) ? null : date
}

function startOfDay(date: Date) {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

function endOfDay(date: Date) {
  const result = new Date(date)
  result.setHours(23, 59, 59, 999)
  return result
}

function localDateValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function greetingForHour(hour: number) {
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function receiptTime(receipt: Receipt) {
  const date = new Date(receipt.date)
  if (Number.isNaN(date.getTime())) return 'Time unavailable'
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date)
}

export default function Home() {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
  const { currentShop, shops, shopsIsFetching, shopsIsError, refetchShops } = useShop()
  const money = useMemo(() => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'NGN' }), [])
  const [preset, setPreset] = useState<DatePreset>('today')
  const [customFrom, setCustomFrom] = useState(() => localDateValue(new Date()))
  const [customTo, setCustomTo] = useState(() => localDateValue(new Date()))
  const [calendarYear] = useState(() => new Date().getFullYear())

  const range = useMemo(() => {
    const now = new Date()
    if (preset === 'today') {
      return { from: startOfDay(now).toISOString(), to: endOfDay(now).toISOString() }
    }
    if (preset === 'yesterday') {
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      return { from: startOfDay(yesterday).toISOString(), to: endOfDay(yesterday).toISOString() }
    }
    const fromDate = parseLocalDate(customFrom) ?? startOfDay(now)
    const toDate = parseLocalDate(customTo) ?? fromDate
    return { from: startOfDay(fromDate).toISOString(), to: endOfDay(toDate).toISOString() }
  }, [customFrom, customTo, preset])

  const annualRange = useMemo(() => ({
    from: new Date(calendarYear, 0, 1).toISOString(),
    to: new Date(calendarYear, 11, 31, 23, 59, 59, 999).toISOString(),
  }), [calendarYear])

  const rangeLabel = useMemo(() => {
    if (preset === 'today') return 'Today'
    if (preset === 'yesterday') return 'Yesterday'
    return customFrom === customTo ? customFrom : `${customFrom} to ${customTo}`
  }, [customFrom, customTo, preset])

  useEffect(() => {
    if (!isAuthenticated) router.push('/auth/login')
  }, [isAuthenticated, router])

  const skip = !isAuthenticated || !currentShop
  const queryOptions = { skip, refetchOnMountOrArgChange: true }
  const {
    data: revenue,
    isError: revenueIsError,
    refetch: refetchRevenue,
  } = useRevenueQuery({ shopId: currentShop?.id ?? '', ...range }, queryOptions)
  const {
    data: trend = [],
    isError: trendIsError,
    refetch: refetchTrend,
  } = useSalesTrendQuery({ shopId: currentShop?.id ?? '', ...annualRange }, queryOptions)
  const {
    data: paymentBreakdown = [],
    isError: paymentIsError,
    refetch: refetchPaymentBreakdown,
  } = usePaymentBreakdownQuery({ shopId: currentShop?.id ?? '', ...range }, queryOptions)
  const {
    data: receipts = [],
    isError: receiptsIsError,
    refetch: refetchReceipts,
  } = useListReceiptsQuery({ shopId: currentShop?.id ?? '', ...range }, queryOptions)
  const {
    data: products = [],
    isError: productsIsError,
    refetch: refetchProducts,
  } = useListProductsQuery({ shopId: currentShop?.id ?? '' }, queryOptions)

  const lowStockProducts = useMemo(
    () => products.filter((product) => product.quantity <= product.reorderLevel),
    [products],
  )
  const recentReceipts = useMemo(
    () => [...receipts].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5),
    [receipts],
  )
  const monthlySales = useMemo<MonthlySales[]>(() => {
    const valuesByMonth = new Map(trend.map((item) => [item.month, item]))
    return Array.from({ length: 12 }, (_, index) => {
      const month = `${calendarYear}-${String(index + 1).padStart(2, '0')}`
      const value = valuesByMonth.get(month)
      return {
        month: new Intl.DateTimeFormat(undefined, { month: 'short' }).format(new Date(calendarYear, index, 1)),
        totalSales: value?.totalSales ?? 0,
        transactions: value?.transactions ?? 0,
      }
    })
  }, [calendarYear, trend])

  const failedSources = [
    shopsIsError && 'store selection',
    revenueIsError && 'sales summary',
    trendIsError && 'revenue overview',
    paymentIsError && 'payment mix',
    receiptsIsError && 'recent transactions',
    productsIsError && 'inventory',
  ].filter((source): source is string => Boolean(source))
  const hasNoStore = !currentShop && !shopsIsFetching && !shopsIsError && shops.length === 0

  const retryDashboard = () => {
    void Promise.all([
      refetchShops(),
      refetchRevenue(),
      refetchTrend(),
      refetchPaymentBreakdown(),
      refetchReceipts(),
      refetchProducts(),
    ])
  }

  if (!isAuthenticated) return null

  const greeting = greetingForHour(new Date().getHours())
  const firstName = user?.name.trim().split(/\s+/)[0] || 'there'
  const currentDate = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
  const inventoryUnits = products.reduce((total, product) => total + Math.max(0, product.quantity), 0)
  const inStockPercent = products.length
    ? Math.round(((products.length - lowStockProducts.length) / products.length) * 100)
    : 0

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-4 md:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <CalendarDays className="size-3.5" />
            <span>{currentDate}</span>
            {/* {isFetching && (
              <span role="status" className="ml-1 inline-flex items-center gap-1.5 normal-case tracking-normal">
                <RefreshCw className="size-3 animate-spin" />
                Updating
              </span>
            )} */}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {greeting}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening at {currentShop?.name || 'your store'}.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/terminal')}
          className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 sm:self-auto"
        >
          <Plus className="size-4" />
          New sale
        </button>
      </header>

      {failedSources.length > 0 && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm text-foreground">
            Could not refresh {failedSources.join(', ')}. Check your connection or store permissions and try again.
          </p>
          <button
            type="button"
            onClick={retryDashboard}
            className="inline-flex h-8 shrink-0 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-xs font-medium hover:bg-muted"
          >
            <RefreshCw className="size-3.5" />
            Retry
          </button>
        </div>
      )}
      {hasNoStore && (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">Create or join a store to load dashboard data.</p>
          <button
            type="button"
            onClick={() => router.push('/stores')}
            className="inline-flex h-8 shrink-0 items-center justify-center gap-2 rounded-md border border-border px-3 text-xs font-medium hover:bg-muted"
          >
            Go to stores <ArrowRight className="size-3.5" />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {([
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'custom', label: 'By date' },
          ] as const).map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setPreset(option.id)}
              className={cn(
                'whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                preset === option.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-muted',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        {preset === 'custom' && (
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={customFrom}
              onChange={(event) => {
                setCustomFrom(event.target.value)
                if (event.target.value > customTo) setCustomTo(event.target.value)
              }}
              className="h-9 w-[150px]"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="date"
              value={customTo}
              min={customFrom}
              onChange={(event) => setCustomTo(event.target.value)}
              className="h-9 w-[150px]"
            />
          </div>
        )}
      </div>

      <section aria-label="Sales summary" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Revenue"
          value={money.format(revenue?.totalSales ?? 0)}
          icon={TrendingUp}
          description={`Sales recorded ${rangeLabel.toLowerCase()}`}
          iconClassName="bg-blue-500/10"
        />
        <StatCard
          title="Transactions"
          value={revenue?.totalTransactions ?? 0}
          icon={ReceiptText}
          description="Completed sales"
          iconClassName="bg-violet-500/10"
        />
        <StatCard
          title="Average order value"
          value={money.format(revenue?.averageOrderValue ?? 0)}
          icon={ShoppingBag}
          description="Average amount per sale"
          iconClassName="bg-emerald-500/10"
        />
        <StatCard
          title="Low stock"
          value={lowStockProducts.length}
          icon={Package}
          description="Products at or below reorder level"
          iconClassName="bg-amber-500/10"
        />
      </section>

      <section aria-label="Sales analytics" className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
        <RevenueOverview data={monthlySales} />
        <PaymentBreakdownCard data={paymentBreakdown} />
      </section>

      <section aria-label="Store activity" className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
            <div>
              <CardTitle>Recent transactions</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Latest sales for {rangeLabel.toLowerCase()}</p>
            </div>
            <button
              type="button"
              onClick={() => router.push('/receipts')}
              className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              View all <ArrowRight className="size-3.5" />
            </button>
          </CardHeader>
          <CardContent>
            {recentReceipts.length === 0 ? (
              <div className="flex min-h-[210px] flex-col items-center justify-center text-center">
                <ReceiptText className="mb-3 size-8 text-muted-foreground/60" />
                <p className="text-sm font-medium">No transactions yet</p>
                <p className="mt-1 text-xs text-muted-foreground">Sales from this period will appear here.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {recentReceipts.map((receipt) => (
                  <li key={receipt.id} className="flex items-center gap-3 py-3 first:pt-1 last:pb-1">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <ReceiptText className="size-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {receipt.customerName || 'Walk-in customer'}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>#{receipt.id.slice(-8).toUpperCase()}</span>
                        <span aria-hidden="true">·</span>
                        <Clock3 className="size-3" />
                        {receiptTime(receipt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">{money.format(receipt.total)}</p>
                      <p className="text-xs capitalize text-muted-foreground">{receipt.paymentMethod}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
            <div>
              <CardTitle>Inventory health</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Current availability across your catalogue</p>
            </div>
            <button
              type="button"
              onClick={() => router.push('/inventory')}
              className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              View inventory <ArrowRight className="size-3.5" />
            </button>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-semibold tabular-nums">{products.length.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Products tracked</p>
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums">{inventoryUnits.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Units in stock</p>
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Products above reorder level</span>
                <span className="font-medium tabular-nums">{inStockPercent}%</span>
              </div>
              <div
                role="progressbar"
                aria-label="Products above reorder level"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={inStockPercent}
                className="h-2 overflow-hidden rounded-full bg-muted"
              >
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${inStockPercent}%` }} />
              </div>
            </div>
            <div className="border-t border-border pt-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium">Needs attention</p>
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                  {lowStockProducts.length}
                </span>
              </div>
              {lowStockProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground">All products are above their reorder levels.</p>
              ) : (
                <ul className="space-y-2">
                  {lowStockProducts.slice(0, 3).map((product) => (
                    <li key={product.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate">{product.name}</span>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {product.quantity} left
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
