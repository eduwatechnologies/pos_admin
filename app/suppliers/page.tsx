'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Edit2, Filter, Plus, Search, Trash2, Truck } from 'lucide-react'

import { useAuth } from '@/context/auth-context'
import { useShop } from '@/context/shop-context'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { Supplier } from '@/lib/types'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import {
  useCreateSupplierMutation,
  useDeleteSupplierMutation,
  useListSuppliersQuery,
  useUpdateSupplierMutation,
} from '@/redux/api/suppliers-api'
import { useGetSettingsQuery } from '@/redux/api/settings-api'

export default function SuppliersPage() {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { currentShop } = useShop()

  const [searchTerm, setSearchTerm] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteCandidate, setDeleteCandidate] = useState<Supplier | null>(null)

  useEffect(() => {
    if (!isAuthenticated) router.push('/auth/login')
  }, [isAuthenticated, router])

  const skip = !isAuthenticated || !currentShop
  const { data: suppliers = [], error } = useListSuppliersQuery({ shopId: currentShop?.id ?? '' }, { skip })
  const { data: settings } = useGetSettingsQuery({ shopId: currentShop?.id ?? '' }, { skip })

  const [createSupplier] = useCreateSupplierMutation()
  const [updateSupplier] = useUpdateSupplierMutation()
  const [deleteSupplier, { isLoading: isDeleting }] = useDeleteSupplierMutation()

  useEffect(() => {
    if (!error) return
    toast({ title: 'Error', description: 'Failed to load suppliers', variant: 'destructive' })
  }, [error, toast])

  const canManageInventory = useMemo(() => {
    if (!user) return false
    if (user.role === 'admin' || user.role === 'super_admin') return true
    const roleKey = String(user.role ?? '')
    return Boolean((settings?.rolePermissions as any)?.[roleKey]?.inventory)
  }, [settings?.rolePermissions, user])

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return suppliers
    return suppliers.filter((s) => {
      const hay = [s.name, s.email ?? '', s.phone ?? ''].join(' ').toLowerCase()
      return hay.includes(q)
    })
  }, [suppliers, searchTerm])

  const seedForm = (s: Supplier | null) => {
    setName(s?.name ?? '')
    setEmail(s?.email ?? '')
    setPhone(s?.phone ?? '')
    setAddress(s?.address ?? '')
    setNotes(s?.notes ?? '')
    setIsActive(s?.isActive ?? true)
    setIsSubmitting(false)
  }

  if (!isAuthenticated) return null

  const openCreate = () => {
    if (!canManageInventory) {
      toast({
        title: 'Access denied',
        description: 'You do not have permission to manage suppliers',
        variant: 'destructive',
      })
      return
    }
    setEditing(null)
    seedForm(null)
    setModalOpen(true)
  }

  const openEdit = (s: Supplier) => {
    if (!canManageInventory) {
      toast({
        title: 'Access denied',
        description: 'You do not have permission to manage suppliers',
        variant: 'destructive',
      })
      return
    }
    setEditing(s)
    seedForm(s)
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    if (!canManageInventory) {
      toast({
        title: 'Access denied',
        description: 'You do not have permission to manage suppliers',
        variant: 'destructive',
      })
      return
    }
    const trimmedName = name.trim()
    if (!trimmedName) {
      toast({ title: 'Error', description: 'Supplier name is required', variant: 'destructive' })
      return
    }
    if (!currentShop) {
      toast({ title: 'Error', description: 'Select a shop first', variant: 'destructive' })
      return
    }

    try {
      setIsSubmitting(true)
      if (editing) {
        await updateSupplier({
          shopId: currentShop.id,
          supplierId: editing.id,
          input: {
            name: trimmedName,
            email: email.trim(),
            phone: phone.trim(),
            address: address.trim(),
            notes: notes.trim(),
            isActive,
          },
        }).unwrap()
      } else {
        await createSupplier({
          shopId: currentShop.id,
          input: {
            name: trimmedName,
            email: email.trim() || undefined,
            phone: phone.trim() || undefined,
            address: address.trim() || undefined,
            notes: notes.trim() || undefined,
          },
        }).unwrap()
      }
      setModalOpen(false)
      toast({ title: 'Success', description: editing ? 'Supplier updated' : 'Supplier created' })
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save supplier',
        variant: 'destructive',
      })
      setIsSubmitting(false)
    }
  }

  const handleDelete = (s: Supplier) => {
    if (!canManageInventory) {
      toast({
        title: 'Access denied',
        description: 'You do not have permission to manage suppliers',
        variant: 'destructive',
      })
      return
    }
    if (!currentShop) return
    setDeleteCandidate(s)
  }

  const confirmDelete = async () => {
    if (!deleteCandidate) return
    if (!currentShop) return
    try {
      await deleteSupplier({ shopId: currentShop.id, supplierId: deleteCandidate.id }).unwrap()
      toast({ title: 'Deleted', description: 'Supplier deleted' })
      setDeleteCandidate(null)
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete supplier',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search suppliers..."
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

          <Button type="button" className="h-9 gap-2 rounded-lg" onClick={openCreate} disabled={!canManageInventory || !currentShop}>
            <Plus className="h-4 w-4" />
            Add Supplier
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Supplier
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Contact
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="w-28 px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((s) => {
                  const status = s.isActive ? 'Active' : 'Inactive'
                  return (
                    <tr key={s.id} className="transition-colors hover:bg-muted/50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                            <Truck className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-card-foreground">{s.name}</span>
                            <span className="text-xs text-muted-foreground">{s.address ?? ''}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">
                        {[s.email, s.phone].filter(Boolean).join(' • ') || '-'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[11px] font-medium',
                            s.isActive
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                              : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="rounded-md hover:bg-secondary"
                            onClick={() => openEdit(s)}
                            disabled={!canManageInventory || !currentShop}
                          >
                            <Edit2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="rounded-md hover:bg-secondary"
                            onClick={() => handleDelete(s)}
                            disabled={!canManageInventory || !currentShop}
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

      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open)
          if (!open) setIsSubmitting(false)
        }}
      >
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle>
            <DialogDescription>{editing ? 'Update supplier details' : 'Create a new supplier'}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Supplier name" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Address</label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" />
            </div>

            {editing ? (
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Active</div>
                  <div className="text-xs text-muted-foreground">Disable instead of deleting</div>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            ) : null}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="h-9">
                Cancel
              </Button>
              <Button type="submit" className="h-9" disabled={isSubmitting}>
                {editing ? 'Save Changes' : 'Create Supplier'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDeleteDialog
        open={!!deleteCandidate}
        onOpenChange={(open) => setDeleteCandidate(open ? deleteCandidate : null)}
        title="Delete supplier?"
        description={
          deleteCandidate ? (
            <span>
              This will permanently delete <span className="font-medium">{deleteCandidate.name}</span>.
            </span>
          ) : null
        }
        confirmText="Delete supplier"
        loading={isDeleting}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
