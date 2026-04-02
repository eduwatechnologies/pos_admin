'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { useShop } from '@/context/shop-context'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { useAdjustStockMutation, useGetProductDetailQuery } from '@/redux/api/products-api'
import { useGetSettingsQuery } from '@/redux/api/settings-api'

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>()
  const productId = String((params as any)?.id ?? '')
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
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
  const { data: settings } = useGetSettingsQuery({ shopId: currentShop?.id ?? '' }, { skip: !isAuthenticated || !currentShop })
  const [adjustStock, { isLoading: isAdjusting }] = useAdjustStockMutation()

  const [adjustMode, setAdjustMode] = useState<'increase' | 'decrease'>('increase')
  const [adjustQty, setAdjustQty] = useState<string>('1')
  const [adjustReason, setAdjustReason] = useState<string>('')

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

  const canManageInventory = useMemo(() => {
    if (!user) return false
    if (user.role === 'admin' || user.role === 'super_admin') return true
    const roleKey = String(user.role ?? '')
    return Boolean((settings?.rolePermissions as any)?.[roleKey]?.inventory)
  }, [settings?.rolePermissions, user])

  if (!isAuthenticated) return null
  if (!currentShop) return null

  const product = data?.product
  const purchases = data?.purchases ?? []
  const movements = data?.movements ?? []
  const qtyNumber = Math.floor(Number(adjustQty))
  const canSubmitAdjust = canManageInventory && product && Number.isFinite(qtyNumber) && qtyNumber > 0 && adjustReason.trim() && !isAdjusting

  const submitAdjust = async () => {
    if (!currentShop || !product) return
    const qty = Math.floor(Number(adjustQty))
    if (!Number.isFinite(qty) || qty <= 0) return
    const reason = adjustReason.trim()
    if (!reason) return
    const delta = adjustMode === 'decrease' ? -qty : qty
    try {
      await adjustStock({ shopId: currentShop.id, productId: product.id, input: { delta, reason } }).unwrap()
      setAdjustQty('1')
      setAdjustReason('')
      toast({ title: 'Success', description: 'Stock adjusted' })
    } catch (err) {
      toast({
        title: 'Error',
        description:
          (err as any)?.data?.error ?? (err as any)?.data?.message ?? (err instanceof Error ? err.message : 'Failed to adjust stock'),
        variant: 'destructive',
      })
    }
  }

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

      {product ? (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="text-lg font-semibold tracking-tight">Adjust Stock</div>
              <div className="text-sm text-muted-foreground">Increase or decrease stock with a reason.</div>
            </div>
            <Button type="button" variant="outline" className="h-9" disabled={!canSubmitAdjust} onClick={submitAdjust}>
              {isAdjusting ? 'Saving…' : 'Apply'}
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <select
                value={adjustMode}
                onChange={(e) => setAdjustMode(e.target.value === 'decrease' ? 'decrease' : 'increase')}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={!canManageInventory || isAdjusting}
              >
                <option value="increase">Increase</option>
                <option value="decrease">Decrease</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity</label>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={!canManageInventory || isAdjusting}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Reason</label>
              <input
                type="text"
                placeholder="e.g. damaged, recount, correction"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={!canManageInventory || isAdjusting}
              />
            </div>
          </div>

          {!canManageInventory ? <div className="mt-3 text-sm text-destructive">You do not have permission to adjust stock.</div> : null}
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

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Stock Movements</h2>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Type</th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Qty</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Source</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {movements.length === 0 ? (
                  <tr>
                    <td className="px-5 py-4 text-sm text-muted-foreground" colSpan={5}>
                      No movements found for this product
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => (
                    <tr key={m.id} className="transition-colors hover:bg-muted/50">
                      <td className="px-5 py-3.5 text-sm text-card-foreground">
                        {m.occurredAt instanceof Date && !Number.isNaN(m.occurredAt.getTime()) ? m.occurredAt.toLocaleString() : '-'}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">{m.type || '-'}</td>
                      <td className="px-5 py-3.5 text-right text-sm font-semibold text-card-foreground">
                        {m.qtyDelta > 0 ? `+${m.qtyDelta}` : String(m.qtyDelta)}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">
                        {m.sourceType ? `${m.sourceType}${m.sourceId ? `#${m.sourceId.slice(-6)}` : ''}` : '-'}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">{m.notes ?? '-'}</td>
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
