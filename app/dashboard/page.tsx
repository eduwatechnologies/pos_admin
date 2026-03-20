'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { DashboardCards } from '@/components/dashboard-cards'
import { SalesChart } from '@/components/sales-chart'
import { RecentReceipts } from '@/components/recent-receipts'
import { useShop } from '@/context/shop-context'
import { DailySales, Receipt } from '@/lib/types'
import { useRevenueQuery } from '@/redux/api/analytics-api'
import { useBestSellersQuery } from '@/redux/api/analytics-api'
import { useListReceiptsQuery } from '@/redux/api/receipts-api'
import { useListProductsQuery } from '@/redux/api/products-api'
import { useListCategoriesQuery } from '@/redux/api/categories-api'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type DatePreset = 'today' | 'yesterday' | 'custom'

function parseLocalDate(value: string) {
  const parts = value.split('-').map((p) => Number(p))
  const [y, m, d] = parts
  if (!y || !m || !d) return null
  const date = new Date(y, m - 1, d)
  if (Number.isNaN(date.getTime())) return null
  return date
}

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function endOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

export default function Home() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const { currentShop } = useShop()
  const money = useMemo(() => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'NGN' }), [])

  const [preset, setPreset] = useState<DatePreset>('today')
  const todayStr = useMemo(() => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }, [])
  const [customFrom, setCustomFrom] = useState<string>(todayStr)
  const [customTo, setCustomTo] = useState<string>(todayStr)

  const range = useMemo(() => {
    const now = new Date()
    if (preset === 'today') {
      const from = startOfDay(now)
      const to = endOfDay(now)
      return { from: from.toISOString(), to: to.toISOString() }
    }
    if (preset === 'yesterday') {
      const d = new Date(now)
      d.setDate(d.getDate() - 1)
      const from = startOfDay(d)
      const to = endOfDay(d)
      return { from: from.toISOString(), to: to.toISOString() }
    }
    const fromDate = parseLocalDate(customFrom) ?? startOfDay(now)
    const toDate = parseLocalDate(customTo) ?? fromDate
    const from = startOfDay(fromDate)
    const to = endOfDay(toDate)
    return { from: from.toISOString(), to: to.toISOString() }
  }, [customFrom, customTo, preset])

  const rangeLabel = useMemo(() => {
    if (preset === 'today') return 'Today'
    if (preset === 'yesterday') return 'Yesterday'
    const from = customFrom || todayStr
    const to = customTo || from
    return from === to ? from : `${from} → ${to}`
  }, [customFrom, customTo, preset, todayStr])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, router])

  const skip = !isAuthenticated || !currentShop
  const { data: revenue } = useRevenueQuery(
    { shopId: currentShop?.id ?? '', from: range.from, to: range.to },
    { skip }
  )
  const { data: bestSellers = [] } = useBestSellersQuery(
    { shopId: currentShop?.id ?? '', from: range.from, to: range.to },
    { skip }
  )
  const { data: receipts = [] } = useListReceiptsQuery({ shopId: currentShop?.id ?? '', from: range.from, to: range.to }, { skip })
  const { data: products = [] } = useListProductsQuery({ shopId: currentShop?.id ?? '' }, { skip })
  const { data: categories = [] } = useListCategoriesQuery({ shopId: currentShop?.id ?? '' }, { skip })

  const stats = useMemo(() => {
    const lowStockProducts = products.filter((p) => p.quantity <= p.reorderLevel).length
    return {
      totalSales: revenue?.totalSales ?? 0,
      totalTransactions: revenue?.totalTransactions ?? 0,
      averageOrderValue: revenue?.averageOrderValue ?? 0,
      lowStockProducts,
      categoriesCount: categories.length,
    }
  }, [categories.length, products, revenue?.averageOrderValue, revenue?.totalSales, revenue?.totalTransactions])

  const recentReceipts = useMemo<Receipt[]>(() => {
    return [...receipts].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5)
  }, [receipts])

  const salesTrend = useMemo<DailySales[]>(() => {
    const sorted = [...receipts].sort((a, b) => a.date.getTime() - b.date.getTime())
    const byDay = new Map<string, { sales: number; transactions: number }>()
    sorted.forEach((r) => {
      const d = new Date(r.date)
      d.setHours(0, 0, 0, 0)
      const key = d.toISOString().slice(0, 10)
      const cur = byDay.get(key) ?? { sales: 0, transactions: 0 }
      cur.sales += r.total
      cur.transactions += 1
      byDay.set(key, cur)
    })
    return Array.from(byDay.entries())
      .map(([date, v]) => ({
        date,
        sales: Math.round(v.sales * 100) / 100,
        transactions: v.transactions,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [receipts])

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Sales overview and key performance metrics.</p>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {([
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'custom', label: 'By Date' },
            ] as const).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPreset(p.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                  preset === p.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-muted'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {preset === 'custom' ? (
            <div className="flex items-center gap-2">
              <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="h-9 w-[160px]" />
              <span className="text-xs text-muted-foreground">to</span>
              <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="h-9 w-[160px]" />
            </div>
          ) : null}
        </div>
      </div>

      <DashboardCards
        totalSales={stats.totalSales}
        totalTransactions={stats.totalTransactions}
        averageOrderValue={stats.averageOrderValue}
        lowStockProducts={stats.lowStockProducts}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SalesChart data={salesTrend} title="Revenue Overview" subtitle={rangeLabel} />
        </div>
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Top Selling Products</CardTitle>
            <span className="text-xs text-muted-foreground">Top 5</span>
          </CardHeader>
          <CardContent className="space-y-3">
            {bestSellers.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No sales yet for this period.</div>
            ) : (
              bestSellers.slice(0, 5).map((p, idx) => (
                <div key={`${p.name}-${idx}`} className="flex items-center gap-3">
                  <div className="w-7 text-xs font-mono text-muted-foreground">{String(idx + 1).padStart(2, '0')}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-card-foreground truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.qty} sold</div>
                  </div>
                  <div className="text-sm font-semibold text-card-foreground tabular-nums">{money.format(p.revenue)}</div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <RecentReceipts receipts={recentReceipts} />
    </div>
  )
}
