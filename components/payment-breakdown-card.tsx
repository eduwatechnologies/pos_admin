'use client'

import { useMemo } from 'react'
import { Banknote, CreditCard, Landmark, Wallet } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export type PaymentBreakdown = {
  paymentMethod: string
  count: number
  total: number
}

const paymentStyles: Record<string, { color: string; background: string; icon: typeof Wallet }> = {
  cash: { color: 'bg-emerald-500', background: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400', icon: Banknote },
  card: { color: 'bg-blue-500', background: 'bg-blue-500/10 text-blue-700 dark:text-blue-400', icon: CreditCard },
  transfer: { color: 'bg-violet-500', background: 'bg-violet-500/10 text-violet-700 dark:text-violet-400', icon: Landmark },
  other: { color: 'bg-amber-500', background: 'bg-amber-500/10 text-amber-700 dark:text-amber-400', icon: Wallet },
}

function formatMethod(method: string) {
  const normalized = method.toLowerCase()
  return normalized === 'pos' ? 'Card' : normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

export function PaymentBreakdownCard({ data }: { data: PaymentBreakdown[] }) {
  const sortedData = useMemo(() => [...data].sort((a, b) => b.total - a.total), [data])
  const totalTransactions = data.reduce((total, item) => total + item.count, 0)
  const totalRevenue = data.reduce((total, item) => total + item.total, 0)
  const money = useMemo(
    () => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }),
    [],
  )

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Payment mix</CardTitle>
            <CardDescription className="mt-1">How customers paid</CardDescription>
          </div>
          <span className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            {totalTransactions.toLocaleString()} sales
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-xl bg-muted/40 p-4">
          <p className="text-xs font-medium text-muted-foreground">Total collected</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{money.format(totalRevenue)}</p>
          {totalTransactions > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              Across {totalTransactions.toLocaleString()} {totalTransactions === 1 ? 'transaction' : 'transactions'}
            </p>
          )}
        </div>

        {sortedData.length === 0 || totalTransactions === 0 ? (
          <div className="flex min-h-[132px] flex-col items-center justify-center rounded-lg border border-dashed border-border px-4 text-center">
            <Wallet className="mb-2 size-5 text-muted-foreground/70" />
            <p className="text-sm font-medium">No payments recorded</p>
            <p className="mt-1 text-xs text-muted-foreground">Payment activity will show here.</p>
          </div>
        ) : (
          <>
            <div
              role="img"
              aria-label={sortedData.map((item) => {
                const share = totalTransactions > 0 ? Math.round((item.count / totalTransactions) * 100) : 0
                return `${formatMethod(item.paymentMethod)} ${share}%`
              }).join(', ')}
              className="flex h-2.5 overflow-hidden rounded-full bg-muted"
            >
              {sortedData.map((item) => {
                const style = paymentStyles[item.paymentMethod.toLowerCase()] ?? paymentStyles.other
                const share = (item.count / totalTransactions) * 100
                return (
                  <span
                    key={item.paymentMethod}
                    className={`${style.color} first:rounded-l-full last:rounded-r-full`}
                    style={{ width: `${share}%` }}
                  />
                )
              })}
            </div>

            <ul className="space-y-1">
              {sortedData.map((item) => {
                const style = paymentStyles[item.paymentMethod.toLowerCase()] ?? paymentStyles.other
                const Icon = style.icon
                const share = Math.round((item.count / totalTransactions) * 100)
                return (
                  <li key={item.paymentMethod} className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50">
                    <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${style.background}`}>
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{formatMethod(item.paymentMethod)}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {item.count.toLocaleString()} {item.count === 1 ? 'sale' : 'sales'}
                        <span aria-hidden="true"> · </span>
                        {share}%
                      </span>
                    </span>
                    <span className="text-right text-sm font-semibold tabular-nums">{money.format(item.total)}</span>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  )
}
