'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { DailySales } from '@/lib/types'

interface SalesByPeriodProps {
  data: DailySales[]
}

export function SalesByPeriod({ data }: SalesByPeriodProps) {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')

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
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke="currentColor" style={{ fontSize: '0.875rem' }} />
            <YAxis stroke="currentColor" style={{ fontSize: '0.875rem' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
              }}
              formatter={(value: number) => `$${value.toFixed(2)}`}
            />
            <Line
              type="monotone"
              dataKey="sales"
              stroke="hsl(var(--primary))"
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
