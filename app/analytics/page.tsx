'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUpRight, BarChart3, CalendarDays, RefreshCw } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { useShop } from '@/context/shop-context'
import { RevenueSummary } from './components/revenue-summary'
import { SalesByPeriod } from './components/sales-by-period'
import { BestSellingProducts } from './components/best-selling-products'
import { PaymentBreakdownCard } from '@/components/payment-breakdown-card'
import { DailySales } from '@/lib/types'
import { usePaymentBreakdownQuery } from '@/redux/api/analytics-api'
import { useListReceiptsQuery } from '@/redux/api/receipts-api'

export default function AnalyticsPage() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const { currentShop } = useShop()

  useEffect(() => {
    if (!isAuthenticated) router.push('/auth/login')
  }, [isAuthenticated, router])

  const monthRange = useMemo(() => {
    const now = new Date()
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString(),
    }
  }, [])

  const skip = !isAuthenticated || !currentShop
  const queryOptions = { skip, refetchOnMountOrArgChange: true }
  const {
    data: receipts = [],
    isError: receiptsError,
    isFetching: receiptsFetching,
    refetch: refetchReceipts,
  } = useListReceiptsQuery({ shopId: currentShop?.id ?? '' }, queryOptions)
  const {
    data: paymentBreakdown = [],
    isError: paymentsError,
    isFetching: paymentsFetching,
    refetch: refetchPayments,
  } = usePaymentBreakdownQuery({ shopId: currentShop?.id ?? '', ...monthRange }, queryOptions)

  const dailyData = useMemo<DailySales[]>(() => {
    const byIsoDay = new Map<string, { sales: number; transactions: number }>()
    receipts.forEach((receipt) => {
      const date = new Date(receipt.date)
      if (Number.isNaN(date.getTime())) return
      date.setHours(0, 0, 0, 0)
      const key = date.toISOString().slice(0, 10)
      const current = byIsoDay.get(key) ?? { sales: 0, transactions: 0 }
      current.sales += receipt.total
      current.transactions += 1
      byIsoDay.set(key, current)
    })

    return Array.from(byIsoDay.entries())
      .map(([date, value]) => ({
        date,
        sales: Math.round(value.sales * 100) / 100,
        transactions: value.transactions,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [receipts])

  if (!isAuthenticated) return null

  const monthLabel = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(new Date())
  const isFetching = receiptsFetching || paymentsFetching
  const retryAnalytics = () => {
    void Promise.all([refetchReceipts(), refetchPayments()])
  }

  return (
    <main className="mx-auto max-w-[1600px] space-y-7 p-4 md:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <CalendarDays className="size-3.5" />
            <span>{monthLabel}</span>
            {isFetching && <span className="normal-case tracking-normal">· Refreshing data</span>}
          </div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            <BarChart3 className="size-7 text-primary" />
            Analytics
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Understand sales performance and what&apos;s driving your business.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg border border-border bg-card px-4 text-sm font-medium transition-colors hover:bg-muted sm:self-auto"
        >
          Back to dashboard <ArrowUpRight className="size-4" />
        </button>
      </header>

      {(receiptsError || paymentsError) && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm">
            Could not refresh {[
              receiptsError && 'sales history',
              paymentsError && 'payment breakdown',
            ].filter(Boolean).join(' and ')}. Check your connection or store permissions and try again.
          </p>
          <button
            type="button"
            onClick={retryAnalytics}
            className="inline-flex h-8 shrink-0 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-xs font-medium hover:bg-muted"
          >
            <RefreshCw className="size-3.5" />
            Retry
          </button>
        </div>
      )}

      <section aria-label="Revenue summary" className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold">Revenue snapshot</h2>
          <p className="mt-1 text-xs text-muted-foreground">Sales at a glance across today, this week, and this month.</p>
        </div>
        <RevenueSummary />
      </section>

      <section aria-label="Sales trends and payment methods" className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(340px,1fr)]">
        <SalesByPeriod data={dailyData} />
        <PaymentBreakdownCard data={paymentBreakdown} />
      </section>

      <section aria-label="Product performance" className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold">Product performance</h2>
          <p className="mt-1 text-xs text-muted-foreground">The products contributing the most revenue this month.</p>
        </div>
        <BestSellingProducts />
      </section>
    </main>
  )
}
