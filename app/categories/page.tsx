'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Filter, Folder, Plus, Search, Trash2, Edit2 } from 'lucide-react'

import { useAuth } from '@/context/auth-context'
import { useShop } from '@/context/shop-context'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { Category } from '@/lib/types'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import {
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useListCategoriesQuery,
  useUpdateCategoryMutation,
} from '@/redux/api/categories-api'
import { useGetSettingsQuery } from '@/redux/api/settings-api'

export default function CategoriesPage() {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { currentShop } = useShop()

  const [searchTerm, setSearchTerm] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteCandidate, setDeleteCandidate] = useState<Category | null>(null)

  useEffect(() => {
    if (!isAuthenticated) router.push('/auth/login')
  }, [isAuthenticated, router])

  const skip = !isAuthenticated || !currentShop
  const { data: categories = [], error } = useListCategoriesQuery({ shopId: currentShop?.id ?? '' }, { skip })
  const { data: settings } = useGetSettingsQuery({ shopId: currentShop?.id ?? '' }, { skip })

  const [createCategory] = useCreateCategoryMutation()
  const [updateCategory] = useUpdateCategoryMutation()
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation()

  useEffect(() => {
    if (!error) return
    toast({ title: 'Error', description: 'Failed to load categories', variant: 'destructive' })
  }, [error, toast])

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return categories
    return categories.filter((c) => c.name.toLowerCase().includes(q))
  }, [categories, searchTerm])

  useEffect(() => {
    if (!modalOpen) return
    setName(editing?.name ?? 'General')
    setIsSubmitting(false)
  }, [editing, modalOpen])

  if (!isAuthenticated) return null

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (c: Category) => {
    setEditing(c)
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    const trimmed = name.trim()
    if (!trimmed) {
      toast({ title: 'Error', description: 'Category name is required', variant: 'destructive' })
      return
    }
    if (!currentShop) {
      toast({ title: 'Error', description: 'Select a shop first', variant: 'destructive' })
      return
    }

    try {
      setIsSubmitting(true)
      if (editing) {
        await updateCategory({ shopId: currentShop.id, categoryId: editing.id, input: { name: trimmed } }).unwrap()
      } else {
        await createCategory({ shopId: currentShop.id, input: { name: trimmed } }).unwrap()
      }
      setModalOpen(false)
      toast({ title: 'Success', description: editing ? 'Category updated' : 'Category created' })
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save category',
        variant: 'destructive',
      })
      setIsSubmitting(false)
    }
  }

  const handleDelete = (c: Category) => {
    if (!currentShop) return
    setDeleteCandidate(c)
  }

  const confirmDelete = async () => {
    if (!deleteCandidate) return
    if (!currentShop) return
    try {
      await deleteCategory({ shopId: currentShop.id, categoryId: deleteCandidate.id }).unwrap()
      toast({ title: 'Deleted', description: 'Category deleted' })
      setDeleteCandidate(null)
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete category',
        variant: 'destructive',
      })
    }
  }

  const canManage = useMemo(() => {
    if (!user) return false
    if (user.role === 'admin' || user.role === 'super_admin') return true
    const roleKey = String(user.role ?? '')
    return Boolean((settings?.rolePermissions as any)?.[roleKey]?.inventory)
  }, [settings?.rolePermissions, user])

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 w-[260px] rounded-lg pl-9"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-9 gap-2 rounded-lg text-muted-foreground hover:text-foreground"
            >
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>

          <Button type="button" className="h-9 gap-2 rounded-lg" onClick={openCreate} disabled={!canManage}>
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Category
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
                {filtered.map((c) => {
                  const status = c.isActive ? 'Active' : 'Inactive'
                  return (
                    <tr key={c.id} className="transition-colors hover:bg-muted/50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                            <Folder className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <span className="text-sm font-medium text-card-foreground">{c.name}</span>
                        </div>
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
                            disabled={!canManage}
                          >
                            <Edit2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="rounded-md hover:bg-secondary"
                            onClick={() => handleDelete(c)}
                            disabled={!canManage}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Category' : 'Add New Category'}</DialogTitle>
            <DialogDescription>{editing ? 'Update category name' : 'Create a category for your products'}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="categoryName" className="text-sm font-medium">
                Category Name *
              </label>
              <Input
                id="categoryName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Drinks"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !canManage}>
                {editing ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDeleteDialog
        open={!!deleteCandidate}
        onOpenChange={(open) => setDeleteCandidate(open ? deleteCandidate : null)}
        title="Delete category?"
        description={
          deleteCandidate ? (
            <span>
              This will permanently delete <span className="font-medium">{deleteCandidate.name}</span>.
            </span>
          ) : null
        }
        confirmText="Delete category"
        loading={isDeleting}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
