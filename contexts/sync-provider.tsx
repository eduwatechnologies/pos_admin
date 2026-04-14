'use client'

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import {
  db,
  getPendingSyncItems,
  updateSyncItemStatus,
  removeSyncItem,
  markReceiptSynced,
  type SyncQueueItem,
} from '@/lib/db'

interface SyncContextType {
  isOnline: boolean
  isSyncing: boolean
  pendingCount: number
  lastSyncTime: number | null
  triggerSync: () => void
}

const SyncContext = createContext<SyncContextType | null>(null)

export function useSync() {
  const ctx = useContext(SyncContext)
  if (!ctx) throw new Error('useSync must be used within SyncProvider')
  return ctx
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

async function processSyncItem(item: SyncQueueItem): Promise<boolean> {
  try {
    switch (item.type) {
      case 'CREATE_RECEIPT': {
        const receipt = item.payload as {
          shopId: string
          items: Array<{ productId: string; name: string; qty: number; unitPriceCents: number }>
          customerName: string
          paymentMethod: string
          taxCents: number
          customerId?: string
        }
        const res = await fetch(`${API_URL}/api/shops/${receipt.shopId}/receipts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: receipt.items,
            customerId: receipt.customerId ?? undefined,
            customerName: receipt.customerName,
            paymentMethod: receipt.paymentMethod,
            taxCents: receipt.taxCents,
          }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(err.error || `HTTP ${res.status}`)
        }
        const data = await res.json()
        await markReceiptSynced(item.entityId)
        return true
      }
      case 'UPDATE_STOCK': {
        const stock = item.payload as { shopId: string; productId: string; qtyChange: number }
        const res = await fetch(`${API_URL}/api/shops/${stock.shopId}/products/${stock.productId}/adjust-stock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adjustment: stock.qtyChange, reason: 'offline_sync' }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(err.error || `HTTP ${res.status}`)
        }
        return true
      }
      default:
        return true
    }
  } catch (err) {
    console.error(`Sync error for item ${item.id}:`, err)
    throw err
  }
}

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null)
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isSyncingRef = useRef(false)

  const updatePendingCount = useCallback(async () => {
    const count = await db.syncQueue.where({ status: 'pending' }).count()
    setPendingCount(count)
  }, [])

  const processQueue = useCallback(async () => {
    if (isSyncingRef.current || !navigator.onLine) return
    isSyncingRef.current = true
    setIsSyncing(true)

    try {
      const pendingItems = await getPendingSyncItems()
      for (const item of pendingItems) {
        if (item.retryCount >= 5) {
          await updateSyncItemStatus(item.id!, 'failed', 'Max retries exceeded')
          continue
        }
        await updateSyncItemStatus(item.id!, 'processing')
        try {
          const success = await processSyncItem(item)
          if (success) {
            await removeSyncItem(item.id!)
            await updatePendingCount()
          } else {
            await updateSyncItemStatus(item.id!, 'pending', 'Unknown error')
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error'
          await updateSyncItemStatus(item.id!, 'pending', message)
        }
      }
      setLastSyncTime(Date.now())
    } finally {
      isSyncingRef.current = false
      setIsSyncing(false)
      await updatePendingCount()
    }
  }, [updatePendingCount])

  const triggerSync = useCallback(() => {
    if (navigator.onLine) {
      processQueue()
    }
  }, [processQueue])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      processQueue()
    }
    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setIsOnline(navigator.onLine)

    updatePendingCount()

    syncIntervalRef.current = setInterval(() => {
      if (navigator.onLine) {
        processQueue()
      }
    }, 30000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
      }
    }
  }, [processQueue, updatePendingCount])

  return (
    <SyncContext.Provider
      value={{
        isOnline,
        isSyncing,
        pendingCount,
        lastSyncTime,
        triggerSync,
      }}
    >
      {children}
    </SyncContext.Provider>
  )
}
