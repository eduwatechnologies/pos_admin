'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { DashboardCards } from '@/components/dashboard-cards'
import { SalesChart } from '@/components/sales-chart'
import { RecentReceipts } from '@/components/recent-receipts'
import { useShop } from '@/context/shop-context'
import { api } from '@/lib/api/client'
import { DailySales, Receipt } from '@/lib/types'

export default function Home() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const { currentShop } = useShop()
  const [stats, setStats] = useState({
    totalSales: 0,
    totalTransactions: 0,
    averageOrderValue: 0,
    lowStockProducts: 0,
  })
  const [recentReceipts, setRecentReceipts] = useState<Receipt[]>([])
  const [salesTrend, setSalesTrend] = useState<DailySales[]>([])

  const todayRange = useMemo(() => {
    const from = new Date()
    from.setHours(0, 0, 0, 0)
    const to = new Date(from)
    to.setDate(to.getDate() + 1)
    return { from: from.toISOString(), to: to.toISOString() }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!isAuthenticated || !currentShop) return
      try {
        const [revenue, receipts, products] = await Promise.all([
          api.analytics.revenue(currentShop.id, todayRange),
          api.receipts.list(currentShop.id),
          api.products.list(currentShop.id),
        ])
        if (cancelled) return

        const lowStockProducts = products.filter(p => p.quantity <= p.reorderLevel).length
        setStats({
          totalSales: revenue.totalSales,
          totalTransactions: revenue.totalTransactions,
          averageOrderValue: revenue.averageOrderValue,
          lowStockProducts,
        })

        const sorted = [...receipts].sort((a, b) => b.date.getTime() - a.date.getTime())
        setRecentReceipts(sorted.slice(0, 5))

        const byDay = new Map<string, { sales: number; transactions: number }>()
        sorted.forEach(r => {
          const d = new Date(r.date)
          d.setHours(0, 0, 0, 0)
          const key = d.toISOString().slice(0, 10)
          const cur = byDay.get(key) ?? { sales: 0, transactions: 0 }
          cur.sales += r.total
          cur.transactions += 1
          byDay.set(key, cur)
        })

        const trend = Array.from(byDay.entries())
          .map(([date, v]) => ({
            date,
            sales: Math.round(v.sales * 100) / 100,
            transactions: v.transactions,
          }))
          .sort((a, b) => a.date.localeCompare(b.date))
        setSalesTrend(trend)
      } catch {
        if (cancelled) return
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [currentShop, isAuthenticated, todayRange])

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Welcome back! Here's your sales overview.</p>
      </div>

      <DashboardCards
        totalSales={stats.totalSales}
        totalTransactions={stats.totalTransactions}
        averageOrderValue={stats.averageOrderValue}
        lowStockProducts={stats.lowStockProducts}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SalesChart data={salesTrend} />
        </div>
        <div>
          {/* Placeholder for sidebar widget */}
        </div>
      </div>

      <RecentReceipts receipts={recentReceipts} />
    </div>
  )
}
