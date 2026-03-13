'use client'

import { useState } from 'react'
import { useAuth } from '@/context/auth-context'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { InventoryTable } from './components/inventory-table'
import { AddProductModal } from './components/add-product-modal'
import { Product } from '@/lib/types'
import { Plus } from 'lucide-react'
import { useShop } from '@/context/shop-context'
import { api } from '@/lib/api/client'

export default function InventoryPage() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { currentShop } = useShop()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | undefined>()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!isAuthenticated || !currentShop) return
      setIsLoading(true)
      try {
        const items = await api.products.list(currentShop.id)
        if (!cancelled) setProducts(items)
      } catch (err) {
        if (cancelled) return
        toast({
          title: 'Error',
          description: err instanceof Error ? err.message : 'Failed to load products',
          variant: 'destructive',
        })
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, currentShop, toast])

  if (!isAuthenticated) {
    return null
  }

  const handleAddProduct = async (productData: Partial<Product>) => {
    if (!currentShop) {
      toast({
        title: 'Error',
        description: 'Select a shop first',
        variant: 'destructive',
      })
      return
    }

    try {
      if (editingProduct) {
        const updated = await api.products.update(currentShop.id, editingProduct.id, {
          name: productData.name ?? editingProduct.name,
          sku: productData.sku ?? editingProduct.sku,
          price: productData.price ?? editingProduct.price,
          quantity: productData.quantity ?? editingProduct.quantity,
          reorderLevel: productData.reorderLevel ?? editingProduct.reorderLevel,
        })
        setProducts(prev => prev.map(p => (p.id === updated.id ? updated : p)))
        setEditingProduct(undefined)
      } else {
        const created = await api.products.create(currentShop.id, {
          name: productData.name ?? '',
          sku: productData.sku ?? '',
          price: productData.price ?? 0,
          quantity: productData.quantity ?? 0,
          reorderLevel: productData.reorderLevel ?? 0,
        })
        setProducts(prev => [created, ...prev])
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save product',
        variant: 'destructive',
      })
      throw err
    }
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setModalOpen(true)
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!currentShop) return
    try {
      await api.products.remove(currentShop.id, productId)
      setProducts(prev => prev.filter(p => p.id !== productId))
      toast({
        title: 'Success',
        description: 'Product deleted',
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete product',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground mt-2">Manage your products and stock levels</p>
        </div>
        <Button
          onClick={() => {
            setEditingProduct(undefined)
            setModalOpen(true)
          }}
          className="gap-2"
          disabled={!currentShop || isLoading}
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      <InventoryTable
        products={products}
        onEdit={handleEditProduct}
        onDelete={handleDeleteProduct}
      />

      <AddProductModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={handleAddProduct}
        initialProduct={editingProduct}
      />
    </div>
  )
}
