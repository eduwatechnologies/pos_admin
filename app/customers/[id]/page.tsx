'use client'

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { useAuth } from '@/context/auth-context'
import { useShop } from '@/context/shop-context'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useGetCustomerActivityQuery } from '@/redux/api/customers-api'

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const customerId = params.id as string
  const { isAuthenticated } = useAuth()
  const { currentShop } = useShop()
  const { toast } = useToast()
  const money = useMemo(() => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'NGN' }), [])

  useEffect(() => {
    if (!isAuthenticated) router.push('/auth/login')
  }, [isAuthenticated, router])

  const skip = !isAuthenticated || !currentShop || !customerId
  const { data, error, isLoading } = useGetCustomerActivityQuery(
    { shopId: currentShop?.id ?? '', customerId },
    { skip },
  )

  useEffect(() => {
    if (!error) return
    toast({ title: 'Error', description: 'Failed to load customer activity', variant: 'destructive' })
  }, [error, toast])

  const customer = data?.customer ?? null
  const receipts = data?.receipts ?? []
  const summary = data?.summary ?? { totalOrders: 0, totalSpent: 0, refundedCount: 0 }

  const averageOrderValue = useMemo(() => {
    if (!summary.totalOrders) return 0
    return summary.totalSpent / summary.totalOrders
  }, [summary.totalOrders, summary.totalSpent])

  if (!isAuthenticated) return null

  if (!customer && !isLoading) {
    return (
      <div className="space-y-8 p-4 md:p-8">
        <div className="flex items-center gap-4">
          <Link href="/customers" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Customer Not Found</h1>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <Link href="/customers" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{customer?.name ?? 'Customer'}</h1>
            <p className="text-muted-foreground mt-1">
              {customer?.email ?? '—'} • {customer?.phone ?? '—'}
            </p>
          </div>
        </div>

        <Button type="button" variant="outline" onClick={() => router.push('/receipts')}>
          View All Receipts
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{money.format(summary.totalSpent)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Order</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{money.format(averageOrderValue)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">{customer?.isActive ? 'Active' : 'Inactive'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Last Purchase</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">{summary.lastPurchaseAt ? new Date(summary.lastPurchaseAt).toLocaleString() : '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Address</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">{customer?.address ?? '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm whitespace-pre-wrap">{customer?.notes ?? '—'}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Receipt</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Payment</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {receipts.slice(0, 100).map((r) => (
                  <tr key={r.id} className="hover:bg-muted/50">
                    <td className="px-3 py-2 text-sm">{new Date(r.date).toLocaleString()}</td>
                    <td className="px-3 py-2 text-sm font-mono">{r.id}</td>
                    <td className="px-3 py-2 text-sm capitalize">{String(r.paymentMethod ?? '—')}</td>
                    <td className="px-3 py-2 text-sm capitalize">{String(r.status ?? 'paid')}</td>
                    <td className="px-3 py-2 text-right text-sm font-medium">{money.format(r.total)}</td>
                  </tr>
                ))}
                {!receipts.length ? (
                  <tr>
                    <td className="px-3 py-4 text-sm text-muted-foreground" colSpan={5}>
                      No transactions found for this customer yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="mt-3 text-xs text-muted-foreground">
            Refunds: {summary.refundedCount}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

