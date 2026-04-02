export type UserRole = 'admin' | 'super_admin' | (string & {})
export type UserStatus = 'active' | 'inactive'
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'other' | (string & {})

export interface Shop {
  id: string
  name: string
  location: string
  address?: string
  phone?: string
  createdAt: Date
}

export interface ShopContextType {
  currentShop: Shop | null
  shops: Shop[]
  setCurrentShop: (shop: Shop) => void
  addShop: (shop: Shop) => void
}

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  status: UserStatus
  createdAt: Date
}

export interface Product {
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

export interface Category {
  id: string
  name: string
  isActive: boolean
  createdAt: Date
}

export interface ReceiptItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface Receipt {
  id: string
  date: Date
  customerId?: string
  customerName?: string
  items: ReceiptItem[]
  subtotal: number
  tax: number
  total: number
  paymentMethod: PaymentMethod
  status?: 'paid' | 'refunded' | string
  refundedAt?: Date
  refundReason?: string
  cashierId: string
  cashierName?: string
  shopId?: string
  notes?: string
}

export interface Expense {
  id: string
  category: string
  description?: string
  amount: number
  occurredAt: Date
  supplierId?: string
  createdByUserId?: string
  shopId?: string
}

export interface AuditLog {
  id: string
  occurredAt: Date
  action: string
  entityType: string
  entityId?: string
  userId?: string
  ip?: string
  userAgent?: string
  metadata?: any
}

export interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  notes?: string
  isActive: boolean
  createdAt: Date
  shopId?: string
}

export interface Supplier {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  notes?: string
  isActive: boolean
  createdAt: Date
  shopId?: string
}

export interface PurchaseItem {
  productId: string
  productName: string
  quantity: number
  unitCost: number
  subtotal: number
}

export interface Purchase {
  id: string
  purchasedAt: Date
  status: 'posted' | 'voided' | (string & {})
  supplierId?: string
  supplierName?: string
  reference?: string
  notes?: string
  items: PurchaseItem[]
  totalCost: number
  createdAt: Date
  shopId?: string
}

export interface SupplierBillItem {
  productId?: string
  description: string
  qty: number
  unitCost: number
  subtotal: number
}

export interface SupplierBillPayment {
  amount: number
  method: string
  paidAt: Date
  reference?: string
  notes?: string
  createdByUserId?: string
}

export interface SupplierBill {
  id: string
  supplierId: string
  reference: string
  status: 'unpaid' | 'partially_paid' | 'paid' | 'voided' | (string & {})
  items: SupplierBillItem[]
  subtotal: number
  total: number
  paid: number
  dueDate: Date
  payments: SupplierBillPayment[]
  notes?: string
  sourceType?: string
  sourceId?: string
  createdByUserId?: string
  createdAt: Date
  shopId?: string
}

export interface Employee {
  id: string
  name: string
  email: string
  phone?: string
  role: UserRole
  status: UserStatus
  joinDate: Date
  salaryOrWage?: number
  shopId?: string
}

export interface Sale {
  id: string
  date: Date
  total: number
  itemCount: number
  paymentMethod: string
}

export interface DailySales {
  date: string
  sales: number
  transactions: number
}

export interface EmployeePerformance {
  employeeId: string
  employeeName: string
  totalSales: number
  transactionCount: number
  averageOrderValue: number
  commissionRate?: number
  commissionEarned?: number
}

export interface EmployeeDailySales {
  employeeId: string
  employeeName: string
  date: string
  sales: number
  transactions: number
}

export interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (input: { name: string; email: string; password: string; shopName?: string; currency?: string }) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}
