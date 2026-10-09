import { createMigrate, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { idbStorage } from './idb-storage'
import { baseApi } from '@/redux/api/base-api'

const PERSIST_VERSION = 1

const persistConfig = {
  key: 'kounter-root',
  version: PERSIST_VERSION,
  storage: idbStorage,
  whitelist: [
    'auth',
    'app',
    'settings',
    'shops',
    'products',
    baseApi.reducerPath,
  ],
  blacklist: [
    'app.ui',
    'app.notifications',
  ],
  migrate: createMigrate(
    {
      0: (state: any) => {
        return state
      },
    },
    { debug: process.env.NODE_ENV === 'development' },
  ),
}

const apiPersistConfig = {
  key: 'kounter-api',
  version: PERSIST_VERSION,
  storage: idbStorage,
  whitelist: ['queries'],
  blacklist: ['mutations', 'provided', 'subscriptions', 'config'],
}

export { persistConfig, apiPersistConfig }