'use client'

import { useMemo, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts'
import { motion } from 'framer-motion'
import { DailySales } from '@/lib/types'
import { format, parseISO } from 'date-fns'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

interface SalesChartProps {
  data: DailySales[]
  title?: string
  subtitle?: string
}

const chartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig

export function SalesChart({ data, title = 'Sales', subtitle }: SalesChartProps) {
  const [period, setPeriod] = useState<'Week' | 'Month' | 'Year'>('Week')

  const money = useMemo(() => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'NGN' }), [])
  const compactMoney = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'NGN',
        notation: 'compact',
        maximumFractionDigits: 1,
      }),
    []
  )

  const chartData = useMemo(() => {
    const safe = Array.isArray(data) ? data : []

    if (period === 'Week') {
      return safe.slice(-7).map((d) => ({
        name: format(parseISO(d.date), 'EEE'),
        revenue: d.sales,
        orders: d.transactions,
      }))
    }

    if (period === 'Month') {
      return safe.slice(-30).map((d) => ({
        name: format(parseISO(d.date), 'MMM d'),
        revenue: d.sales,
        orders: d.transactions,
      }))
    }

    const byMonth = new Map<string, { revenue: number; orders: number; monthDate: Date }>()
    safe.slice(-365).forEach((d) => {
      const dt = parseISO(d.date)
      const key = format(dt, 'yyyy-MM')
      const cur = byMonth.get(key) ?? { revenue: 0, orders: 0, monthDate: new Date(dt.getFullYear(), dt.getMonth(), 1) }
      cur.revenue += d.sales
      cur.orders += d.transactions
      byMonth.set(key, cur)
    })

    return Array.from(byMonth.values())
      .sort((a, b) => a.monthDate.getTime() - b.monthDate.getTime())
      .slice(-12)
      .map((m) => ({
        name: format(m.monthDate, 'MMM'),
        revenue: Math.round(m.revenue * 100) / 100,
        orders: m.orders,
      }))
  }, [data, period])

  const resolvedSubtitle = subtitle ? subtitle : period === 'Week' ? 'Weekly sales performance' : period === 'Month' ? 'Monthly sales performance' : 'Yearly sales performance'
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="bg-card rounded-xl border border-border p-5 shadow-sm"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
        <div className="min-w-0">
          <h3 className="font-semibold text-card-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{resolvedSubtitle}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-1 bg-secondary rounded-lg p-0.5">
          {(['Week', 'Month', 'Year'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                p === period ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">No sales data for this period.</div>
      ) : (
        <div className="h-[320px] w-full pt-4">
          <ChartContainer config={chartConfig} className="aspect-auto h-full w-full">
            <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                vertical={false} 
                opacity={0.4}
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                minTickGap={20}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(v: any) => compactMoney.format(Number(v) || 0)}
                width={65}
                dx={-10}
              />
              <ChartTooltip
                cursor={{ 
                  stroke: 'hsl(var(--border))', 
                  strokeWidth: 2,
                  strokeDasharray: '5 5'
                }}
                content={
                  <ChartTooltipContent
                    indicator="line"
                    formatter={(value: any) => [money.format(Number(value) || 0), 'Revenue']}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--color-revenue)"
                strokeWidth={3}
                fill="url(#revenueGradient)"
                dot={{ 
                  r: 5, 
                  fill: 'hsl(var(--background))', 
                  strokeWidth: 2, 
                  stroke: 'var(--color-revenue)',
                  fillOpacity: 1
                }}
                activeDot={{ 
                  r: 7, 
                  strokeWidth: 0,
                  fill: 'var(--color-revenue)'
                }}
                animationDuration={1500}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      )}
    </motion.div>
  )
}
