'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { LucideIcon, TrendingDown, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  trend?: {
    value: number
    label: string
    isPositive: boolean
  }
  className?: string
  iconClassName?: string
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  className,
  iconClassName,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className={cn('overflow-hidden transition-all hover:shadow-md', className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className={cn('rounded-lg bg-primary/10 p-2', iconClassName)}>
              <Icon className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <h2 className="text-3xl font-bold tracking-tight">{value}</h2>
          </div>
          <div className="mt-2 flex items-center space-x-2">
            {trend && (
              <span
                className={cn(
                  'flex items-center text-xs font-medium',
                  trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
                )}
              >
                {trend.isPositive ? (
                  <TrendingUp className="mr-1 h-3 w-3" />
                ) : (
                  <TrendingDown className="mr-1 h-3 w-3" />
                )}
                {trend.isPositive ? '+' : '-'}
                {Math.abs(trend.value)}%
              </span>
            )}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
