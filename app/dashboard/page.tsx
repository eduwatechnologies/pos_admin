'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { StatCard } from '@/components/stat-card'
import { SalesChart } from '@/components/sales-chart'
import { CategoryDistributionChart } from '@/components/category-distribution-chart'
import { SalesByHourChart } from '@/components/sales-by-hour-chart'
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
import { DollarSign, ShoppingCart, TrendingUp, Package, Layers } from 'lucide-react'

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

  const categoryDistribution = useMemo(() => {
    const byCategory = new Map<string, number>()
    receipts.forEach((r) => {
      r.items.forEach((item) => {
        // Find product to get its category
        const product = products.find((p) => p.id === item.productId)
        const cat = product?.category || 'General'
        byCategory.set(cat, (byCategory.get(cat) || 0) + item.subtotal)
      })
    })
    return Array.from(byCategory.entries())
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value)
  }, [products, receipts])

  const hourlySales = useMemo(() => {
    const byHour = new Map<number, number>()
    receipts.forEach((r) => {
      const hour = new Date(r.date).getHours()
      byHour.set(hour, (byHour.get(hour) || 0) + r.total)
    })
    return Array.from(byHour.entries()).map(([hour, sales]) => ({
      hour,
      sales: Math.round(sales * 100) / 100,
    }))
  }, [receipts])

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={money.format(stats.totalSales)}
          icon={DollarSign}
          description="Total sales in this period"
          trend={{ value: 12, label: 'from last period', isPositive: true }}
        />
        <StatCard
          title="Transactions"
          value={stats.totalTransactions}
          icon={ShoppingCart}
          description="Completed orders"
          trend={{ value: 8, label: 'from last period', isPositive: true }}
        />
        <StatCard
          title="Avg Order Value"
          value={money.format(stats.averageOrderValue)}
          icon={TrendingUp}
          description="Average spent per order"
          trend={{ value: 2, label: 'from last period', isPositive: false }}
        />
        <StatCard
          title="Low Stock"
          value={stats.lowStockProducts}
          icon={Package}
          description="Products needing restock"
          iconClassName="bg-amber-500/10"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
        <div className="lg:col-span-2 space-y-6">
          <SalesChart data={salesTrend} title="Revenue Overview" subtitle={rangeLabel} />
          
        </div>
        <div className="space-y-6 lg:self-start">
          
          <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold">Top Selling Products</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-4">
                {bestSellers.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">No sales yet for this period.</div>
                ) : (
                  bestSellers.slice(0, 5).map((p, idx) => (
                    <div key={`${p.name}-${idx}`} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-card-foreground truncate">{p.name}</div>
                        <div className="text-[11px] text-muted-foreground">{p.qty} units sold</div>
                      </div>
                      <div className="text-sm font-semibold text-card-foreground tabular-nums">
                        {money.format(p.revenue)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <RecentReceipts receipts={recentReceipts} />
    </div>
  )
}
