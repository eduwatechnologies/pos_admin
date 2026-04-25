'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/context/auth-context'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { InventoryTable } from './components/inventory-table'
import { AddProductModal } from './components/add-product-modal'
import { Product } from '@/lib/types'
import { useShop } from '@/context/shop-context'
import { useListCategoriesQuery } from '@/redux/api/categories-api'
import { useGetSettingsQuery } from '@/redux/api/settings-api'
import {
  useCreateProductMutation,
  useDeleteProductMutation,
  useListProductsQuery,
  useUpdateProductMutation,
} from '@/redux/api/products-api'

export default function InventoryPage() {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { currentShop } = useShop()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | undefined>()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, router])

  const { data: products = [], isFetching: isLoading, error } = useListProductsQuery(
    { shopId: currentShop?.id ?? '' },
    { skip: !isAuthenticated || !currentShop }
  )

  const { data: categories = [], error: categoriesError } = useListCategoriesQuery(
    { shopId: currentShop?.id ?? '' },
    { skip: !isAuthenticated || !currentShop }
  )

  const { data: settings } = useGetSettingsQuery({ shopId: currentShop?.id ?? '' }, { skip: !isAuthenticated || !currentShop })

  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation()
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation()
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation()

  useEffect(() => {
    if (!error) return
    toast({
      title: 'Error',
      description: 'Failed to load products',
      variant: 'destructive',
    })
  }, [error, toast])

  useEffect(() => {
    if (!categoriesError) return
    toast({
      title: 'Error',
      description: 'Failed to load categories',
      variant: 'destructive',
    })
  }, [categoriesError, toast])

  const canManageInventory = useMemo(() => {
    if (!user) return false
    if (user.role === 'admin' || user.role === 'super_admin') return true
    const roleKey = String(user.role ?? '')
    return Boolean((settings?.rolePermissions as any)?.[roleKey]?.inventory)
  }, [settings?.rolePermissions, user])

  const categoryOptions = useMemo(() => {
    const set = new Set<string>(['General'])
    categories.forEach((c) => set.add(c.name))
    if (editingProduct?.category) set.add(editingProduct.category)
    return Array.from(set)
  }, [categories, editingProduct?.category])

  if (!isAuthenticated) {
    return null
  }

  const handleAddProduct = async (productData: Partial<Product>) => {
    if (!canManageInventory) {
      toast({
        title: 'Access denied',
        description: 'You do not have permission to manage inventory',
        variant: 'destructive',
      })
      return
    }
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
        await updateProduct({
          shopId: currentShop.id,
          productId: editingProduct.id,
          input: {
          name: productData.name ?? editingProduct.name,
          category: productData.category ?? editingProduct.category,
          sku: productData.sku ?? editingProduct.sku,
          imageUrl: productData.imageUrl ?? editingProduct.imageUrl,
          price: productData.price ?? editingProduct.price,
          quantity: productData.quantity ?? editingProduct.quantity,
          reorderLevel: productData.reorderLevel ?? editingProduct.reorderLevel,
          },
        }).unwrap()
        setEditingProduct(undefined)
      } else {
        await createProduct({
          shopId: currentShop.id,
          input: {
          name: productData.name ?? '',
          category: productData.category ?? 'General',
          sku: productData.sku ?? '',
          imageUrl: productData.imageUrl ?? '',
          price: productData.price ?? 0,
          quantity: productData.quantity ?? 0,
          reorderLevel: productData.reorderLevel ?? 0,
          },
        }).unwrap()
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
    if (!canManageInventory) {
      toast({
        title: 'Access denied',
        description: 'You do not have permission to manage inventory',
        variant: 'destructive',
      })
      return
    }
    setEditingProduct(product)
    setModalOpen(true)
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!canManageInventory) {
      toast({
        title: 'Access denied',
        description: 'You do not have permission to manage inventory',
        variant: 'destructive',
      })
      return
    }
    if (!currentShop) return
    try {
      await deleteProduct({ shopId: currentShop.id, productId }).unwrap()
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
      <InventoryTable
        products={products}
        onAdd={
          canManageInventory
            ? () => {
                setEditingProduct(undefined)
                setModalOpen(true)
              }
            : undefined
        }
        onEdit={handleEditProduct}
        onDelete={handleDeleteProduct}
        disableActions={!canManageInventory || !currentShop || isLoading || isCreating || isUpdating || isDeleting}
      />

      <AddProductModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={handleAddProduct}
        initialProduct={editingProduct}
        categories={categoryOptions}
        shopId={currentShop?.id}
      />
    </div>
  )
}
