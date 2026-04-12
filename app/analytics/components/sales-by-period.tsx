'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

  const chartData = useMemo(() => {
    if (period === 'daily') {
      return data.slice(-30)
    } else if (period === 'weekly') {
      const weeks = []
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
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Sales by Period</CardTitle>
          <div className="flex gap-2">
            {['daily', 'weekly', 'monthly'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p as any)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors capitalize ${
                  period === p
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full pt-4">
          <ChartContainer config={chartConfig} className="aspect-auto h-full w-full">
            <LineChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
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
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(v) => money.format(v)}
                width={75}
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
              <Line
                type="monotone"
                dataKey="sales"
                stroke="var(--color-sales)"
                strokeWidth={3}
                dot={{ 
                  r: 5, 
                  fill: 'hsl(var(--background))', 
                  strokeWidth: 2, 
                  stroke: 'var(--color-sales)',
                  fillOpacity: 1
                }}
                activeDot={{ 
                  r: 7, 
                  strokeWidth: 0,
                  fill: 'var(--color-sales)'
                }}
                animationDuration={1500}
              />
            </LineChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}
