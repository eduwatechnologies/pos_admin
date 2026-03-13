'use client'

import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import { Product, Receipt, Employee } from '@/lib/types'

interface SyncContextType {
  lastSyncTime: Date | null
  isSyncing: boolean
  syncData: () => Promise<void>
  saveData: (data: SyncData) => void
  loadData: () => SyncData | null
}

export interface SyncData {
  products: Product[]
  receipts: Receipt[]
  employees: Employee[]
  version: number
  timestamp: number
}

const SyncContext = createContext<SyncContextType | undefined>(undefined)

const SYNC_KEY = 'pos_sync_data'
const SYNC_VERSION = 1

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize sync time from localStorage
  React.useEffect(() => {
    const storedData = localStorage.getItem(SYNC_KEY)
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData) as SyncData
        setLastSyncTime(new Date(parsed.timestamp))
      } catch {
        localStorage.removeItem(SYNC_KEY)
      }
    }
  }, [])

  const saveData = useCallback((data: SyncData) => {
    const syncData: SyncData = {
      ...data,
      version: SYNC_VERSION,
      timestamp: Date.now(),
    }
    localStorage.setItem(SYNC_KEY, JSON.stringify(syncData))
    setLastSyncTime(new Date(syncData.timestamp))
  }, [])

  const loadData = useCallback((): SyncData | null => {
    const storedData = localStorage.getItem(SYNC_KEY)
    if (!storedData) return null

    try {
      const parsed = JSON.parse(storedData) as SyncData
      if (parsed.version === SYNC_VERSION) {
        return parsed
      }
    } catch {
      localStorage.removeItem(SYNC_KEY)
    }
    return null
  }, [])

  const syncData = useCallback(async () => {
    setIsSyncing(true)

    // Simulate cloud sync delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // In a real app, this would:
    // 1. Send current data to server
    // 2. Fetch updates from server
    // 3. Merge changes
    // 4. Update localStorage

    setIsSyncing(false)
    setLastSyncTime(new Date())

    // Schedule next auto-sync in 30 seconds
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }
    syncTimeoutRef.current = setTimeout(() => {
      syncData()
    }, 30000) // Auto-sync every 30 seconds
  }, [])

  // Start auto-sync on mount
  React.useEffect(() => {
    const timer = setTimeout(() => {
      syncData()
    }, 5000) // First sync after 5 seconds

    return () => {
      clearTimeout(timer)
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [])

  return (
    <SyncContext.Provider
      value={{
        lastSyncTime,
        isSyncing,
        syncData,
        saveData,
        loadData,
      }}
    >
      {children}
    </SyncContext.Provider>
  )
}

export function useSync() {
  const context = useContext(SyncContext)
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider')
  }
  return context
}
