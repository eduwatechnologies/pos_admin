'use client'

import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

type ProductsState = {
  search: string
  selectedProductId: string | null
}

const initialState: ProductsState = {
  search: '',
  selectedProductId: null,
}

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setProductsSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload
    },
    setSelectedProductId: (state, action: PayloadAction<string | null>) => {
      state.selectedProductId = action.payload
    },
  },
})

export const { setProductsSearch, setSelectedProductId } = productsSlice.actions
export default productsSlice.reducer

