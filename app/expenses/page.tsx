'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CircleDollarSign, Filter, Plus, Search, Trash2 } from 'lucide-react'

import { useAuth } from '@/context/auth-context'
import { useShop } from '@/context/shop-context'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { Expense, Supplier } from '@/lib/types'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import { useGetSettingsQuery } from '@/redux/api/settings-api'
import { useListSuppliersQuery } from '@/redux/api/suppliers-api'
import {
  useCreateExpenseMutation,
  useDeleteExpenseMutation,
  useListExpensesQuery,
  useUpdateExpenseMutation,
} from '@/redux/api/expenses-api'

function nowLocalInputString() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function ExpensesPage() {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { currentShop } = useShop()

  const [searchTerm, setSearchTerm] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)

  const [category, setCategory] = useState('')
  const [amount, setAmount] = useState<number>(0)
  const [description, setDescription] = useState('')
  const [occurredAt, setOccurredAt] = useState(nowLocalInputString())
  const [supplierQuery, setSupplierQuery] = useState('')
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteCandidate, setDeleteCandidate] = useState<Expense | null>(null)

  useEffect(() => {
    if (!isAuthenticated) router.push('/auth/login')
  }, [isAuthenticated, router])

  const skip = !isAuthenticated || !currentShop
  const { data: expenses = [], error } = useListExpensesQuery({ shopId: currentShop?.id ?? '' }, { skip })
  const { data: settings } = useGetSettingsQuery({ shopId: currentShop?.id ?? '' }, { skip })
  const { data: suppliers = [] } = useListSuppliersQuery({ shopId: currentShop?.id ?? '' }, { skip })

  const [createExpense] = useCreateExpenseMutation()
  const [updateExpense] = useUpdateExpenseMutation()
  const [deleteExpense, { isLoading: isDeleting }] = useDeleteExpenseMutation()

  useEffect(() => {
    if (!error) return
    toast({ title: 'Error', description: 'Failed to load expenses', variant: 'destructive' })
  }, [error, toast])

  const canManageAnalytics = useMemo(() => {
    if (!user) return false
    if (user.role === 'admin' || user.role === 'super_admin') return true
    const roleKey = String(user.role ?? '')
    return Boolean((settings?.rolePermissions as any)?.[roleKey]?.analytics)
  }, [settings?.rolePermissions, user])

  const money = useMemo(() => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'NGN' }), [])

  const supplierNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of suppliers) map.set(s.id, s.name)
    return map
  }, [suppliers])

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return expenses
    return expenses.filter((e) => {
      const supplierName = e.supplierId ? supplierNameById.get(e.supplierId) ?? '' : ''
      const hay = [e.category, e.description ?? '', supplierName].join(' ').toLowerCase()
      return hay.includes(q)
    })
  }, [expenses, searchTerm, supplierNameById])

  useEffect(() => {
    if (!modalOpen) return
    setCategory(editing?.category ?? '')
    setAmount(editing ? editing.amount : 0)
    setDescription(editing?.description ?? '')
    setOccurredAt(editing ? editing.occurredAt.toISOString().slice(0, 16) : nowLocalInputString())
    setSelectedSupplierId(editing?.supplierId ?? null)
    setSupplierQuery('')
    setIsSubmitting(false)
  }, [editing, modalOpen])

  if (!isAuthenticated) return null

  const openCreate = () => {
    if (!canManageAnalytics) {
      toast({ title: 'Access denied', description: 'You do not have permission to manage expenses', variant: 'destructive' })
      return
    }
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (e: Expense) => {
    if (!canManageAnalytics) {
      toast({ title: 'Access denied', description: 'You do not have permission to manage expenses', variant: 'destructive' })
      return
    }
    setEditing(e)
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    if (!canManageAnalytics) {
      toast({ title: 'Access denied', description: 'You do not have permission to manage expenses', variant: 'destructive' })
      return
    }
    const c = category.trim()
    if (!c) {
      toast({ title: 'Error', description: 'Category is required', variant: 'destructive' })
      return
    }
    if (!currentShop) {
      toast({ title: 'Error', description: 'Select a shop first', variant: 'destructive' })
      return
    }
    try {
      setIsSubmitting(true)
      if (editing) {
        await updateExpense({
          shopId: currentShop.id,
          expenseId: editing.id,
          input: {
            category: c,
            description: description.trim(),
            amount,
            occurredAt,
            supplierId: selectedSupplierId ?? undefined,
          },
        }).unwrap()
      } else {
        await createExpense({
          shopId: currentShop.id,
          input: {
            category: c,
            description: description.trim() || undefined,
            amount,
            occurredAt,
            supplierId: selectedSupplierId ?? undefined,
          },
        }).unwrap()
      }
      setModalOpen(false)
      toast({ title: 'Success', description: editing ? 'Expense updated' : 'Expense recorded' })
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save expense',
        variant: 'destructive',
      })
      setIsSubmitting(false)
    }
  }

  const handleDelete = (e: Expense) => {
    if (!canManageAnalytics) {
      toast({ title: 'Access denied', description: 'You do not have permission to manage expenses', variant: 'destructive' })
      return
    }
    if (!currentShop) return
    setDeleteCandidate(e)
  }

  const confirmDelete = async () => {
    if (!deleteCandidate) return
    if (!currentShop) return
    try {
      await deleteExpense({ shopId: currentShop.id, expenseId: deleteCandidate.id }).unwrap()
      toast({ title: 'Deleted', description: 'Expense deleted' })
      setDeleteCandidate(null)
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete expense',
        variant: 'destructive',
      })
    }
  }

  const filteredSuppliers = useMemo(() => {
    const q = supplierQuery.trim().toLowerCase()
    if (!q) return suppliers.slice(0, 12)
    return suppliers.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 12)
  }, [supplierQuery, suppliers])

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground mt-2">Record and manage expenses</p>
        </div>
        <Button type="button" className="h-9 gap-2 rounded-lg" onClick={openCreate} disabled={!canManageAnalytics || !currentShop}>
          <Plus className="h-4 w-4" />
          New Expense
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 w-[260px] rounded-lg pl-9"
              />
            </div>
            <Button type="button" variant="outline" className="h-9 gap-2 rounded-lg text-muted-foreground hover:text-foreground">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Category</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Description</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Supplier</th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Amount</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</th>
                  <th className="w-28 px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((e) => {
                  const supplierName = e.supplierId ? supplierNameById.get(e.supplierId) ?? 'Unknown' : '-'
                  return (
                    <tr key={e.id} className="transition-colors hover:bg-muted/50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-card-foreground">{e.category}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">{e.description ?? '-'}</td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">{supplierName}</td>
                      <td className="px-5 py-3.5 text-right text-sm font-semibold text-card-foreground">{money.format(e.amount)}</td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">
                        {e.occurredAt instanceof Date && !Number.isNaN(e.occurredAt.getTime()) ? e.occurredAt.toLocaleString() : '-'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            onClick={() => openEdit(e)}
                            disabled={!canManageAnalytics || !currentShop}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="rounded-md hover:bg-secondary"
                            onClick={() => handleDelete(e)}
                            disabled={!canManageAnalytics || !currentShop}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Expense' : 'New Expense'}</DialogTitle>
            <DialogDescription>{editing ? 'Update expense' : 'Record a new expense'}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Utilities" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount</label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={String(amount)}
                  onChange={(e) => setAmount(Math.max(0, Number(e.target.value || 0)))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Input type="datetime-local" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional details" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Supplier (optional)</label>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Input
                  value={supplierQuery}
                  onChange={(e) => setSupplierQuery(e.target.value)}
                  placeholder={
                    selectedSupplierId ? supplierNameById.get(selectedSupplierId) ?? 'Selected supplier' : 'Search suppliers'
                  }
                />
                <div className="max-h-40 overflow-auto rounded-lg border border-border">
                  {selectedSupplierId ? (
                    <div className="p-3 text-sm text-muted-foreground">
                      Selected: <span className="text-card-foreground">{supplierNameById.get(selectedSupplierId)}</span>
                    </div>
                  ) : filteredSuppliers.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground">No suppliers</div>
                  ) : (
                    filteredSuppliers.map((s: Supplier) => (
                      <button
                        key={s.id}
                        type="button"
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                        onClick={() => setSelectedSupplierId(s.id)}
                      >
                        <span className="font-medium">{s.name}</span>
                        <span className="text-xs text-muted-foreground">{s.phone ?? ''}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="h-9">
                Cancel
              </Button>
              <Button type="submit" className="h-9" disabled={!canManageAnalytics || isSubmitting}>
                {editing ? 'Save Changes' : 'Create Expense'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDeleteDialog
        open={!!deleteCandidate}
        onOpenChange={(open) => setDeleteCandidate(open ? deleteCandidate : null)}
        title="Delete expense?"
        description="This will permanently delete this expense record."
        confirmText="Delete expense"
        loading={isDeleting}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
