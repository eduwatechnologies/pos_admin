'use client'

import { useAuth } from '@/context/auth-context'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RevenueSummary } from './components/revenue-summary'
import { SalesByPeriod } from './components/sales-by-period'
import { BestSellingProducts } from './components/best-selling-products'
import { useShop } from '@/context/shop-context'
import { api } from '@/lib/api/client'
import { DailySales } from '@/lib/types'

export default function AnalyticsPage() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const { currentShop } = useShop()
  const [dailyData, setDailyData] = useState<DailySales[]>([])

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
        const receipts = await api.receipts.list(currentShop.id)
        if (cancelled) return

        const byIsoDay = new Map<string, { sales: number; transactions: number }>()
        receipts.forEach(r => {
          const d = new Date(r.date)
          d.setHours(0, 0, 0, 0)
          const key = d.toISOString().slice(0, 10)
          const cur = byIsoDay.get(key) ?? { sales: 0, transactions: 0 }
          cur.sales += r.total
          cur.transactions += 1
          byIsoDay.set(key, cur)
        })

        const series = Array.from(byIsoDay.entries())
          .map(([date, v]) => ({
            date,
            sales: Math.round(v.sales * 100) / 100,
            transactions: v.transactions,
          }))
          .sort((a, b) => a.date.localeCompare(b.date))

        setDailyData(series)
      } catch {
        if (!cancelled) setDailyData([])
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [currentShop, isAuthenticated])

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-2">Detailed sales insights and performance metrics</p>
      </div>

      <RevenueSummary />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SalesByPeriod data={dailyData} />
        </div>
        <div>
          {/* Placeholder for sidebar content */}
        </div>
      </div>

      <BestSellingProducts />
    </div>
  )
}
