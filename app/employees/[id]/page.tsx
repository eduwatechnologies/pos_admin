'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getEmployeeStats } from '@/lib/performance-utils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/context/auth-context'
import { useShop } from '@/context/shop-context'
import { api } from '@/lib/api/client'
import { Employee, Receipt } from '@/lib/types'

export default function EmployeeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const employeeId = params.id as string
  const { isAuthenticated } = useAuth()
  const { currentShop } = useShop()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [receipts, setReceipts] = useState<Receipt[]>([])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!isAuthenticated || !currentShop) return
      try {
        const [employees, receipts] = await Promise.all([
          api.employees.list(currentShop.id),
          api.receipts.list(currentShop.id),
        ])
        if (cancelled) return
        setEmployee(employees.find(e => e.id === employeeId) ?? null)
        setReceipts(receipts)
      } catch {
        if (!cancelled) {
          setEmployee(null)
          setReceipts([])
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [currentShop, employeeId, isAuthenticated])

  const stats = useMemo(() => {
    if (!employee) return { totalSales: 0, transactionCount: 0, averageOrderValue: 0 }
    return getEmployeeStats(receipts, employee.id)
  }, [employee, receipts])

  const dailySalesData = useMemo(() => {
    if (!employee) return []

    const salesByDate = new Map<string, { date: string; sales: number; transactions: number }>()

    receipts
      .filter(r => r.cashierId === employee.id)
      .forEach(receipt => {
        const d = new Date(receipt.date)
        d.setHours(0, 0, 0, 0)
        const date = d.toISOString().slice(0, 10)

        if (!salesByDate.has(date)) {
          salesByDate.set(date, { date, sales: 0, transactions: 0 })
        }

        const data = salesByDate.get(date)!
        data.sales += receipt.total
        data.transactions += 1
      })

    return Array.from(salesByDate.values()).sort((a, b) => a.date.localeCompare(b.date))
  }, [employee, receipts])

  const recentTransactions = useMemo(() => {
    if (!employee) return []
    return receipts
      .filter(r => r.cashierId === employee.id)
      .slice(-10)
      .reverse()
  }, [employee, receipts])

  if (!isAuthenticated) {
    return null
  }

  if (!employee) {
    return (
      <div className="space-y-8 p-4 md:p-8">
        <div>
          <h1 className="text-3xl font-bold">Employee Not Found</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex items-center gap-4">
        <Link href="/employees" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{employee.name}</h1>
          <p className="text-muted-foreground mt-1 capitalize">{employee.role} • {employee.status}</p>
        </div>
      </div>

      {/* Employee Info */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Email</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{employee.email}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Phone</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{employee.phone || 'N/A'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Join Date</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{new Date(employee.joinDate).toLocaleDateString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Salary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">${(employee.salaryOrWage || 0).toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalSales.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.transactionCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.averageOrderValue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Sales Chart */}
      {dailySalesData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Daily Sales Trend</CardTitle>
            <CardDescription>Sales over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailySalesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#0D9488" name="Sales" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Last 10 sales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4 font-medium">Receipt ID</th>
                    <th className="text-left py-2 px-4 font-medium">Date</th>
                    <th className="text-left py-2 px-4 font-medium">Items</th>
                    <th className="text-right py-2 px-4 font-medium">Total</th>
                    <th className="text-left py-2 px-4 font-medium">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map(receipt => (
                    <tr key={receipt.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-mono text-xs">{receipt.id.slice(0, 8)}</td>
                      <td className="py-3 px-4">{new Date(receipt.date).toLocaleDateString()}</td>
                      <td className="py-3 px-4">{receipt.items.length}</td>
                      <td className="py-3 px-4 text-right font-semibold">${receipt.total.toFixed(2)}</td>
                      <td className="py-3 px-4 capitalize text-xs">
                        <span className="bg-muted px-2 py-1 rounded">{receipt.paymentMethod}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
