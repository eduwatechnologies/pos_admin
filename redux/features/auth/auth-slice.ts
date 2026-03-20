'use client'

import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

import type { ApiUser } from '@/lib/api/mappers'

type AuthState = {
  token: string | null
  user: ApiUser | null
}

const initialState: AuthState = {
  token: null,
  user: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ token: string; user: ApiUser }>) => {
      state.token = action.payload.token
      state.user = action.payload.user
    },
    clearCredentials: (state) => {
      state.token = null
      state.user = null
    },
  },
})

export const { setCredentials, clearCredentials } = authSlice.actions
export default authSlice.reducer

