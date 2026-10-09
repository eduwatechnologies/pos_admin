import { openDB, DBSchema } from 'idb'

interface KounterDB extends DBSchema {
  redux: {
    key: string
    value: any
  }
}

const DB_NAME = 'kounter-redux'
const STORE_NAME = 'redux'

let dbPromise: Promise<IDBDatabase> | null = null

function getDB() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('indexedDB not available on server'))
  }
  if (!dbPromise) {
    dbPromise = openDB<KounterDB>(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME)
        }
      },
    })
  }
  return dbPromise
}

export const idbStorage = {
  getItem: async (key: string) => {
    if (typeof window === 'undefined') return null
    try {
      const db = await getDB()
      return (await db.get(STORE_NAME, key)) ?? null
    } catch {
      return null
    }
  },
  setItem: async (key: string, value: any) => {
    if (typeof window === 'undefined') return
    try {
      const db = await getDB()
      await db.put(STORE_NAME, value, key)
    } catch (err) {
      console.error('[idbStorage] setItem failed:', err)
    }
  },
  removeItem: async (key: string) => {
    if (typeof window === 'undefined') return
    try {
      const db = await getDB()
      await db.delete(STORE_NAME, key)
    } catch (err) {
      console.error('[idbStorage] removeItem failed:', err)
    }
  },
}