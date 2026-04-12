'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

interface SalesByHourProps {
  data: { hour: number; sales: number }[]
  title?: string
  description?: string
}

const chartConfig = {
  sales: {
    label: 'Revenue',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig

export function SalesByHourChart({
  data,
  title = 'Hourly Sales',
  description = 'Revenue distribution by time of day',
}: SalesByHourProps) {
  const chartData = useMemo(() => {
    // Ensure all 24 hours are present
    const fullDay = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      label: `${i % 12 || 12}${i < 12 ? 'AM' : 'PM'}`,
      sales: 0,
    }))

    data.forEach((d) => {
      if (d.hour >= 0 && d.hour < 24) {
        fullDay[d.hour].sales = d.sales
      }
    })

    return fullDay
  }, [data])

  const money = useMemo(() => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'NGN', notation: 'compact' }), [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
    >
      <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full pt-4">
            <ChartContainer config={chartConfig} className="aspect-auto h-full w-full">
              <BarChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  vertical={false} 
                  stroke="hsl(var(--border))" 
                  opacity={0.4}
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  interval={3}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(v) => money.format(v)}
                  width={60}
                  dx={-10}
                />
                <ChartTooltip
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
                  content={
                    <ChartTooltipContent 
                      indicator="dot" 
                      labelFormatter={(value) => `Time: ${value}`}
                      formatter={(value: any) => [
                        new Intl.NumberFormat(undefined, { style: 'currency', currency: 'NGN' }).format(Number(value)),
                        'Revenue'
                      ]}
                    />
                  }
                />
                <Bar 
                  dataKey="sales" 
                  radius={[6, 6, 0, 0]}
                  barSize={20}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.sales > 0 ? 'var(--color-sales)' : 'hsl(var(--muted))'} 
                      fillOpacity={entry.sales > 0 ? 0.9 : 0.3}
                      className="transition-all duration-300 hover:fill-opacity-100"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
