import Dexie, { type EntityTable } from 'dexie'

export interface LocalProduct {
  id: string
  shopId: string
  name: string
  category: string
  sku: string | null
  barcode: string | null
  price: number
  priceCents: number
  stockQty: number
  lowStockThreshold: number
  isActive: boolean
  imageUrl: string | null
  updatedAt?: number
}

export interface LocalReceipt {
  id: string
  shopId: string
  localId: string
  items: Array<{
    productId: string
    name: string
    qty: number
    unitPriceCents: number
    lineTotalCents: number
  }>
  subtotalCents: number
  taxCents: number
  discountCents: number
  totalCents: number
  paymentMethod: string
  customerId: string | null
  customerName: string | null
  cashierUserId: string | null
  status: 'pending' | 'completed' | 'failed'
  synced: boolean
  syncedAt: number | null
  createdAt: number
  source: 'online' | 'pos'
}

export interface SyncQueueItem {
  id?: number
  type: 'CREATE_RECEIPT' | 'UPDATE_RECEIPT' | 'UPDATE_STOCK'
  entityId: string
  payload: unknown
  retryCount: number
  status: 'pending' | 'processing' | 'failed'
  createdAt: number
  lastError: string | null
}

export interface LocalSettings {
  key: string
  value: unknown
  updatedAt: number
}

class KounterDatabase extends Dexie {
  products!: EntityTable<LocalProduct, 'id'>
  receipts!: EntityTable<LocalReceipt, 'id'>
  syncQueue!: EntityTable<SyncQueueItem, 'id'>
  settings!: EntityTable<LocalSettings, 'key'>

  constructor() {
    super('KounterPOS')

    this.version(1).stores({
      products: 'id, shopId, name, category, barcode, sku, isActive, updatedAt',
      receipts: 'id, shopId, localId, status, synced, createdAt',
      syncQueue: '++id, type, entityId, status, createdAt',
      settings: 'key, updatedAt',
    })
  }
}

export const db = new KounterDatabase()

export async function initializeLocalData(shopId: string, products: LocalProduct[]) {
  await db.transaction('rw', db.products, db.settings, async () => {
    await db.products.where({ shopId }).delete()
    await db.products.bulkAdd(products.map(p => ({ ...p, shopId, updatedAt: Date.now() })))
    await db.settings.put({ key: 'lastSync', value: Date.now(), updatedAt: Date.now() })
  })
}

export async function getLocalProducts(shopId: string) {
  return db.products.where({ shopId, isActive: true }).toArray()
}

export async function saveLocalReceipt(receipt: Omit<LocalReceipt, 'id' | 'synced' | 'syncedAt' | 'createdAt'>) {
  const id = `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  const fullReceipt: LocalReceipt = {
    ...receipt,
    id,
    synced: false,
    syncedAt: null,
    createdAt: Date.now(),
  }
  await db.receipts.add(fullReceipt)
  return fullReceipt
}

export async function markReceiptSynced(id: string) {
  await db.receipts.update(id, { synced: true, syncedAt: Date.now() })
}

export async function getUnsyncedReceipts() {
  return db.receipts.where({ synced: false, status: 'pending' }).toArray()
}

export async function addToSyncQueue(type: SyncQueueItem['type'], entityId: string, payload: unknown) {
  await db.syncQueue.add({
    type,
    entityId,
    payload,
    retryCount: 0,
    status: 'pending',
    createdAt: Date.now(),
    lastError: null,
  })
}

export async function getPendingSyncItems() {
  return db.syncQueue.where({ status: 'pending' }).sortBy('createdAt')
}

export async function updateSyncItemStatus(id: number, status: SyncQueueItem['status'], error?: string) {
  const updates: Partial<SyncQueueItem> = { status }
  if (error) updates.lastError = error
  if (status === 'processing') {
    await db.syncQueue.update(id, { ...updates, retryCount: (await db.syncQueue.get(id))!.retryCount + 1 })
  } else {
    await db.syncQueue.update(id, updates)
  }
}

export async function removeSyncItem(id: number) {
  await db.syncQueue.delete(id)
}

export async function updateLocalStock(productId: string, qtyChange: number) {
  const product = await db.products.get(productId)
  if (product) {
    await db.products.update(productId, { stockQty: Math.max(0, product.stockQty + qtyChange) })
  }
}

export async function getLocalSettings(key: string) {
  const setting = await db.settings.get(key)
  return setting?.value
}

export async function setLocalSettings(key: string, value: unknown) {
  await db.settings.put({ key, value, updatedAt: Date.now() })
}
