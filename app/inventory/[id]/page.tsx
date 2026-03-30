'use client'

import { useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { useShop } from '@/context/shop-context'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { useGetProductDetailQuery } from '@/redux/api/products-api'

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>()
  const productId = String((params as any)?.id ?? '')
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { currentShop } = useShop()
  const { toast } = useToast()

  useEffect(() => {
    if (!isAuthenticated) router.push('/auth/login')
  }, [isAuthenticated, router])

  const skip = !isAuthenticated || !currentShop || !productId
  const { data, error, isFetching } = useGetProductDetailQuery(
    { shopId: currentShop?.id ?? '', productId },
    { skip },
  )

  useEffect(() => {
    if (!error) return
    toast({ title: 'Error', description: 'Failed to load product details', variant: 'destructive' })
  }, [error, toast])

  const money = useMemo(() => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'NGN' }), [])

  const supplierNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of data?.suppliers ?? []) {
      if (!s.id) continue
      map.set(s.id, s.name)
    }
    return map
  }, [data?.suppliers])

  if (!isAuthenticated) return null
  if (!currentShop) return null

  const product = data?.product
  const purchases = data?.purchases ?? []

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{product?.name ?? (isFetching ? 'Loading…' : 'Product')}</h1>
          <p className="text-muted-foreground">Product details, purchases and suppliers</p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" className="h-9" onClick={() => router.push('/inventory')}>
            Back to Inventory
          </Button>
        </div>
      </div>

      {product ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="text-sm text-muted-foreground">Stock</div>
            <div className="mt-1 text-2xl font-semibold text-card-foreground">{product.quantity}</div>
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <div className="text-muted-foreground">
                Reorder level: <span className="text-card-foreground">{product.reorderLevel}</span>
              </div>
              <div className="text-muted-foreground">
                Category: <span className="text-card-foreground">{product.category}</span>
              </div>
              <div className="text-muted-foreground">
                SKU: <span className="text-card-foreground">{product.sku || '-'}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="text-sm text-muted-foreground">Price</div>
            <div className="mt-1 text-2xl font-semibold text-card-foreground">{money.format(product.price)}</div>
            <div className="mt-3 text-sm text-muted-foreground">
              Status: <span className="text-card-foreground">{product.quantity === 0 ? 'Out of stock' : 'Active'}</span>
            </div>
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Recent Purchases</h2>
          <Button type="button" className="h-9" onClick={() => router.push('/purchases')}>
            Go to Purchases
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Date
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Supplier
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Reference
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Qty
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Unit Cost
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Total
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {purchases.length === 0 ? (
                  <tr>
                    <td className="px-5 py-4 text-sm text-muted-foreground" colSpan={7}>
                      No purchases found for this product
                    </td>
                  </tr>
                ) : (
                  purchases.map((p) => (
                    <tr key={p.id} className="transition-colors hover:bg-muted/50">
                      <td className="px-5 py-3.5 text-sm text-card-foreground">
                        {p.purchasedAt instanceof Date && !Number.isNaN(p.purchasedAt.getTime())
                          ? p.purchasedAt.toLocaleString()
                          : '-'}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">
                        {p.supplierId ? supplierNameById.get(p.supplierId) ?? 'Unknown' : '-'}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">{p.reference ?? '-'}</td>
                      <td className="px-5 py-3.5 text-right text-sm text-card-foreground">{p.qty}</td>
                      <td className="px-5 py-3.5 text-right text-sm text-card-foreground">{money.format(p.unitCost)}</td>
                      <td className="px-5 py-3.5 text-right text-sm font-semibold text-card-foreground">{money.format(p.lineTotal)}</td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">{p.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

