'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Users, ShoppingCart, DollarSign } from 'lucide-react'
import { useShop } from '@/context/shop-context'
import { api } from '@/lib/api/client'

export function RevenueSummary() {
  const { currentShop } = useShop()
  const [stats, setStats] = useState({
    today: { revenue: 0, transactions: 0, avgOrder: 0 },
    week: { revenue: 0, transactions: 0, avgOrder: 0 },
    month: { revenue: 0, transactions: 0, avgOrder: 0 },
  })

  const ranges = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const thisWeekStart = new Date(today)
    thisWeekStart.setDate(today.getDate() - today.getDay())

    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)

    return {
      today: { from: today.toISOString(), to: tomorrow.toISOString() },
      week: { from: thisWeekStart.toISOString(), to: tomorrow.toISOString() },
      month: { from: thisMonthStart.toISOString(), to: tomorrow.toISOString() },
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!currentShop) return
      try {
        const [today, week, month] = await Promise.all([
          api.analytics.revenue(currentShop.id, ranges.today),
          api.analytics.revenue(currentShop.id, ranges.week),
          api.analytics.revenue(currentShop.id, ranges.month),
        ])
        if (cancelled) return
        setStats({
          today: {
            revenue: today.totalSales,
            transactions: today.totalTransactions,
            avgOrder: today.averageOrderValue,
          },
          week: {
            revenue: week.totalSales,
            transactions: week.totalTransactions,
            avgOrder: week.averageOrderValue,
          },
          month: {
            revenue: month.totalSales,
            transactions: month.totalTransactions,
            avgOrder: month.averageOrderValue,
          },
        })
      } catch {
        if (cancelled) return
        setStats({
          today: { revenue: 0, transactions: 0, avgOrder: 0 },
          week: { revenue: 0, transactions: 0, avgOrder: 0 },
          month: { revenue: 0, transactions: 0, avgOrder: 0 },
        })
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [currentShop, ranges])

  const summaryCards = [
    {
      title: "Today's Revenue",
      value: `$${stats.today.revenue.toFixed(2)}`,
      subtitle: `${stats.today.transactions} transactions`,
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      title: "This Week's Revenue",
      value: `$${stats.week.revenue.toFixed(2)}`,
      subtitle: `${stats.week.transactions} transactions`,
      icon: TrendingUp,
      color: 'text-blue-600',
    },
    {
      title: "This Month's Revenue",
      value: `$${stats.month.revenue.toFixed(2)}`,
      subtitle: `${stats.month.transactions} transactions`,
      icon: ShoppingCart,
      color: 'text-purple-600',
    },
    {
      title: 'Average Order Value',
      value: `$${stats.month.avgOrder.toFixed(2)}`,
      subtitle: `Monthly average`,
      icon: Users,
      color: 'text-orange-600',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {summaryCards.map(card => {
        const Icon = card.icon
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.subtitle}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
