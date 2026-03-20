'use client'

import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

type EmployeesState = {
  search: string
  selectedEmployeeId: string | null
}

const initialState: EmployeesState = {
  search: '',
  selectedEmployeeId: null,
}

const employeesSlice = createSlice({
  name: 'employees',
  initialState,
  reducers: {
    setEmployeesSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload
    },
    setSelectedEmployeeId: (state, action: PayloadAction<string | null>) => {
      state.selectedEmployeeId = action.payload
    },
  },
})

export const { setEmployeesSearch, setSelectedEmployeeId } = employeesSlice.actions
export default employeesSlice.reducer

