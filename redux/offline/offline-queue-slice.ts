import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'

export type QueuedOperationType = 'receipt.create' | 'customer.create'

export interface QueuedOperation {
  id: string
  type: QueuedOperationType
  shopId: string
  payload: any
  createdAt: number
  status: 'pending' | 'retrying' | 'synced' | 'error'
  attempts: number
  lastError?: string
  syncedAt?: number
  serverId?: string
  optimistic?: {
    stockDeltas?: Record<string, number>
    tempCustomerId?: string
  }
}

interface OfflineQueueState {
  queue: QueuedOperation[]
  isProcessing: boolean
  lastSyncAttempt: number | null
}

const initialState: OfflineQueueState = {
  queue: [],
  isProcessing: false,
  lastSyncAttempt: null,
}

const offlineQueueSlice = createSlice({
  name: 'offlineQueue',
  initialState,
  reducers: {
    enqueue: (state, action: PayloadAction<Omit<QueuedOperation, 'id' | 'createdAt' | 'status' | 'attempts'>>) => {
      const operation: QueuedOperation = {
        ...action.payload,
        id: uuidv4(),
        createdAt: Date.now(),
        status: 'pending',
        attempts: 0,
      }
      state.queue.push(operation)
    },
    markRetrying: (state, action: PayloadAction<string>) => {
      const op = state.queue.find((q) => q.id === action.payload)
      if (op) {
        op.status = 'retrying'
        op.attempts += 1
        state.lastSyncAttempt = Date.now()
      }
    },
    markSynced: (state, action: PayloadAction<{ id: string; serverId?: string }>) => {
      const op = state.queue.find((q) => q.id === action.payload.id)
      if (op) {
        op.status = 'synced'
        op.syncedAt = Date.now()
        if (action.payload.serverId) op.serverId = action.payload.serverId
      }
    },
    markError: (state, action: PayloadAction<{ id: string; error: string }>) => {
      const op = state.queue.find((q) => q.id === action.payload.id)
      if (op) {
        op.status = 'error'
        op.lastError = action.payload.error
      }
    },
    removeSynced: (state) => {
      state.queue = state.queue.filter((q) => q.status !== 'synced')
    },
    clearQueue: (state) => {
      state.queue = []
    },
    setProcessing: (state, action: PayloadAction<boolean>) => {
      state.isProcessing = action.payload
    },
    retryOperation: (state, action: PayloadAction<string>) => {
      const op = state.queue.find((q) => q.id === action.payload)
      if (op && (op.status === 'error' || op.status === 'pending')) {
        op.status = 'pending'
        op.lastError = undefined
      }
    },
    retryAll: (state) => {
      state.queue.forEach((op) => {
        if (op.status === 'error' || op.status === 'pending') {
          op.status = 'pending'
          op.lastError = undefined
        }
      })
    },
  },
})

export const {
  enqueue,
  markRetrying,
  markSynced,
  markError,
  removeSynced,
  clearQueue,
  setProcessing,
  retryOperation,
  retryAll,
} = offlineQueueSlice.actions

export default offlineQueueSlice.reducer

export const selectOfflineQueue = (state: { offlineQueue: OfflineQueueState }) => state.offlineQueue.queue
export const selectPendingCount = (state: { offlineQueue: OfflineQueueState }) =>
  state.offlineQueue.queue.filter((q) => q.status === 'pending' || q.status === 'retrying').length
export const selectErrorCount = (state: { offlineQueue: OfflineQueueState }) =>
  state.offlineQueue.queue.filter((q) => q.status === 'error').length
export const selectIsProcessing = (state: { offlineQueue: OfflineQueueState }) => state.offlineQueue.isProcessing