'use client'

import { useMemo } from 'react'
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
import { useBestSellersQuery } from '@/redux/api/analytics-api'

export function BestSellingProducts() {
  const { currentShop } = useShop()
  const money = useMemo(() => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'NGN' }), [])

  const monthRange = useMemo(() => {
    const from = new Date()
    from.setDate(1)
    from.setHours(0, 0, 0, 0)
    const to = new Date()
    to.setHours(23, 59, 59, 999)
    return { from: from.toISOString(), to: to.toISOString() }
  }, [])

  const skip = !currentShop
  const { data = [] } = useBestSellersQuery(
    { shopId: currentShop?.id ?? '', from: monthRange.from, to: monthRange.to },
    { skip }
  )

  const chartData = useMemo(() => {
    return data.slice(0, 10).map((d) => ({
      name: d.name.length > 20 ? d.name.substring(0, 17) + '...' : d.name,
      quantity: d.qty,
      revenue: Math.round(d.revenue * 100) / 100,
    }))
  }, [data])

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
              formatter={(value: any) => money.format(Number(value) || 0)}
            />
            <Bar dataKey="revenue" fill="hsl(var(--chart-1))" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
