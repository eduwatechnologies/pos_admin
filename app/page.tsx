'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart3, Folder, Package, Receipt, ShoppingCart, StoreIcon, TrendingUp, Users, DollarSign } from 'lucide-react'

import { StatCard } from '@/components/stat-card'
import { RecentReceipts } from '@/components/recent-receipts'
import { SalesChart } from '@/components/sales-chart'
import { Button } from '@/components/ui/button'
import type { DailySales, Receipt } from '@/lib/types'
import { useAuth } from '@/context/auth-context'

const demoSales: DailySales[] = [
  { date: '2026-03-28', sales: 125000, transactions: 28 },
  { date: '2026-03-29', sales: 98000, transactions: 21 },
  { date: '2026-03-30', sales: 141500, transactions: 33 },
  { date: '2026-03-31', sales: 162000, transactions: 37 },
  { date: '2026-04-01', sales: 154500, transactions: 35 },
  { date: '2026-04-02', sales: 189000, transactions: 41 },
  { date: '2026-04-03', sales: 173000, transactions: 39 },
]

const demoReceipts: Receipt[] = [
  {
    id: 'RCP-1042',
    date: new Date('2026-04-03T09:41:00.000Z'),
    customerName: 'Walk-in',
    items: [
      { productId: 'p1', productName: 'Milo Sachet', quantity: 2, unitPrice: 250, subtotal: 500 },
      { productId: 'p2', productName: 'Peak Milk', quantity: 1, unitPrice: 1200, subtotal: 1200 },
    ],
    subtotal: 1700,
    tax: 0,
    total: 1700,
    paymentMethod: 'cash',
    cashierId: 'u1',
    cashierName: 'Amina',
  },
  {
    id: 'RCP-1041',
    date: new Date('2026-04-03T08:55:00.000Z'),
    customerName: 'Chinedu',
    items: [{ productId: 'p3', productName: 'Detergent', quantity: 1, unitPrice: 3500, subtotal: 3500 }],
    subtotal: 3500,
    tax: 0,
    total: 3500,
    paymentMethod: 'transfer',
    cashierId: 'u2',
    cashierName: 'Sodiq',
  },
  {
    id: 'RCP-1039',
    date: new Date('2026-04-02T18:10:00.000Z'),
    customerName: 'Walk-in',
    items: [{ productId: 'p4', productName: 'Bread', quantity: 3, unitPrice: 900, subtotal: 2700 }],
    subtotal: 2700,
    tax: 0,
    total: 2700,
    paymentMethod: 'card',
    cashierId: 'u1',
    cashierName: 'Amina',
  },
]

