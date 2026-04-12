'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { motion } from 'framer-motion'
import { useShop } from '@/context/shop-context'
import { useBestSellersQuery } from '@/redux/api/analytics-api'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

const chartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig

export function BestSellingProducts() {
  const { currentShop } = useShop()
  const money = useMemo(() => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'NGN', notation: 'compact' }), [])

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
    return data.slice(0, 8).map((d) => ({
      name: d.name.length > 15 ? d.name.substring(0, 12) + '...' : d.name,
      fullName: d.name,
      quantity: d.qty,
      revenue: Math.round(d.revenue * 100) / 100,
    }))
  }, [data])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.6 }}
    >
      <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle>Top Selling Products</CardTitle>
          <p className="text-xs text-muted-foreground">Highest revenue generating items this month</p>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full pt-4">
            <ChartContainer config={chartConfig} className="aspect-auto h-full w-full">
              <BarChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 60 }}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  vertical={false} 
                  stroke="hsl(var(--border))" 
                  opacity={0.4}
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                  dy={15}
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
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      labelFormatter={(_, payload) => payload[0]?.payload?.fullName || ''}
                      formatter={(value: any, name: any, props: any) => [
                        money.format(Number(value) || 0),
                        `Revenue (${props.payload.quantity} sold)`
                      ]}
                    />
                  }
                />
                <Bar 
                  dataKey="revenue" 
                  radius={[6, 6, 0, 0]} 
                  fill="var(--color-revenue)" 
                  fillOpacity={0.9} 
                  barSize={32}
                  className="transition-all duration-300 hover:fill-opacity-100"
                />
              </BarChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
