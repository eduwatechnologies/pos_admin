'use client'

import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

type ProductsState = {
  search: string
  selectedProductId: string | null
  localStockDeltas: Record<string, number>
}

const initialState: ProductsState = {
  search: '',
  selectedProductId: null,
  localStockDeltas: {},
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
    applyLocalStockDelta: (state, action: PayloadAction<{ productId: string; delta: number }>) => {
      const { productId, delta } = action.payload
      state.localStockDeltas[productId] = (state.localStockDeltas[productId] ?? 0) + delta
      if (state.localStockDeltas[productId] === 0) {
        delete state.localStockDeltas[productId]
      }
    },
    clearLocalStockDeltas: (state, action: PayloadAction<string[]>) => {
      action.payload.forEach((id) => {
        delete state.localStockDeltas[id]
      })
    },
    setLocalStockDeltas: (state, action: PayloadAction<Record<string, number>>) => {
      state.localStockDeltas = action.payload
    },
  },
})

export const {
  setProductsSearch,
  setSelectedProductId,
  applyLocalStockDelta,
  clearLocalStockDeltas,
  setLocalStockDeltas,
} = productsSlice.actions

export default productsSlice.reducer

export const selectLocalStockDeltas = (state: { products: ProductsState }) => state.products.localStockDeltas

export const selectEffectiveStock = (state: { products: ProductsState }, productId: string, serverStock: number) => {
  const localDelta = state.products.localStockDeltas[productId] ?? 0
  return Math.max(0, serverStock + localDelta)
}