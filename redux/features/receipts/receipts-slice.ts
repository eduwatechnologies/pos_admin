'use client'

import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface OfflineReceipt {
  _id: string
  localId: string
  shopId: string
  items: Array<{
    productId: string
    quantity: number
    unitPriceCents: number
    totalCents: number
  }>
  subtotalCents: number
  taxCents: number
  totalCents: number
  paymentMethod: 'cash' | 'card' | 'transfer' | 'mixed'
  paymentDetails?: Record<string, any>
  customerId?: string
  customerName?: string
  status: 'pending' | 'completed' | 'refunded'
  createdAt: string
  paidAt: string
  isOffline: boolean
}

type ReceiptsState = {
  search: string
  selectedReceiptId: string | null
  offlineReceipts: OfflineReceipt[]
}

const initialState: ReceiptsState = {
  search: '',
  selectedReceiptId: null,
  offlineReceipts: [],
}

const receiptsSlice = createSlice({
  name: 'receipts',
  initialState,
  reducers: {
    setReceiptsSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload
    },
    setSelectedReceiptId: (state, action: PayloadAction<string | null>) => {
      state.selectedReceiptId = action.payload
    },
    addOfflineReceipt: (state, action: PayloadAction<OfflineReceipt>) => {
      state.offlineReceipts.unshift(action.payload)
    },
    removeOfflineReceipt: (state, action: PayloadAction<string>) => {
      state.offlineReceipts = state.offlineReceipts.filter((r) => r.localId !== action.payload)
    },
    clearOfflineReceipts: (state) => {
      state.offlineReceipts = []
    },
    setOfflineReceipts: (state, action: PayloadAction<OfflineReceipt[]>) => {
      state.offlineReceipts = action.payload
    },
  },
})

export const {
  setReceiptsSearch,
  setSelectedReceiptId,
  addOfflineReceipt,
  removeOfflineReceipt,
  clearOfflineReceipts,
  setOfflineReceipts,
} = receiptsSlice.actions

export default receiptsSlice.reducer

export const selectOfflineReceipts = (state: { receipts: ReceiptsState }) => state.receipts.offlineReceipts