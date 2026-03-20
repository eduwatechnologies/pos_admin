import { configureStore } from '@reduxjs/toolkit'

import { baseApi } from '@/redux/api/base-api'
import appReducer from '@/redux/features/app/app-slice'
import authReducer from '@/redux/features/auth/auth-slice'
import employeesReducer from '@/redux/features/employees/employees-slice'
import receiptsReducer from '@/redux/features/receipts/receipts-slice'
import analyticsReducer from '@/redux/features/analytics/analytics-slice'
import settingsReducer from '@/redux/features/settings/settings-slice'
import productsReducer from '@/redux/features/products/products-slice'
import shopsReducer from '@/redux/features/shops/shops-slice'

export const store = configureStore({
  reducer: {
    app: appReducer,
    auth: authReducer,
    employees: employeesReducer,
    receipts: receiptsReducer,
    analytics: analyticsReducer,
    settings: settingsReducer,
    products: productsReducer,
    shops: shopsReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
