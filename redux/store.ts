import { configureStore, isPlain } from '@reduxjs/toolkit'
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist'

import { baseApi } from '@/redux/api/base-api'
import appReducer from '@/redux/features/app/app-slice'
import authReducer from '@/redux/features/auth/auth-slice'
import employeesReducer from '@/redux/features/employees/employees-slice'
import receiptsReducer from '@/redux/features/receipts/receipts-slice'
import analyticsReducer from '@/redux/features/analytics/analytics-slice'
import settingsReducer from '@/redux/features/settings/settings-slice'
import productsReducer from '@/redux/features/products/products-slice'
import shopsReducer from '@/redux/features/shops/shops-slice'
import offlineQueueReducer from '@/redux/offline/offline-queue-slice'
import { persistConfig, apiPersistConfig } from '@/redux/offline/persist-config'

const isSerializable = (value: unknown) => value instanceof Date || isPlain(value)
const getEntries = (value: unknown) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return []
  return Object.entries(value as Record<string, unknown>)
}

const persistedAppReducer = persistReducer(persistConfig, appReducer)
const persistedAuthReducer = persistReducer(persistConfig, authReducer)
const persistedSettingsReducer = persistReducer(persistConfig, settingsReducer)
const persistedShopsReducer = persistReducer(persistConfig, shopsReducer)
const persistedProductsReducer = persistReducer(persistConfig, productsReducer)
const persistedApiReducer = persistReducer(apiPersistConfig, baseApi.reducer)

export const store = configureStore({
  reducer: {
    app: persistedAppReducer,
    auth: persistedAuthReducer,
    employees: employeesReducer,
    receipts: receiptsReducer,
    analytics: analyticsReducer,
    settings: persistedSettingsReducer,
    products: persistedProductsReducer,
    shops: persistedShopsReducer,
    offlineQueue: offlineQueueReducer,
    [baseApi.reducerPath]: persistedApiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        isSerializable,
        getEntries,
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(baseApi.middleware),
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch