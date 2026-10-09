import { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/redux/store'
import { selectOfflineQueue, selectIsProcessing } from '@/redux/offline/offline-queue-slice'
import { enqueue, markRetrying, markSynced, markError, setProcessing, removeSynced } from '@/redux/offline/offline-queue-slice'

const RETRY_DELAYS = [1000, 3000, 10000]
const MAX_RETRIES = 3

function isNetworkError(error: any): boolean {
  if (!error) return false
  if (error.name === 'NetworkError' || error.name === 'TypeError') return true
  if (error.message?.includes('fetch') || error.message?.includes('network')) return true
  if (error.status === undefined && error.code === 'ERR_NETWORK') return true
  return false
}

function isRetryableError(error: any): boolean {
  if (isNetworkError(error)) return true
  if (error.status === 500 || error.status === 502 || error.status === 503 || error.status === 504) return true
  if (error.status === 429) return true
  return false
}

function isAuthError(error: any): boolean {
  return error.status === 401
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    setIsOnline(navigator.onLine)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

export function useProcessQueue() {
  const dispatch = useDispatch<AppDispatch>()
  const queue = useSelector(selectOfflineQueue)
  const isProcessing = useSelector(selectIsProcessing)
  const isOnline = useOnlineStatus()
  const processingRef = useRef(false)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const processQueue = useCallback(async () => {
    if (processingRef.current || !isOnline) return
    
    const pendingOps = queue.filter((op) => op.status === 'pending' || op.status === 'retrying')
    if (pendingOps.length === 0) return

    processingRef.current = true
    dispatch(setProcessing(true))

    for (const op of pendingOps) {
      if (!navigator.onLine) break
      
      dispatch(markRetrying(op.id))

      try {
        let response: any

        if (op.type === 'receipt.create') {
          const { createReceipt } = await import('@/redux/api/receipts-api')
          response = await dispatch(createReceipt(op.payload)).unwrap()
        } else if (op.type === 'customer.create') {
          const { createCustomer } = await import('@/redux/api/customers-api')
          response = await dispatch(createCustomer(op.payload)).unwrap()
        }

        dispatch(markSynced({ id: op.id, serverId: response?.data?._id || response?.id }))
        
        // Invalidate relevant tags
        if (op.type === 'receipt.create') {
          dispatch(import('@/redux/api/receipts-api').then((m) => m.receiptsApi.util.invalidateTags(['Receipt'])))
          dispatch(import('@/redux/api/products-api').then((m) => m.productsApi.util.invalidateTags(['Product'])))
        } else if (op.type === 'customer.create') {
          dispatch(import('@/redux/api/customers-api').then((m) => m.customersApi.util.invalidateTags(['Customer'])))
        }

        // If this was a customer creation with temp ID, we need to update receipts that reference it
        if (op.type === 'customer.create' && op.optimistic?.tempCustomerId && response?.data?._id) {
          // TODO: Update any offline receipts that reference the temp customer ID
        }

      } catch (error: any) {
        if (isAuthError(error)) {
          // Don't retry auth errors - they need user intervention
          dispatch(markError({ id: op.id, error: 'Authentication required' }))
          continue
        }

        if (isRetryableError(error) && op.attempts < MAX_RETRIES) {
          // Will be retried on next cycle
          console.log(`[OfflineQueue] Retrying ${op.id} (attempt ${op.attempts + 1})`)
        } else {
          const errorMsg = isNetworkError(error) 
            ? 'Network error - will retry when online' 
            : error.message || 'Unknown error'
          dispatch(markError({ id: op.id, error: errorMsg }))
        }
      }
    }

    // Clean up synced items
    dispatch(removeSynced())
    processingRef.current = false
    dispatch(setProcessing(false))

    // Schedule next retry if there are still pending/error items that can be retried
    const remaining = queue.filter((op) => 
      (op.status === 'pending' || op.status === 'retrying') && 
      (op.status !== 'error' || isRetryableError({ status: op.lastError }))
    )
    if (remaining.length > 0 && isOnline) {
      const delay = RETRY_DELAYS[Math.min(remaining.length - 1, RETRY_DELAYS.length - 1)]
      retryTimeoutRef.current = setTimeout(() => {
        dispatch(setProcessing(false))
        processQueue()
      }, delay)
    }
  }, [dispatch, queue, isOnline, isProcessing])

  // Trigger processing when online status changes
  useEffect(() => {
    if (isOnline && !isProcessing) {
      processQueue()
    }
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [isOnline, isProcessing, processQueue])

  return { processQueue, isProcessing, isOnline }
}

export function useOfflineQueue() {
  const queue = useSelector(selectOfflineQueue)
  const pendingCount = queue.filter((q) => q.status === 'pending' || q.status === 'retrying').length
  const errorCount = queue.filter((q) => q.status === 'error').length
  const syncedCount = queue.filter((q) => q.status === 'synced').length

  return { queue, pendingCount, errorCount, syncedCount }
}