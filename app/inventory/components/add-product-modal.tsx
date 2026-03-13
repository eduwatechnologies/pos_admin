'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Product } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

interface AddProductModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (product: Partial<Product>) => void | Promise<void>
  initialProduct?: Product
}

export function AddProductModal({
  open,
  onOpenChange,
  onSave,
  initialProduct,
}: AddProductModalProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState<Partial<Product>>(
    initialProduct || {
      name: '',
      sku: '',
      price: 0,
      quantity: 0,
      reorderLevel: 0,
    }
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    try {
      await onSave(formData)
    } catch {
      return
    }
    setFormData({
      name: '',
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="price" className="text-sm font-medium">
                Price ($) *
              </label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price || 0}
                onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
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
                onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
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
              onChange={e => setFormData({ ...formData, reorderLevel: parseInt(e.target.value) })}
              placeholder="0"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {initialProduct ? 'Update' : 'Add'} Product
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
