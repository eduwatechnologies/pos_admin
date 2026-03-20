'use client'

import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

type AnalyticsState = {
  fromIso: string | null
  toIso: string | null
}

const initialState: AnalyticsState = {
  fromIso: null,
  toIso: null,
}

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setAnalyticsRange: (state, action: PayloadAction<{ fromIso: string | null; toIso: string | null }>) => {
      state.fromIso = action.payload.fromIso
      state.toIso = action.payload.toIso
    },
    clearAnalyticsRange: (state) => {
      state.fromIso = null
      state.toIso = null
    },
  },
})

export const { setAnalyticsRange, clearAnalyticsRange } = analyticsSlice.actions
export default analyticsSlice.reducer

