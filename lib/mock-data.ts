import { Product, Employee, Receipt, DailySales, User } from './types'

export const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    status: 'active',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    email: 'cashier@example.com',
    name: 'John Cashier',
    role: 'cashier',
    status: 'active',
    createdAt: new Date('2024-02-15'),
  },
]

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Espresso',
    sku: 'ESP001',
    category: 'Coffee',
    price: 2.5,
    quantity: 150,
    reorderLevel: 50,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Cappuccino',
    sku: 'CAP001',
    category: 'Coffee',
    price: 3.5,
    quantity: 120,
    reorderLevel: 40,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '3',
    name: 'Latte',
    sku: 'LAT001',
    category: 'Coffee',
    price: 4.0,
    quantity: 200,
    reorderLevel: 60,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '4',
    name: 'Croissant',
    sku: 'CRO001',
    category: 'Pastry',
    price: 3.0,
    quantity: 45,
    reorderLevel: 30,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '5',
    name: 'Chocolate Cake',
    sku: 'CHO001',
    category: 'Pastry',
    price: 5.5,
    quantity: 20,
    reorderLevel: 15,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '6',
    name: 'Blueberry Muffin',
    sku: 'BLU001',
    category: 'Pastry',
    price: 3.5,
    quantity: 80,
    reorderLevel: 40,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '7',
    name: 'Orange Juice',
    sku: 'ORA001',
    category: 'Beverage',
    price: 3.0,
    quantity: 60,
    reorderLevel: 30,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '8',
    name: 'Iced Tea',
    sku: 'TEA001',
    category: 'Beverage',
    price: 2.5,
    quantity: 100,
    reorderLevel: 50,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '9',
    name: 'Sandwich',
    sku: 'SAN001',
    category: 'Food',
    price: 7.5,
    quantity: 35,
    reorderLevel: 20,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '10',
    name: 'Salad',
    sku: 'SAL001',
    category: 'Food',
    price: 8.0,
    quantity: 25,
    reorderLevel: 15,
    createdAt: new Date('2024-01-01'),
  },
]

export const mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '555-0101',
    role: 'cashier',
    status: 'active',
    joinDate: new Date('2024-01-10'),
    salaryOrWage: 3500,
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '555-0102',
    role: 'cashier',
    status: 'active',
    joinDate: new Date('2024-02-01'),
    salaryOrWage: 3500,
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike@example.com',
    phone: '555-0103',
    role: 'admin',
    status: 'active',
    joinDate: new Date('2023-12-01'),
    salaryOrWage: 5000,
  },
  {
    id: '4',
    name: 'Sarah Davis',
    email: 'sarah@example.com',
    phone: '555-0104',
    role: 'cashier',
    status: 'active',
    joinDate: new Date('2024-03-01'),
    salaryOrWage: 3500,
  },
  {
    id: '5',
    name: 'Tom Wilson',
    email: 'tom@example.com',
    phone: '555-0105',
    role: 'cashier',
    status: 'inactive',
    joinDate: new Date('2024-01-15'),
    salaryOrWage: 3500,
  },
]

// Generate receipts for the past 90 days
export const generateMockReceipts = (): Receipt[] => {
  const receipts: Receipt[] = []
  const now = new Date()
  const products = mockProducts
  const employees = mockEmployees.filter(e => e.role === 'cashier')

  for (let i = 0; i < 100; i++) {
    const daysAgo = Math.floor(Math.random() * 90)
    const date = new Date(now)
    date.setDate(date.getDate() - daysAgo)
    date.setHours(Math.floor(Math.random() * 12) + 6, Math.floor(Math.random() * 60), 0)

    const itemCount = Math.floor(Math.random() * 5) + 1
    const items: typeof Receipt.prototype.items = []
    let subtotal = 0

    for (let j = 0; j < itemCount; j++) {
      const product = products[Math.floor(Math.random() * products.length)]
      const quantity = Math.floor(Math.random() * 3) + 1
      const itemSubtotal = product.price * quantity
      subtotal += itemSubtotal

      items.push({
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice: product.price,
        subtotal: itemSubtotal,
      })
    }

    const tax = Math.round(subtotal * 0.08 * 100) / 100
    const total = Math.round((subtotal + tax) * 100) / 100
    const employee = employees[Math.floor(Math.random() * employees.length)]

    receipts.push({
      id: `REC-${String(i + 1).padStart(5, '0')}`,
      date,
      customerName: `Customer ${i + 1}`,
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      tax,
      total,
      paymentMethod: ['cash', 'card', 'digital'][Math.floor(Math.random() * 3)] as any,
      cashierId: employee.id,
      cashierName: employee.name,
    })
  }

  return receipts.sort((a, b) => b.date.getTime() - a.date.getTime())
}

export const mockReceipts = generateMockReceipts()

// Generate daily sales data for 30 days
export const generateDailySalesData = (): DailySales[] => {
  const data: DailySales[] = []
  const now = new Date()

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    const dayReceipts = mockReceipts.filter(r => {
      const receiptDate = r.date.toISOString().split('T')[0]
      return receiptDate === dateStr
    })

    const sales = Math.round(dayReceipts.reduce((sum, r) => sum + r.total, 0) * 100) / 100
    const transactions = dayReceipts.length

    data.push({
      date: dateStr,
      sales,
      transactions,
    })
  }

  return data
}

export const dailySalesData = generateDailySalesData()

// Mock credentials for testing
export const mockCredentials = [
  { email: 'admin@example.com', password: 'admin123' },
  { email: 'cashier@example.com', password: 'cashier123' },
]
