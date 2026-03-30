'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Plus, Search, Trash2, X } from 'lucide-react'

import { useAuth } from '@/context/auth-context'
import { useShop } from '@/context/shop-context'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { Product, Supplier } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import { useListProductsQuery } from '@/redux/api/products-api'
import { useGetSettingsQuery } from '@/redux/api/settings-api'
import { useListSuppliersQuery } from '@/redux/api/suppliers-api'
import { useCreatePurchaseMutation, useListPurchasesQuery, useVoidPurchaseMutation } from '@/redux/api/purchases-api'

function nowLocalInputString() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

type DraftLine = {
  productId: string
  productName: string
  qty: number
  unitCost: number
}

export default function PurchasesPage() {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { currentShop } = useShop()

  const [searchTerm, setSearchTerm] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  const [supplierQuery, setSupplierQuery] = useState('')
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null)

  const [productQuery, setProductQuery] = useState('')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [purchasedAt, setPurchasedAt] = useState(nowLocalInputString())
  const [lines, setLines] = useState<DraftLine[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) router.push('/auth/login')
  }, [isAuthenticated, router])

  const skip = !isAuthenticated || !currentShop
  const { data: purchases = [], error: purchasesError } = useListPurchasesQuery({ shopId: currentShop?.id ?? '' }, { skip })
  const { data: suppliers = [], error: suppliersError } = useListSuppliersQuery(
    { shopId: currentShop?.id ?? '' },
    { skip },
  )
  const { data: products = [], error: productsError } = useListProductsQuery({ shopId: currentShop?.id ?? '' }, { skip })
  const { data: settings } = useGetSettingsQuery({ shopId: currentShop?.id ?? '' }, { skip })

  const [createPurchase] = useCreatePurchaseMutation()
  const [voidPurchase] = useVoidPurchaseMutation()

  useEffect(() => {
    if (!purchasesError) return
    toast({ title: 'Error', description: 'Failed to load purchases', variant: 'destructive' })
  }, [purchasesError, toast])

  useEffect(() => {
    if (!suppliersError) return
    toast({ title: 'Error', description: 'Failed to load suppliers', variant: 'destructive' })
  }, [suppliersError, toast])

  useEffect(() => {
    if (!productsError) return
    toast({ title: 'Error', description: 'Failed to load products', variant: 'destructive' })
  }, [productsError, toast])

  const canManageInventory = useMemo(() => {
    if (!user) return false
    if (user.role === 'admin' || user.role === 'super_admin') return true
    const roleKey = String(user.role ?? '')
    return Boolean((settings?.rolePermissions as any)?.[roleKey]?.inventory)
  }, [settings?.rolePermissions, user])

  const money = useMemo(() => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'NGN' }), [])

  const supplierNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of suppliers) map.set(s.id, s.name)
    return map
  }, [suppliers])

  const selectedSupplier = useMemo(() => {
    if (!selectedSupplierId) return null
    return suppliers.find((s) => s.id === selectedSupplierId) ?? null
  }, [selectedSupplierId, suppliers])

  const filteredPurchases = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return purchases
    return purchases.filter((p) => {
      const supplierName = p.supplierId ? supplierNameById.get(p.supplierId) ?? '' : ''
      const hay = [supplierName, p.reference ?? '', p.notes ?? '', p.status ?? ''].join(' ').toLowerCase()
      return hay.includes(q)
    })
  }, [purchases, searchTerm, supplierNameById])

  const filteredSuppliers = useMemo(() => {
    const q = supplierQuery.trim().toLowerCase()
    if (!q) return suppliers.slice(0, 12)
    return suppliers.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 12)
  }, [supplierQuery, suppliers])

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase()
    if (!q) return products.slice(0, 12)
    return products
      .filter((p) => {
        const hay = [p.name, p.sku ?? ''].join(' ').toLowerCase()
        return hay.includes(q)
      })
      .slice(0, 12)
  }, [productQuery, products])

  const totalCost = useMemo(() => {
    return lines.reduce((sum, l) => sum + l.qty * l.unitCost, 0)
  }, [lines])

  const resetDraft = () => {
    setSupplierQuery('')
    setSelectedSupplierId(null)
    setProductQuery('')
    setReference('')
    setNotes('')
    setPurchasedAt(nowLocalInputString())
    setLines([])
    setIsSubmitting(false)
  }

  useEffect(() => {
    if (!modalOpen) return
    resetDraft()
  }, [modalOpen])

  const addProductLine = (p: Product) => {
    setLines((prev) => {
      const idx = prev.findIndex((x) => x.productId === p.id)
      if (idx >= 0) {
        const next = prev.slice()
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 }
        return next
      }
      return [...prev, { productId: p.id, productName: p.name, qty: 1, unitCost: 0 }]
    })
  }

  const removeLine = (productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId))
  }

  const updateLine = (productId: string, patch: Partial<DraftLine>) => {
    setLines((prev) => prev.map((l) => (l.productId === productId ? { ...l, ...patch } : l)))
  }

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    if (!canManageInventory) {
      toast({
        title: 'Access denied',
        description: 'You do not have permission to create purchases',
        variant: 'destructive',
      })
      return
    }
    if (!currentShop) {
      toast({ title: 'Error', description: 'Select a shop first', variant: 'destructive' })
      return
    }
    if (lines.length === 0) {
      toast({ title: 'Error', description: 'Add at least one product line', variant: 'destructive' })
      return
    }

    for (const l of lines) {
      if (!Number.isInteger(l.qty) || l.qty < 1) {
        toast({ title: 'Error', description: 'Qty must be an integer >= 1', variant: 'destructive' })
        return
      }
      if (typeof l.unitCost !== 'number' || !Number.isFinite(l.unitCost) || l.unitCost < 0) {
        toast({ title: 'Error', description: 'Unit cost must be a number >= 0', variant: 'destructive' })
        return
      }
    }

    try {
      setIsSubmitting(true)
      await createPurchase({
        shopId: currentShop.id,
        input: {
          supplierId: selectedSupplierId ?? undefined,
          reference: reference.trim() || undefined,
          notes: notes.trim() || undefined,
          purchasedAt: purchasedAt ? new Date(purchasedAt).toISOString() : undefined,
          items: lines.map((l) => ({
            productId: l.productId,
            qty: l.qty,
            unitCostCents: Math.round(l.unitCost * 100),
          })),
        },
      }).unwrap()
      toast({ title: 'Success', description: 'Purchase created' })
      setModalOpen(false)
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create purchase',
        variant: 'destructive',
      })
      setIsSubmitting(false)
    }
  }

  const handleVoid = async (purchaseId: string) => {
    if (!canManageInventory) {
      toast({
        title: 'Access denied',
        description: 'You do not have permission to void purchases',
        variant: 'destructive',
      })
      return
    }
    if (!currentShop) return
    try {
      await voidPurchase({ shopId: currentShop.id, purchaseId }).unwrap()
      toast({ title: 'Voided', description: 'Purchase voided' })
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to void purchase',
        variant: 'destructive',
      })
    }
  }

  if (!isAuthenticated) return null

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchases</h1>
          <p className="text-muted-foreground mt-2">Record purchases and update stock</p>
        </div>
        <Button type="button" className="h-9 gap-2 rounded-lg" onClick={() => setModalOpen(true)} disabled={!canManageInventory || !currentShop}>
          <Plus className="h-4 w-4" />
          New Purchase
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search purchases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 w-[300px] rounded-lg pl-9"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Supplier</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Reference</th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Total</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="w-28 px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td className="px-5 py-4 text-sm text-muted-foreground" colSpan={6}>
                      No purchases found
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map((p) => {
                    const supplierName = p.supplierId ? supplierNameById.get(p.supplierId) ?? 'Unknown' : '-'
                    const isVoided = p.status === 'voided'
                    return (
                      <tr key={p.id} className="transition-colors hover:bg-muted/50">
                        <td className="px-5 py-3.5 text-sm text-card-foreground">{p.purchasedAt.toLocaleString()}</td>
                        <td className="px-5 py-3.5 text-sm text-muted-foreground">{supplierName}</td>
                        <td className="px-5 py-3.5 text-sm text-muted-foreground">{p.reference ?? '-'}</td>
                        <td className="px-5 py-3.5 text-right text-sm font-semibold text-card-foreground">{money.format(p.totalCost)}</td>
                        <td className="px-5 py-3.5">
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-[11px] font-medium',
                              isVoided
                                ? 'bg-muted text-muted-foreground'
                                : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
                            )}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 text-destructive hover:text-destructive"
                              onClick={() => handleVoid(p.id)}
                              disabled={!canManageInventory || isVoided}
                            >
                              Void
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[860px]">
          <DialogHeader>
            <DialogTitle>New Purchase</DialogTitle>
            <DialogDescription>Add items to increase stock. You can optionally select a supplier.</DialogDescription>
          </DialogHeader>

          {!canManageInventory ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>You do not have permission to create purchases</AlertDescription>
            </Alert>
          ) : null}

          <form onSubmit={handleCreatePurchase} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Purchased At</label>
                <Input type="datetime-local" value={purchasedAt} onChange={(e) => setPurchasedAt(e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Supplier</label>
                <div className="flex items-center gap-2">
                  <Input
                    value={supplierQuery}
                    onChange={(e) => setSupplierQuery(e.target.value)}
                    placeholder={selectedSupplier ? selectedSupplier.name : 'Search suppliers (optional)'}
                  />
                  {selectedSupplier ? (
                    <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => setSelectedSupplierId(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
                {!selectedSupplier ? (
                  <div className="max-h-40 overflow-auto rounded-lg border border-border">
                    {filteredSuppliers.length === 0 ? (
                      <div className="p-3 text-sm text-muted-foreground">No suppliers</div>
                    ) : (
                      filteredSuppliers.map((s: Supplier) => (
                        <button
                          key={s.id}
                          type="button"
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                          onClick={() => {
                            setSelectedSupplierId(s.id)
                            setSupplierQuery('')
                          }}
                        >
                          <span className="font-medium">{s.name}</span>
                          <span className="text-xs text-muted-foreground">{s.phone ?? ''}</span>
                        </button>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Selected: <span className="text-card-foreground">{selectedSupplier.name}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Reference</label>
                <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Invoice no. (optional)" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Items</label>
                <div className="text-sm text-muted-foreground">
                  Total: <span className="text-card-foreground font-semibold">{money.format(totalCost)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Input
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                    placeholder="Search products to add..."
                  />
                  <div className="max-h-56 overflow-auto rounded-lg border border-border">
                    {filteredProducts.length === 0 ? (
                      <div className="p-3 text-sm text-muted-foreground">No products</div>
                    ) : (
                      filteredProducts.map((p: Product) => (
                        <button
                          key={p.id}
                          type="button"
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                          onClick={() => addProductLine(p)}
                        >
                          <span className="font-medium">{p.name}</span>
                          <span className="text-xs text-muted-foreground">{p.sku}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="max-h-56 overflow-auto rounded-lg border border-border">
                    {lines.length === 0 ? (
                      <div className="p-3 text-sm text-muted-foreground">No items added</div>
                    ) : (
                      <div className="divide-y divide-border">
                        {lines.map((l) => (
                          <div key={l.productId} className="p-3 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <div className="truncate text-sm font-medium text-card-foreground">{l.productName}</div>
                                <div className="text-xs text-muted-foreground">
                                  Line: <span className="text-card-foreground">{money.format(l.qty * l.unitCost)}</span>
                                </div>
                              </div>
                              <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeLine(l.productId)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">Qty</label>
                                <Input
                                  type="number"
                                  min={1}
                                  step={1}
                                  value={String(l.qty)}
                                  onChange={(e) => updateLine(l.productId, { qty: Math.max(1, Math.floor(Number(e.target.value || 1))) })}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">Unit Cost</label>
                                <Input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  value={String(l.unitCost)}
                                  onChange={(e) => updateLine(l.productId, { unitCost: Math.max(0, Number(e.target.value || 0)) })}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" className="h-9" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="h-9" disabled={isSubmitting || !canManageInventory}>
                Create Purchase
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
