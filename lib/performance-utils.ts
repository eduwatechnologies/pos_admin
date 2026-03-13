import { Receipt, Employee, EmployeePerformance, EmployeeDailySales } from './types'

export function calculateEmployeePerformance(
  employees: Employee[],
  receipts: Receipt[],
  commissionRate: number = 0.05
): EmployeePerformance[] {
  const performanceMap = new Map<string, EmployeePerformance>()

  // Initialize performance for all employees
  employees.forEach(emp => {
    performanceMap.set(emp.id, {
      employeeId: emp.id,
      employeeName: emp.name,
      totalSales: 0,
      transactionCount: 0,
      averageOrderValue: 0,
      commissionRate,
      commissionEarned: 0,
    })
  })

  // Aggregate sales data
  receipts.forEach(receipt => {
    const perf = performanceMap.get(receipt.cashierId)
    if (perf) {
      perf.totalSales += receipt.total
      perf.transactionCount += 1
    }
  })

  // Calculate averages and commissions
  performanceMap.forEach(perf => {
    if (perf.transactionCount > 0) {
      perf.averageOrderValue = perf.totalSales / perf.transactionCount
      perf.commissionEarned = perf.totalSales * (perf.commissionRate || 0)
    }
  })

  // Return sorted by total sales (descending)
  return Array.from(performanceMap.values()).sort(
    (a, b) => b.totalSales - a.totalSales
  )
}

export function getEmployeeDailySales(
  receipts: Receipt[],
  dateStr: string
): EmployeeDailySales[] {
  const salesMap = new Map<string, EmployeeDailySales>()

  receipts.forEach(receipt => {
    const receiptDate = new Date(receipt.date)
    receiptDate.setHours(0, 0, 0, 0)
    const targetDate = new Date(dateStr)
    targetDate.setHours(0, 0, 0, 0)

    if (receiptDate.getTime() === targetDate.getTime()) {
      const key = receipt.cashierId
      if (!salesMap.has(key)) {
        salesMap.set(key, {
          employeeId: receipt.cashierId,
          employeeName: receipt.cashierName || 'Unknown',
          date: dateStr,
          sales: 0,
          transactions: 0,
        })
      }

      const sales = salesMap.get(key)!
      sales.sales += receipt.total
      sales.transactions += 1
    }
  })

  return Array.from(salesMap.values()).sort((a, b) => b.sales - a.sales)
}

export function getEmployeeStats(
  receipts: Receipt[],
  employeeId: string
): {
  totalSales: number
  transactionCount: number
  averageOrderValue: number
} {
  const employeeReceipts = receipts.filter(r => r.cashierId === employeeId)
  const totalSales = employeeReceipts.reduce((sum, r) => sum + r.total, 0)
  const transactionCount = employeeReceipts.length

  return {
    totalSales,
    transactionCount,
    averageOrderValue: transactionCount > 0 ? totalSales / transactionCount : 0,
  }
}
