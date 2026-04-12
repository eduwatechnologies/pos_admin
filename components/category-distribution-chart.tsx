'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from '@/components/ui/chart'

interface CategoryDistributionProps {
  data: { name: string; value: number }[]
  title?: string
  description?: string
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
]

export function CategoryDistributionChart({
  data,
  title = 'Category Distribution',
  description = 'Sales breakdown by product category',
}: CategoryDistributionProps) {
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => b.value - a.value)
  }, [data])

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {}
    sortedData.forEach((item, index) => {
      config[item.name] = {
        label: item.name,
        color: COLORS[index % COLORS.length],
      }
    })
    return config
  }, [sortedData])

  if (data.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
          No data available
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="h-full"
    >
      <Card className="h-full overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full pt-4">
            <ChartContainer config={chartConfig} className="aspect-auto h-full w-full">
              <PieChart>
                <Pie
                  data={sortedData}
                  cx="50%"
                  cy="45%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={1500}
                  strokeWidth={0}
                >
                  {sortedData.map((item, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={chartConfig[item.name]?.color} 
                      className="transition-all duration-300 hover:opacity-80 outline-none"
                    />
                  ))}
                </Pie>
                <ChartTooltip
                  content={
                    <ChartTooltipContent 
                      hideLabel 
                      formatter={(value, name) => (
                        <div className="flex items-center gap-2">
                          <div 
                            className="size-3 rounded-full shadow-sm ring-2 ring-background" 
                            style={{ backgroundColor: chartConfig[name as string]?.color }} 
                          />
                          <span className="font-semibold">{name}:</span>
                          <span className="tabular-nums font-medium">{Number(value).toLocaleString()}</span>
                        </div>
                      )}
                    />
                  }
                />
                <ChartLegend 
                  content={<ChartLegendContent />} 
                  className="mt-4 flex-wrap gap-4"
                />
              </PieChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
