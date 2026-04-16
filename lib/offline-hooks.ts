'use client'

import { useCallback, useEffect, useState } from 'react'
import { db, initializeLocalData, getLocalProducts, getLocalCategories, type LocalProduct, type LocalReceipt, type LocalCategory } from '@/lib/db'
import { useSync } from '@/context/sync-context'
import type { Receipt, ReceiptItem } from '@/lib/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export function useLocalProducts(
  shopId: string | undefined, 
  remoteProducts: LocalProduct[] = [], 
  remoteCategories: LocalCategory[] = []
) {
  const { isOnline } = useSync()
  const [localProducts, setLocalProducts] = useState<LocalProduct[]>([])
  const [localCategories, setLocalCategories] = useState<LocalCategory[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (!shopId) return

    const init = async () => {
      try {
        const [products, categories] = await Promise.all([
          getLocalProducts(shopId),
          getLocalCategories(shopId)
        ])
        setLocalProducts(products)
        setLocalCategories(categories)
        setIsInitialized(true)
      } catch (err) {
        console.error('Failed to initialize local data:', err)
        setIsInitialized(true)
      }
    }

    init()
  }, [shopId])

  useEffect(() => {
    if (!shopId || !isOnline || (remoteProducts.length === 0 && remoteCategories.length === 0)) return

    const syncToLocal = async () => {
      try {
        await initializeLocalData(shopId, remoteProducts, remoteCategories)
        const [products, categories] = await Promise.all([
          getLocalProducts(shopId),
          getLocalCategories(shopId)
        ])
        setLocalProducts(products)
        setLocalCategories(categories)
      } catch (err) {
        console.error('Failed to sync data to local:', err)
      }
    }

    syncToLocal()
  }, [shopId, isOnline, remoteProducts, remoteCategories])

  return {
    products: isOnline ? remoteProducts : localProducts,
    categories: isOnline ? remoteCategories : localCategories,
    localProducts,
    localCategories,
    isInitialized,
    isUsingLocal: !isOnline && localProducts.length > 0,
  }
}

function mapLocalToReceipt(local: LocalReceipt): Receipt {
  return {
    id: local.id,
    date: new Date(local.createdAt),
    customerId: local.customerId || undefined,
    customerName: local.customerName || undefined,
    items: local.items.map(i => ({
      productId: i.productId,
      productName: i.name,
      quantity: i.qty,
      unitPrice: i.unitPriceCents / 100,
      subtotal: i.lineTotalCents / 100,
    })),
    subtotal: local.subtotalCents / 100,
    tax: local.taxCents / 100,
    total: local.totalCents / 100,
    paymentMethod: local.paymentMethod,
    status: local.status === 'pending' ? 'pending' : 'paid',
    cashierId: local.cashierId || '',
    shopId: local.shopId,
  }
}

export function useLocalReceipts(shopId: string | undefined) {
  const [localReceipts, setLocalReceipts] = useState<Receipt[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadLocal = useCallback(async () => {
    if (!shopId) {
      setLocalReceipts([])
      setIsLoading(false)
      return
    }

    try {
      const locals = await db.receipts
        .where('shopId')
        .equals(shopId)
        .and(r => !r.synced)
        .reverse()
        .sortBy('createdAt')
      
      setLocalReceipts(locals.map(mapLocalToReceipt))
    } catch (err) {
      console.error('Failed to load local receipts:', err)
    } finally {
      setIsLoading(false)
    }
  }, [shopId])

  useEffect(() => {
    loadLocal()
    // Refresh local receipts every 5 seconds to show newly added ones
    const interval = setInterval(loadLocal, 5000)
    return () => clearInterval(interval)
  }, [loadLocal])

  return {
    localReceipts,
    isLoading,
    refresh: loadLocal,
  }
}

export function useOfflineReceipt() {
  const { isOnline, triggerSync } = useSync()
  const [isProcessing, setIsProcessing] = useState(false)

  const saveReceiptLocally = useCallback(async (receipt: {
    shopId: string
    items: Array<{ productId: string; name: string; qty: number; unitPriceCents: number; lineTotalCents: number }>
    subtotalCents: number
    taxCents: number
    discountCents: number
    totalCents: number
    paymentMethod: string
    customerId: string | null
    customerName: string | null
    cashierId: string | null
    source: 'pos'
  }) => {
    const id = `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

    const localReceipt = {
      id,
      localId: id,
      shopId: receipt.shopId,
      items: receipt.items,
      subtotalCents: receipt.subtotalCents,
      taxCents: receipt.taxCents,
      discountCents: receipt.discountCents,
      totalCents: receipt.totalCents,
      paymentMethod: receipt.paymentMethod,
      customerId: receipt.customerId,
      customerName: receipt.customerName,
      cashierId: receipt.cashierId || null,
      status: 'pending' as const,
      synced: false,
      syncedAt: null,
      createdAt: Date.now(),
      source: 'pos' as const,
    }

    await db.receipts.add(localReceipt)

    for (const item of receipt.items) {
      const product = await db.products.get(item.productId)
      if (product) {
        await db.products.update(item.productId, {
          stockQty: Math.max(0, product.stockQty - item.qty),
        })
      }
    }

    await db.syncQueue.add({
      type: 'CREATE_RECEIPT',
      entityId: id,
      payload: {
        shopId: receipt.shopId,
        items: receipt.items.map(i => ({
          productId: i.productId,
          qty: i.qty,
          name: i.name,
          unitPriceCents: i.unitPriceCents,
        })),
        customerId: receipt.customerId || undefined,
        customerName: receipt.customerName || 'Walk-in',
        paymentMethod: receipt.paymentMethod,
        taxCents: receipt.taxCents,
      },
      retryCount: 0,
      status: 'pending',
      createdAt: Date.now(),
      lastError: null,
    })

    if (isOnline) {
      setIsProcessing(true)
      triggerSync()
      setIsProcessing(false)
    }

    return id
  }, [isOnline, triggerSync])

  return {
    saveReceiptLocally,
    isProcessing,
    isOnline,
  }
}