export default function Home() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) return
    router.replace('/dashboard')
  }, [isAuthenticated, router])

  if (isAuthenticated) return null

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <StoreIcon className="size-5" />
            </span>
            <div className="text-sm font-semibold text-foreground">BillScan POS</div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="h-9 px-3">
              <Link href="/auth/login">Login</Link>
            </Button>
            <Button asChild className="h-9 px-4">
              <Link href="/auth/register">Create account</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="px-4 py-12 md:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <section className="mx-auto max-w-3xl space-y-6 text-center">
            <div className="inline-flex items-center justify-center rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
              Sales • Inventory • Receipts • Staff
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">BillScan POS Dashboard</h1>
              <p className="text-base text-muted-foreground md:text-lg">
                Run your store in one place. Track sales, manage inventory, print receipts, and monitor staff performance — fast.
              </p>
            </div>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild className="h-11 px-6">
                <Link href="/auth/register">Start free trial</Link>
              </Button>
              <Button asChild variant="outline" className="h-11 px-6">
                <Link href="/auth/login">Go to login</Link>
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-card p-4 text-left">
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                    <ShoppingCart className="size-4" />
                  </span>
                  <div className="text-sm font-medium text-card-foreground">Fast checkout</div>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">Barcode scan + quick cart</div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 text-left">
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600">
                    <Package className="size-4" />
                  </span>
                  <div className="text-sm font-medium text-card-foreground">Inventory control</div>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">Low stock alerts + purchases</div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 text-left">
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600">
                    <TrendingUp className="size-4" />
                  </span>
                  <div className="text-sm font-medium text-card-foreground">Insights</div>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">Sales trends + best sellers</div>
              </div>
            </div>
          </section>

          <div className="mt-16 space-y-16">
            <section className="space-y-6">
              <div className="rounded-2xl border border-border bg-background shadow-sm">
                <div className="border-b border-border px-5 py-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="size-4 text-muted-foreground" />
                    <div className="text-sm font-semibold">Dashboard preview</div>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">Example view of your store performance.</div>
                </div>
                <div className="space-y-5 p-5">
                  <DashboardCards
                    totalSales={demoSales.reduce((a, b) => a + b.sales, 0)}
                    totalTransactions={234}
                    averageOrderValue={4200}
                    lowStockProducts={8}
                  />
                  <div className="grid gap-5 lg:grid-cols-5">
                    <div className="lg:col-span-3">
                      <SalesChart data={demoSales} title="Sales" subtitle="Weekly sales performance" />
                    </div>
                    <div className="lg:col-span-2">
                      <RecentReceipts receipts={demoReceipts} />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Features</div>
                <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Everything you need to run daily operations</h2>
                <p className="text-sm text-muted-foreground md:text-base">
                  Built for fast checkout, accurate stock, and clear visibility into performance.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                      <ShoppingCart className="size-4" />
                    </span>
                    <div className="text-sm font-semibold text-card-foreground">POS Terminal</div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">Scan products, apply tax, take cash/card/transfer.</div>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex size-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600">
                      <Package className="size-4" />
                    </span>
                    <div className="text-sm font-semibold text-card-foreground">Inventory & Categories</div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">Track quantities, reorder levels, and product pricing.</div>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex size-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600">
                      <Receipt className="size-4" />
                    </span>
                    <div className="text-sm font-semibold text-card-foreground">Receipts</div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">Print receipts, view history, and handle refunds.</div>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex size-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
                      <Users className="size-4" />
                    </span>
                    <div className="text-sm font-semibold text-card-foreground">Customers</div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">Keep customer records and improve repeat sales.</div>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex size-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
                      <Users className="size-4" />
                    </span>
                    <div className="text-sm font-semibold text-card-foreground">Employees</div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">Create staff accounts, roles, and performance overview.</div>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                      <BarChart3 className="size-4" />
                    </span>
                    <div className="text-sm font-semibold text-card-foreground">Reports & Analytics</div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">Understand trends, best sellers, and daily performance.</div>
                </div>
              </div>
            </section>

          <section className="grid gap-8 rounded-2xl border border-border bg-muted/30 p-6 md:grid-cols-3 md:items-center md:p-10">
            <div className="md:col-span-1">
              <div className="text-sm font-medium text-muted-foreground">How it works</div>
              <div className="mt-2 text-2xl font-semibold tracking-tight">Start selling in minutes</div>
              <div className="mt-2 text-sm text-muted-foreground">
                Create your store, add products, then begin checkout on the terminal.
              </div>
            </div>
            <div className="grid gap-4 md:col-span-2 md:grid-cols-3">
              <div className="rounded-2xl border border-border bg-background p-5">
                <div className="flex items-center gap-2">
                  <StoreIcon className="size-4 text-muted-foreground" />
                  <div className="text-sm font-semibold">1. Create store</div>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">Sign up and setup your shop profile.</div>
              </div>
              <div className="rounded-2xl border border-border bg-background p-5">
                <div className="flex items-center gap-2">
                  <Package className="size-4 text-muted-foreground" />
                  <div className="text-sm font-semibold">2. Add inventory</div>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">Products, categories, stock and prices.</div>
              </div>
              <div className="rounded-2xl border border-border bg-background p-5">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="size-4 text-muted-foreground" />
                  <div className="text-sm font-semibold">3. Start checkout</div>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">Scan items, take payment, print receipt.</div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Pricing</div>
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Simple plans that scale with you</h2>
              <p className="text-sm text-muted-foreground md:text-base">Start small and upgrade when you need more terminals and staff.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="text-sm font-semibold">Starter</div>
                <div className="mt-2 text-3xl font-semibold">₦3,000</div>
                <div className="mt-1 text-sm text-muted-foreground">Best for single counter shops.</div>
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <div>1 terminal</div>
                  <div>2 staff</div>
                  <div>Basic reports</div>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6 ring-1 ring-primary/20">
                <div className="text-sm font-semibold">Growth</div>
                <div className="mt-2 text-3xl font-semibold">₦5,000</div>
                <div className="mt-1 text-sm text-muted-foreground">Most popular for busy stores.</div>
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <div>2 terminals</div>
                  <div>6 staff</div>
                  <div>Advanced reports</div>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="text-sm font-semibold">Pro</div>
                <div className="mt-2 text-3xl font-semibold">₦10,000</div>
                <div className="mt-1 text-sm text-muted-foreground">For multi-branch businesses.</div>
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <div>Up to 5 terminals</div>
                  <div>Up to 15 staff</div>
                  <div>Priority support</div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="h-11 px-6">
                <Link href="/auth/register">Start free trial</Link>
              </Button>
              <Button asChild variant="outline" className="h-11 px-6">
                <Link href="/auth/login">Go to login</Link>
              </Button>
            </div>
          </section>

          <section className="space-y-6">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">FAQ</div>
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Common questions</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="text-sm font-semibold">Can I add more staff later?</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Yes. Upgrade your plan anytime to increase your staff and terminal limits.
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="text-sm font-semibold">Do you support cash and transfers?</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Yes. You can record cash, card, and bank transfer sales from the terminal.
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="text-sm font-semibold">Can I track low stock?</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Yes. Set reorder levels per product and see low stock alerts on the dashboard.
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="text-sm font-semibold">Is my data safe?</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Your account is protected with authentication, and access can be controlled per role.
                </div>
              </div>
            </div>
          </section>

          <footer className="border-t border-border py-10 text-sm text-muted-foreground">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <StoreIcon className="size-4" />
                <div>BillScan POS</div>
              </div>
              <div className="flex items-center gap-4">
                <Link href="/auth/login" className="hover:text-foreground">Login</Link>
                <Link href="/auth/register" className="hover:text-foreground">Create account</Link>
              </div>
            </div>
          </footer>
          </div>
        </div>
      </div>
    </div>
  )
}
