'use client'

import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

type AppState = {
  businessName: string
  businessLogoUrl: string | null
}

const initialState: AppState = {
  businessName: 'ScanSell POS',
  businessLogoUrl: null,
}

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setBusinessName: (state, action: PayloadAction<string>) => {
      state.businessName = action.payload
    },
    setBusinessLogoUrl: (state, action: PayloadAction<string | null>) => {
      state.businessLogoUrl = action.payload
    },
  },
})

export const { setBusinessName, setBusinessLogoUrl } = appSlice.actions
export default appSlice.reducer

