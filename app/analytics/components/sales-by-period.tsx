'use client'

import { useState, useMemo } from 'react'
import { TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { DailySales } from '@/lib/types'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

interface SalesByPeriodProps {
  data: DailySales[]
}

const chartConfig = {
  sales: {
    label: 'Revenue',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig

export function SalesByPeriod({ data }: SalesByPeriodProps) {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const money = useMemo(() => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'NGN' }), [])
  const periodOptions = ['daily', 'weekly', 'monthly'] as const

  const chartData = useMemo(() => {
    if (period === 'daily') {
      return data.slice(-30)
    } else if (period === 'weekly') {
      const weeks: { date: string; sales: number; transactions: number }[] = []
      for (let i = 0; i < Math.ceil(data.length / 7); i++) {
        const weekData = data.slice(i * 7, (i + 1) * 7)
        const weekSales = weekData.reduce((sum, d) => sum + d.sales, 0)
        const weekTransactions = weekData.reduce((sum, d) => sum + d.transactions, 0)
        weeks.push({
          date: `Week ${i + 1}`,
          sales: Math.round(weekSales * 100) / 100,
          transactions: weekTransactions,
        })
      }
      return weeks.slice(-12)
    } else {
      // Monthly
      const months: Record<string, { sales: number; transactions: number }> = {}
      data.forEach(d => {
        const [year, month] = d.date.split('-')
        const monthKey = `${year}-${month}`
        if (!months[monthKey]) {
          months[monthKey] = { sales: 0, transactions: 0 }
        }
        months[monthKey].sales += d.sales
        months[monthKey].transactions += d.transactions
      })
      return Object.entries(months).map(([date, data]) => ({
        date,
        sales: Math.round(data.sales * 100) / 100,
        transactions: data.transactions,
      }))
    }
  }, [data, period])

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Sales trends</CardTitle>
          <CardDescription className="mt-1">Revenue and transaction activity over time</CardDescription>
        </div>
        <div className="flex w-fit gap-1 rounded-lg bg-muted p-1">
          {periodOptions.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              aria-pressed={period === p}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors capitalize ${
                period === p
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex h-[320px] flex-col items-center justify-center text-center">
            <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-primary/10">
              <TrendingUp className="size-5 text-primary" />
            </div>
            <p className="text-sm font-medium">No sales activity yet</p>
            <p className="mt-1 max-w-[250px] text-xs text-muted-foreground">
              Sales trends will appear here once your store has completed transactions.
            </p>
          </div>
        ) : (
          <div className="h-[320px] w-full pt-3">
            <ChartContainer config={chartConfig} className="aspect-auto h-full w-full">
              <LineChart data={chartData} margin={{ top: 16, right: 12, left: 4, bottom: 8 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                  opacity={0.4}
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  minTickGap={20}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => money.format(value)}
                  width={75}
                  dx={-8}
                />
                <ChartTooltip
                  cursor={{
                    stroke: 'hsl(var(--border))',
                    strokeWidth: 2,
                    strokeDasharray: '5 5',
                  }}
                  content={
                    <ChartTooltipContent
                      indicator="line"
                      formatter={(value) => [money.format(Number(value) || 0), 'Revenue']}
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="var(--color-sales)"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: 'hsl(var(--background))',
                    strokeWidth: 2,
                    stroke: 'var(--color-sales)',
                  }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--color-sales)' }}
                  animationDuration={900}
                />
              </LineChart>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
