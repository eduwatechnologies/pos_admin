'use client'

import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

type ReceiptsState = {
  search: string
  selectedReceiptId: string | null
}

const initialState: ReceiptsState = {
  search: '',
  selectedReceiptId: null,
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
  },
})

export const { setReceiptsSearch, setSelectedReceiptId } = receiptsSlice.actions
export default receiptsSlice.reducer

