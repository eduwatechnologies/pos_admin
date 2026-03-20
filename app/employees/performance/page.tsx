'use client'

import { useEffect, useMemo } from 'react'
import { useAuth } from '@/context/auth-context'
import { useShop } from '@/context/shop-context'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { EmployeePerformance } from '@/lib/types'
import { useEmployeePerformanceQuery } from '@/redux/api/analytics-api'
import { useListEmployeesQuery } from '@/redux/api/employees-api'

export default function PerformancePage() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const { currentShop } = useShop()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, router])

  const range = useMemo(() => {
    const from = new Date()
    from.setDate(1)
    from.setHours(0, 0, 0, 0)
    const to = new Date()
    to.setHours(23, 59, 59, 999)
    return { from: from.toISOString(), to: to.toISOString() }
  }, [])

  const skip = !isAuthenticated || !currentShop
  const { data: employees = [] } = useListEmployeesQuery({ shopId: currentShop?.id ?? '' }, { skip })
  const { data: perf = [] } = useEmployeePerformanceQuery(
    { shopId: currentShop?.id ?? '', from: range.from, to: range.to },
    { skip }
  )

  const performanceData = useMemo<EmployeePerformance[]>(() => {
    const byId = new Map(perf.map((p) => [p.cashierUserId, p]))
    const commissionRate = 0.05
    const result: EmployeePerformance[] = employees.map((e) => {
      const p = byId.get(e.id)
      const totalSales = p?.totalSales ?? 0
      const transactionCount = p?.totalTransactions ?? 0
      const averageOrderValue = transactionCount > 0 ? totalSales / transactionCount : 0
      return {
        employeeId: e.id,
        employeeName: e.name,
        totalSales,
        transactionCount,
        averageOrderValue,
        commissionRate,
        commissionEarned: totalSales * commissionRate,
      }
    })

    result.sort((a, b) => b.totalSales - a.totalSales)
    return result
  }, [employees, perf])

  const topPerformers = performanceData.slice(0, 5)

  const chartData = performanceData.map(emp => ({
    name: emp.employeeName,
    sales: parseFloat(emp.totalSales.toFixed(2)),
    commission: parseFloat((emp.commissionEarned || 0).toFixed(2)),
  }))

  const totalCompanySales = performanceData.reduce((sum, emp) => sum + emp.totalSales, 0)
  const totalTransactions = performanceData.reduce((sum, emp) => sum + emp.transactionCount, 0)
  const avgOrderValue = totalTransactions > 0 ? totalCompanySales / totalTransactions : 0
  const money = useMemo(() => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'NGN' }), [])

  if (!isAuthenticated) return null

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Employee Performance</h1>
        <p className="text-muted-foreground mt-2">Track sales and performance metrics for your team.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Company Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{money.format(totalCompanySales)}</div>
            <p className="text-xs text-muted-foreground mt-1">{totalTransactions} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{money.format(avgOrderValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all employees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top Performer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topPerformers[0]?.employeeName || 'N/A'}</div>
            <p className="text-xs text-muted-foreground mt-1">{money.format(topPerformers[0]?.totalSales ?? 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Sales by Employee</CardTitle>
          <CardDescription>Total sales and commission earnings</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip formatter={(value) => money.format(Number(value) || 0)} />
              <Legend />
              <Bar dataKey="sales" fill="#0D9488" name="Sales" />
              <Bar dataKey="commission" fill="#F97316" name="Commission (5%)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Leaderboard</CardTitle>
          <CardDescription>Ranked by total sales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4 font-medium">Rank</th>
                  <th className="text-left py-2 px-4 font-medium">Employee</th>
                  <th className="text-right py-2 px-4 font-medium">Transactions</th>
                  <th className="text-right py-2 px-4 font-medium">Total Sales</th>
                  <th className="text-right py-2 px-4 font-medium">Avg Order</th>
                  <th className="text-right py-2 px-4 font-medium">Commission (5%)</th>
                </tr>
              </thead>
              <tbody>
                {performanceData.map((emp, idx) => (
                  <tr key={emp.employeeId} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <span className="font-medium text-primary">#{idx + 1}</span>
                    </td>
                    <td className="py-3 px-4 font-medium">{emp.employeeName}</td>
                    <td className="py-3 px-4 text-right">{emp.transactionCount}</td>
                    <td className="py-3 px-4 text-right font-semibold">
                      {money.format(emp.totalSales)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {money.format(emp.averageOrderValue)}
                    </td>
                    <td className="py-3 px-4 text-right text-accent font-semibold">
                      {money.format(emp.commissionEarned || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
