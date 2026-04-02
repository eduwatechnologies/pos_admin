export type ApiUser = {
  id: string
  email: string
  name: string
  role: string
  shopIds: string[]
  isActive: boolean
}

export type ApiShop = {
  id: string
  name: string
  location: string
  address?: string
  phone?: string
  createdAt: Date
}

export type ApiProduct = {
  id: string
  name: string
  sku: string
  barcode?: string
  category: string
  imageUrl?: string
  price: number
  quantity: number
  reorderLevel: number
  shopId?: string
  createdAt: Date
}

export type ApiCategory = {
  id: string
  name: string
  isActive: boolean
  createdAt: Date
}

export type ApiEmployee = {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  status: 'active' | 'inactive'
  joinDate: Date
  salaryOrWage?: number
  shopId?: string
}

export type ApiReceiptItem = {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export type ApiReceipt = {
  id: string
  date: Date
  customerName?: string
  items: ApiReceiptItem[]
  subtotal: number
  tax: number
  total: number
  paymentMethod: 'cash' | 'card' | 'transfer' | 'other' | string
  status?: 'paid' | 'refunded' | string
  refundedAt?: Date
  refundReason?: string
  cashierId: string
  cashierName?: string
  shopId?: string
  notes?: string
}

export function toIsoDate(input: any) {
  const d = input ? new Date(input) : new Date()
  if (Number.isNaN(d.getTime())) return new Date()
  return d
}

export function mapUser(u: any): ApiUser {
  return {
    id: String(u?.id ?? u?._id ?? ''),
    email: String(u?.email ?? ''),
    name: String(u?.name ?? ''),
    role: String(u?.role ?? 'cashier'),
    shopIds: Array.isArray(u?.shopIds) ? u.shopIds.map((s: any) => String(s)) : [],
    isActive: u?.isActive !== false,
  }
}

export function mapShop(s: any): ApiShop {
  const id = String(s?.id ?? s?._id ?? '')
  const address = s?.address ? String(s.address) : undefined
  return {
    id,
    name: String(s?.name ?? ''),
    location: address ?? '',
    address,
    phone: s?.phone ? String(s.phone) : undefined,
    createdAt: toIsoDate(s?.createdAt),
  }
}

export function mapProduct(p: any): ApiProduct {
  const category = p?.category ? String(p.category) : 'General'
  return {
    id: String(p?._id ?? p?.id ?? ''),
    name: String(p?.name ?? ''),
    sku: p?.sku ? String(p.sku) : '',
    barcode: p?.barcode ? String(p.barcode) : undefined,
    category,
    imageUrl: p?.imageUrl ? String(p.imageUrl) : undefined,
    price: Number(p?.priceCents ?? 0) / 100,
    quantity: Number(p?.stockQty ?? 0),
    reorderLevel: Number(p?.lowStockThreshold ?? 0),
    shopId: p?.shopId ? String(p.shopId) : undefined,
    createdAt: toIsoDate(p?.createdAt),
  }
}

export function mapCategory(c: any): ApiCategory {
  return {
    id: String(c?._id ?? c?.id ?? ''),
    name: String(c?.name ?? ''),
    isActive: c?.isActive !== false,
    createdAt: toIsoDate(c?.createdAt),
  }
}

export function mapEmployee(u: any, shopId?: string): ApiEmployee {
  const salaryOrWageRaw = u?.salaryOrWage
  const salaryOrWageNumber = salaryOrWageRaw == null ? undefined : Number(salaryOrWageRaw)
  return {
    id: String(u?._id ?? u?.id ?? ''),
    name: String(u?.name ?? ''),
    email: String(u?.email ?? ''),
    phone: u?.phone ? String(u.phone) : undefined,
    role: String(u?.role ?? 'cashier'),
    status: u?.isActive === false ? 'inactive' : 'active',
    joinDate: toIsoDate(u?.createdAt),
    salaryOrWage: Number.isFinite(salaryOrWageNumber) ? salaryOrWageNumber : undefined,
    shopId,
  }
}

export function mapReceipt(r: any, cashierNameById?: Map<string, string>): ApiReceipt {
  const cashierId = String(r?.cashierUserId ?? '')
  return {
    id: String(r?._id ?? r?.id ?? ''),
    date: toIsoDate(r?.paidAt ?? r?.createdAt),
    customerName: r?.customerName ? String(r.customerName) : undefined,
    items: Array.isArray(r?.items)
      ? r.items.map((i: any) => ({
          productId: String(i?.productId ?? ''),
          productName: String(i?.name ?? ''),
          quantity: Number(i?.qty ?? 0),
          unitPrice: Number(i?.unitPriceCents ?? 0) / 100,
          subtotal: Number(i?.lineTotalCents ?? 0) / 100,
        }))
      : [],
    subtotal: Number(r?.subtotalCents ?? 0) / 100,
    tax: Number(r?.taxCents ?? 0) / 100,
    total: Number(r?.totalCents ?? 0) / 100,
    paymentMethod: String(r?.paymentMethod ?? ''),
    status: r?.status ? String(r.status) : undefined,
    refundedAt: r?.refundedAt ? toIsoDate(r.refundedAt) : undefined,
    refundReason: r?.refundReason ? String(r.refundReason) : undefined,
    cashierId,
    cashierName: cashierNameById?.get(cashierId),
    shopId: r?.shopId ? String(r.shopId) : undefined,
    notes: undefined,
  }
}
