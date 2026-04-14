'use client'

import { useCallback, useEffect, useState } from 'react'
import { db, initializeLocalData, getLocalProducts, type LocalProduct } from '@/lib/db'
import { useSync } from '@/context/sync-context'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export function useLocalProducts(shopId: string | undefined, remoteProducts: LocalProduct[] = []) {
  const { isOnline } = useSync()
  const [localProducts, setLocalProducts] = useState<LocalProduct[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (!shopId) return

    const init = async () => {
      try {
        const local = await getLocalProducts(shopId)
        setLocalProducts(local)
        setIsInitialized(true)
      } catch (err) {
        console.error('Failed to initialize local products:', err)
        setIsInitialized(true)
      }
    }

    init()
  }, [shopId])

  useEffect(() => {
    if (!shopId || !isOnline || remoteProducts.length === 0) return

    const syncToLocal = async () => {
      try {
        await initializeLocalData(shopId, remoteProducts)
        const local = await getLocalProducts(shopId)
        setLocalProducts(local)
      } catch (err) {
        console.error('Failed to sync products to local:', err)
      }
    }

    syncToLocal()
  }, [shopId, isOnline, remoteProducts])

  return {
    products: isOnline ? remoteProducts : localProducts,
    localProducts,
    isInitialized,
    isUsingLocal: !isOnline && localProducts.length > 0,
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
    cashierUserId: string | null
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
      cashierUserId: receipt.cashierId || null,
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
