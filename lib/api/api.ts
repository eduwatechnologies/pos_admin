import { apiClient } from '@/lib/api/http'
import { mapEmployee, mapProduct, mapReceipt, mapShop, mapUser, toIsoDate, type ApiEmployee, type ApiProduct, type ApiReceipt, type ApiShop, type ApiUser } from '@/lib/api/mappers'

export const api = {
  auth: {
    async login(email: string, password: string): Promise<{ token: string; user: ApiUser }> {
      const res = await apiClient.post('/auth/login', { email, password })
      const token = String(res.data?.token ?? '')
      const user = mapUser(res.data?.user)
      return { token, user }
    },
    async me(): Promise<{ user: ApiUser }> {
      const res = await apiClient.get('/auth/me')
      return { user: mapUser(res.data?.user) }
    },
  },
  shops: {
    async list(): Promise<ApiShop[]> {
      const res = await apiClient.get('/shops')
      const items = Array.isArray(res.data?.items) ? res.data.items : []
      return items.map(mapShop)
    },
  },
  products: {
    async list(shopId: string): Promise<ApiProduct[]> {
      const res = await apiClient.get(`/shops/${shopId}/products`)
      const items = Array.isArray(res.data?.items) ? res.data.items : []
      return items.map(mapProduct)
    },
    async create(shopId: string, input: { name: string; sku?: string; price: number; quantity: number; reorderLevel: number }) {
      const res = await apiClient.post(`/shops/${shopId}/products`, {
        name: input.name,
        sku: input.sku ? input.sku : null,
        priceCents: Math.round(Number(input.price ?? 0) * 100),
        stockQty: Number(input.quantity ?? 0),
        lowStockThreshold: Number(input.reorderLevel ?? 0),
      })
      return mapProduct(res.data?.item)
    },
    async update(shopId: string, productId: string, input: Partial<{ name: string; sku: string; price: number; quantity: number; reorderLevel: number }>) {
      const payload: any = {}
      if ('name' in input) payload.name = input.name
      if ('sku' in input) payload.sku = input.sku ? input.sku : null
      if ('price' in input) payload.priceCents = Math.round(Number(input.price ?? 0) * 100)
      if ('quantity' in input) payload.stockQty = Number(input.quantity ?? 0)
      if ('reorderLevel' in input) payload.lowStockThreshold = Number(input.reorderLevel ?? 0)
      const res = await apiClient.patch(`/shops/${shopId}/products/${productId}`, payload)
      return mapProduct(res.data?.item)
    },
    async remove(shopId: string, productId: string) {
      await apiClient.delete(`/shops/${shopId}/products/${productId}`)
    },
  },
  employees: {
    async list(shopId: string): Promise<ApiEmployee[]> {
      const res = await apiClient.get(`/shops/${shopId}/employees`)
      const items = Array.isArray(res.data?.items) ? res.data.items : []
      return items.map((u: any) => mapEmployee(u, shopId))
    },
    async create(shopId: string, input: { name: string; email: string; password: string }): Promise<ApiEmployee> {
      const res = await apiClient.post(`/shops/${shopId}/employees`, input)
      const item = res.data?.item
      return {
        id: String(item?.id ?? item?._id ?? ''),
        name: String(item?.name ?? ''),
        email: String(item?.email ?? ''),
        phone: item?.phone ? String(item.phone) : undefined,
        role: 'cashier',
        status: item?.isActive === false ? 'inactive' : 'active',
        joinDate: toIsoDate(item?.createdAt),
        salaryOrWage: undefined,
        shopId,
      }
    },
    async update(shopId: string, employeeId: string, input: Partial<{ name: string; email: string }>): Promise<ApiEmployee> {
      const res = await apiClient.patch(`/shops/${shopId}/employees/${employeeId}`, input)
      return mapEmployee(res.data?.item, shopId)
    },
    async setStatus(shopId: string, employeeId: string, isActive: boolean): Promise<ApiEmployee> {
      const res = await apiClient.patch(`/shops/${shopId}/employees/${employeeId}/status`, { isActive })
      return mapEmployee(res.data?.item, shopId)
    },
    async remove(shopId: string, employeeId: string) {
      await apiClient.delete(`/shops/${shopId}/employees/${employeeId}`)
    },
  },
  receipts: {
    async list(shopId: string): Promise<ApiReceipt[]> {
      const res = await apiClient.get(`/shops/${shopId}/receipts`)
      const items = Array.isArray(res.data?.items) ? res.data.items : []
      return items.map((r: any) => mapReceipt(r))
    },
  },
  analytics: {
    async revenue(shopId: string, params?: { from?: string; to?: string }) {
      const res = await apiClient.get(`/shops/${shopId}/analytics/revenue`, { params })
      return {
        totalSales: Number(res.data?.totalSalesCents ?? 0) / 100,
        totalTransactions: Number(res.data?.totalTransactions ?? 0),
        averageOrderValue: Number(res.data?.averageOrderValueCents ?? 0) / 100,
      }
    },
    async bestSellers(shopId: string, params?: { from?: string; to?: string }) {
      const res = await apiClient.get(`/shops/${shopId}/analytics/best-sellers`, { params })
      const items = Array.isArray(res.data?.items) ? res.data.items : []
      return items.map((i: any) => ({
        name: String(i?.name ?? ''),
        qty: Number(i?.qty ?? 0),
        revenue: Number(i?.revenueCents ?? 0) / 100,
      }))
    },
    async employeePerformance(shopId: string, params?: { from?: string; to?: string }) {
      const res = await apiClient.get(`/shops/${shopId}/analytics/employee-performance`, { params })
      const items = Array.isArray(res.data?.items) ? res.data.items : []
      return items.map((i: any) => ({
        cashierUserId: String(i?.cashierUserId ?? ''),
        totalSales: Number(i?.totalSalesCents ?? 0) / 100,
        totalTransactions: Number(i?.totalTransactions ?? 0),
      }))
    },
  },
  settings: {
    async get(shopId: string) {
      const res = await apiClient.get(`/shops/${shopId}/settings`)
      const s = res.data?.settings ?? {}
      return {
        businessName: String(s?.businessName ?? ''),
        address: s?.address ? String(s.address) : '',
        phone: s?.phone ? String(s.phone) : '',
        currency: String(s?.currency ?? 'NGN'),
        name: String(s?.name ?? ''),
      }
    },
    async update(shopId: string, input: Partial<{ name: string; currency: string; businessName: string; address: string; phone: string }>) {
      const res = await apiClient.patch(`/shops/${shopId}/settings`, input)
      const s = res.data?.settings ?? {}
      return {
        businessName: String(s?.businessName ?? ''),
        address: s?.address ? String(s.address) : '',
        phone: s?.phone ? String(s.phone) : '',
        currency: String(s?.currency ?? 'NGN'),
        name: String(s?.name ?? ''),
      }
    },
  },
}

