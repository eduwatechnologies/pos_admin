'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export type MonthlySales = {
  month: string
  totalSales: number
  transactions: number
}

const chartConfig = {
  totalSales: {
    label: 'Revenue',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig

const money = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'NGN',
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function RevenueOverview({ data }: { data: MonthlySales[] }) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Revenue overview</CardTitle>
          <CardDescription>Monthly sales this year</CardDescription>
        </div>
        <span className="shrink-0 rounded-md bg-secondary px-2.5 py-1.5 text-xs font-medium text-secondary-foreground">
          This year
        </span>
      </CardHeader>
      <CardContent>
        {data.length === 0 || data.every((item) => item.totalSales <= 0) ? (
          <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
            No revenue data for this year yet.
          </div>
        ) : (
          <div className="h-[250px] w-full">
            <ChartContainer config={chartConfig} className="aspect-auto h-full w-full">
              <BarChart data={data} margin={{ top: 12, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value: number) => money.format(value)}
                  width={64}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => [new Intl.NumberFormat(undefined, {
                        style: 'currency',
                        currency: 'NGN',
                      }).format(Number(value) || 0), 'Revenue']}
                    />
                  }
                />
                <Bar dataKey="totalSales" fill="var(--color-totalSales)" radius={[5, 5, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
