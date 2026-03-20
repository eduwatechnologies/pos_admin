'use client'

import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

type ShopsState = {
  currentShopId: string | null
}

const initialState: ShopsState = {
  currentShopId: null,
}

const shopsSlice = createSlice({
  name: 'shops',
  initialState,
  reducers: {
    setCurrentShopId: (state, action: PayloadAction<string | null>) => {
      state.currentShopId = action.payload
    },
  },
})

export const { setCurrentShopId } = shopsSlice.actions
export default shopsSlice.reducer

