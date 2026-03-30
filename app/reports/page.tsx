'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { useAuth } from '@/context/auth-context'
import { useShop } from '@/context/shop-context'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { SalesChart } from '@/components/sales-chart'
import type { DailySales } from '@/lib/types'
import { useReportSummaryQuery, useSalesByDayQuery, useTopProductsQuery } from '@/redux/api/reports-api'

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

export default function ReportsPage() {
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

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, router])

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

  const skip = !isAuthenticated || !currentShop
  const { data: summary } = useReportSummaryQuery({ shopId: currentShop?.id ?? '', from: range.from, to: range.to }, { skip })
  const { data: byDay = [] } = useSalesByDayQuery({ shopId: currentShop?.id ?? '', from: range.from, to: range.to }, { skip })
  const { data: topProducts = [] } = useTopProductsQuery({ shopId: currentShop?.id ?? '', from: range.from, to: range.to, limit: 10 }, { skip })

  const chartData = useMemo<DailySales[]>(() => {
    return byDay.map((d) => ({
      date: d.date,
      sales: d.netSales,
      transactions: d.transactions,
    }))
  }, [byDay])

  if (!isAuthenticated) return null

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-2">Sales and finance report summary.</p>
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
                  preset === p.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-muted',
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Net Sales</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold tabular-nums">{money.format(summary?.netSales ?? 0)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Expenses</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold tabular-nums">{money.format(summary?.expenses ?? 0)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Net</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold tabular-nums">{money.format(summary?.net ?? 0)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold tabular-nums">{summary?.transactions ?? 0}</CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SalesChart data={chartData} title="Net Sales" subtitle={rangeLabel} />
        </div>
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Top Products</CardTitle>
            <span className="text-xs text-muted-foreground">Top 10</span>
          </CardHeader>
          <CardContent className="space-y-3">
            {topProducts.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No sales for this period.</div>
            ) : (
              topProducts.map((p, idx) => (
                <div key={`${p.name}-${idx}`} className="flex items-center gap-3">
                  <div className="w-7 text-xs font-mono text-muted-foreground">{String(idx + 1).padStart(2, '0')}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-card-foreground truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.qty} net sold</div>
                  </div>
                  <div className="text-sm font-semibold text-card-foreground tabular-nums">{money.format(p.revenue)}</div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

