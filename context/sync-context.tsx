'use client'

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import {
  db,
  getPendingSyncItems,
  updateSyncItemStatus,
  removeSyncItem,
  markReceiptSynced,
  type SyncQueueItem,
} from '@/lib/db'

export interface SyncContextType {
  isOnline: boolean
  isSyncing: boolean
  pendingCount: number
  lastSyncTime: number | null
  triggerSync: () => void
  forceOnline: () => void
}

const SyncContext = createContext<SyncContextType>({
  isOnline: true,
  isSyncing: false,
  pendingCount: 0,
  lastSyncTime: null,
  triggerSync: () => {},
  forceOnline: () => {},
})

export function useSync() {
  const context = useContext(SyncContext)
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider')
  }
  return context
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
const MAX_RETRIES = 5
const RETRY_DELAY_MS = 3000

async function processQueueItem(item: SyncQueueItem, api: typeof fetch): Promise<boolean> {
  const endpoint = `${API_URL}/api`

  switch (item.type) {
    case 'CREATE_RECEIPT': {
      const payload = item.payload as {
        shopId: string
        items: Array<{ productId: string; qty: number; name: string; unitPriceCents: number }>
        customerId?: string
        customerName: string
        paymentMethod: string
        taxCents: number
      }
      const res = await api(`${endpoint}/shops/${payload.shopId}/receipts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: payload.items.map(i => ({
            productId: i.productId,
            qty: i.qty,
            name: i.name,
            unitPriceCents: i.unitPriceCents,
          })),
          customerId: payload.customerId || undefined,
          customerName: payload.customerName,
          paymentMethod: payload.paymentMethod,
          taxCents: payload.taxCents,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Sync failed' }))
        throw new Error(err.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      await markReceiptSynced(item.entityId)
      return true
    }

    case 'UPDATE_STOCK': {
      const payload = item.payload as { shopId: string; productId: string; qtyChange: number }
      const res = await api(`${endpoint}/shops/${payload.shopId}/products/${payload.productId}/adjust-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adjustment: payload.qtyChange, reason: 'offline_sync' }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Sync failed' }))
        throw new Error(err.error || `HTTP ${res.status}`)
      }
      return true
    }

    default:
      throw new Error(`Unknown sync type: ${item.type}`)
  }
}

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast()
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null)

  const isProcessingRef = useRef(false)
  const syncTriggeredRef = useRef(false)

  const updatePendingCount = useCallback(async () => {
    try {
      const items = await getPendingSyncItems()
      setPendingCount(items.length)
    } catch {
      setPendingCount(0)
    }
  }, [])

  const processQueue = useCallback(async () => {
    if (isProcessingRef.current || !navigator.onLine) return
    isProcessingRef.current = true
    setIsSyncing(true)

    try {
      const items = await getPendingSyncItems()
      if (items.length === 0) {
        setIsSyncing(false)
        isProcessingRef.current = false
        return
      }

      let successCount = 0
      let failCount = 0

      // Process in parallel with a concurrency limit
      const CONCURRENCY = 5
      for (let i = 0; i < items.length; i += CONCURRENCY) {
        if (!navigator.onLine) break

        const batch = items.slice(i, i + CONCURRENCY)
        await Promise.all(
          batch.map(async (item) => {
            await updateSyncItemStatus(item.id!, 'processing')

            try {
              const success = await processQueueItem(item, fetch)
              if (success) {
                await removeSyncItem(item.id!)
                successCount++
              }
            } catch (err) {
              const errorMessage = err instanceof Error ? err.message : 'Unknown error'
              const shouldRetry = item.retryCount < MAX_RETRIES

              if (shouldRetry) {
                await updateSyncItemStatus(item.id!, 'pending', errorMessage)
              } else {
                await updateSyncItemStatus(item.id!, 'failed', errorMessage)
                failCount++
              }
            }
          })
        )

        await updatePendingCount()
      }

      if (successCount > 0) {
        toast({
          title: 'Sync complete',
          description: `Successfully synced ${successCount} item(s)`,
        })
      }

      if (failCount > 0) {
        toast({
          title: 'Sync issues',
          description: `${failCount} item(s) failed to sync after multiple attempts`,
          variant: 'destructive',
        })
      }

      setLastSyncTime(Date.now())
    } catch (err) {
      console.error('Sync processing error:', err)
    } finally {
      isProcessingRef.current = false
      setIsSyncing(false)
    }
  }, [toast, updatePendingCount])

  const triggerSync = useCallback(() => {
    if (syncTriggeredRef.current) return
    syncTriggeredRef.current = true

    if (navigator.onLine) {
      processQueue().finally(() => {
        syncTriggeredRef.current = false
      })
    } else {
      syncTriggeredRef.current = false
    }
  }, [processQueue])

  const forceOnline = useCallback(() => {
    setIsOnline(true)
    triggerSync()
  }, [triggerSync])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      toast({
        title: 'Back online',
        description: 'Syncing pending items...',
      })
      triggerSync()
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast({
        title: 'You are offline',
        description: 'Sales will be saved locally and synced when back online.',
        variant: 'default',
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    setIsOnline(navigator.onLine)

    updatePendingCount()

    const interval = setInterval(() => {
      updatePendingCount()
      if (navigator.onLine) {
        triggerSync()
      }
    }, 30000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [toast, triggerSync, updatePendingCount])

  return (
    <SyncContext.Provider
      value={{
        isOnline,
        isSyncing,
        pendingCount,
        lastSyncTime,
        triggerSync,
        forceOnline,
      }}
    >
      {children}
    </SyncContext.Provider>
  )
}
