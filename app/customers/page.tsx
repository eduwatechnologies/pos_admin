'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Edit2, Filter, Plus, Search, Trash2, User } from 'lucide-react'

import { useAuth } from '@/context/auth-context'
import { useShop } from '@/context/shop-context'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { Customer } from '@/lib/types'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import {
  useCreateCustomerMutation,
  useDeleteCustomerMutation,
  useListCustomersQuery,
  useUpdateCustomerMutation,
} from '@/redux/api/customers-api'
import { useGetSettingsQuery } from '@/redux/api/settings-api'

export default function CustomersPage() {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { currentShop } = useShop()

  const [searchTerm, setSearchTerm] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteCandidate, setDeleteCandidate] = useState<Customer | null>(null)

  useEffect(() => {
    if (!isAuthenticated) router.push('/auth/login')
  }, [isAuthenticated, router])

  const skip = !isAuthenticated || !currentShop
  const { data: customers = [], error } = useListCustomersQuery({ shopId: currentShop?.id ?? '' }, { skip })
  const { data: settings } = useGetSettingsQuery({ shopId: currentShop?.id ?? '' }, { skip })

  const [createCustomer] = useCreateCustomerMutation()
  const [updateCustomer] = useUpdateCustomerMutation()
  const [deleteCustomer, { isLoading: isDeleting }] = useDeleteCustomerMutation()

  useEffect(() => {
    if (!error) return
    toast({ title: 'Error', description: 'Failed to load customers', variant: 'destructive' })
  }, [error, toast])

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return customers
    return customers.filter((c) => {
      const hay = [c.name, c.email ?? '', c.phone ?? ''].join(' ').toLowerCase()
      return hay.includes(q)
    })
  }, [customers, searchTerm])

  useEffect(() => {
    if (!modalOpen) return
    setName(editing?.name ?? '')
    setEmail(editing?.email ?? '')
    setPhone(editing?.phone ?? '')
    setAddress(editing?.address ?? '')
    setNotes(editing?.notes ?? '')
    setIsActive(editing?.isActive ?? true)
    setIsSubmitting(false)
  }, [editing, modalOpen])

  if (!isAuthenticated) return null

  const canManageCustomers = useMemo(() => {
    if (!user) return false
    if (user.role === 'admin' || user.role === 'super_admin') return true
    const roleKey = String(user.role ?? '')
    return Boolean((settings?.rolePermissions as any)?.[roleKey]?.customers)
  }, [settings?.rolePermissions, user])

  const openCreate = () => {
    if (!canManageCustomers) {
      toast({
        title: 'Access denied',
        description: 'You do not have permission to manage customers',
        variant: 'destructive',
      })
      return
    }
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (c: Customer) => {
    if (!canManageCustomers) {
      toast({
        title: 'Access denied',
        description: 'You do not have permission to manage customers',
        variant: 'destructive',
      })
      return
    }
    setEditing(c)
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    if (!canManageCustomers) {
      toast({
        title: 'Access denied',
        description: 'You do not have permission to manage customers',
        variant: 'destructive',
      })
      return
    }

    const trimmedName = name.trim()
    if (!trimmedName) {
      toast({ title: 'Error', description: 'Customer name is required', variant: 'destructive' })
      return
    }
    if (!currentShop) {
      toast({ title: 'Error', description: 'Select a shop first', variant: 'destructive' })
      return
    }

    try {
      setIsSubmitting(true)
      if (editing) {
        await updateCustomer({
          shopId: currentShop.id,
          customerId: editing.id,
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
        await createCustomer({
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
      toast({ title: 'Success', description: editing ? 'Customer updated' : 'Customer created' })
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save customer',
        variant: 'destructive',
      })
      setIsSubmitting(false)
    }
  }

  const handleDelete = (c: Customer) => {
    if (!canManageCustomers) {
      toast({
        title: 'Access denied',
        description: 'You do not have permission to manage customers',
        variant: 'destructive',
      })
      return
    }
    if (!currentShop) return
    setDeleteCandidate(c)
  }

  const confirmDelete = async () => {
    if (!deleteCandidate) return
    if (!currentShop) return
    try {
      await deleteCustomer({ shopId: currentShop.id, customerId: deleteCandidate.id }).unwrap()
      toast({ title: 'Deleted', description: 'Customer deleted' })
      setDeleteCandidate(null)
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete customer',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground mt-2">Manage your customer directory</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
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

          <Button type="button" className="h-9 gap-2 rounded-lg" onClick={openCreate} disabled={!canManageCustomers || !currentShop}>
            <Plus className="h-4 w-4" />
            Add Customer
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Customer</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Contact</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="w-28 px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((c) => {
                  const status = c.isActive ? 'Active' : 'Inactive'
                  return (
                    <tr key={c.id} className="transition-colors hover:bg-muted/50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-card-foreground">{c.name}</span>
                            {c.email ? <span className="text-xs text-muted-foreground">{c.email}</span> : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-sm text-card-foreground">{c.phone || '—'}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[11px] font-medium',
                            c.isActive ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-muted text-muted-foreground',
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
                            onClick={() => openEdit(c)}
                            disabled={!canManageCustomers}
                          >
                            <Edit2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="rounded-md hover:bg-secondary"
                            onClick={() => handleDelete(c)}
                            disabled={!canManageCustomers}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit customer' : 'Add customer'}</DialogTitle>
            <DialogDescription>{editing ? 'Update customer details' : 'Create a new customer record'}</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSave}>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Customer name" disabled={!canManageCustomers || isSubmitting} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" disabled={!canManageCustomers || isSubmitting} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Phone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" disabled={!canManageCustomers || isSubmitting} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Address</label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" disabled={!canManageCustomers || isSubmitting} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" disabled={!canManageCustomers || isSubmitting} />
            </div>
            {editing ? (
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Active</span>
                  <span className="text-xs text-muted-foreground">Inactive customers remain in the directory</span>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} disabled={!canManageCustomers || isSubmitting} />
              </div>
            ) : null}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!canManageCustomers || isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDeleteDialog
        open={!!deleteCandidate}
        onOpenChange={(open) => setDeleteCandidate(open ? deleteCandidate : null)}
        title="Delete customer?"
        description={
          deleteCandidate ? (
            <span>
              This will permanently delete <span className="font-medium">{deleteCandidate.name}</span>.
            </span>
          ) : null
        }
        confirmText="Delete customer"
        loading={isDeleting}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
