'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Product } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

interface AddProductModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (product: Partial<Product>) => void | Promise<void>
  initialProduct?: Product
  categories?: string[]
}

export function AddProductModal({
  open,
  onOpenChange,
  onSave,
  initialProduct,
  categories,
}: AddProductModalProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<Partial<Product>>(
    initialProduct || {
      name: '',
      category: 'General',
      sku: '',
      price: 0,
      quantity: 0,
      reorderLevel: 0,
    }
  )

  const categoryOptions = useMemo(() => {
    const values = Array.isArray(categories) ? categories : []
    const set = new Set<string>(['General'])
    values.forEach((v) => {
      const name = String(v ?? '').trim()
      if (name) set.add(name)
    })
    const current = String(formData.category ?? '').trim()
    if (current) set.add(current)
    return Array.from(set)
  }, [categories, formData.category])

  useEffect(() => {
    if (!open) return
    setFormData(
      initialProduct || {
        name: '',
        category: 'General',
        sku: '',
        price: 0,
        quantity: 0,
        reorderLevel: 0,
      }
    )
  }, [initialProduct, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    const name = String(formData.name ?? '').trim()
    const category = String(formData.category ?? '').trim()
    const sku = String(formData.sku ?? '').trim()

    if (!name) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsSubmitting(true)
      await onSave({ ...formData, name, category: category || 'General', sku })
    } catch {
      setIsSubmitting(false)
      return
    }
    setIsSubmitting(false)
    setFormData({
      name: '',
      category: 'General',
      sku: '',
      price: 0,
      quantity: 0,
      reorderLevel: 0,
    })
    onOpenChange(false)

    toast({
      title: 'Success',
      description: initialProduct ? 'Product updated' : 'Product added',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          <DialogDescription>
            {initialProduct ? 'Update product details' : 'Add a new product to your inventory'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Product Name *
            </label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Espresso"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="sku" className="text-sm font-medium">
              SKU
            </label>
            <Input
              id="sku"
              value={formData.sku || ''}
              onChange={e => setFormData({ ...formData, sku: e.target.value })}
              placeholder="e.g., ESP001"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Category
            </label>
            <Select
              value={String(formData.category ?? 'General') || 'General'}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
              disabled={isSubmitting}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="price" className="text-sm font-medium">
                Price (₦) *
              </label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price || 0}
              onChange={(e) => {
                const raw = e.target.value
                const value = raw === '' ? 0 : Number(raw)
                setFormData({ ...formData, price: Number.isFinite(value) ? value : 0 })
              }}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="quantity" className="text-sm font-medium">
                Quantity *
              </label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={formData.quantity || 0}
              onChange={(e) => {
                const raw = e.target.value
                const value = raw === '' ? 0 : Number.parseInt(raw, 10)
                setFormData({ ...formData, quantity: Number.isFinite(value) ? value : 0 })
              }}
                placeholder="0"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="reorderLevel" className="text-sm font-medium">
              Reorder Level
            </label>
            <Input
              id="reorderLevel"
              type="number"
              min="0"
              value={formData.reorderLevel || 0}
            onChange={(e) => {
              const raw = e.target.value
              const value = raw === '' ? 0 : Number.parseInt(raw, 10)
              setFormData({ ...formData, reorderLevel: Number.isFinite(value) ? value : 0 })
            }}
              placeholder="0"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {initialProduct ? 'Update' : 'Add'} Product
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
