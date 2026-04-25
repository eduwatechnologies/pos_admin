'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Filter, Plus, Search, Trash2 } from 'lucide-react'

import { useAuth } from '@/context/auth-context'
import { useShop } from '@/context/shop-context'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { Supplier, SupplierBill } from '@/lib/types'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import { useGetSettingsQuery } from '@/redux/api/settings-api'
import { useListSuppliersQuery } from '@/redux/api/suppliers-api'
import {
  useCreateSupplierBillMutation,
  useListSupplierBillsQuery,
  usePaySupplierBillMutation,
  useVoidSupplierBillMutation,
} from '@/redux/api/supplier-bills-api'

const statusStyles: Record<string, { label: string; className: string }> = {
  unpaid: { label: 'Unpaid', className: 'bg-destructive/10 text-destructive' },
  partially_paid: { label: 'Partially paid', className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' },
  paid: { label: 'Paid', className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
  voided: { label: 'Voided', className: 'bg-muted text-muted-foreground' },
}

type DraftBillItem = { description: string; qty: string; unitCost: string }

export default function SupplierBillsPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const { currentShop } = useShop()
  const { toast } = useToast()

  useEffect(() => {
    if (!isAuthenticated) router.push('/auth/login')
  }, [isAuthenticated, router])

  const skip = !isAuthenticated || !currentShop
  const { data: settings } = useGetSettingsQuery({ shopId: currentShop?.id ?? '' }, { skip })

  const canManageInventory = useMemo(() => {
    if (!user) return false
    if (user.role === 'admin' || user.role === 'super_admin') return true
    const roleKey = String(user.role ?? '')
    return Boolean((settings?.rolePermissions as any)?.[roleKey]?.inventory)
  }, [settings?.rolePermissions, user])

  const [searchTerm, setSearchTerm] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('')
  const [supplierQuery, setSupplierQuery] = useState('')

  const { data: suppliersData } = useListSuppliersQuery({ shopId: currentShop?.id ?? '' }, { skip })
  const suppliers = suppliersData ?? []

  const supplierNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of suppliers) map.set(s.id, s.name)
    return map
  }, [suppliers])

  const { data: bills, error, isFetching } = useListSupplierBillsQuery(
    {
      shopId: currentShop?.id ?? '',
      q: searchTerm.trim() ? searchTerm.trim() : undefined,
      status: statusFilter || undefined,
      supplierId: selectedSupplierId || undefined,
    },
    { skip },
  )

  const [createBill, { isLoading: isCreating }] = useCreateSupplierBillMutation()
  const [payBill, { isLoading: isPaying }] = usePaySupplierBillMutation()
  const [voidBill, { isLoading: isVoiding }] = useVoidSupplierBillMutation()

  useEffect(() => {
    if (!error) return
    toast({ title: 'Error', description: 'Failed to load supplier bills', variant: 'destructive' })
  }, [error, toast])

  const money = useMemo(() => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'NGN' }), [])

  const [createOpen, setCreateOpen] = useState(false)
  const [createSupplierId, setCreateSupplierId] = useState('')
  const [createReference, setCreateReference] = useState('')
  const [createDueDate, setCreateDueDate] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [createNotes, setCreateNotes] = useState('')
  const [createItems, setCreateItems] = useState<DraftBillItem[]>([{ description: '', qty: '1', unitCost: '0' }])
  const [createSupplierSearch, setCreateSupplierSearch] = useState('')

  const openCreate = () => {
    setCreateSupplierId('')
    setCreateReference('')
    setCreateDueDate(new Date().toISOString().slice(0, 10))
    setCreateNotes('')
    setCreateItems([{ description: '', qty: '1', unitCost: '0' }])
    setCreateSupplierSearch('')
    setCreateOpen(true)
  }

  const createSubtotal = useMemo(() => {
    let cents = 0
    for (const i of createItems) {
      const qty = Math.floor(Number(i.qty))
      const unit = Math.round(Number(i.unitCost) * 100)
      if (!Number.isFinite(qty) || qty <= 0) continue
      if (!Number.isFinite(unit) || unit < 0) continue
      cents += qty * unit
    }
    return cents / 100
  }, [createItems])

  const canSubmitCreate = useMemo(() => {
    if (!canManageInventory || !currentShop) return false
    if (!createSupplierId) return false
    const due = new Date(createDueDate)
    if (Number.isNaN(due.getTime())) return false
    const normalized = createItems
      .map((i) => ({
        description: i.description.trim(),
        qty: Math.floor(Number(i.qty)),
        unit: Math.round(Number(i.unitCost) * 100),
      }))
      .filter((i) => i.description && Number.isFinite(i.qty) && i.qty > 0 && Number.isFinite(i.unit) && i.unit >= 0)
    return normalized.length > 0 && !isCreating
  }, [canManageInventory, createDueDate, createItems, createSupplierId, currentShop, isCreating])

  const submitCreate = async () => {
    if (!currentShop || !canSubmitCreate) return
    const payloadItems = createItems
      .map((i) => ({
        description: i.description.trim(),
        qty: Math.floor(Number(i.qty)),
        unitCostCents: Math.round(Number(i.unitCost) * 100),
      }))
      .filter((i) => i.description && Number.isFinite(i.qty) && i.qty > 0 && Number.isFinite(i.unitCostCents) && i.unitCostCents >= 0)

    try {
      await createBill({
        shopId: currentShop.id,
        input: {
          supplierId: createSupplierId,
          reference: createReference.trim() ? createReference.trim() : undefined,
          dueDate: createDueDate,
          notes: createNotes.trim() ? createNotes.trim() : undefined,
          items: payloadItems,
        },
      }).unwrap()
      setCreateOpen(false)
      toast({ title: 'Success', description: 'Supplier bill created' })
    } catch (err) {
      toast({
        title: 'Error',
        description: (err as any)?.data?.error ?? (err as any)?.data?.message ?? (err instanceof Error ? err.message : 'Failed to create bill'),
        variant: 'destructive',
      })
    }
  }

  const filteredSuppliers = useMemo(() => {
    const q = supplierQuery.trim().toLowerCase()
    if (!q) return suppliers.slice(0, 12)
    return suppliers.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 12)
  }, [supplierQuery, suppliers])

  const createSupplierOptions = useMemo(() => {
    const q = createSupplierSearch.trim().toLowerCase()
    if (!q) return suppliers.slice(0, 12)
    return suppliers.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 12)
  }, [createSupplierSearch, suppliers])

  const [payOpen, setPayOpen] = useState(false)
  const [payTarget, setPayTarget] = useState<SupplierBill | null>(null)
  const [payAmount, setPayAmount] = useState('0')
  const [payMethod, setPayMethod] = useState('transfer')
  const [payDate, setPayDate] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [payReference, setPayReference] = useState('')
  const [payNotes, setPayNotes] = useState('')

  const openPay = (b: SupplierBill) => {
    setPayTarget(b)
    const balance = Math.max(0, b.total - b.paid)
    setPayAmount(String(balance))
    setPayMethod('transfer')
    setPayDate(new Date().toISOString().slice(0, 10))
    setPayReference('')
    setPayNotes('')
    setPayOpen(true)
  }

  const canSubmitPay = useMemo(() => {
    if (!canManageInventory || !currentShop || !payTarget) return false
    const amt = Number(payAmount)
    if (!Number.isFinite(amt) || amt <= 0) return false
    const d = new Date(payDate)
    if (Number.isNaN(d.getTime())) return false
    return payMethod.trim() && !isPaying
  }, [canManageInventory, currentShop, isPaying, payAmount, payDate, payMethod, payTarget])

  const submitPay = async () => {
    if (!currentShop || !payTarget || !canSubmitPay) return
    const amtCents = Math.round(Number(payAmount) * 100)
    try {
      await payBill({
        shopId: currentShop.id,
        billId: payTarget.id,
        input: {
          amountCents: amtCents,
          method: payMethod.trim(),
          paidAt: payDate,
          reference: payReference.trim() ? payReference.trim() : undefined,
          notes: payNotes.trim() ? payNotes.trim() : undefined,
        },
      }).unwrap()
      setPayOpen(false)
      toast({ title: 'Success', description: 'Payment recorded' })
    } catch (err) {
      toast({
        title: 'Error',
        description: (err as any)?.data?.error ?? (err as any)?.data?.message ?? (err instanceof Error ? err.message : 'Failed to record payment'),
        variant: 'destructive',
      })
    }
  }

  const [deleteCandidate, setDeleteCandidate] = useState<SupplierBill | null>(null)
  const confirmVoid = async () => {
    if (!currentShop || !deleteCandidate) return
    try {
      await voidBill({ shopId: currentShop.id, billId: deleteCandidate.id }).unwrap()
      setDeleteCandidate(null)
      toast({ title: 'Success', description: 'Bill voided' })
    } catch (err) {
      toast({
        title: 'Error',
        description: (err as any)?.data?.error ?? (err as any)?.data?.message ?? (err instanceof Error ? err.message : 'Failed to void bill'),
        variant: 'destructive',
      })
    }
  }

  if (!isAuthenticated) return null
  if (!currentShop) return null

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex items-center justify-end gap-2">
        <Button type="button" className="h-9 gap-2 rounded-lg" onClick={openCreate} disabled={!canManageInventory || !currentShop}>
          <Plus className="h-4 w-4" />
          New Bill
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search bills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 w-[260px] rounded-lg pl-9"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-9 gap-2 rounded-lg text-muted-foreground hover:text-foreground"
              onClick={() => setFilterOpen((v) => !v)}
            >
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>
          <Button type="button" variant="outline" className="h-9" onClick={() => router.push('/suppliers')}>
            Manage suppliers
          </Button>
        </div>

        {filterOpen ? (
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="partially_paid">Partially paid</option>
                  <option value="paid">Paid</option>
                  <option value="voided">Voided</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Supplier</label>
                <div className="relative">
                  <Input
                    placeholder="Search suppliers..."
                    value={supplierQuery}
                    onChange={(e) => setSupplierQuery(e.target.value)}
                    className="h-9 rounded-lg"
                  />
                  <div className="mt-2 max-h-52 overflow-auto rounded-lg border border-border bg-background">
                    <button
                      type="button"
                      className={cn('flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted', !selectedSupplierId && 'bg-muted')}
                      onClick={() => setSelectedSupplierId('')}
                    >
                      <span className="font-medium">All suppliers</span>
                      <span className="text-xs text-muted-foreground">—</span>
                    </button>
                    {filteredSuppliers.map((s: Supplier) => (
                      <button
                        key={s.id}
                        type="button"
                        className={cn(
                          'flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted',
                          selectedSupplierId === s.id && 'bg-muted',
                        )}
                        onClick={() => setSelectedSupplierId(s.id)}
                      >
                        <span className="font-medium">{s.name}</span>
                        <span className="text-xs text-muted-foreground">{s.phone ?? ''}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Supplier</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Reference</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Due</th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Total</th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Paid</th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Balance</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="w-28 px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {!bills || bills.length === 0 ? (
                  <tr>
                    <td className="px-5 py-4 text-sm text-muted-foreground" colSpan={8}>
                      {isFetching ? 'Loading…' : 'No bills found'}
                    </td>
                  </tr>
                ) : (
                  bills.map((b) => {
                    const status = statusStyles[b.status] ?? { label: b.status, className: 'bg-muted text-muted-foreground' }
                    const balance = Math.max(0, b.total - b.paid)
                    return (
                      <tr key={b.id} className="transition-colors hover:bg-muted/50">
                        <td className="px-5 py-3.5 text-sm text-card-foreground">{supplierNameById.get(b.supplierId) ?? 'Unknown'}</td>
                        <td className="px-5 py-3.5 text-sm text-muted-foreground">{b.reference}</td>
                        <td className="px-5 py-3.5 text-sm text-muted-foreground">
                          {b.dueDate instanceof Date && !Number.isNaN(b.dueDate.getTime()) ? b.dueDate.toLocaleDateString() : '-'}
                        </td>
                        <td className="px-5 py-3.5 text-right text-sm font-semibold text-card-foreground">{money.format(b.total)}</td>
                        <td className="px-5 py-3.5 text-right text-sm text-card-foreground">{money.format(b.paid)}</td>
                        <td className="px-5 py-3.5 text-right text-sm text-card-foreground">{money.format(balance)}</td>
                        <td className="px-5 py-3.5">
                          <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', status.className)}>{status.label}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="h-8 px-3"
                              onClick={() => openPay(b)}
                              disabled={!canManageInventory || b.status === 'voided' || b.status === 'paid' || isPaying}
                            >
                              Pay
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="rounded-md hover:bg-secondary"
                              onClick={() => setDeleteCandidate(b)}
                              disabled={!canManageInventory || b.status === 'voided' || b.status === 'paid' || isVoiding}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>New Supplier Bill</DialogTitle>
            <DialogDescription>Create a bill and track payments against it.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Supplier</label>
              <Input
                placeholder="Search suppliers..."
                value={createSupplierSearch}
                onChange={(e) => setCreateSupplierSearch(e.target.value)}
                className="h-9 rounded-lg"
                disabled={!canManageInventory || isCreating}
              />
              <div className="max-h-52 overflow-auto rounded-lg border border-border bg-background">
                {createSupplierOptions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={cn(
                      'flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted',
                      createSupplierId === s.id && 'bg-muted',
                    )}
                    onClick={() => setCreateSupplierId(s.id)}
                    disabled={!canManageInventory || isCreating}
                  >
                    <span className="font-medium">{s.name}</span>
                    <span className="text-xs text-muted-foreground">{s.phone ?? ''}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Due date</label>
                <Input type="date" value={createDueDate} onChange={(e) => setCreateDueDate(e.target.value)} className="h-9 rounded-lg" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Reference</label>
                <Input
                  placeholder="Optional"
                  value={createReference}
                  onChange={(e) => setCreateReference(e.target.value)}
                  className="h-9 rounded-lg"
                  disabled={!canManageInventory || isCreating}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  placeholder="Optional"
                  value={createNotes}
                  onChange={(e) => setCreateNotes(e.target.value)}
                  className="min-h-[80px] rounded-lg"
                  disabled={!canManageInventory || isCreating}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Subtotal: <span className="text-card-foreground font-medium">{money.format(createSubtotal)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Items</div>
              <Button
                type="button"
                variant="outline"
                className="h-8"
                onClick={() => setCreateItems((prev) => [...prev, { description: '', qty: '1', unitCost: '0' }])}
                disabled={!canManageInventory || isCreating}
              >
                Add line
              </Button>
            </div>

            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Description</th>
                    <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Qty</th>
                    <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Unit cost</th>
                    <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Line total</th>
                    <th className="w-10 px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {createItems.map((line, idx) => {
                    const qty = Math.floor(Number(line.qty))
                    const unit = Number(line.unitCost)
                    const lineTotal = Number.isFinite(qty) && qty > 0 && Number.isFinite(unit) && unit >= 0 ? qty * unit : 0
                    return (
                      <tr key={idx}>
                        <td className="px-3 py-2">
                          <Input
                            placeholder="e.g. cartons, services, etc."
                            value={line.description}
                            onChange={(e) =>
                              setCreateItems((prev) => prev.map((p, i) => (i === idx ? { ...p, description: e.target.value } : p)))
                            }
                            className="h-9 rounded-lg"
                            disabled={!canManageInventory || isCreating}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            inputMode="numeric"
                            min="1"
                            step="1"
                            value={line.qty}
                            onChange={(e) =>
                              setCreateItems((prev) => prev.map((p, i) => (i === idx ? { ...p, qty: e.target.value } : p)))
                            }
                            className="h-9 rounded-lg text-right"
                            disabled={!canManageInventory || isCreating}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.01"
                            value={line.unitCost}
                            onChange={(e) =>
                              setCreateItems((prev) => prev.map((p, i) => (i === idx ? { ...p, unitCost: e.target.value } : p)))
                            }
                            className="h-9 rounded-lg text-right"
                            disabled={!canManageInventory || isCreating}
                          />
                        </td>
                        <td className="px-3 py-2 text-right text-sm font-semibold text-card-foreground">{money.format(lineTotal)}</td>
                        <td className="px-3 py-2 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="rounded-md hover:bg-secondary"
                            onClick={() => setCreateItems((prev) => prev.filter((_, i) => i !== idx))}
                            disabled={!canManageInventory || isCreating || createItems.length === 1}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} className="h-9">
              Cancel
            </Button>
            <Button type="button" className="h-9" onClick={submitCreate} disabled={!canSubmitCreate}>
              {isCreating ? 'Creating…' : 'Create Bill'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>Attach a payment to this supplier bill.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <Input type="number" inputMode="decimal" min="0" step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Method</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="cash">Cash</option>
                <option value="transfer">Transfer</option>
                <option value="card">Card</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reference</label>
              <Input placeholder="Optional" value={payReference} onChange={(e) => setPayReference(e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea placeholder="Optional" value={payNotes} onChange={(e) => setPayNotes(e.target.value)} className="min-h-[80px] rounded-lg" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setPayOpen(false)} className="h-9">
              Cancel
            </Button>
            <Button type="button" className="h-9" onClick={submitPay} disabled={!canSubmitPay}>
              {isPaying ? 'Saving…' : 'Save Payment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!deleteCandidate}
        onOpenChange={(open) => setDeleteCandidate(open ? deleteCandidate : null)}
        title="Void supplier bill?"
        description="This will void the bill (cannot be undone)."
        confirmText="Void bill"
        loading={isVoiding}
        onConfirm={confirmVoid}
      />
    </div>
  )
}
