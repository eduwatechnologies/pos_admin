'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
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
import { normalizeBaseUrl } from '@/lib/api/http'

interface AddProductModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (product: Partial<Product>) => void | Promise<void>
  initialProduct?: Product
  categories?: string[]
  shopId?: string
}

export function AddProductModal({
  open,
  onOpenChange,
  onSave,
  initialProduct,
  categories,
  shopId,
}: AddProductModalProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [formData, setFormData] = useState<Partial<Product>>(
    initialProduct || {
      name: '',
      category: 'General',
      sku: '',
      imageUrl: '',
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
        imageUrl: '',
        price: 0,
        quantity: 0,
        reorderLevel: 0,
      }
    )
  }, [initialProduct, open])

  const uploadImage = async (file: File) => {
    if (!shopId) {
      toast({ title: 'Error', description: 'Select a shop first', variant: 'destructive' })
      return
    }

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Upload failed', description: 'Only images are allowed', variant: 'destructive' })
      return
    }
    if (file.size > 4 * 1024 * 1024) {
      toast({ title: 'Upload failed', description: 'Image is too large (max 4MB)', variant: 'destructive' })
      return
    }

    try {
      setIsUploadingImage(true)
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
      const baseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080')
      const url = `${baseUrl}/shops/${shopId}/products/upload-image`

      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result ?? ''))
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsDataURL(file)
      })

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dataUrl }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const message = typeof data?.error === 'string' && data.error ? data.error : 'Upload failed'
        throw new Error(message)
      }

      const uploadedUrl = String(data?.url ?? '')
      if (!uploadedUrl) throw new Error('Upload failed')

      setFormData((prev) => ({ ...prev, imageUrl: uploadedUrl }))
      toast({ title: 'Image uploaded', description: 'Preview updated' })
    } catch (err) {
      toast({
        title: 'Upload failed',
        description: err instanceof Error ? err.message : 'Upload failed',
        variant: 'destructive',
      })
    } finally {
      setIsUploadingImage(false)
    }
  }

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
      <DialogContent className="max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{initialProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          <DialogDescription>
            {initialProduct ? 'Update product details' : 'Add a new product to your inventory'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1">
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

            <div className="space-y-2">
              <label htmlFor="imageUrl" className="text-sm font-medium">
                Image URL
              </label>
              <Input
                id="imageUrl"
                type="url"
                value={formData.imageUrl || ''}
                onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://cdn.example.com/image.jpg"
              />
              <div>
                <Input
                  type="file"
                  accept="image/*"
                  disabled={isSubmitting || isUploadingImage || !shopId}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    uploadImage(file)
                  }}
                />
              </div>
              {formData.imageUrl ? (
                <div className="rounded-lg border border-border p-2">
                  <Image src={formData.imageUrl} alt="Preview" width={256} height={128} className="max-h-32 object-contain mx-auto" />
                </div>
              ) : null}
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
