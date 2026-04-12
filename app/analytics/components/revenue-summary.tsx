'use client'

import { useMemo } from 'react'
import { TrendingUp, Users, ShoppingCart, DollarSign } from 'lucide-react'
import { useShop } from '@/context/shop-context'
import { useRevenueQuery } from '@/redux/api/analytics-api'
import { StatCard } from '@/components/stat-card'

export function RevenueSummary() {
  const { currentShop } = useShop()
  const money = useMemo(() => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'NGN' }), [])

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

  const skip = !currentShop
  const { data: todayStats } = useRevenueQuery(
    { shopId: currentShop?.id ?? '', from: ranges.today.from, to: ranges.today.to },
    { skip }
  )
  const { data: weekStats } = useRevenueQuery(
    { shopId: currentShop?.id ?? '', from: ranges.week.from, to: ranges.week.to },
    { skip }
  )
  const { data: monthStats } = useRevenueQuery(
    { shopId: currentShop?.id ?? '', from: ranges.month.from, to: ranges.month.to },
    { skip }
  )

  const stats = {
    today: {
      revenue: todayStats?.totalSales ?? 0,
      transactions: todayStats?.totalTransactions ?? 0,
      avgOrder: todayStats?.averageOrderValue ?? 0,
    },
    week: {
      revenue: weekStats?.totalSales ?? 0,
      transactions: weekStats?.totalTransactions ?? 0,
      avgOrder: weekStats?.averageOrderValue ?? 0,
    },
    month: {
      revenue: monthStats?.totalSales ?? 0,
      transactions: monthStats?.totalTransactions ?? 0,
      avgOrder: monthStats?.averageOrderValue ?? 0,
    },
  }

  const summaryCards = [
    {
      title: "Today's Revenue",
      value: money.format(stats.today.revenue),
      subtitle: `${stats.today.transactions} transactions`,
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      title: "This Week's Revenue",
      value: money.format(stats.week.revenue),
      subtitle: `${stats.week.transactions} transactions`,
      icon: TrendingUp,
      color: 'text-blue-600',
    },
    {
      title: "This Month's Revenue",
      value: money.format(stats.month.revenue),
      subtitle: `${stats.month.transactions} transactions`,
      icon: ShoppingCart,
      color: 'text-purple-600',
    },
    {
      title: 'Average Order Value',
      value: money.format(stats.month.avgOrder),
      subtitle: `Monthly average`,
      icon: Users,
      color: 'text-orange-600',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {summaryCards.map((card) => (
        <StatCard
          key={card.title}
          title={card.title}
          value={card.value}
          icon={card.icon}
          description={card.subtitle}
          iconClassName={card.color.replace('text-', 'bg-').replace('-600', '-600/10')}
        />
      ))}
    </div>
  )
}
