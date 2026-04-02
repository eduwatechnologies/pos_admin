'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Receipt } from '@/lib/types'
import { Receipt as ReceiptIcon } from 'lucide-react'

interface RecentReceiptsProps {
  receipts: Receipt[]
}

export function RecentReceipts({ receipts }: RecentReceiptsProps) {
  const money = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'NGN' })
  const paymentStyles: Record<string, string> = {
    cash: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    card: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
    transfer: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
    other: 'bg-muted text-muted-foreground',
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Recent Transactions</CardTitle>
        <span className="text-xs text-muted-foreground">{receipts.length}</span>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Receipt
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Date
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Customer
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Items
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Total
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Payment
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {receipts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">
                      No transactions yet for this period.
                    </td>
                  </tr>
                ) : (
                  receipts.map((receipt) => {
                    const paymentKey = String(receipt.paymentMethod ?? '').toLowerCase()
                    const pill = paymentStyles[paymentKey] ?? 'bg-muted text-muted-foreground'
                    return (
                      <tr key={receipt.id} className="transition-colors hover:bg-muted/50">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                              <ReceiptIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <span className="text-sm font-mono text-card-foreground">{receipt.id}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-muted-foreground">
                          {receipt.date.toLocaleDateString()} {receipt.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-muted-foreground">
                          {receipt.customerName ? receipt.customerName : 'Walk-in'}
                        </td>
                        <td className="px-5 py-3.5 text-right text-sm text-card-foreground tabular-nums">
                          {receipt.items.length}
                        </td>
                        <td className="px-5 py-3.5 text-right text-sm font-semibold text-card-foreground tabular-nums">
                          {money.format(receipt.total)}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium capitalize', pill)}>
                            {paymentKey || 'n/a'}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
