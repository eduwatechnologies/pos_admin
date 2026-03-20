'use client'

import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

type SettingsState = {
  isDirty: boolean
}

const initialState: SettingsState = {
  isDirty: false,
}

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setSettingsDirty: (state, action: PayloadAction<boolean>) => {
      state.isDirty = action.payload
    },
  },
})

export const { setSettingsDirty } = settingsSlice.actions
export default settingsSlice.reducer

