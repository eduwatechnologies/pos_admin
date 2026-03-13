'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useShop } from '@/context/shop-context'
import { api } from '@/lib/api/client'

export function BestSellingProducts() {
  const { currentShop } = useShop()
  const [items, setItems] = useState<Array<{ name: string; quantity: number; revenue: number }>>([])

  const monthRange = useMemo(() => {
    const from = new Date()
    from.setDate(1)
    from.setHours(0, 0, 0, 0)
    const to = new Date()
    to.setHours(23, 59, 59, 999)
    return { from: from.toISOString(), to: to.toISOString() }
  }, [])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!currentShop) return
      try {
        const data = await api.analytics.bestSellers(currentShop.id, monthRange)
        if (cancelled) return
        setItems(
          data.slice(0, 10).map(d => ({
            name: d.name.length > 20 ? d.name.substring(0, 17) + '...' : d.name,
            quantity: d.qty,
            revenue: Math.round(d.revenue * 100) / 100,
          }))
        )
      } catch {
        if (!cancelled) setItems([])
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [currentShop, monthRange])

  const chartData = useMemo(() => items, [items])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Best Selling Products (Top 10)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              stroke="currentColor"
              style={{ fontSize: '0.75rem' }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis stroke="currentColor" style={{ fontSize: '0.875rem' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
              }}
              formatter={(value: number) => `$${value.toFixed(2)}`}
            />
            <Bar dataKey="revenue" fill="hsl(var(--chart-1))" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
